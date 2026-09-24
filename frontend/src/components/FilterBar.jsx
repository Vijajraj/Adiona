import { useState, useMemo } from 'react';
import { Filter, X, Clock, Users, Layers, RotateCcw, Sparkles } from 'lucide-react';
import {
  GENERAL_SAFETY_CATEGORIES,
  WOMEN_SAFETY_CATEGORIES,
  AFFECTED_GROUPS,
} from '../utils/categories';
import seedReports from '../data/seedReports.json';

export function FilterBar({ filters, onFilterChange, onResetFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  // Compute live incident counts for all categories and demographic groups
  const categoryCounts = useMemo(() => {
    const counts = {};
    (seedReports || []).forEach((r) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, []);

  const groupCounts = useMemo(() => {
    const counts = {};
    (seedReports || []).forEach((r) => {
      if (r.affected_group) counts[r.affected_group] = (counts[r.affected_group] || 0) + 1;
    });
    return counts;
  }, []);

  const totalReportsCount = seedReports.length;
  const womenSafetyTotal = (seedReports || []).filter(
    (r) => r.affected_group === 'woman' || WOMEN_SAFETY_CATEGORIES.some((c) => c.id === r.category)
  ).length;

  const activeCount = [
    filters.category,
    filters.hours_back,
    filters.affected_group,
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0;

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
        <span>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        {hasActiveFilters && <span className="filter-active-dot" />}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="filter-panel" role="region" aria-label="Map filters panel">
          <div className="filter-panel-header">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <h3>Heatmap Filters</h3>
              {activeCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {activeCount} active
                </span>
              )}
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

          {/* Quick presets with actual incident numbers */}
          <div className="px-4 pt-3 pb-1 border-b border-slate-700/40">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>Quick Presets</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pb-2">
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filters.affected_group === 'woman'
                    ? 'bg-pink-500/25 border-pink-400 text-pink-300 font-medium ring-1 ring-pink-400/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
                onClick={() =>
                  onFilterChange(
                    'affected_group',
                    filters.affected_group === 'woman' ? null : 'woman'
                  )
                }
              >
                👩 Women Safety ({womenSafetyTotal})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filters.category === 'poor_lighting'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-medium ring-1 ring-amber-400/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
                onClick={() =>
                  onFilterChange(
                    'category',
                    filters.category === 'poor_lighting' ? null : 'poor_lighting'
                  )
                }
              >
                💡 Poor Lighting ({categoryCounts['poor_lighting'] || 0})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filters.category === 'unsafe_road'
                    ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300 font-medium ring-1 ring-indigo-400/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
                onClick={() =>
                  onFilterChange(
                    'category',
                    filters.category === 'unsafe_road' ? null : 'unsafe_road'
                  )
                }
              >
                🚧 Accident Spots ({categoryCounts['unsafe_road'] || 0})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filters.category === 'unsafe_transport'
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-medium ring-1 ring-cyan-400/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
                onClick={() =>
                  onFilterChange(
                    'category',
                    filters.category === 'unsafe_transport' ? null : 'unsafe_transport'
                  )
                }
              >
                🚌 Transit Stops ({categoryCounts['unsafe_transport'] || 0})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filters.hours_back === 24
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-medium ring-1 ring-emerald-400/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
                onClick={() =>
                  onFilterChange('hours_back', filters.hours_back === 24 ? null : 24)
                }
              >
                ⏱️ Past 24h
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
                  {GENERAL_SAFETY_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} {count > 0 ? `(${count})` : '(0)'}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="Women Safety">
                  {WOMEN_SAFETY_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} {count > 0 ? `(${count})` : '(0)'}
                      </option>
                    );
                  })}
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
                <option value="6">Past 6 Hours (Live reports only)</option>
                <option value="24">Past 24 Hours (Live reports only)</option>
                <option value="72">Past 3 Days</option>
                <option value="168">Past 7 Days (Includes 24/09/2026 data)</option>
                <option value="720">Past 30 Days (Includes 24/09/2026 data)</option>
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
                {AFFECTED_GROUPS.map((group) => {
                  const count = groupCounts[group.id] || 0;
                  return (
                    <option key={group.id} value={group.id}>
                      {group.label} {count > 0 ? `(${count})` : '(0)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
