'use client';
import { useState } from 'react';
import { Check, Loader2, X, AlertTriangle, LayoutTemplate } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}

type TemplateId = 'agency' | 'msp' | 'consulting';

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useTemplates() {
  return useQuery<Template[]>({
    queryKey: ['orgs', 'templates'],
    queryFn: () => api.get('/orgs/templates').then((r) => r.data),
    staleTime: Infinity,
  });
}

function useApplyTemplate(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: TemplateId) =>
      api.post(`/orgs/${orgId}/templates/${templateId}/apply`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orgs', orgId] });
    },
  });
}

// ── Change template modal ──────────────────────────────────────────────────────

interface ChangeTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templates: Template[];
  currentTemplateId: string | null;
  orgId: string;
}

function ChangeTemplateModal({ open, onClose, templates, currentTemplateId, orgId }: ChangeTemplateModalProps) {
  const [selected, setSelected] = useState<TemplateId | null>(null);
  const applyTemplate = useApplyTemplate(orgId);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleApply = async () => {
    if (!selected) return;
    await applyTemplate.mutateAsync(selected);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change workspace template</h2>
            <p className="mt-0.5 text-sm text-gray-500">Select a template to apply preset configurations</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Applying a template will not delete existing data, only add preset values such as pipeline stages and categories.
          </p>
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 gap-3 p-6">
          {templates.map((t) => {
            const isSelected = selected === t.id;
            const isCurrent = currentTemplateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id as TemplateId)}
                className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <span className="text-3xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
                    {isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleApply()}
            disabled={!selected || applyTemplate.isPending || success}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {applyTemplate.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Applying…</>
            ) : success ? (
              <><Check className="h-4 w-4" /> Applied!</>
            ) : (
              'Apply template'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TemplatesSettings() {
  const orgId = useAuthStore((s) => s.user?.orgId ?? '');
  const { data: templates = [], isLoading } = useTemplates();
  const [showModal, setShowModal] = useState(false);

  // Read the current applied template from org settings
  // We'll derive it from the templates list rather than a separate API call
  // The org settings are available via the auth store or a separate query
  const [currentTemplateId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentTemplate = templates.find((t) => t.id === currentTemplateId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Workspace Template</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Apply a vertical template to pre-configure your workspace for your industry.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LayoutTemplate className="h-4 w-4" />
          Change template
        </button>
      </div>

      {/* Current template */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
        {currentTemplate ? (
          <div className="flex items-center gap-4">
            <span className="text-3xl">{currentTemplate.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentTemplate.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{currentTemplate.description}</p>
            </div>
            <span className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Active
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-400">
            <LayoutTemplate className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">No template applied</p>
              <p className="text-xs">Click &quot;Change template&quot; to configure your workspace for your industry.</p>
            </div>
          </div>
        )}
      </div>

      {/* Available templates preview */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Available templates</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">{t.icon}</span>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
              </div>
              <p className="text-xs text-gray-500">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      <ChangeTemplateModal
        open={showModal}
        onClose={() => setShowModal(false)}
        templates={templates}
        currentTemplateId={currentTemplateId}
        orgId={orgId}
      />
    </div>
  );
}
