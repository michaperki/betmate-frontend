import React from 'react';

type ConfirmButtonProps = {
  onConfirm: () => void | Promise<void>;
  confirm: string;
  disabled?: boolean;
  children?: React.ReactNode;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
};

const ConfirmButton: React.FC<ConfirmButtonProps> = ({ onConfirm, confirm, disabled, children, title, className, style }) => {
  const handleClick = async () => {
    try {
      if (disabled) return;
      if (!window.confirm(confirm)) return;
      await onConfirm();
    } catch (e) {
      // noop; let caller handle refresh/notifications
    }
  };
  return (
    <button title={title} disabled={disabled} onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  );
};

export default ConfirmButton;

