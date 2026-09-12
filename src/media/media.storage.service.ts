import { Injectable } from '@nestjs/common';
import { copyFile, mkdir, rename, unlink, access } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { mediaConfig } from './media.config.js';
import type { MediaStorageLocation } from './entities/media-asset.enums.js';

@Injectable()
export class MediaStorageService {
  absolutePath(location: MediaStorageLocation, relativePath: string): string {
    const root =
      location === 'gallery'
        ? mediaConfig.galleryRoot
        : mediaConfig.stagingRoot;
    return join(root, relativePath);
  }

  publicUrl(location: MediaStorageLocation, relativePath: string): string {
    const normalized = relativePath.split('\\').join('/');
    return `${mediaConfig.publicBaseUrl}/${location}/${normalized}`;
  }

  async ensureSellerDirs(sellerId: string): Promise<void> {
    await Promise.all([
      mkdir(join(mediaConfig.stagingRoot, sellerId), { recursive: true }),
      mkdir(join(mediaConfig.galleryRoot, sellerId), { recursive: true }),
    ]);
  }

  buildRelativePath(sellerId: string, assetId: string, originalName: string): string {
    const ext = this.safeExtension(originalName);
    return `${sellerId}/${assetId}${ext}`;
  }

  private safeExtension(originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    if (!ext || ext.length > 10 || !/^\.[a-z0-9]+$/.test(ext)) {
      return '';
    }
    return ext;
  }

  async writeStaging(
    relativePath: string,
    buffer: Buffer,
  ): Promise<void> {
    const fullPath = this.absolutePath('staging', relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(fullPath, buffer);
  }

  async promoteToGallery(relativePath: string): Promise<void> {
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
    const fullPath = this.absolutePath(location, relativePath);
    try {
      await access(fullPath);
      await unlink(fullPath);
    } catch {
      // already gone
    }
  }
}
