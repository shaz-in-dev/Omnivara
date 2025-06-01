import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrgsService } from './orgs.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TemplatesService } from './templates/templates.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orgs')
export class OrgsController {
  constructor(
    private readonly orgs: OrgsService,
    private readonly templates: TemplatesService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.orgs.findById(id);
  }

  @Get(':orgId/members')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'List org members' })
  findMembers(@Param('orgId') orgId: string) {
    return this.orgs.findMembers(orgId);
  }

  @Post(':orgId/members/invite')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Invite a member to the org' })
  invite(
    @Param('orgId') orgId: string,
    @Body() body: { email: string; roleId?: string },
  ) {
    return this.orgs.inviteMember(orgId, body.email, body.roleId);
  }

  @Patch(':orgId/settings')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Update org settings (modules, onboarding, etc.)' })
  updateSettings(
    @Param('orgId') orgId: string,
    @Body() body: { settings?: Record<string, unknown>; onboardingCompleted?: boolean },
  ) {
    return this.orgs.updateSettings(orgId, body);
  }

  // ── Sample data ────────────────────────────────────────────────────────────

  @Post(':orgId/seed-sample-data')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Seed sample data for new orgs to explore the product' })
  seedSampleData(@Param('orgId') orgId: string) {
    return this.orgs.seedSampleData(orgId);
  }

  @Delete(':orgId/seed-sample-data')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Remove all sample data from the org' })
  clearSampleData(@Param('orgId') orgId: string) {
    return this.orgs.clearSampleData(orgId);
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'List all vertical templates (no tenant guard needed)' })
  listTemplates() {
    return this.templates.listTemplates();
  }

  @Post(':orgId/templates/:templateId/apply')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Apply a vertical template to the org' })
  applyTemplate(
    @Param('orgId') orgId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.templates.applyTemplate(orgId, templateId as 'agency' | 'msp' | 'consulting');
  }
}
