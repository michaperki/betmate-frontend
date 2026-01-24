import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { authTokenName } from 'utils';

/**
 * Redirect unauthenticated guests of new mock-first pages to onboarding,
 * but avoid redirecting while a persisted token is present (jwt hydration).
 */
export function useRequireAuthForNew(): void {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    try {
      const hasToken = (typeof window !== 'undefined') && !!window.localStorage.getItem(authTokenName);
      if (!isAuthenticated && !hasToken) {
        const from = encodeURIComponent(location.pathname + (location.search || ''));
        history.replace(`/new-onboarding?from=${from}`);
      }
    } catch {}
  }, [isAuthenticated, history, location.pathname, location.search]);
}

