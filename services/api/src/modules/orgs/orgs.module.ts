import { Module } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';
import { ExportController } from './export.controller';
import { TemplatesService } from './templates/templates.service';

@Module({
  controllers: [OrgsController, ExportController],
  providers:   [OrgsService, TemplatesService],
  exports:     [OrgsService, TemplatesService],
})
export class OrgsModule {}
