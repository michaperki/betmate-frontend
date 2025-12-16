import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';

type AdminRouteProps = RouteProps & { redirectTo?: string };

const AdminRoute: React.FC<AdminRouteProps> = ({ redirectTo = '/signin', ...rest }) => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const role = useSelector((s: RootState) => (s.auth.user as any)?.role);

  return (
    <Route
      {...rest}
      render={({ location, ...props }) => {
        // Require full authentication (no tentative token allow) for admin routes
        if (!isAuthenticated) {
          return <Redirect to={{ pathname: redirectTo, state: { from: location?.pathname || '/' } }} />;
        }
        // If authenticated but not admin, redirect home
        if (isAuthenticated && role !== 'admin') {
          return <Redirect to={{ pathname: '/', state: { from: location?.pathname || '/' } }} />;
        }
        // Otherwise render (we allow tentative render with token; API calls are server-guarded)
        return rest.render ? (rest.render as any)(props) : (rest.component ? React.createElement(rest.component as any, props) : null);
      }}
    />
  );
};

export default AdminRoute;
