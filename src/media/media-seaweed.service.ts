import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { mediaConfig } from './media.config.js';

@Injectable()
export class MediaSeaweedService {
  private client: S3Client | null = null;

  private getClient(): S3Client {
    if (!mediaConfig.seaweed.enabled) {
      throw new Error('SEAWEED_S3_ENDPOINT is not configured');
    }
    if (
      !mediaConfig.seaweed.accessKeyId ||
      !mediaConfig.seaweed.secretAccessKey
    ) {
      throw new Error(
        'SEAWEED_S3_ACCESS_KEY and SEAWEED_S3_SECRET_KEY are required',
      );
    }
    if (!this.client) {
      this.client = new S3Client({
        endpoint: mediaConfig.seaweed.endpoint,
        region: mediaConfig.seaweed.region,
        forcePathStyle: true,
        // A presigned browser PUT has no payload when it is signed. The SDK's
        // default optional CRC32 calculation signs an empty-body checksum,
        // which SeaweedFS then rejects for the actual uploaded file.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        credentials: {
          accessKeyId: mediaConfig.seaweed.accessKeyId,
          secretAccessKey: mediaConfig.seaweed.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  async createUploadUrl(key: string, mimeType: string): Promise<string> {
    return getSignedUrl(
      this.getClient(),
      new PutObjectCommand({
        Bucket: mediaConfig.seaweed.bucket,
        Key: key,
        ContentType: mimeType,
      }),
      { expiresIn: mediaConfig.seaweed.uploadUrlTtlSeconds },
    );
  }

  async assertObject(key: string, expectedSize: number): Promise<void> {
    const result = await this.getClient().send(
      new HeadObjectCommand({ Bucket: mediaConfig.seaweed.bucket, Key: key }),
    );
    if (result.ContentLength !== expectedSize) {
      throw new Error(
        `Unexpected object size: expected ${expectedSize}, received ${result.ContentLength ?? 'unknown'}`,
      );
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({ Bucket: mediaConfig.seaweed.bucket, Key: key }),
    );
  }

  publicUrl(key: string): string {
    if (!mediaConfig.seaweed.publicBaseUrl) {
      throw new Error(
        'MEDIA_PUBLIC_BASE_URL is required for public SeaweedFS URLs',
      );
    }
    return `${mediaConfig.seaweed.publicBaseUrl}/${key
      .split('\\')
      .join('/')
      .replace(/^\/+/, '')}`;
  }
}
