import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';
import { TaskItemsController } from './task-items/task-items.controller';
import { TaskItemsService } from './task-items/task-items.service';

@Module({
  controllers: [ProjectsController, TasksController, TaskItemsController],
  providers: [ProjectsService, TasksService, TaskItemsService],
  exports: [ProjectsService, TasksService, TaskItemsService],
})
export class ProjectsModule {}
