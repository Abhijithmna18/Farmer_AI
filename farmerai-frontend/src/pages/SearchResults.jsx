// src/pages/SearchResults.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAll } from '../services/searchService';

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

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const navigate = useNavigate();
  const abortRef = useRef();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ events: [], products: [], services: [] });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!q) {
      setResults({ events: [], products: [], services: [] });
      setMessage('Enter a search query');
      return;
    }
    (async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setMessage('');
      try {
        const data = await searchAll(q, abortRef.current.signal);
        setResults(data?.results || { events: [], products: [], services: [] });
        setMessage(data?.message || '');
      } catch (e) {
        setMessage('Failed to load results');
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Search results for “{q}”</h1>
      {loading && <div className="text-gray-500">Searching…</div>}
      {!loading && message && <div className="text-gray-500">{message}</div>}

      {/* Events */}
      {results.events?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Events</h2>
          <div className="divide-y border rounded-lg">
            {results.events.map((ev) => (
              <div key={ev._id} className="p-4 hover:bg-gray-50 flex flex-col gap-1 cursor-pointer"
                   onClick={() => navigate('/events')}>
                <div className="font-medium text-gray-900">
                  <Highlight text={ev.title} term={q} />
                </div>
                <div className="text-sm text-gray-600">
                  <Highlight text={ev.location || ''} term={q} />
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  <Highlight text={ev.description || ''} term={q} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {results.products?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Products</h2>
          <div className="divide-y border rounded-lg">
            {results.products.map((p) => (
              <div key={p._id} className="p-4 hover:bg-gray-50 cursor-pointer"
                   onClick={() => navigate(`/products/${p._id}`)}>
                <div className="font-medium text-gray-900">
                  <Highlight text={p.name} term={q} />
                </div>
                <div className="text-sm text-gray-600">
                  <Highlight text={p.category || ''} term={q} />
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  <Highlight text={p.description || ''} term={q} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {results.services?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Services</h2>
          <div className="divide-y border rounded-lg">
            {results.services.map((s) => (
              <div key={s._id} className="p-4 hover:bg-gray-50 cursor-pointer"
                   onClick={() => navigate(`/services/${s._id}`)}>
                <div className="font-medium text-gray-900">
                  <Highlight text={s.name} term={q} />
                </div>
                <div className="text-sm text-gray-600">
                  <Highlight text={s.category || ''} term={q} />
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  <Highlight text={s.description || ''} term={q} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}