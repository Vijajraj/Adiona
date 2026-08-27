import { useState } from 'react';
import { Filter, X, Clock, Users, Layers, RotateCcw } from 'lucide-react';
import {
  GENERAL_SAFETY_CATEGORIES,
  WOMEN_SAFETY_CATEGORIES,
  AFFECTED_GROUPS,
} from '../utils/categories';

export function FilterBar({ filters, onFilterChange, onResetFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Boolean(
    filters.category || filters.hours_back || filters.affected_group
  );

  return (
    <div className="filter-bar-container">
      {/* Floating trigger button */}
      <button
        type="button"
        className={`filter-toggle-btn ${hasActiveFilters ? 'has-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle map filters"
        aria-expanded={isOpen}
      >
        <Filter size={18} />
        <span>Filters</span>
        {hasActiveFilters && <span className="filter-active-dot" />}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="filter-panel" role="region" aria-label="Map filters panel">
          <div className="filter-panel-header">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <h3>Heatmap Filters</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-reset"
                  onClick={onResetFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                className="close-filter-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close filter panel"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="filter-panel-body space-y-4">
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Layers size={14} />
                <span>Problem Category</span>
              </label>
              <select
                className="filter-select"
                value={filters.category || ''}
                onChange={(e) => onFilterChange('category', e.target.value || null)}
              >
                <option value="">All Categories (Default)</option>
                <optgroup label="General Safety">
                  {GENERAL_SAFETY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Women Safety">
                  {WOMEN_SAFETY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Time Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Clock size={14} />
                <span>Time Range</span>
              </label>
              <select
                className="filter-select"
                value={filters.hours_back || ''}
                onChange={(e) =>
                  onFilterChange('hours_back', e.target.value ? parseInt(e.target.value, 10) : null)
                }
              >
                <option value="">All Time (Cumulative)</option>
                <option value="6">Past 6 Hours</option>
                <option value="24">Past 24 Hours</option>
                <option value="72">Past 3 Days</option>
                <option value="168">Past 7 Days</option>
                <option value="720">Past 30 Days</option>
              </select>
            </div>

            {/* Demographic Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Users size={14} />
                <span>Affected Demographic</span>
              </label>
              <select
                className="filter-select"
                value={filters.affected_group || ''}
                onChange={(e) => onFilterChange('affected_group', e.target.value || null)}
              >
                <option value="">All Groups</option>
                {AFFECTED_GROUPS.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
