// src/components/SearchBar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll } from '../services/searchService';

// Simple debounce hook
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function Highlight({ text, term }) {
  if (!term) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegExp(term)})`, 'ig');
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <mark key={i} className="bg-yellow-200">{part}</mark> : <span key={i}>{part}</span>
      )}
    </>
  );
}

// Static pages list for quick navigation
const pagesList = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Assistant', path: '/assistant' },
  { label: 'Recommendations', path: '/recommendations' },
  { label: 'Reports', path: '/reports' },
  { label: 'Events', path: '/events' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
  { label: 'Blog', path: '/blog' },
  { label: 'Community', path: '/community' },
  { label: 'About Us', path: '/about-us' },
  { label: 'Gallery', path: '/gallery' },
];

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ events: [], products: [], services: [] });
  const debounced = useDebounce(query, 300);
  const abortRef = useRef();

  // Fetch as user types (debounced)
  useEffect(() => {
    if (!debounced || debounced.trim().length < 2) {
      setResults({ events: [], products: [], services: [] });
      setOpen(!!debounced && debounced.trim().length > 0); // still open to show pages
      return;
    }

    (async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const data = await searchAll(debounced.trim(), abortRef.current.signal);
        setResults(data?.results || { events: [], products: [], services: [] });
        setOpen(true);
      } catch (_) {
        // ignore cancellation or errors in preview
      } finally {
        setLoading(false);
      }
    })();
  }, [debounced]);

  const totalCount = useMemo(
    () => (results.events?.length || 0) + (results.products?.length || 0) + (results.services?.length || 0),
    [results]
  );

  const triggerSearch = () => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pagesList;
    return pagesList.filter(p => p.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="flex-1 relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') triggerSearch();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search for products, events, or services..."
        className="w-full max-w-md px-6 py-3 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-green-200 focus:border-green-400 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
      />
      <button
        aria-label="Search"
        onClick={triggerSearch}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </button>

      {/* Dropdown preview: pages + results */}
      {open && (
        <div className="absolute z-20 mt-2 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          {/* Pages quick links */}
          <div>
            <div className="text-xs font-semibold text-gray-500 px-2 mb-1">Pages</div>
            <ul className="divide-y">
              {filteredPages.slice(0, 6).map((p) => (
                <li key={p.path} className="py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => { setOpen(false); navigate(p.path); }}>
                  <div className="font-medium text-gray-800">
                    <Highlight text={p.label} term={query} />
                  </div>
                  <div className="text-xs text-gray-500">{p.path}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="my-2 border-t" />

          {/* Data results */}
          {loading ? (
            <div className="text-sm text-gray-500 px-2 py-3">Searching...</div>
          ) : totalCount === 0 && query.trim().length >= 2 ? (
            <div className="text-sm text-gray-500 px-2 py-3">No results found</div>
          ) : (
            <div className="space-y-3">
              {/* Events */}
              {results.events?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 px-2 mb-1">Events</div>
                  <ul className="divide-y">
                    {results.events.slice(0, 5).map((ev) => (
                      <li key={ev._id} className="py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => { setOpen(false); navigate(`/events`); }}>
                        <div className="font-medium text-gray-800">
                          <Highlight text={ev.title} term={query} />
                        </div>
                        <div className="text-xs text-gray-500">
                          <Highlight text={ev.location || ''} term={query} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Products */}
              {results.products?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 px-2 mb-1">Products</div>
                  <ul className="divide-y">
                    {results.products.slice(0, 5).map((p) => (
                      <li key={p._id} className="py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => { setOpen(false); navigate(`/products/${p._id}`); }}>
                        <div className="font-medium text-gray-800">
                          <Highlight text={p.name} term={query} />
                        </div>
                        <div className="text-xs text-gray-500">
                          <Highlight text={p.category || ''} term={query} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Services */}
              {results.services?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 px-2 mb-1">Services</div>
                  <ul className="divide-y">
                    {results.services.slice(0, 5).map((s) => (
                      <li key={s._id} className="py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => { setOpen(false); navigate(`/services/${s._id}`); }}>
                        <div className="font-medium text-gray-800">
                          <Highlight text={s.name} term={query} />
                        </div>
                        <div className="text-xs text-gray-500">
                          <Highlight text={s.category || ''} term={query} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 px-2">
                <button
                  onClick={triggerSearch}
                  className="w-full text-center text-sm text-blue-600 hover:underline"
                >
                  View all results
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}