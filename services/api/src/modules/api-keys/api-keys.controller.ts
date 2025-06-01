import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser, type CurrentUserPayload } from '../../common';

/**
 * API Key management.
 * All routes scoped to `:orgId` so we never mix keys between orgs.
 */
@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orgs/:orgId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys for the org (prefix only, no hash)' })
  findAll(@Param('orgId') orgId: string) {
    return this.apiKeysService.findAll(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API key — full key returned ONCE' })
  create(
    @Param('orgId') orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { name: string; expiresAt?: string },
  ) {
    return this.apiKeysService.create(
      orgId,
      user.id,
      body.name,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revoke(
    @Param('orgId') orgId: string,
    @Param('id')    id: string,
  ) {
    await this.apiKeysService.revoke(orgId, id);
    return { revoked: true };
  }
}
