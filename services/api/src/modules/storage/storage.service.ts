import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    this.bucket = this.config.get<string>('S3_BUCKET', 'omnivara-dev');

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: this.config.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // required for MinIO
    });
  }

  /**
   * Upload a file buffer to S3/MinIO.
   * Returns the public URL of the uploaded object.
   */
  async uploadFile(
    folder: string,
    buffer: Buffer,
    mimetype: string,
    originalName?: string,
  ): Promise<string> {
    const ext = originalName?.split('.').pop() ?? mimetype.split('/')[1] ?? 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read' as any,
      }),
    );

    // Build public URL — MinIO path-style: endpoint/bucket/key
    const url = `${this.endpoint}/${this.bucket}/${key}`;
    this.logger.log(`Uploaded ${key} (${mimetype}, ${buffer.length} bytes)`);
    return url;
  }

  /** Delete an object by its full URL or just the key */
  async deleteFile(urlOrKey: string): Promise<void> {
    // Extract key from URL if full URL is passed
    const key = urlOrKey.startsWith('http')
      ? urlOrKey.split(`/${this.bucket}/`)[1] ?? urlOrKey
      : urlOrKey;

    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted ${key}`);
  }
}
