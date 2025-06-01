import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrg, CurrentUser } from '../../common';
import type { CurrentUserPayload } from '../../common';
import { SlackService, SlackConfigDto } from './slack.service';

@ApiTags('Slack')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orgs/:orgId/slack')
export class SlackController {
  constructor(private readonly svc: SlackService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get Slack integration config' })
  async getConfig(@CurrentOrg() orgId: string) {
    const config = await this.svc.getConfig(orgId);
    if (!config) return { configured: false };
    // Never expose the access token to the client
    return {
      configured:  true,
      channelId:   config.channelId,
      channelName: config.channelName,
      createdAt:   config.createdAt,
    };
  }

  @Post('config')
  @ApiOperation({ summary: 'Save/update Slack integration config' })
  saveConfig(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SlackConfigDto,
  ) {
    return this.svc.saveConfig(orgId, user.id, dto);
  }

  @Delete('config')
  @ApiOperation({ summary: 'Remove Slack integration' })
  removeConfig(@CurrentOrg() orgId: string) {
    return this.svc.removeConfig(orgId);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test message to the configured Slack channel' })
  test(@CurrentOrg() orgId: string) {
    return this.svc.sendTest(orgId);
  }
}
