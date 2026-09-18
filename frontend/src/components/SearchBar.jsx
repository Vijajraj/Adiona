import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, X, Loader2, Sparkles, Navigation } from 'lucide-react';
import { CHENNAI_BOUNDS } from '../utils/bounds';
import { searchLocalLocalities } from '../utils/chennaiLocalities';

// In-memory cache to prevent duplicate remote queries
const nominatimCache = new Map();

export function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Instant local results computed synchronously with 0ms delay
  const localResults = useMemo(() => {
    return searchLocalLocalities(query, 6).map((item) => ({
      id: `local-${item.shortName}`,
      name: item.name,
      shortName: item.shortName,
      category: item.category,
      lat: item.lat,
      lng: item.lng,
      isInstant: true,
    }));
  }, [query]);

  // Combined and deduplicated list of results
  const allResults = useMemo(() => {
    const seen = new Set();
    const list = [];

    // Prioritize instant curated local results
    for (const item of localResults) {
      seen.add(item.shortName.toLowerCase());
      list.push(item);
    }

    // Append remote Nominatim results if not already matched
    for (const item of remoteResults) {
      const key = item.shortName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }

    return list;
  }, [localResults, remoteResults]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fast debounced Nominatim search with in-memory caching
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setRemoteResults([]);
      setLoading(false);
      if (localResults.length === 0) {
        setIsOpen(false);
      }
      return;
    }

    setIsOpen(true);
    const normalizedKey = trimmed.toLowerCase();

    // Check cache first for instant response
    if (nominatimCache.has(normalizedKey)) {
      setRemoteResults(nominatimCache.get(normalizedKey));
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      try {
        const minLng = CHENNAI_BOUNDS[0][0];
        const minLat = CHENNAI_BOUNDS[0][1];
        const maxLng = CHENNAI_BOUNDS[1][0];
        const maxLat = CHENNAI_BOUNDS[1][1];

        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed
        )}+Chennai&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&limit=6`;

        const res = await fetch(searchUrl, {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'en',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const parsed = data
            .map((item) => ({
              id: `osm-${item.place_id}`,
              name: item.display_name,
              shortName: item.display_name.split(',')[0],
              category: 'Chennai Address',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              isInstant: false,
            }))
            .filter(
              (item) =>
                item.lat >= minLat &&
                item.lat <= maxLat &&
                item.lng >= minLng &&
                item.lng <= maxLng
            );

          nominatimCache.set(normalizedKey, parsed);
          setRemoteResults(parsed);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Geocoding fallback notice:', err.message);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, localResults.length]);

  // Reset active keyboard highlight when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [allResults]);

  const handleSelect = (item) => {
    setQuery(item.shortName);
    setIsOpen(false);
    onSelectLocation(item);
  };

  const handleClear = () => {
    setQuery('');
    setRemoteResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Keyboard navigation support
  const handleKeyDown = (e) => {
    if (!isOpen || allResults.length === 0) {
      if (e.key === 'ArrowDown' && query.trim().length >= 1) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allResults.length) {
        handleSelect(allResults[activeIndex]);
      } else if (allResults.length > 0) {
        handleSelect(allResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon text-slate-400" />
        <input
          type="text"
          className="search-input"
          placeholder="Search Chennai locality (e.g. T. Nagar, Velachery)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= 1 && allResults.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search locality in Chennai"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading ? (
          <Loader2 size={16} className="clear-icon animate-spin text-slate-400" />
        ) : query ? (
          <button
            type="button"
            className="clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {isOpen && allResults.length > 0 && (
        <ul
          ref={listRef}
          className="search-results-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {allResults.map((item, idx) => {
            const isHighlighted = idx === activeIndex;
            return (
              <li key={item.id} role="option" aria-selected={isHighlighted}>
                <button
                  type="button"
                  className={`search-result-item ${isHighlighted ? 'active-highlight' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="result-icon-wrap">
                    {item.isInstant ? (
                      <Sparkles size={15} className="text-amber-400 flex-shrink-0" />
                    ) : (
                      <MapPin size={15} className="text-indigo-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="result-text flex-1 min-w-0">
                    <div className="result-title-row flex items-center justify-between gap-2">
                      <span className="result-title font-medium truncate">{item.shortName}</span>
                      {item.category && (
                        <span className="result-badge flex-shrink-0">{item.category}</span>
                      )}
                    </div>
                    <div className="result-desc text-xs text-slate-400 truncate">{item.name}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
