import {
  Controller, Get, Query, Param, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orgs/:orgId/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log entries (paginated, filterable)' })
  @ApiQuery({ name: 'userId',   required: false })
  @ApiQuery({ name: 'action',   required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'limit',    required: false, type: Number })
  async findAll(
    @Param('orgId') orgId: string,
    @Query('userId')   userId?:   string,
    @Query('action')   action?:   string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?:   string,
    @Query('page')     page?:     string,
    @Query('limit')    limit?:    string,
  ) {
    return this.auditService.findAll(orgId, {
      userId,
      action,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo:   dateTo   ? new Date(dateTo)   : undefined,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit log as CSV download' })
  @ApiQuery({ name: 'userId',   required: false })
  @ApiQuery({ name: 'action',   required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  async exportCsv(
    @Param('orgId') orgId: string,
    @Res() res: Response,
    @Query('userId')   userId?:   string,
    @Query('action')   action?:   string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?:   string,
  ) {
    const csv = await this.auditService.exportCsv(orgId, {
      userId,
      action,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo:   dateTo   ? new Date(dateTo)   : undefined,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${new Date().toISOString().slice(0,10)}.csv"`);
    res.status(200).send(csv);
  }
}
