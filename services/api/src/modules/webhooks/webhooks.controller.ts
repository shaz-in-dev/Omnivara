import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrg } from '../../common';
import { WebhooksService, CreateWebhookDto } from './webhooks.service';

export const WEBHOOK_EVENTS = [
  'lead.created',        'lead.updated',       'lead.deleted',
  'contact.created',
  'opportunity.created', 'opportunity.won',    'opportunity.lost',
  'ticket.created',      'ticket.resolved',    'ticket.closed',
  'invoice.created',     'invoice.paid',
] as const;

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orgs/:orgId/webhooks')
export class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}

  /** Must be registered before :id routes */
  @Get('events')
  @ApiOperation({ summary: 'List all supported webhook event types' })
  eventTypes() {
    return { events: WEBHOOK_EVENTS };
  }

  @Get()
  @ApiOperation({ summary: 'List webhooks' })
  findAll(@CurrentOrg() orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook' })
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.svc.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create webhook' })
  create(@CurrentOrg() orgId: string, @Body() dto: CreateWebhookDto) {
    return this.svc.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update webhook' })
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateWebhookDto> & { active?: boolean },
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.svc.remove(orgId, id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  deliveries(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.svc.getDeliveries(orgId, id, limit);
  }

}
