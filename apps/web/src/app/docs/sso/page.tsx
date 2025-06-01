import { Shield, ExternalLink, Copy } from 'lucide-react';

export const metadata = {
  title: 'SSO Setup Guide — Omnivara',
  description: 'Step-by-step guide for configuring SAML 2.0 / OIDC Single Sign-On with Okta, Azure AD, Google Workspace, and other identity providers.',
};

const PROVIDERS = [
  {
    id: 'okta',
    name: 'Okta',
    steps: [
      'In the Okta Admin Console, go to Applications → Create App Integration.',
      'Select SAML 2.0 as the sign-on method.',
      'Set the Single sign-on URL to: https://app.omnivara.io/api/v1/auth/sso/saml/callback',
      'Set the Audience URI (SP Entity ID) to: https://app.omnivara.io',
      'Set Name ID format to EmailAddress.',
      'Add attribute mappings: email → user.email, firstName → user.firstName, lastName → user.lastName.',
      'Download the Identity Provider metadata XML and paste it in Omnivara → Settings → Security → SAML Configuration.',
      'Assign the application to your users or groups.',
      'Test the integration using the "Preview the SAML Assertion" button.',
    ],
  },
  {
    id: 'azure',
    name: 'Azure Active Directory',
    steps: [
      'In the Azure Portal, go to Azure Active Directory → Enterprise Applications → New application.',
      'Select "Create your own application" → "Integrate any other application you don\'t find in the gallery".',
      'Under Single sign-on, select SAML.',
      'Set the Identifier (Entity ID) to: https://app.omnivara.io',
      'Set the Reply URL (ACS URL) to: https://app.omnivara.io/api/v1/auth/sso/saml/callback',
      'Configure user attributes: user.mail → email, user.givenname → firstName, user.surname → lastName.',
      'Download the Federation Metadata XML and paste it in Omnivara → Settings → Security → SAML Configuration.',
      'Assign users and groups to the application.',
      'Test with a pilot user before rolling out to the entire org.',
    ],
  },
  {
    id: 'google',
    name: 'Google Workspace',
    steps: [
      'In the Google Admin console, go to Apps → Web and mobile apps → Add App → Add custom SAML app.',
      'Name the app "Omnivara" and click Next.',
      'Download the IdP metadata (or note the SSO URL and certificate). Click Next.',
      'Set the ACS URL to: https://app.omnivara.io/api/v1/auth/sso/saml/callback',
      'Set the Entity ID to: https://app.omnivara.io',
      'Set Name ID format to EMAIL and Name ID to Primary Email.',
      'Add attribute mappings: Basic Information > Primary Email → email.',
      'Turn on the app for the appropriate organizational units.',
      'Test with a user in the assigned OU.',
    ],
  },
  {
    id: 'generic',
    name: 'Generic SAML 2.0',
    steps: [
      'Obtain your Identity Provider\'s metadata XML or SSO URL and certificate.',
      'In your IdP, create a new SAML 2.0 application.',
      'Set the SP Entity ID (Audience) to: https://app.omnivara.io',
      'Set the ACS (Callback) URL to: https://app.omnivara.io/api/v1/auth/sso/saml/callback',
      'Configure attribute mapping for: email (required), firstName (optional), lastName (optional).',
      'Set Name ID format to urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      'Paste your IdP metadata XML or enter the SSO URL + certificate in Omnivara → Settings → Security → SAML.',
      'Set the domain restriction so only your company email domain can use SSO.',
      'Click "Test SSO" in Omnivara settings to verify the integration.',
    ],
  },
];

export default function SsoDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
          <Shield className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SSO Setup Guide</h1>
          <p className="mt-2 text-gray-500">
            Configure Single Sign-On for your organization. SSO is available on{' '}
            <strong>Business and Enterprise</strong> plans. Your users will be able to log in
            with their existing company credentials.
          </p>
        </div>
      </div>

      {/* SP Metadata */}
      <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Omnivara Service Provider Details
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Use these values when configuring your Identity Provider:
        </p>
        <div className="space-y-3">
          {[
            { label: 'Entity ID (Audience URI)', value: 'https://app.omnivara.io' },
            { label: 'ACS URL (Callback URL)',    value: 'https://app.omnivara.io/api/v1/auth/sso/saml/callback' },
            { label: 'Metadata URL',              value: 'https://app.omnivara.io/api/v1/auth/sso/saml/metadata' },
            { label: 'Name ID Format',            value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 rounded-xl bg-white px-4 py-3 dark:bg-gray-900">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-0.5 font-mono text-sm text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          href="/api/v1/auth/sso/saml/metadata"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <ExternalLink className="h-4 w-4" /> Download SP metadata XML
        </a>
      </div>

      {/* Provider guides */}
      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
        Step-by-step guides
      </h2>
      <div className="space-y-8">
        {PROVIDERS.map((provider) => (
          <div
            key={provider.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
          >
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              {provider.name}
            </h3>
            <ol className="space-y-3">
              {provider.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* Troubleshooting */}
      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-900/10">
        <h3 className="mb-3 text-base font-semibold text-amber-800 dark:text-amber-400">
          Common issues
        </h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-500">
          <li><strong>Invalid ACS URL:</strong> Make sure there are no trailing slashes or typos.</li>
          <li><strong>Clock skew error:</strong> Ensure your IdP clock is synchronized (NTP). SAML assertions expire quickly.</li>
          <li><strong>Attribute not found:</strong> Check that the email attribute is mapped exactly — it is case-sensitive.</li>
          <li><strong>Certificate mismatch:</strong> If you rotate your IdP certificate, update it in Omnivara Settings immediately.</li>
          <li><strong>Domain restriction:</strong> Only users with your configured domain can use SSO. Others must use password login.</li>
        </ul>
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        Need help?{' '}
        <a href="mailto:support@omnivara.io" className="text-brand-600 hover:underline">
          support@omnivara.io
        </a>{' '}
        · Enterprise customers get dedicated onboarding for SSO configuration.
      </div>
    </div>
  );
}
