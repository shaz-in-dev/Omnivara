import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';

@Module({
  imports:     [HttpModule.register({ timeout: 15_000 })],
  controllers: [SlackController],
  providers:   [SlackService],
  exports:     [SlackService],
})
export class SlackModule {}
