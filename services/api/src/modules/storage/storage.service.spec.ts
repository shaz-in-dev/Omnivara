import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

// Mock the AWS SDK S3 client
const mockSend = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client:           jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand:   jest.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

// Mock uuid so keys are predictable
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid-1234') }));

const mockConfig = {
  get: jest.fn((key: string, def: unknown) => {
    const cfg: Record<string, unknown> = {
      S3_ENDPOINT:   'http://localhost:9000',
      S3_BUCKET:     'omnivara-dev',
      S3_REGION:     'us-east-1',
      S3_ACCESS_KEY: 'minioadmin',
      S3_SECRET_KEY: 'minioadmin',
    };
    return cfg[key] ?? def;
  }),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(StorageService);
  });

  describe('uploadFile', () => {
    it('calls S3 send with PutObjectCommand', async () => {
      await service.uploadFile('avatars', Buffer.from('image data'), 'image/png');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('returns a public URL containing bucket and key', async () => {
      const url = await service.uploadFile('receipts', Buffer.from('pdf'), 'application/pdf', 'receipt.pdf');
      expect(url).toContain('omnivara-dev');
      expect(url).toContain('receipts/');
      expect(url).toContain('test-uuid-1234');
    });

    it('uses extension from originalName when provided', async () => {
      const url = await service.uploadFile('docs', Buffer.from('data'), 'image/png', 'photo.jpg');
      expect(url).toContain('.jpg');
    });

    it('falls back to mimetype extension when no originalName', async () => {
      const url = await service.uploadFile('docs', Buffer.from('data'), 'image/jpeg');
      expect(url).toContain('.jpeg');
    });

    it('falls back to "bin" when mimetype has no subtype', async () => {
      const url = await service.uploadFile('misc', Buffer.from('data'), 'application');
      expect(url).toContain('.bin');
    });

    it('key format is folder/uuid.ext', async () => {
      const url = await service.uploadFile('invoices', Buffer.from('data'), 'application/pdf', 'inv.pdf');
      // URL is endpoint/bucket/key
      const key = url.split('omnivara-dev/')[1];
      expect(key).toBe('invoices/test-uuid-1234.pdf');
    });
  });

  describe('deleteFile', () => {
    it('calls S3 send with DeleteObjectCommand for a plain key', async () => {
      await service.deleteFile('avatars/test-uuid-1234.png');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('extracts key from full URL when URL is passed', async () => {
      const fullUrl = 'http://localhost:9000/omnivara-dev/avatars/test-uuid-1234.png';
      await service.deleteFile(fullUrl);
      // Should extract 'avatars/test-uuid-1234.png' as the key
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const cmdInput = (DeleteObjectCommand as jest.Mock).mock.calls[0]![0] as any;
      expect(cmdInput.Key).toBe('avatars/test-uuid-1234.png');
    });

    it('does not throw when S3 delete fails (errors propagate)', async () => {
      mockSend.mockRejectedValueOnce(new Error('S3 error'));
      await expect(service.deleteFile('some/key.png')).rejects.toThrow('S3 error');
    });
  });
});
