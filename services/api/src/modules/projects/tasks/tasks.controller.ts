import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CurrentOrg } from '../../../common';

@ApiTags('Projects - Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Query('sprintId') sprintId?: string,
  ) {
    return this.tasks.findByProject(orgId, projectId, 1, 100, sprintId);
  }

  @Post()
  create(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Body() body: { title: string; status?: string; priority?: string; sprintId?: string; assigneeId?: string; dueDate?: string; description?: string },
  ) {
    return this.tasks.create(orgId, { projectId, ...body });
  }

  @Patch(':id/status')
  updateStatus(@CurrentOrg() orgId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.tasks.updateStatus(orgId, id, status);
  }

  @Patch(':id')
  updateTask(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: { sprintId?: string | null; status?: string; priority?: string; title?: string; description?: string },
  ) {
    return this.tasks.updateTask(orgId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTask(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.tasks.deleteTask(orgId, id);
  }
}
