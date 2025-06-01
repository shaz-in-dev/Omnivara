'use client';
import { useState } from 'react';
import { Search, Plus, MoreHorizontal, Mail, Shield, UserX, Crown, User, Briefcase, Loader2 } from 'lucide-react';
import { useMembers, useInviteMember, type ApiMember } from '@/hooks/use-members';
import { useEmailVerified } from '@/hooks/use-email-verified';
import { useSubscription } from '@/hooks/use-billing';
import { LimitReachedModal } from '@/components/billing/limit-reached-modal';

const PLAN_MEMBER_LIMITS: Record<string, number> = {
  starter: 5,
  growth:  25,
  business: 100,
  enterprise: Infinity,
};

type RoleLabel = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner:  { label: 'Owner',  icon: Crown,    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
  admin:  { label: 'Admin',  icon: Shield,   color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
  member: { label: 'Member', icon: User,     color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  viewer: { label: 'Viewer', icon: Briefcase, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
};

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-indigo-500',
];

function avatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-brand-500';
}

function RoleBadge({ roleName }: { roleName: string }) {
  const key = roleName.toLowerCase();
  const cfg = ROLE_CONFIG[key] ?? ROLE_CONFIG['member']!;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

interface Props {
  orgId: string;
}

export function MembersSettings({ orgId }: Props) {
  const { guardAction } = useEmailVerified();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useMembers(orgId);
  const invite = useInviteMember(orgId);
  const { data: subData } = useSubscription();
  const [showLimitModal, setShowLimitModal] = useState(false);

  const planId     = subData?.planId ?? 'starter';
  const memberLimit = PLAN_MEMBER_LIMITS[planId] ?? 5;
  const atLimit    = members.length >= memberLimit;

  const filtered = members.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleInvite = async () => {
    if (!inviteEmail) return;
    await invite.mutateAsync({ email: inviteEmail });
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInvite(false);
      setInviteEmail('');
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Members</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading ? '…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => {
            if (atLimit) { setShowLimitModal(true); return; }
            guardAction(() => setShowInvite(!showInvite), 'Verify your email before inviting team members.');
          }}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Invite member
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-800 dark:bg-brand-900/10">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Invite a new member</h4>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => void handleInvite()}
              disabled={invite.isPending || !inviteEmail}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {invite.isPending ? 'Sending…' : inviteSent ? '✓ Sent!' : 'Send invite'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-40 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span className="text-sm">Loading members…</span>
        </div>
      )}

      {/* Members table */}
      {!isLoading && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Member', 'Role', 'Joined', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                    {search ? 'No members match your search.' : 'No members yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((member: ApiMember) => (
                  <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${avatarColor(member.userId)} text-xs font-bold text-white`}>
                          {member.user.name.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                          <p className="text-xs text-gray-400">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge roleName={member.role.name} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">
                      {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                          className="rounded-lg p-1.5 text-gray-300 opacity-0 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === member.id && (
                          <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                              <Shield className="h-3.5 w-3.5 text-gray-400" />
                              Change role
                            </button>
                            <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                              <UserX className="h-3.5 w-3.5" />
                              Remove member
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <LimitReachedModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        type="members"
        currentPlan={planId}
      />
    </div>
  );
}
