import { Module } from '@nestjs/common';
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';
import { LeadsImportService } from './leads/leads.import.service';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { ContactsImportService } from './contacts/contacts.import.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { OpportunitiesController } from './opportunities/opportunities.controller';
import { OpportunitiesService } from './opportunities/opportunities.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';

@Module({
  controllers: [
    LeadsController,
    ContactsController,
    AccountsController,
    OpportunitiesController,
    ActivitiesController,
  ],
  providers: [
    LeadsService,
    LeadsImportService,
    ContactsService,
    ContactsImportService,
    AccountsService,
    OpportunitiesService,
    ActivitiesService,
  ],
  exports: [LeadsService, ContactsService, AccountsService, OpportunitiesService],
})
export class CrmModule {}
