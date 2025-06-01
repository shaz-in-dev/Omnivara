import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { parse } from 'csv-parse/sync';

interface LeadRow {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  source?: string;
  notes?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

@Injectable()
export class LeadsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(orgId: string, userId: string, buffer: Buffer): Promise<ImportResult> {
    let rows: LeadRow[];
    try {
      rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as LeadRow[];
    } catch {
      throw new BadRequestException('Invalid CSV file — could not parse');
    }

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }
    if (rows.length > 5000) {
      throw new BadRequestException('CSV file too large — max 5,000 rows per import');
    }

    const errors: ImportResult['errors'] = [];
    const toInsert: Array<{
      orgId: string;
      ownerId: string;
      name: string;
      email?: string;
      company?: string;
      phone?: string;
      source?: string;
      notes?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2; // +2 because row 1 is header

      // name is required
      const name = (row.name ?? '').trim();
      if (!name) {
        errors.push({ row: rowNum, reason: 'Missing required field: name' });
        continue;
      }

      toInsert.push({
        orgId,
        ownerId: userId,
        name,
        ...(row.email?.trim() && { email: row.email.trim() }),
        ...(row.company?.trim() && { company: row.company.trim() }),
        ...(row.phone?.trim() && { phone: row.phone.trim() }),
        ...(row.source?.trim() && { source: row.source.trim() }),
        ...(row.notes?.trim() && { notes: row.notes.trim() }),
      });
    }

    if (toInsert.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    const result = await this.prisma.lead.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      skipped: toInsert.length - result.count,
      errors,
    };
  }

  /** Return a sample CSV template the user can download */
  static csvTemplate(): string {
    return [
      'name,email,company,phone,source,notes',
      'Alice Cooper,alice@fintech.com,FinTech Solutions,+1 555 0100,Website,Interested in Growth plan',
      'Bob Martinez,bob@retail.com,Retail Giant,,LinkedIn,',
    ].join('\n');
  }
}
