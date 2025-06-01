'use client';
import { useState } from 'react';
import { Key, Webhook, Slack } from 'lucide-react';
import { ApiKeysTab } from './tabs/api-keys-tab';
import { WebhooksTab } from './tabs/webhooks-tab';
import { SlackTab } from './tabs/slack-tab';

type IntTab = 'api-keys' | 'webhooks' | 'slack';

const TABS: { id: IntTab; label: string; icon: React.ElementType }[] = [
  { id: 'api-keys', label: 'API Keys',  icon: Key     },
  { id: 'webhooks', label: 'Webhooks',  icon: Webhook },
  { id: 'slack',    label: 'Slack',     icon: Slack   },
];

export function IntegrationsSettings() {
  const [activeTab, setActiveTab] = useState<IntTab>('api-keys');

  const TabContent = activeTab === 'api-keys' ? ApiKeysTab
    : activeTab === 'webhooks' ? WebhooksTab
    : SlackTab;

  return (
    <div className="space-y-0">
      {/* Sub-navigation */}
      <div className="border-b border-gray-200 px-6 dark:border-gray-800">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 pb-3 pt-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <TabContent />
    </div>
  );
}
