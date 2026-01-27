import React from 'react';

interface StarRatingProps {
  score: number;
  maxStars?: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Converts a score (0-100) to a star rating (0-maxStars with half-star precision)
 * For example, with maxStars=5:
 * - 0-10: 0 stars (complete blunder)
 * - 10-40: 0.5-1 stars (poor move)
 * - 40-60: 1.5-2 stars (decent move)
 * - 60-80: 2.5-3 stars (good move)
 * - 80-95: 3.5-4 stars (excellent move)
 * - 95-100: 4.5-5 stars (best move)
 */
export const scoreToStars = (score: number, maxStars: number = 5): number => {
  if (!Number.isFinite(score) || score < 0) return 0;
  if (score > 100) score = 100; // Cap at 100
  
  // Convert to a scale from 0 to maxStars with half-star precision
  if (score < 10) return 0;
  if (score < 40) return maxStars * 0.1;
  if (score < 50) return maxStars * 0.3;
  if (score < 60) return maxStars * 0.4;
  if (score < 70) return maxStars * 0.6;
  if (score < 80) return maxStars * 0.7;
  if (score < 90) return maxStars * 0.8;
  if (score < 95) return maxStars * 0.9;
  return maxStars;
};

const StarRating: React.FC<StarRatingProps> = ({ 
  score,
  maxStars = 5,
  size = 'medium',
  className = '',
  style = {}
}) => {
  // Calculate star rating based on score
  const starRating = scoreToStars(score, maxStars);
  
  // Determine the size in pixels
  const sizeInPx = size === 'small' ? 12 : size === 'medium' ? 16 : 20;

  return (
    <div 
      className={`star-rating ${className}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        ...style
      }}
    >
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = Math.min(1, Math.max(0, starRating - i));
        
        // Choose the star type
        let starType: 'filled' | 'half' | 'empty';
        if (filled >= 0.8) {
          starType = 'filled';
        } else if (filled >= 0.2) {
          starType = 'half';
        } else {
          starType = 'empty';
        }
        
        return (
          <Star 
            key={i} 
            type={starType} 
            size={sizeInPx} 
          />
        );
      })}
    </div>
  );
};

interface StarProps {
  type: 'filled' | 'half' | 'empty';
  size: number;
}

// Individual star component
const Star: React.FC<StarProps> = ({ type, size }) => {
  const sizeStyle = { width: `${size}px`, height: `${size}px` };
  
  // Star colors based on type
  const fillColor = type === 'empty' ? 'none' : 'var(--warning, #f59e0b)';
  const strokeColor = 'var(--warning, #f59e0b)';
  const opacity = type === 'empty' ? 0.3 : 1;
  
  // Generate a unique ID for the gradient to avoid conflicts with multiple instances
  const gradientId = `half-fill-${Math.random().toString(36).substr(2, 9)}`;
  
  if (type === 'half') {
    return (
      <div style={{ display: 'inline-flex', ...sizeStyle }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor={fillColor} stopOpacity={1} />
              <stop offset="50%" stopColor="transparent" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={`url(#${gradientId})`}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'inline-flex', ...sizeStyle }}>
      <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default StarRating;