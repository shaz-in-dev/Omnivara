import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { ContactsImportService } from './contacts.import.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CurrentUser, CurrentOrg } from '../../../common';
import type { CurrentUserPayload } from '../../../common';
import type { Express } from 'express';

@ApiTags('CRM - Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('crm/contacts')
export class ContactsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly importer: ContactsImportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create contact' })
  create(@CurrentOrg() orgId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateContactDto) {
    return this.contacts.create(orgId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List contacts' })
  findAll(
    @CurrentOrg() orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.contacts.findAll(orgId, page, limit, search, accountId);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Download contacts CSV import template' })
  downloadTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts-template.csv"');
    res.status(HttpStatus.OK).send(ContactsImportService.csvTemplate());
  }

  @Post('import')
  @ApiOperation({ summary: 'Import contacts from CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.match(/\.(csv|txt)$/i) && file.mimetype !== 'text/csv') {
        return cb(new Error('Only CSV files are allowed'), false);
      }
      cb(null, true);
    },
  }))
  importCsv(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.importer.importCsv(orgId, user.id, file.buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.contacts.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact' })
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.contacts.remove(orgId, id);
  }
}
