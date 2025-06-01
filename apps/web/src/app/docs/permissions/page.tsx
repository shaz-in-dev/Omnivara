import { RolesMatrix } from '@/components/settings/roles-matrix';

export const metadata = {
  title: 'Permissions Reference — Omnivara',
  description: 'Complete permissions matrix showing what each role can do across all Omnivara modules.',
};

export default function PermissionsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Permissions Reference</h1>
        <p className="mt-2 text-gray-500">
          Complete overview of what each role can do across all modules. Admins can create custom
          roles in{' '}
          <a href="/settings" className="text-brand-600 hover:underline">
            Settings → Roles
          </a>
          .
        </p>
      </div>
      <RolesMatrix />
    </div>
  );
}
