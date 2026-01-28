import React, { useEffect } from 'react';
import { subscribe } from './bus';
import { useNotifications } from './context';

const NotificationBridge: React.FC = () => {
  const {
    notify, notifySuccess, notifyError, notifyInfo,
  } = useNotifications();

  useEffect(() => {
    return subscribe((n) => {
      // Pass through full type so custom variants (win/loss) render with styles
      if (n.type === 'success') notifySuccess(n.title, n.message);
      else if (n.type === 'error') notifyError(n.title, n.message);
      else if (n.type === 'info') notifyInfo(n.title, n.message);
      else notify({ type: n.type as any, title: n.title, message: n.message });
    });
  }, [notify, notifySuccess, notifyError, notifyInfo]);

  return null;
};

export default NotificationBridge;
