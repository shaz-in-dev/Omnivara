import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CurrentOrg } from '../../common';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  findAll(@CurrentOrg() orgId: string) { return this.projects.findAll(orgId); }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) { return this.projects.findOne(orgId, id); }

  @Post()
  create(@CurrentOrg() orgId: string, @Body() body: { name: string; description?: string }) {
    return this.projects.create(orgId, body);
  }

  @Patch(':id')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() body: { name?: string; status?: string }) {
    return this.projects.update(orgId, id, body);
  }

  @Get(':projectId/sprints')
  getSprints(@CurrentOrg() orgId: string, @Param('projectId') projectId: string) {
    return this.projects.getSprints(orgId, projectId);
  }

  @Post(':projectId/sprints')
  createSprint(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Body() body: { name: string; goal?: string; startDate: string; endDate: string; status?: string },
  ) {
    return this.projects.createSprint(orgId, projectId, body);
  }
}
