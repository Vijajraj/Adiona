import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { CHENNAI_BOUNDS } from '../utils/bounds';

export function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);

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

  // Debounced Nominatim Search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setIsOpen(false);
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

        // Nominatim query bounded to Chennai box
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed
        )}+Chennai&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&limit=5`;

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
              id: item.place_id,
              name: item.display_name,
              shortName: item.display_name.split(',')[0],
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }))
            .filter(
              (item) =>
                item.lat >= minLat &&
                item.lat <= maxLat &&
                item.lng >= minLng &&
                item.lng <= maxLng
            );

          setResults(parsed);
          setIsOpen(parsed.length > 0);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Nominatim search failed:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.shortName);
    setIsOpen(false);
    onSelectLocation(item);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && results.length > 0 && setIsOpen(true)}
          aria-label="Search locality in Chennai"
        />
        {loading ? (
          <Loader2 size={16} className="clear-icon animate-spin text-slate-400" />
        ) : query ? (
          <button type="button" className="clear-btn" onClick={handleClear} aria-label="Clear search">
            <X size={16} />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <ul className="search-results-dropdown" role="listbox">
          {results.map((item) => (
            <li key={item.id} role="option" aria-selected={false}>
              <button type="button" className="search-result-item" onClick={() => handleSelect(item)}>
                <MapPin size={16} className="text-indigo-600 flex-shrink-0" />
                <div className="result-text">
                  <div className="result-title font-medium">{item.shortName}</div>
                  <div className="result-desc text-xs text-slate-400 truncate">{item.name}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
