import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { authTokenName } from 'utils';

type ProtectedRouteProps = RouteProps & { redirectTo?: string };

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectTo = '/signin', ...rest }) => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  // If a token exists but Redux hasn't hydrated yet, treat as tentatively authenticated
  const hasToken = (typeof window !== 'undefined') && !!localStorage.getItem(authTokenName);
  return (
    <Route
      {...rest}
      render={({ location, ...props }) => (
        (isAuthenticated || hasToken)
          ? (rest.render ? (rest.render as any)(props) : (rest.component ? React.createElement(rest.component as any, props) : null))
          : <Redirect to={{ pathname: redirectTo, state: { from: location?.pathname || '/' } }} />
      )}
    />
  );
};

export default ProtectedRoute;
