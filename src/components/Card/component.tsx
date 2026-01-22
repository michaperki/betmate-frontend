import React from 'react';
import clsx from 'clsx';
import './style.scss';

type Props = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
};

export const Card: React.FC<Props> = ({ children, className, interactive }) => {
  return (
    <div
      className={clsx('bm-card', interactive && 'bm-card--interactive', className)}
    >
      {children}
    </div>
  );
};

export default Card;
