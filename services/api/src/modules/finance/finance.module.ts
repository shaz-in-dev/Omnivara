import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices/invoices.controller';
import { InvoicesService } from './invoices/invoices.service';
import { ExpensesController } from './expenses/expenses.controller';
import { ExpensesService } from './expenses/expenses.service';

@Module({
  controllers: [InvoicesController, ExpensesController],
  providers: [InvoicesService, ExpensesService],
  exports: [InvoicesService, ExpensesService],
})
export class FinanceModule {}
