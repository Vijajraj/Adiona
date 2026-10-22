import { useState, useMemo } from 'react';
import { Filter, X, Clock, Users, Layers, RotateCcw, Sparkles, LifeBuoy, Sun, Moon, Sunset, Sunrise } from 'lucide-react';
import {
  GENERAL_SAFETY_CATEGORIES,
  WOMEN_SAFETY_CATEGORIES,
  AFFECTED_GROUPS,
} from '../utils/categories';
import { useTranslation } from '../i18n/LanguageContext';
import seedReports from '../data/seedReports.json';

export function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  showHelpPoints,
  onToggleHelpPoints,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useTranslation();

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

  const womenSafetyTotal = (seedReports || []).filter(
    (r) => r.affected_group === 'woman' || WOMEN_SAFETY_CATEGORIES.some((c) => c.id === r.category)
  ).length;

  const activeCount = [
    filters.category,
    filters.hours_back,
    filters.affected_group,
    filters.time_bucket && filters.time_bucket !== 'all' ? filters.time_bucket : null,
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
        <span>{t('filters')}{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        {hasActiveFilters && <span className="filter-active-dot" />}
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="filter-panel" role="region" aria-label="Map filters panel">
          <div className="filter-panel-header">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <h3>{t('heatmapFilters')}</h3>
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
                  <span>{t('clearFilters')}</span>
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
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <span>{language === 'ta' ? 'விரைவு வடிப்புகள்' : 'Quick Presets'}</span>
              </div>

              {/* Nearby Emergency Help Layer Toggle */}
              {onToggleHelpPoints && (
                <button
                  type="button"
                  onClick={onToggleHelpPoints}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                    showHelpPoints
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={t('nearbyHelpDesc')}
                >
                  <LifeBuoy size={11} className={showHelpPoints ? 'text-emerald-400 animate-pulse' : ''} />
                  <span>{t('nearbyHelp')}</span>
                </button>
              )}
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
                👩 {t('group_woman')} ({womenSafetyTotal})
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
                💡 {t('cat_poor_lighting')} ({categoryCounts['poor_lighting'] || 0})
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
                🚧 {t('cat_unsafe_road')} ({categoryCounts['unsafe_road'] || 0})
              </button>
              <button
                type="button"
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filters.time_bucket === 'night'
                    ? 'bg-purple-500/25 border-purple-400 text-purple-300 font-medium ring-1 ring-purple-400/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
                onClick={() =>
                  onFilterChange(
                    'time_bucket',
                    filters.time_bucket === 'night' ? 'all' : 'night'
                  )
                }
              >
                🌙 {t('timeNight')}
              </button>
            </div>
          </div>

          <div className="filter-panel-body space-y-4">
            {/* Time of Day Bucket Filter (Phase 2 Spec §3.2) */}
            <div className="filter-group">
              <label className="filter-label">
                <Clock size={14} />
                <span>{t('timeOfDay')}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: t('timeAll'), icon: null },
                  { id: 'morning', label: t('timeMorning'), icon: Sunrise },
                  { id: 'afternoon', label: t('timeAfternoon'), icon: Sun },
                  { id: 'evening', label: t('timeEvening'), icon: Sunset },
                  { id: 'night', label: t('timeNight'), icon: Moon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = (filters.time_bucket || 'all') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onFilterChange('time_bucket', item.id)}
                      className={`text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {Icon && <Icon size={12} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Problem Category Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Layers size={14} />
                <span>{t('problemCategory')}</span>
              </label>
              <select
                className="filter-select"
                value={filters.category || ''}
                onChange={(e) => onFilterChange('category', e.target.value || null)}
              >
                <option value="">{language === 'ta' ? 'அனைத்து வகைகளும்' : 'All Categories (Default)'}</option>
                <optgroup label={language === 'ta' ? 'பொதுப் பாதுகாப்பு' : 'General Safety'}>
                  {GENERAL_SAFETY_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    const label = t(`cat_${cat.id}`) || cat.label;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {label} {count > 0 ? `(${count})` : '(0)'}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label={language === 'ta' ? 'பெண்கள் பாதுகாப்பு' : 'Women Safety'}>
                  {WOMEN_SAFETY_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    const label = t(`cat_${cat.id}`) || cat.label;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {label} {count > 0 ? `(${count})` : '(0)'}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            {/* Recency Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Clock size={14} />
                <span>{t('timeRange')}</span>
              </label>
              <select
                className="filter-select"
                value={filters.hours_back || ''}
                onChange={(e) =>
                  onFilterChange('hours_back', e.target.value ? parseInt(e.target.value, 10) : null)
                }
              >
                <option value="">{t('allTime')}</option>
                <option value="24">{t('past24h')}</option>
                <option value="168">{t('past7d')}</option>
                <option value="720">{t('past30d')}</option>
                <option value="2160">{t('past90d')}</option>
              </select>
            </div>

            {/* Demographic Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <Users size={14} />
                <span>{t('affectedDemographic')}</span>
              </label>
              <select
                className="filter-select"
                value={filters.affected_group || ''}
                onChange={(e) => onFilterChange('affected_group', e.target.value || null)}
              >
                <option value="">{language === 'ta' ? 'அனைத்து குழுக்கள்' : 'All Groups'}</option>
                {AFFECTED_GROUPS.map((group) => {
                  const count = groupCounts[group.id] || 0;
                  const label = t(`group_${group.id}`) || group.label;
                  return (
                    <option key={group.id} value={group.id}>
                      {label} {count > 0 ? `(${count})` : '(0)'}
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
