import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (requester must share an org with the target)' })
  findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.users.findById(id, req.user.sub);
  }
}
