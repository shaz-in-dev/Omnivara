import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { CurrentOrg } from '../../../common';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Finance - Invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  findAll(@CurrentOrg() orgId: string, @Query() query: ListInvoicesDto) {
    return this.invoices.findAll(orgId, query.page ?? 1, query.limit ?? 25, query.status as InvoiceStatus | undefined);
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) { return this.invoices.findOne(orgId, id); }

  @Post()
  create(@CurrentOrg() orgId: string, @Body() body: CreateInvoiceDto) {
    return this.invoices.create(orgId, body);
  }

  @Post(':id/send')
  send(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.invoices.send(orgId, id);
  }

  @Patch(':id/status')
  updateStatus(@CurrentOrg() orgId: string, @Param('id') id: string, @Body('status') status: InvoiceStatus) {
    return this.invoices.updateStatus(orgId, id, status);
  }
}
