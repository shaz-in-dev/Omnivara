import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [HttpModule.register({ timeout: 12_000 })],
  controllers: [WebhooksController],
  providers:   [WebhooksService],
  exports:     [WebhooksService],
})
export class WebhooksModule {}
