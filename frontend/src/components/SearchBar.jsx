import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, X, Loader2, Sparkles, Navigation, Locate } from 'lucide-react';
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
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Instant local results computed synchronously with 0ms delay
  const localResults = useMemo(() => {
    return searchLocalLocalities(query, 8).map((item) => ({
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

  // Debounced Nominatim search (350ms) with in-memory caching and bounded viewbox
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
          console.warn('Geocoding notice:', err.message);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, localResults.length]);

  // Reset active keyboard highlight when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [allResults]);

  const handleSelect = (item) => {
    setQuery(item.shortName);
    setIsOpen(false);
    inputRef.current?.blur(); // Dismiss mobile virtual keyboard
    onSelectLocation(item);
  };

  const handleClear = () => {
    setQuery('');
    setRemoteResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // GPS Locate Current Location
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      setTimeout(() => setGeoError(null), 3000);
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        const item = {
          id: 'user-gps-loc',
          name: 'Your Current GPS Location',
          shortName: 'Current Location',
          category: 'GPS Location',
          lat: latitude,
          lng: longitude,
          isInstant: true,
        };
        handleSelect(item);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err.message);
        setGeoError('Location permission denied or unavailable');
        setTimeout(() => setGeoError(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
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
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search Chennai locality, landmark, metro..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search locality in Chennai"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />

        {/* GPS Locate Button */}
        <button
          type="button"
          className="gps-btn p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
          onClick={handleUseCurrentLocation}
          title="Use current GPS location"
          aria-label="Use current location"
        >
          {locating ? (
            <Loader2 size={16} className="animate-spin text-indigo-400" />
          ) : (
            <Navigation size={15} />
          )}
        </button>

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

      {geoError && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-900/90 text-red-200 text-xs rounded-lg shadow-lg border border-red-700/50 z-50">
          {geoError}
        </div>
      )}

      {isOpen && (
        <div className="search-results-dropdown" role="listbox" aria-label="Search suggestions" ref={listRef}>
          {/* Quick GPS option at top */}
          <button
            type="button"
            className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 border-b border-slate-700/40 hover:bg-indigo-500/10 transition-colors group"
            onClick={handleUseCurrentLocation}
          >
            <div className="p-1.5 rounded-full bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Locate size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                {locating ? 'Detecting your location...' : 'Use current location'}
              </div>
              <div className="text-[11px] text-slate-400">Jump directly to your GPS coordinates in Chennai</div>
            </div>
          </button>

          {allResults.length > 0 ? (
            <ul className="py-1">
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
          ) : query.trim().length >= 2 && !loading ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No matching Chennai localities found. Try another landmark or area.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
