import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eventsService from '../services/eventsService';
import { Calendar, MapPin, Clock, Users, RefreshCcw, Search, Download, Bookmark, Share2, Heart, Star, MessageCircle, TrendingUp, Filter, SortAsc, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Events(){
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [when, setWhen] = useState('upcoming'); // upcoming | past | all
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState(['training','market','community']);
  const [saved, setSaved] = useState(()=>{
    try { return new Set(JSON.parse(localStorage.getItem('savedEvents')||'[]')); } catch { return new Set(); }
  });
  
  // Enhanced state
  const [difficulty, setDifficulty] = useState('all');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [featured, setFeatured] = useState(false);
  const [sortBy, setSortBy] = useState('dateTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [likedEvents, setLikedEvents] = useState(new Set());

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        category: category === 'all' ? '' : category,
        difficulty: difficulty === 'all' ? '' : difficulty,
        location,
        featured: featured ? 'true' : '',
        sortBy,
        sortOrder,
        page: p,
        limit: 9
      });

      if (priceRange.min) params.append('priceMin', priceRange.min);
      if (priceRange.max) params.append('priceMax', priceRange.max);

      const res = await eventsService.search(params.toString());
      setItems(res?.events || []);
      setPages(res?.pagination?.pages || 1);
      setPage(res?.pagination?.current || p);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;
    try {
      const res = await eventsService.getRecommendations();
      setRecommendations(res?.recommendations || []);
    } catch (e) {
      console.error('Failed to load recommendations:', e);
    }
  };

  const toggleLike = async (eventId) => {
    if (!user) {
      toast.error('Please login to like events');
      return;
    }

    try {
      const res = await eventsService.toggleLike(eventId);
      setLikedEvents(prev => {
        const newSet = new Set(prev);
        if (res.liked) {
          newSet.add(eventId);
        } else {
          newSet.delete(eventId);
        }
        return newSet;
      });
      toast.success(res.liked ? 'Event liked!' : 'Event unliked');
    } catch (e) {
      console.error('Failed to toggle like:', e);
      toast.error('Failed to like event');
    }
  };

  const trackView = async (eventId) => {
    try {
      await eventsService.trackView(eventId);
    } catch (e) {
      console.error('Failed to track view:', e);
    }
  };


  const toggleSave = (id) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('savedEvents', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const shareEvent = async (ev) => {
    const shareData = {
      title: ev.title,
      text: `${ev.title} — ${new Date(ev.dateTime).toLocaleString()}\n${ev.locationDetail?.address || ev.location || ''}`,
      url: window.location.origin + window.location.pathname + `?event=${ev._id}`
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast.success('Event link copied');
      }
    } catch (_) {
      // ignore cancel
    }
  };

  // Initialize from URL and fetch categories
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q0 = params.get('q') || '';
    const c0 = params.get('category') || 'all';
    const w0 = params.get('when') || 'upcoming';
    const p0 = parseInt(params.get('page') || '1', 10);
    setQ(q0);
    setCategory(c0);
    setWhen(w0);
    load(Number.isNaN(p0) ? 1 : p0);
    loadRecommendations();
    // categories
    eventsService.categories().then(list => {
      if (Array.isArray(list) && list.length) setCategories(list);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (when) params.set('when', when);
    if (page) params.set('page', String(page));
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [q, category, when, page]);

  const onSearch = () => load(1);

  const skeletons = useMemo(() => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-2xl bg-white animate-pulse">
          <div className="h-40 bg-gray-200 rounded-xl mb-3" />
          <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-1/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  ), []);

  const EventCard = ({ ev, onRSVP, onDetails }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border rounded-2xl bg-white shadow-sm hover:shadow-md transition"
    >
      {ev.bannerUrl && (
        <img src={ev.bannerUrl} alt={ev.title} className="h-40 w-full object-cover rounded-xl mb-3" />
      )}
      <div className="text-lg font-semibold text-gray-900">{ev.title}</div>
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(ev.dateTime).toLocaleString()}</div>
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {ev.locationDetail?.address || ev.location || '—'}</div>
        {ev.duration && <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {ev.duration}</div>}
        {ev.attendeeCount != null && <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {ev.attendeeCount} attending</div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ev.category && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700">{ev.category}</span>}
        {ev.tags?.slice(0,3).map(t => (
          <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">#{t}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => onRSVP(ev)}
        >RSVP</button>
        <button
          className={`px-3 py-1.5 rounded-lg border ${saved.has(ev._id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => toggleSave(ev._id)}
          title={saved.has(ev._id)?'Remove from favorites':'Save to favorites'}
        >
          <Bookmark className="w-4 h-4 inline mr-1"/>{saved.has(ev._id)?'Saved':'Save'}
        </button>
        <button className="px-3 py-1.5 bg-gray-100 rounded-lg border hover:bg-gray-200" onClick={() => shareEvent(ev)}>
          <Share2 className="w-4 h-4 inline mr-1"/> Share
        </button>
        <button className="px-3 py-1.5 bg-gray-100 rounded-lg border hover:bg-gray-200" onClick={() => window.open(eventsService.exportICS(ev._id), '_blank')}>ICS</button>
        <button className="px-3 py-1.5 bg-gray-100 rounded-lg border hover:bg-gray-200" onClick={() => window.open(eventsService.exportCSV(ev._id), '_blank')}>CSV</button>
        <button className="px-3 py-1.5 bg-gray-100 rounded-lg border hover:bg-gray-200" onClick={() => window.open(eventsService.exportPDF(ev._id), '_blank')}>PDF</button>
        <button className="ml-auto px-3 py-1.5 text-gray-700 hover:text-emerald-700" onClick={() => onDetails(ev)}>Details</button>
      </div>
    </motion.div>
  );

  const [selected, setSelected] = useState(null);

  const rsvp = async (ev) => {
    if (!user) {
      toast.error('Please login to enroll in events');
      return;
    }

    try {
      const response = await eventsService.rsvp(ev._id, 'going');
      
      if (response.success) {
        // Show success message with status
        if (response.message) {
          toast.success(response.message);
        } else {
          toast.success('Enrollment successful! Check your email for confirmation.');
        }
        
        // Save event details for reference
        try { 
          localStorage.setItem('lastEvent', JSON.stringify({ 
            id: ev._id, 
            title: ev.title, 
            dateTime: ev.dateTime, 
            location: ev.locationDetail?.address || ev.location || '' 
          })); 
        } catch {}
        
        // Reload the page to update counts
        load(page);
      } else {
        toast.error(response.message || 'Failed to enroll');
      }
    } catch (e) {
      console.error('RSVP error:', e);
      toast.error('Failed to enroll. Please try again.');
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Events</h2>
          <button 
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
            onClick={() => navigate('/')}
            title="Go to Home"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700" onClick={()=>load(1)}>
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="border px-9 py-2 rounded-lg w-full" placeholder="Search events, location or tags" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={onSearch}>Search</button>
          </div>
          <select className="border px-3 py-2 rounded-lg" value={category} onChange={(e)=>{ setCategory(e.target.value); setPage(1); }}>
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c[0]?.toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select className="border px-3 py-2 rounded-lg" value={when} onChange={(e)=>setWhen(e.target.value)}>
            <option value="upcoming">Upcoming</option>
            <option value="all">All</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>


      {/* List */}
      {loading ? skeletons : (
        items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-700 font-medium">No events found</div>
            <div className="text-sm text-gray-500">Try changing your filters or search term</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(ev => (
              <EventCard key={ev._id} ev={ev} onRSVP={rsvp} onDetails={setSelected} />
            ))}
          </div>
        )
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page===1} onClick={()=>load(page-1)} className="px-3 py-1 rounded border disabled:opacity-50">Prev</button>
          {Array.from({length: pages}, (_,i)=>i+1).map(p => (
            <button key={p} onClick={()=>load(p)} className={`px-3 py-1 rounded border ${p===page?'bg-emerald-600 text-white border-emerald-600':'hover:bg-gray-50'}`}>{p}</button>
          ))}
          <button disabled={page===pages} onClick={()=>load(page+1)} className="px-3 py-1 rounded border disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xl font-bold">{selected.title}</div>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={()=>setSelected(null)}>✖</button>
            </div>
            {selected.bannerUrl && <img src={selected.bannerUrl} alt="banner" className="w-full h-56 object-cover rounded-xl mb-3" />}
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(selected.dateTime).toLocaleString()}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selected.locationDetail?.address || selected.location || '—'}</div>
              {selected.description && <p className="mt-2 whitespace-pre-wrap">{selected.description}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg" onClick={()=>rsvp(selected)}>RSVP</button>
              <button className="px-3 py-1.5 bg-gray-100 rounded-lg border" onClick={() => window.open(eventsService.exportICS(selected._id), '_blank')}><Download className="w-4 h-4 inline mr-1"/> ICS</button>
              <button className="px-3 py-1.5 bg-gray-100 rounded-lg border" onClick={() => window.open(eventsService.exportCSV(selected._id), '_blank')}><Download className="w-4 h-4 inline mr-1"/> CSV</button>
              <button className="px-3 py-1.5 bg-gray-100 rounded-lg border" onClick={() => window.open(eventsService.exportPDF(selected._id), '_blank')}><Download className="w-4 h-4 inline mr-1"/> PDF</button>
              <span className="ml-auto" />
              <button className="px-3 py-1.5" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}