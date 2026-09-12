import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { dirname, posix } from 'node:path';
import { mediaConfig } from './media.config.js';
import type { MediaStorageLocation } from './entities/media-asset.enums.js';

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
    // galleryRoot/stagingRoot may be absolute under /var/www or relative to sftp.root
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

  private async getClient(): Promise<SftpClient> {
    if (this.client) {
      return this.client;
    }
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = (async () => {
      const client = new SftpClient();
      await client.connect({
        host: mediaConfig.sftp.host,
        port: mediaConfig.sftp.port,
        username: mediaConfig.sftp.username,
        password: mediaConfig.sftp.password,
        readyTimeout: 20_000,
      });
      this.client = client;
      this.logger.log(
        `SFTP connected to ${mediaConfig.sftp.username}@${mediaConfig.sftp.host}`,
      );
      return client;
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
      // Drop stale connection and retry once.
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
