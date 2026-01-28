import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './style.scss';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-toggle" data-testid="theme-toggle">
      <button
        className="theme-toggle-button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg className="sun-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
              fill="currentColor"
            />
            <path
              d="M12 1V3M12 21V23M1 12H3M21 12H23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg className="moon-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 12.79C20.8427 14.4922 20.204 16.1144 19.1582 17.4668C18.1123 18.8192 16.7034 19.8458 15.0957 20.4265C13.4879 21.0073 11.748 21.1181 10.0795 20.7461C8.41104 20.3741 6.88302 19.5345 5.67425 18.3258C4.46548 17.117 3.62596 15.589 3.25393 13.9205C2.88191 12.252 2.99274 10.5121 3.57346 8.9043C4.15418 7.29651 5.18079 5.88765 6.53321 4.84175C7.88564 3.79585 9.50779 3.15719 11.21 3C10.2134 4.34827 9.73385 6.00945 9.85852 7.68141C9.98318 9.35338 10.7038 10.9251 11.8893 12.1106C13.0748 13.2961 14.6466 14.0168 16.3186 14.1415C17.9906 14.2662 19.6517 13.7866 21 12.79Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;
