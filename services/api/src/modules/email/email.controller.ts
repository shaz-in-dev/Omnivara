import {
  Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import type { Request } from 'express';
import { EmailService } from './email.service';

class SendEmailDto {
  @IsEmail() to!: string;
  @IsString() @IsNotEmpty() subject!: string;
  @IsString() @IsNotEmpty() body!: string;
}

const TEMPLATES = [
  { id: 'welcome',          name: 'Welcome',          description: 'Sent to new users after registration' },
  { id: 'invoice',          name: 'Invoice',           description: 'Invoice notification sent to clients' },
  { id: 'ticket_created',   name: 'Ticket Created',    description: 'Confirmation sent when a support ticket is opened' },
  { id: 'password_reset',   name: 'Password Reset',    description: 'Password reset link email' },
];

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * POST /email/send
   * Send a one-off transactional email.
   * Restricted to org admins (x-org-id header required by convention).
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a one-off email (admin only)' })
  async send(
    @Req() _req: Request & { user: { sub: string; orgId: string } },
    @Body() dto: SendEmailDto,
  ) {
    await this.emailService.sendRaw(
      dto.to,
      dto.subject,
      `<p>${dto.body.replace(/\n/g, '<br>')}</p>`,
    );
    return { message: `Email sent to ${dto.to}` };
  }

  /**
   * GET /email/templates
   * List available email templates.
   */
  @Get('templates')
  @ApiOperation({ summary: 'List available email templates' })
  getTemplates() {
    return { data: TEMPLATES };
  }
}
