import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

/**
 * Global module so EmailService can be injected anywhere
 * without needing to import EmailModule explicitly.
 */
@Global()
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
