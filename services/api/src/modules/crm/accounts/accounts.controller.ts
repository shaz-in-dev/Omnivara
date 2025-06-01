import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser, CurrentOrg } from '../../../common';
import type { CurrentUserPayload } from '../../../common';

@ApiTags('CRM - Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('crm/accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  create(@CurrentOrg() orgId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAccountDto) {
    return this.accounts.create(orgId, user.id, dto);
  }

  @Get()
  findAll(@CurrentOrg() orgId: string, @Query('search') search?: string) {
    return this.accounts.findAll(orgId, 1, 25, search);
  }

  @Get(':id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.accounts.findOne(orgId, id);
  }

  @Patch(':id')
  update(@CurrentOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(orgId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.accounts.remove(orgId, id);
  }
}
