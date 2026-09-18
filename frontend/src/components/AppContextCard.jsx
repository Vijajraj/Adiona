import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Info, EyeOff, MapPin, Users } from 'lucide-react';

export function AppContextCard() {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  if (!isExpanded) {
    return (
      <div className="webapp-context-collapsed-wrapper">
        <button
          type="button"
          className="webapp-context-toggle-btn"
          onClick={() => setIsExpanded(true)}
          title="Learn about Chennai Safety Map"
          aria-label="Expand About Adiona context"
        >
          <Info size={14} className="text-indigo-500 flex-shrink-0" />
          <span className="context-toggle-label">About Adiona</span>
          <ChevronUp size={14} className="text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <aside className="webapp-context-card" aria-label="About Chennai Safety Map">
      {/* Card Header */}
      <div className="context-card-header">
        <div className="context-title-group">
          <div className="context-icon-wrap">
            <Shield size={14} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="context-card-title">About Adiona</h3>
            <p className="context-card-sub">Chennai Safety Map</p>
          </div>
        </div>
        <button
          type="button"
          className="context-collapse-btn"
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse About card"
          title="Minimize"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {/* Card Body */}
      <div className="context-card-body">
        <p className="context-mission-text">
          A login-free, hyperlocal civic safety network for Chennai citizens to share real-time street safety insights.
        </p>

        <ul className="context-features-list">
          <li>
            <EyeOff size={13} className="feature-icon text-emerald-600" />
            <span><strong>100% Anonymous:</strong> No signups, tracking, or personal data.</span>
          </li>
          <li>
            <MapPin size={13} className="feature-icon text-indigo-600" />
            <span><strong>~100m Privacy Grid:</strong> Exact GPS coordinates are never stored.</span>
          </li>
          <li>
            <Users size={13} className="feature-icon text-amber-600" />
            <span><strong>Civic Consensus:</strong> Crowd-verified reports update density live.</span>
          </li>
        </ul>

        {/* Footer info pill */}
        <div className="context-footer-pill">
          <span className="live-dot-mini" />
          <span>Active across Chennai • 15/09/2026</span>
        </div>
      </div>
    </aside>
  );
}
