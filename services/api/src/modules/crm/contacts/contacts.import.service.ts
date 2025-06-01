import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { parse } from 'csv-parse/sync';

interface ContactRow {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string; // used to find accountId by name (best-effort)
  department?: string;
  notes?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

@Injectable()
export class ContactsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(orgId: string, userId: string, buffer: Buffer): Promise<ImportResult> {
    let rows: ContactRow[];
    try {
      rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as ContactRow[];
    } catch {
      throw new BadRequestException('Invalid CSV file — could not parse');
    }

    if (rows.length === 0) throw new BadRequestException('CSV file is empty');
    if (rows.length > 5000) throw new BadRequestException('Max 5,000 rows per import');

    // Pre-load account names for this org so we can resolve company → accountId
    const accounts = await this.prisma.account.findMany({
      where: { orgId },
      select: { id: true, name: true },
    });
    const accountByName = new Map(accounts.map((a) => [a.name.toLowerCase(), a.id]));

    const errors: ImportResult['errors'] = [];
    const toInsert: Array<{
      orgId: string;
      ownerId: string;
      name: string;
      email?: string;
      phone?: string;
      title?: string;
      department?: string;
      accountId?: string;
      tags: string[];
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;

      const name = (row.name ?? '').trim();
      if (!name) {
        errors.push({ row: rowNum, reason: 'Missing required field: name' });
        continue;
      }

      const accountId = row.company?.trim()
        ? accountByName.get(row.company.trim().toLowerCase())
        : undefined;

      toInsert.push({
        orgId,
        ownerId: userId,
        name,
        tags: [],
        ...(row.email?.trim() && { email: row.email.trim() }),
        ...(row.phone?.trim() && { phone: row.phone.trim() }),
        ...(row.title?.trim() && { title: row.title.trim() }),
        ...(row.department?.trim() && { department: row.department.trim() }),
        ...(accountId && { accountId }),
      });
    }

    if (toInsert.length === 0) throw new BadRequestException('No valid rows found in CSV');

    const result = await this.prisma.contact.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    return {
      imported: result.count,
      skipped: toInsert.length - result.count,
      errors,
    };
  }

  static csvTemplate(): string {
    return [
      'name,email,phone,title,company,department',
      'Emma Thompson,emma@techcorp.io,+1 555 0200,VP Engineering,TechCorp Inc,Engineering',
      'James Wilson,j.wilson@example.com,,COO,,Operations',
    ].join('\n');
  }
}
