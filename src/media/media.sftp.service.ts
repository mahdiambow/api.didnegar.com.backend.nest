import { readFileSync } from 'node:fs';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { dirname, posix } from 'node:path';
import { mediaConfig } from './media.config.js';
import type { MediaStorageLocation } from './entities/media-asset.enums.js';

type ConnectAttempt = {
  label: string;
  config: Record<string, unknown>;
};

@Injectable()
export class MediaSftpService implements OnModuleDestroy {
  private readonly logger = new Logger(MediaSftpService.name);
  private client: SftpClient | null = null;
  private connecting: Promise<SftpClient> | null = null;

  get enabled() {
    return mediaConfig.sftp.enabled;
  }

  remotePath(location: MediaStorageLocation, relativePath: string): string {
    const root =
      location === 'gallery'
        ? mediaConfig.galleryRoot
        : mediaConfig.stagingRoot;
    const rel = relativePath.split('\\').join('/');
    if (root.startsWith('/')) {
      return posix.join(root, rel);
    }
    return posix.join(mediaConfig.sftp.root, root, rel);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end().catch(() => undefined);
      this.client = null;
    }
  }

  private resolvePrivateKey(): Buffer | string | undefined {
    if (mediaConfig.sftp.privateKey) {
      return mediaConfig.sftp.privateKey.replace(/\\n/g, '\n');
    }
    if (mediaConfig.sftp.privateKeyPath) {
      try {
        return readFileSync(mediaConfig.sftp.privateKeyPath);
      } catch (error) {
        this.logger.warn(
          `Cannot read MEDIA_SFTP_PRIVATE_KEY_PATH=${mediaConfig.sftp.privateKeyPath}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    return undefined;
  }

  private isAuthError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /authentication methods failed|permission denied|auth/i.test(
      message,
    );
  }

  private buildAttempts(): ConnectAttempt[] {
    const base = {
      host: mediaConfig.sftp.host,
      port: mediaConfig.sftp.port,
      username: mediaConfig.sftp.username,
      readyTimeout: 20_000,
    };
    const password = mediaConfig.sftp.password;
    const privateKey = this.resolvePrivateKey();
    const attempts: ConnectAttempt[] = [];

    if (privateKey) {
      attempts.push({
        label: 'privateKey',
        config: { ...base, privateKey },
      });
      if (password) {
        attempts.push({
          label: 'privateKey+password',
          config: { ...base, privateKey, password },
        });
      }
    }

    if (password) {
      attempts.push({
        label: 'password',
        config: { ...base, password, tryKeyboard: true },
      });
      attempts.push({
        label: 'keyboard-interactive',
        config: {
          ...base,
          password,
          tryKeyboard: true,
          authHandler: ['keyboard-interactive', 'password'],
        },
      });
    }

    return attempts;
  }

  private async connectOnce(attempt: ConnectAttempt): Promise<SftpClient> {
    const client = new SftpClient();
    const password =
      typeof attempt.config.password === 'string'
        ? attempt.config.password
        : mediaConfig.sftp.password;

    client.on(
      'keyboard-interactive',
      (
        _name: string,
        _instructions: string,
        _lang: string,
        _prompts: unknown[],
        finish: (responses: string[]) => void,
      ) => {
        finish([password || '']);
      },
    );

    this.logger.log(`SFTP attempt [${attempt.label}] → ${mediaConfig.sftp.username}@${mediaConfig.sftp.host}`);
    await client.connect(attempt.config);
    return client;
  }

  private async getClient(): Promise<SftpClient> {
    if (this.client) {
      return this.client;
    }
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = (async () => {
      const attempts = this.buildAttempts();
      if (attempts.length === 0) {
        throw new Error(
          'SFTP enabled but no password/private key configured',
        );
      }

      const errors: string[] = [];
      for (const attempt of attempts) {
        try {
          const client = await this.connectOnce(attempt);
          this.client = client;
          this.logger.log(
            `SFTP connected via [${attempt.label}] to ${mediaConfig.sftp.username}@${mediaConfig.sftp.host}`,
          );
          return client;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          errors.push(`${attempt.label}: ${message}`);
          this.logger.warn(`SFTP attempt [${attempt.label}] failed: ${message}`);
        }
      }

      throw new Error(
        `All SFTP auth attempts failed (${errors.join(' | ')})`,
      );
    })();

    try {
      return await this.connecting;
    } catch (error) {
      this.connecting = null;
      this.client = null;
      throw error;
    } finally {
      this.connecting = null;
    }
  }

  private async withClient<T>(fn: (client: SftpClient) => Promise<T>): Promise<T> {
    try {
      const client = await this.getClient();
      return await fn(client);
    } catch (error) {
      if (this.isAuthError(error)) {
        throw error;
      }
      if (this.client) {
        await this.client.end().catch(() => undefined);
        this.client = null;
      }
      const client = await this.getClient();
      return fn(client);
    }
  }

  async ensureDir(remoteDir: string): Promise<void> {
    await this.withClient(async (client) => {
      await client.mkdir(remoteDir, true);
    });
  }

  async put(remoteFilePath: string, buffer: Buffer): Promise<void> {
    await this.ensureDir(dirname(remoteFilePath));
    await this.withClient(async (client) => {
      await client.put(buffer, remoteFilePath);
    });
  }

  async rename(from: string, to: string): Promise<void> {
    await this.ensureDir(dirname(to));
    await this.withClient(async (client) => {
      try {
        await client.rename(from, to);
      } catch {
        await client.rcopy(from, to);
        await client.delete(from).catch(() => undefined);
      }
    });
  }

  async delete(remoteFilePath: string): Promise<void> {
    await this.withClient(async (client) => {
      const exists = await client.exists(remoteFilePath);
      if (exists) {
        await client.delete(remoteFilePath);
      }
    });
  }
}
