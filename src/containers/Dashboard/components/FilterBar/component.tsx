import React from 'react';
import { TimeFilter, RatingFilter, FilterState } from 'hooks/useFilterState';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import './style.scss';

export interface FilterBarProps {
  filters: FilterState;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onRatingFilterChange: (filter: RatingFilter) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onTimeFilterChange,
  onRatingFilterChange,
  onClearFilters,
  totalCount,
  filteredCount,
}) => {
  const { isMobile } = useResponsiveLayout();

  const timeFilterOptions: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All Times' },
    { value: 'starting_soon', label: 'Starting Soon' },
    { value: 'live', label: 'Live Now' },
    { value: 'ending_soon', label: 'Ending Soon' },
  ];

  const ratingFilterOptions: { value: RatingFilter; label: string }[] = [
    { value: 'all', label: 'All Ratings' },
    { value: 'beginner', label: 'Beginner (<1400)' },
    { value: 'intermediate', label: 'Intermediate (1400-1800)' },
    { value: 'master', label: 'Master (1800+)' },
  ];

  const hasActiveFilters = filters.timeFilter !== 'all' || filters.ratingFilter !== 'all';

  return (
    <div className="filter-bar" data-tour-id="filters">
      <div className="filter-header">
        <h3 className="filter-title">Filters</h3>
      </div>
      <div className="filter-controls">
        <div className="filter-group">
          <label className="filter-label">Time</label>
          <select 
            className="filter-select"
            value={filters.timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
          >
            {timeFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Rating</label>
          <select 
            className="filter-select"
            value={filters.ratingFilter}
            onChange={(e) => onRatingFilterChange(e.target.value as RatingFilter)}
          >
            {ratingFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button 
            className="btn btn-secondary filter-clear-btn"
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="filter-results">
        {totalCount > 0 ? (
          <span className="results-text">
            Showing {filteredCount} of {totalCount} matches
          </span>
        ) : (
          <span className="results-text empty">
            No matches currently available
          </span>
        )}
        {hasActiveFilters && (
          <span className="filter-indicator">
            <span className="indicator-dot"></span>
            Filtered
          </span>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
