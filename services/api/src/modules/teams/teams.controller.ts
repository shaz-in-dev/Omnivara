import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  @ApiQuery({ name: 'orgId', required: true })
  @ApiOperation({ summary: 'List teams in an organization' })
  findAll(@Query('orgId') orgId: string) {
    return this.teams.findByOrg(orgId);
  }
}
