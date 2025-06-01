import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CurrentUser, CurrentOrg } from '../../../common';
import type { CurrentUserPayload } from '../../../common';

@ApiTags('CRM - Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('crm/activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  create(@CurrentOrg() orgId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateActivityDto) {
    return this.activities.create(orgId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('opportunityId') opportunityId?: string,
    @Query('contactId') contactId?: string,
    @Query('leadId') leadId?: string,
  ) {
    return this.activities.findAll(orgId, 1, 50, { opportunityId, contactId, leadId });
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark activity as completed' })
  complete(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.activities.complete(orgId, id);
  }
}
