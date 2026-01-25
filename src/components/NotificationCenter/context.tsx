import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';

import './style.scss';

export type NotificationType = 'success' | 'error' | 'info' | 'win' | 'loss';

export interface Notification {
  id: number;
  title: string;
  message?: string;
  type: NotificationType;
  duration?: number;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationContextValue {
  notify: (notification: Omit<Notification, 'id'>) => void;
  notifySuccess: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string) => void;
  notifyInfo: (title: string, message?: string) => void;
  beginGlobalLoading: () => void;
  endGlobalLoading: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingCount, setLoadingCount] = useState(0);
  const idRef = useRef(0);

  const removeNotification = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = idRef.current += 1;
    const newNotification: Notification = {
      id,
      duration: 4000,
      ...notification,
    };

    setNotifications((current) => [...current, newNotification]);

    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }, [removeNotification]);

  const notifySuccess = useCallback((title: string, message?: string) => {
    notify({ title, message, type: 'success' });
  }, [notify]);

  const notifyError = useCallback((title: string, message?: string) => {
    notify({ title, message, type: 'error' });
  }, [notify]);

  const notifyInfo = useCallback((title: string, message?: string) => {
    notify({ title, message, type: 'info' });
  }, [notify]);

  const beginGlobalLoading = useCallback(() => {
    setLoadingCount((count) => count + 1);
  }, []);

  const endGlobalLoading = useCallback(() => {
    setLoadingCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(() => ({
    notify,
    notifySuccess,
    notifyError,
    notifyInfo,
    beginGlobalLoading,
    endGlobalLoading,
  }), [notify, notifySuccess, notifyError, notifyInfo, beginGlobalLoading, endGlobalLoading]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {loadingCount > 0 && (
        <div className="global-loading-bar">
          <div className="loading-bar" />
        </div>
      )}
      <div className="notification-stack">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-toast ${notification.type}`}
            role="status"
          >
            {notification.icon && (
              <div className="notification-icon" aria-hidden>{notification.icon}</div>
            )}
            <div className="notification-content">
              <strong>{notification.title}</strong>
              {notification.message && <p>{notification.message}</p>}
            </div>
            {notification.actionLabel && (
              <button className="notification-action" onClick={notification.onAction}>{notification.actionLabel}</button>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
};
