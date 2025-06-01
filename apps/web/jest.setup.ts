import '@testing-library/jest-dom';

// Suppress console.error noise from React in test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

// Mock next/headers (used in server components)
jest.mock('next/headers', () => ({
  cookies: () => ({ get: jest.fn(), set: jest.fn() }),
  headers: () => new Map(),
}));
