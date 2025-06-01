import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AGENCY_TEMPLATE } from './agency.template';
import { MSP_TEMPLATE } from './msp.template';
import { CONSULTING_TEMPLATE } from './consulting.template';

const ALL_TEMPLATES = [AGENCY_TEMPLATE, MSP_TEMPLATE, CONSULTING_TEMPLATE] as const;

type TemplateId = 'agency' | 'msp' | 'consulting';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  listTemplates() {
    return ALL_TEMPLATES.map(({ id, name, description, icon }) => ({
      id,
      name,
      description,
      icon,
    }));
  }

  async applyTemplate(orgId: string, templateId: TemplateId) {
    const template = ALL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) throw new NotFoundException(`Template '${templateId}' not found`);

    // Merge template config into org settings JSON
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const current = (org.settings ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = {
      ...current,
      appliedTemplate: templateId,
      pipelineStages: (template as Record<string, unknown>)['pipelineStages'] ?? [],
      templateConfig: template,
    };

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { settings: merged as Parameters<typeof this.prisma.organization.update>[0]['data']['settings'] },
    });

    return { applied: true, template: templateId };
  }
}
