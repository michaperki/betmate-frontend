import React from 'react';

const Card: React.FC<{ title?: string; actions?: React.ReactNode; style?: React.CSSProperties }>= ({ title, actions, style, children }) => (
  <div className="admin-card" style={style}>
    {title && (
      <div className="admin-card__title">
        <span>{title}</span>
        {actions}
      </div>
    )}
    {children}
  </div>
);

export default Card;

