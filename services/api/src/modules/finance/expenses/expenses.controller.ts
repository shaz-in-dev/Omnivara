import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@ApiTags('Finance - Expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an expense' })
  create(
    @Param('orgId') orgId: string,
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenses.create(orgId, req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  findAll(@Param('orgId') orgId: string, @Query() query: ListExpensesDto) {
    return this.expenses.findAll(orgId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Expense totals by category and status' })
  summary(@Param('orgId') orgId: string) {
    return this.expenses.getSummary(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.expenses.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense (edit or review)' })
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(orgId, id, req.user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft expense' })
  remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.expenses.remove(orgId, id, req.user.sub);
  }
}
