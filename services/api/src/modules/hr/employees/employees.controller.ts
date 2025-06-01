import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@ApiTags('HR — Employees')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/hr/employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  findAll(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    return this.employees.findAll(orgId, page ? +page : 1, limit ? +limit : 50, department, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.employees.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  create(@Param('orgId') orgId: string, @Body() dto: CreateEmployeeDto) {
    return this.employees.create(orgId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update employee' })
  update(@Param('orgId') orgId: string, @Param('id') id: string, @Body() dto: Partial<CreateEmployeeDto>) {
    return this.employees.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove employee' })
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.employees.remove(orgId, id);
  }
}

@ApiTags('HR — Leave Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard)
@Controller('orgs/:orgId/hr/leave-requests')
export class LeaveRequestsController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List leave requests (optionally filtered by employee or status)' })
  findAll(
    @Param('orgId') orgId: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.employees.getLeaveRequests(orgId, employeeId, status);
  }

  @Post(':employeeId')
  @ApiOperation({ summary: 'Submit a leave request for an employee' })
  create(
    @Param('orgId') orgId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { type: string; startDate: string; endDate: string; days: number; reason?: string },
  ) {
    return this.employees.createLeaveRequest(orgId, employeeId, body);
  }

  @Put(':requestId/review')
  @ApiOperation({ summary: 'Approve or deny a leave request' })
  review(
    @Param('orgId') orgId: string,
    @Param('requestId') requestId: string,
    @Body() body: { action: 'approved' | 'denied'; reviewedBy: string },
  ) {
    return this.employees.reviewLeaveRequest(orgId, requestId, body.action, body.reviewedBy);
  }
}
