/**
 * Returns { isVerified, gate } where gate() throws and shows a toast/alert
 * if the user's email is not verified.
 *
 * Usage:
 *   const { isVerified, guardAction } = useEmailVerified();
 *   <button onClick={() => guardAction(() => doSomething())} ...>
 */
import { useAuthStore } from '@/stores/auth.store';

export function useEmailVerified() {
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.emailVerified === true;

  /**
   * If verified, runs fn(). Otherwise alerts and does nothing.
   * Pass a custom message to override the default alert.
   */
  function guardAction(fn: () => void, message?: string) {
    if (isVerified) {
      fn();
    } else {
      alert(
        message ??
          'Please verify your email address first. Check your inbox for the verification link.',
      );
    }
  }

  return { isVerified, guardAction };
}
