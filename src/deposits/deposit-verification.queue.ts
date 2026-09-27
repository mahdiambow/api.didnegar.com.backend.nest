import {
  HttpException,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import amqp, {
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
} from 'amqplib';
import { ConfigService } from '../config/config.service.js';
import { DepositsService } from './deposits.service.js';

type Stage = 'verify' | 'inquiry' | 'execute';
type Job = { trackId: string };
const STAGES: Stage[] = ['verify', 'inquiry', 'execute'];

/** RabbitMQ equivalent of the reference BullMQ verify → inquiry → execute flow. */
@Injectable()
export class DepositVerificationQueue
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(DepositVerificationQueue.name);
  private readonly enabled: boolean;
  private readonly url: string;
  private readonly retryDelayMs: number;
  private readonly maxRetries: number;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private connecting: Promise<void> | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stopping = false;
  private static readonly exchange = 'didnegar.deposits';
  private static readonly retryExchange = 'didnegar.deposits.retry';
  private static readonly deadExchange = 'didnegar.deposits.dead';

  constructor(
    config: ConfigService,
    private readonly deposits: DepositsService,
  ) {
    this.enabled = config.getBooleanOptional('RABBITMQ_ENABLED', true);
    this.url = config.get('RABBITMQ_URL');
    this.retryDelayMs = config.getNumberOptional(
      'RABBITMQ_DEPOSIT_RETRY_DELAY_MS',
      30_000,
    );
    this.maxRetries = config.getNumberOptional(
      'RABBITMQ_DEPOSIT_MAX_RETRIES',
      5,
    );
  }

  onModuleInit(): void {
    if (this.enabled) this.connectInBackground();
  }
  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  enqueueVerify(trackId: string) {
    return this.enqueue('verify', trackId);
  }
  enqueueInquiry(trackId: string) {
    return this.enqueue('inquiry', trackId);
  }
  enqueueExecute(trackId: string) {
    return this.enqueue('execute', trackId);
  }

  private async enqueue(stage: Stage, trackId: string): Promise<void> {
    if (!this.enabled)
      throw new ServiceUnavailableException(
        'RabbitMQ deposit worker is disabled',
      );
    await this.ensureConnected();
    if (!this.channel)
      throw new ServiceUnavailableException(
        'RabbitMQ deposit worker is unavailable',
      );
    this.publish(this.channel, DepositVerificationQueue.exchange, stage, {
      trackId,
    });
  }

  private publish(
    channel: Channel,
    exchange: string,
    stage: Stage,
    job: Job,
    headers: Record<string, unknown> = {},
  ) {
    channel.publish(
      exchange,
      `deposit.${stage}`,
      Buffer.from(JSON.stringify(job)),
      {
        persistent: true,
        contentType: 'application/json',
        messageId: `${stage}:${job.trackId}`,
        headers,
      },
    );
  }

  private async ensureConnected(): Promise<void> {
    if (this.channel) return;
    if (!this.connecting)
      this.connecting = this.connect().finally(() => {
        this.connecting = null;
      });
    return this.connecting;
  }

  /** Connection failures are retried; they must never become unhandled rejections. */
  private connectInBackground(): void {
    void this.ensureConnected().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    try {
      const connection = await amqp.connect(this.url);
      const channel = await connection.createChannel();
      await channel.prefetch(10);
      await this.assertTopology(channel);
      for (const stage of STAGES)
        await channel.consume(
          this.queue(stage),
          (message) => void this.consume(channel, stage, message),
          { noAck: false },
        );
      this.connection = connection;
      this.channel = channel;
      connection.on('error', (error) =>
        this.logger.warn(`RabbitMQ connection error: ${error.message}`),
      );
      connection.on('close', () => this.handleDisconnect());
      this.logger.log(
        'RabbitMQ deposit verify, inquiry, and execute workers are connected',
      );
    } catch (error) {
      this.logger.error('RabbitMQ deposit worker connection failed', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  private async assertTopology(channel: Channel): Promise<void> {
    await channel.assertExchange(DepositVerificationQueue.exchange, 'direct', {
      durable: true,
    });
    await channel.assertExchange(
      DepositVerificationQueue.retryExchange,
      'direct',
      { durable: true },
    );
    await channel.assertExchange(
      DepositVerificationQueue.deadExchange,
      'direct',
      { durable: true },
    );
    for (const stage of STAGES) {
      const key = `deposit.${stage}`;
      await channel.assertQueue(this.queue(stage), { durable: true });
      await channel.bindQueue(
        this.queue(stage),
        DepositVerificationQueue.exchange,
        key,
      );
      await channel.assertQueue(this.retryQueue(stage), {
        durable: true,
        arguments: {
          'x-message-ttl': this.retryDelayMs,
          'x-dead-letter-exchange': DepositVerificationQueue.exchange,
          'x-dead-letter-routing-key': key,
        },
      });
      await channel.bindQueue(
        this.retryQueue(stage),
        DepositVerificationQueue.retryExchange,
        key,
      );
      await channel.assertQueue(this.deadQueue(stage), { durable: true });
      await channel.bindQueue(
        this.deadQueue(stage),
        DepositVerificationQueue.deadExchange,
        key,
      );
    }
  }

  private async consume(
    channel: Channel,
    stage: Stage,
    message: ConsumeMessage | null,
  ) {
    if (!message) return;
    const job = JSON.parse(message.content.toString('utf8')) as Job;
    try {
      if (!job.trackId) throw new Error('Missing trackId');
      if (stage === 'verify') {
        await this.deposits.verifyGatewayDeposit(job.trackId);
        await this.enqueueInquiry(job.trackId);
      } else if (stage === 'inquiry') {
        if (await this.deposits.inquireGatewayDeposit(job.trackId))
          await this.enqueueExecute(job.trackId);
      } else await this.deposits.executeGatewayDeposit(job.trackId);
      channel.ack(message);
    } catch (error) {
      const retries = Number(
        message.properties.headers?.['x-retry-count'] ?? 0,
      );
      if (error instanceof HttpException && error.getStatus() < 500) {
        channel.ack(message);
        return;
      }
      if (retries >= this.maxRetries) {
        this.publish(
          channel,
          DepositVerificationQueue.deadExchange,
          stage,
          job,
          {
            ...message.properties.headers,
            'x-final-error': this.errorMessage(error),
          },
        );
        channel.ack(message);
        this.logger.error(
          `Deposit ${stage} moved to dead-letter queue after ${retries} retries: ${this.errorMessage(error)}`,
        );
      } else {
        this.publish(
          channel,
          DepositVerificationQueue.retryExchange,
          stage,
          job,
          { ...message.properties.headers, 'x-retry-count': retries + 1 },
        );
        channel.ack(message);
      }
    }
  }

  private queue(stage: Stage) {
    return `didnegar.deposits.${stage}`;
  }
  private retryQueue(stage: Stage) {
    return `${this.queue(stage)}.retry`;
  }
  private deadQueue(stage: Stage) {
    return `${this.queue(stage)}.dead`;
  }
  private handleDisconnect() {
    this.connection = null;
    this.channel = null;
    if (!this.stopping) this.scheduleReconnect();
  }
  private scheduleReconnect() {
    if (this.stopping || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectInBackground();
    }, 5_000);
  }
  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
