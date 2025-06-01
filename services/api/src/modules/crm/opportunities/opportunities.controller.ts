import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { CurrentUser, CurrentOrg } from '../../../common';
import type { CurrentUserPayload } from '../../../common';
import { OpportunityStage } from '@prisma/client';

@ApiTags('CRM - Opportunities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('crm/opportunities')
export class OpportunitiesController {
  constructor(private readonly opps: OpportunitiesService) {}

  @Post()
  create(@CurrentOrg() orgId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateOpportunityDto) {
    return this.opps.create(orgId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('stage') stage?: OpportunityStage,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.opps.findAll(orgId, 1, 25, stage, ownerId);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline view grouped by stage' })
  getPipeline(@CurrentOrg() orgId: string, @Query('ownerId') ownerId?: string) {
    return this.opps.getPipeline(orgId, ownerId);
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.opps.findOne(orgId, id);
  }

  @Patch(':id')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opps.update(orgId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.opps.remove(orgId, id);
  }
}
