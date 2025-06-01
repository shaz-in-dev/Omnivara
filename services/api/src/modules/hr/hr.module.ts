import { Module } from '@nestjs/common';
import { EmployeesService } from './employees/employees.service';
import { EmployeesController, LeaveRequestsController } from './employees/employees.controller';

@Module({
  controllers: [EmployeesController, LeaveRequestsController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class HrModule {}
