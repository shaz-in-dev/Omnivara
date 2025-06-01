import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { LeadsImportService } from './leads.import.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { CurrentUser, CurrentOrg } from '../../../common';
import type { CurrentUserPayload } from '../../../common';
import type { Express } from 'express';

@ApiTags('CRM - Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('crm/leads')
export class LeadsController {
  constructor(
    private readonly leads: LeadsService,
    private readonly importer: LeadsImportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a lead' })
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leads.create(orgId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  findAll(@CurrentOrg() orgId: string, @Query() query: ListLeadsDto) {
    return this.leads.findAll(orgId, query);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Download leads CSV import template' })
  downloadTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads-template.csv"');
    res.status(HttpStatus.OK).send(LeadsImportService.csvTemplate());
  }

  @Post('import')
  @ApiOperation({ summary: 'Import leads from CSV' })
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
  @ApiOperation({ summary: 'Get lead by ID' })
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.leads.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leads.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.leads.remove(orgId, id);
  }
}
