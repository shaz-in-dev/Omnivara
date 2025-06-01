import {
  Controller, Post, Delete, Get, Param, UseGuards, Req,
  UseInterceptors, UploadedFile, BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Express } from 'express';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /**
   * POST /storage/upload
   * Upload a file (multipart/form-data). Returns the stored file metadata.
   */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file to object storage' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  async upload(
    @Req() req: Request & { user: { sub: string; orgId: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const folder = `orgs/${req.user.orgId ?? 'default'}`;
    const url = await this.storage.uploadFile(
      folder,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    // Derive the key from the url: everything after the bucket segment
    const key = url.split('/').slice(3).join('/'); // endpoint/bucket/<key>
    return {
      url,
      key,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * DELETE /storage/files/:key
   * Delete an uploaded file by its storage key.
   */
  @Delete('files/:key(*)')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file by storage key' })
  async deleteFile(@Param('key') key: string) {
    await this.storage.deleteFile(key);
    return { message: `File ${key} deleted` };
  }

  /**
   * GET /storage/files
   * List files for the current org.
   * Note: MinIO / S3 list is not implemented in StorageService yet.
   * Returns an empty list with a note until list support is added.
   */
  @Get('files')
  @ApiOperation({ summary: 'List files for the current org' })
  listFiles(@Req() req: Request & { user: { sub: string; orgId: string } }) {
    // StorageService does not yet expose a list method.
    // Return org context so the caller can build a UI stub.
    return {
      data: [],
      meta: { orgId: req.user.orgId ?? null, total: 0 },
      note: 'File listing via S3 ListObjectsV2 is not yet implemented in StorageService.',
    };
  }
}
