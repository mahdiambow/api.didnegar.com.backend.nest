import { Injectable } from '@nestjs/common';
import {
  access,
  copyFile,
  mkdir,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { mediaConfig } from './media.config.js';
import { MediaSftpService } from './media.sftp.service.js';
import type {
  MediaGroup,
  MediaStorageLocation,
} from './entities/media-asset.enums.js';

@Injectable()
export class MediaStorageService {
  constructor(private readonly sftp: MediaSftpService) {}

  absolutePath(location: MediaStorageLocation, relativePath: string): string {
    if (this.sftp.enabled) {
      return this.sftp.remotePath(location, relativePath);
    }
    const root =
      location === 'gallery'
        ? mediaConfig.galleryRoot
        : mediaConfig.stagingRoot;
    return join(root, relativePath);
  }

  publicUrl(location: MediaStorageLocation, relativePath: string): string {
    const normalized = relativePath.split('\\').join('/');
    // When public base already ends with /media and roots are media/staging,
    // URL is {base}/{location}/{relative}
    return `${mediaConfig.publicBaseUrl}/${location}/${normalized}`;
  }

  /**
   * seller → seller/{sellerId}/{id}.ext
   * blog|product|setting|other → {group}/{id}.ext
   */
  buildRelativePath(
    group: MediaGroup,
    sellerId: string,
    assetId: string,
    originalName: string,
  ): string {
    const ext = this.safeExtension(originalName);
    if (group === 'seller') {
      return `seller/${sellerId}/${assetId}${ext}`;
    }
    return `${group}/${assetId}${ext}`;
  }

  async ensureDirs(group: MediaGroup, sellerId: string): Promise<void> {
    const relativeDir =
      group === 'seller' ? join('seller', sellerId) : group;

    if (this.sftp.enabled) {
      await Promise.all([
        this.sftp.ensureDir(
          this.sftp.remotePath('staging', relativeDir.split('\\').join('/')),
        ),
        this.sftp.ensureDir(
          this.sftp.remotePath('gallery', relativeDir.split('\\').join('/')),
        ),
      ]);
      return;
    }

    await Promise.all([
      mkdir(join(mediaConfig.stagingRoot, relativeDir), { recursive: true }),
      mkdir(join(mediaConfig.galleryRoot, relativeDir), { recursive: true }),
    ]);
  }

  private safeExtension(originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    if (!ext || ext.length > 10 || !/^\.[a-z0-9]+$/.test(ext)) {
      return '';
    }
    return ext;
  }

  async writeStaging(relativePath: string, buffer: Buffer): Promise<void> {
    if (this.sftp.enabled) {
      await this.sftp.put(this.sftp.remotePath('staging', relativePath), buffer);
      return;
    }
    const fullPath = this.absolutePath('staging', relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
  }

  async promoteToGallery(relativePath: string): Promise<void> {
    if (this.sftp.enabled) {
      await this.sftp.rename(
        this.sftp.remotePath('staging', relativePath),
        this.sftp.remotePath('gallery', relativePath),
      );
      return;
    }

    const from = this.absolutePath('staging', relativePath);
    const to = this.absolutePath('gallery', relativePath);
    await mkdir(dirname(to), { recursive: true });
    try {
      await rename(from, to);
    } catch {
      await copyFile(from, to);
      await unlink(from).catch(() => undefined);
    }
  }

  async deleteFile(
    location: MediaStorageLocation,
    relativePath: string,
  ): Promise<void> {
    if (this.sftp.enabled) {
      await this.sftp.delete(this.sftp.remotePath(location, relativePath));
      return;
    }

    const fullPath = this.absolutePath(location, relativePath);
    try {
      await access(fullPath);
      await unlink(fullPath);
    } catch {
      // already gone
    }
  }
}
