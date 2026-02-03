import React from 'react';
import FeatureToggle from './FeatureToggle';

type ToggleCategory = 'safety' | 'growth' | 'ops';

interface FeatureData {
  key: string;
  label: string;
  value: boolean;
  description?: string;
  category: ToggleCategory;
  impact: 'low' | 'medium' | 'high';
  disabled?: boolean;
}

interface FeatureSectionProps {
  title: string;
  features: FeatureData[];
  onChange: (key: string, value: boolean) => void;
  category: ToggleCategory;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ title, features, onChange, category }) => (
  <div>
    <div className={`feature-group-heading ${category}`}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {features.map((feature) => (
        <FeatureToggle
          key={feature.key}
          label={feature.label}
          value={feature.value}
          onChange={(value) => onChange(feature.key, value)}
          description={feature.description}
          category={feature.category}
          impact={feature.impact}
          disabled={feature.disabled}
        />
      ))}
    </div>
  </div>
);

export default FeatureSection;

