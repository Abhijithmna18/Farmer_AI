import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { gsap } from "gsap";
import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";
import { getGrowthCalendars, deleteGrowthCalendar } from "../services/calendarService";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import HomeButton from "../components/HomeButton";
import { Link } from "react-router-dom";
import DashboardSummary from "../components/DashboardSummary";
import { TrendingUp, Calendar as CalendarIcon, Package, Activity, ArrowUpRight, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user, loading: userLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [lastEvent, setLastEvent] = useState(null);
  const [stats, setStats] = useState({
    totalCrops: 0,
    activeCalendars: 0,
    upcomingTasks: 0,
    completedTasks: 0
  });


  const dashboardRef = useRef();
  const welcomeRef = useRef();
  const cardsRef = useRef([]);
  const activityRef = useRef();
  const actionsRef = useRef();
  const leafRefs = useRef([]);

  // Fetch calendars when user changes
  useEffect(() => {
    if (!user) return;
    
    const fetchCalendars = async () => {
      try {
        setLoadingCalendars(true);
        const data = await getGrowthCalendars();
        const calendarsData = Array.isArray(data) ? data : [];
        setCalendars(calendarsData);
        
        // Calculate statistics
        const activeCount = calendarsData.filter(cal => {
          const firstStage = cal.stages?.[0];
          return firstStage && firstStage.stageName !== 'Harvest';
        }).length;
        
        setStats({
          totalCrops: calendarsData.length,
          activeCalendars: activeCount,
          upcomingTasks: calendarsData.length * 3, // Mock calculation
          completedTasks: Math.floor(calendarsData.length * 1.5) // Mock calculation
        });
      } catch (err) {
        console.error("Error fetching calendars:", err);
        // Reset data on error to prevent showing old user's data
        setCalendars([]);
        setStats({
          totalCrops: 0,
          activeCalendars: 0,
          upcomingTasks: 0,
          completedTasks: 0
        });
      } finally {
        setLoadingCalendars(false);
      }
    };
    
    fetchCalendars();
    
    // Load last event for Resume card (scoped to current user)
    try {
      const raw = localStorage.getItem(`lastEvent_${user.id || user._id || user.email}`);
      if (raw) setLastEvent(JSON.parse(raw));
    } catch {
      setLastEvent(null);
    }
  }, [user]);

  // Get current time for personalized greeting (localized)
  const { t } = useTranslation();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('common:goodMorning');
    if (hour < 18) return t('common:goodAfternoon');
    return t('common:goodEvening');
  };

  // Animate dashboard elements on load
  useLayoutEffect(() => {
    if (userLoading) return;

    const checkElementsReady = () => {
      const elementsToCheck = [
        welcomeRef.current,
        activityRef.current,
        actionsRef.current
      ];

      const allElementsReady = elementsToCheck.every(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const cardsReady = cardsRef.current.length > 0 && 
        cardsRef.current.every(card => {
          if (!card) return false;
          const rect = card.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

      return allElementsReady && cardsReady;
    };

    const startAnimations = () => {
      if (!checkElementsReady()) {
        setTimeout(startAnimations, 16);
        return;
      }

      // Set initial states
      gsap.set([welcomeRef.current, cardsRef.current, activityRef.current, actionsRef.current], {
        opacity: 0
      });
      
      gsap.set(leafRefs.current, {
        opacity: 0,
        scale: 0.8
      });

      // Main animation timeline
      const tl = gsap.timeline({ delay: 0.1 });

      tl.to(welcomeRef.current, {
        duration: 0.8,
        opacity: 1,
        y: 0,
        ease: "back.out(1.5)"
      })
        .to(cardsRef.current, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          stagger: 0.15,
          ease: "power2.out"
        }, "-=0.4")
        .to([activityRef.current, actionsRef.current], {
          duration: 0.6,
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: "power2.out"
        }, "-=0.3");

      // Decorative leaf entrance
      leafRefs.current.forEach((leaf, i) => {
        if (leaf) {
          gsap.to(leaf, {
            duration: 1,
            opacity: 0.1,
            scale: 1,
            rotation: i % 2 === 0 ? -10 : 10,
            ease: "elastic.out(1, 0.7)",
            delay: 0.4 + i * 0.1
          });
        }
      });

      // Add hover animations to cards
      cardsRef.current.forEach(card => {
        if (card) {
          card.addEventListener("mouseenter", () => {
            gsap.to(card, {
              y: -8,
              duration: 0.3,
              scale: 1.02,
              boxShadow: "0 20px 40px -15px rgba(76,175,80,0.3)",
              ease: "power2.out"
            });
          });
          
          card.addEventListener("mouseleave", () => {
            gsap.to(card, {
              y: 0,
              duration: 0.3,
              scale: 1,
              boxShadow: "0_8px_20px_-12px_rgba(76,175,80,0.15)",
              ease: "power2.out"
            });
          });
        }
      });

      setIsReady(true);
    };

    // Add "ready" class immediately
    document.body.classList.add("ready");

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(startAnimations);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [userLoading]);

  if (userLoading) return <Loader size="lg" text={t('common:loadingInsights')} />;

  return (
    <div 
      ref={dashboardRef}
      className="min-h-screen p-4 md:p-8 hidden-until-ready"
    >
      <HomeButton />
      {/* Decorative leaves */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          ref={(el) => (leafRefs.current[i] = el)}
          className="absolute text-green-600"
          style={{
            fontSize: "3rem",
            top: `${5 + i * 15}%`,
            left: i % 2 === 0 ? "2%" : "95%",
            transform: `rotate(${i % 2 === 0 ? -10 : 10}deg) scale(0.8)`,
            zIndex: 0,
            opacity: 0
          }}
        >
          🍃
        </div>
      ))}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Personalized welcome */}
        <div 
          ref={welcomeRef}
          className={`mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white/95 to-green-50/90 backdrop-blur-xl
                    border-2 border-green-100 border-opacity-60 
                    shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)]
                    relative overflow-hidden`}
          style={{ opacity: 0 }}
        >
          {/* Decorative accents */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-100 rounded-bl-full opacity-50 z-0"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-100 to-emerald-100 rounded-tr-full opacity-50 z-0"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-30 z-0"></div>
          
          <div className="relative z-10">
            <div className="absolute top-0 right-0">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl md:text-5xl font-bold text-gray-800">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
                  {getGreeting()}
                </span>, {user?.displayName || user?.email.split('@')[0] || "Farmer"}!
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-700 mt-2 font-medium">
              {t('dashboard:welcome')}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Track your farm's progress and optimize your yields with AI-powered insights
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: "Total Crops", 
              value: stats.totalCrops, 
              icon: <Package className="w-5 h-5" />, 
              color: "from-blue-500 to-blue-600",
              bgColor: "bg-blue-50",
              change: "+12%"
            },
            { 
              label: "Active Calendars", 
              value: stats.activeCalendars, 
              icon: <CalendarIcon className="w-5 h-5" />, 
              color: "from-green-500 to-green-600",
              bgColor: "bg-green-50",
              change: "+8%"
            },
            { 
              label: "Upcoming Tasks", 
              value: stats.upcomingTasks, 
              icon: <Activity className="w-5 h-5" />, 
              color: "from-orange-500 to-orange-600",
              bgColor: "bg-orange-50",
              change: "+5%"
            },
            { 
              label: "Completed", 
              value: stats.completedTasks, 
              icon: <TrendingUp className="w-5 h-5" />, 
              color: "from-purple-500 to-purple-600",
              bgColor: "bg-purple-50",
              change: "+15%"
            }
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`${stat.bgColor} p-5 rounded-2xl border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Summary Component */}
        <DashboardSummary user={user} />

        {/* Resume Event */}
        {lastEvent && (
          <div className="mb-6 p-5 rounded-3xl bg-white/90 backdrop-blur-xl border-2 border-green-100 shadow-[0_12px_30px_-12px_rgba(16,185,129,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-emerald-700 font-semibold mb-1">Resume Event</div>
                <div className="text-lg font-bold text-gray-900">{lastEvent.title}</div>
                <div className="text-sm text-gray-700 mt-1">{new Date(lastEvent.dateTime).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{lastEvent.location}</div>
              </div>
              <Link to={`/events?event=${encodeURIComponent(lastEvent.id || '')}`} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Resume</Link>
            </div>
          </div>
        )}

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              id: 1,
              title: "Crop Recommendations",
              icon: "🌱",
              description: "AI-curated planting strategies tailored to your soil and climate.",
              color: "bg-gradient-to-br from-green-50 to-green-100",
              accent: "text-green-600"
            },
            {
              id: 2,
              title: "Weather Updates",
              icon: "🌦️",
              description: "Real-time forecasts to protect your crops from surprises.",
              color: "bg-gradient-to-br from-blue-50 to-blue-100",
              accent: "text-blue-600"
            },
            {
              id: 3,
              title: "Soil Health Insights",
              icon: "🌿",
              description: "Clear analysis and actionable tips to nourish your land.",
              color: "bg-gradient-to-br from-emerald-50 to-emerald-100",
              accent: "text-emerald-600"
            }
          ].map((feature, index) => (
            <div
              key={feature.id}
              ref={el => cardsRef.current[index] = el}
              className={`${feature.color} p-6 rounded-3xl backdrop-blur-md
                         border-2 border-white border-opacity-60
                         shadow-[0_8px_20px_-12px_rgba(76,175,80,0.15)]
                         transition-all duration-300 cursor-pointer
                         hover:border-green-200 group relative overflow-hidden`}
              style={{ opacity: 0 }}
            >
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
              
              <div className="relative z-10">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-700 mb-4">{feature.description}</p>
                <button className={`${feature.accent} font-medium hover:underline flex items-center group-hover:translate-x-1 transition-transform duration-200`}>
                  View details
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Announcements & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)]">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Announcements</h3>
            <ul className="space-y-3">
              <li className="p-3 border rounded-xl bg-emerald-50/50 text-gray-800">New warehouse marketplace filters are now available.</li>
              <li className="p-3 border rounded-xl bg-lime-50/60 text-gray-800">You can export growth calendars to PDF from the details page.</li>
              <li className="p-3 border rounded-xl bg-teal-50/60 text-gray-800">Get weather alerts on your dashboard next week.</li>
            </ul>
          </div>
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)]">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Tips</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="p-3 border rounded-xl">Keep your growth calendar updated for better reminders.</div>
              <div className="p-3 border rounded-xl">Bookmark favorite warehouses to compare prices fast.</div>
              <div className="p-3 border rounded-xl">Use the Assistant for soil-specific crop suggestions.</div>
            </div>
          </div>
        </div>

        {/* Growth Calendar */}
        <div 
          className="bg-white bg-opacity-90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] relative overflow-hidden mb-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
              Growth Calendar
            </span>
          </h3>
          {loadingCalendars ? (
            <p>Growth Calendar Loading...</p>
          ) : calendars.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">You have {calendars.length} growth calendar(s)</div>
                <Link to="/growth-calendar/new" className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add New</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calendars.map((cal) => {
                  const calId = cal._id || cal.id || (cal && cal._id ? cal._id : undefined);
                  const firstStage = cal.stages?.[0];
                  const stageName = firstStage?.stageName || '—';
                  const sowing = cal.plantingDate ? new Date(cal.plantingDate).toLocaleDateString() : '—';
                  // Check for transplant date from multiple sources (robust)
                  const stageForTransplant = cal.stages?.find((s) => {
                    const n = (s?.stageName || '').toLowerCase().trim();
                    return n.includes('transplant') || n === 'seedling';
                  });
                  const transplantFromStages = stageForTransplant?.startDate || stageForTransplant?.endDate;
                  const transplantFromField = cal.transplantDate || cal.transplantingDate;
                  const transplantRaw = transplantFromField || transplantFromStages;
                  const transplantDate = (transplantRaw && !isNaN(new Date(transplantRaw))) ? new Date(transplantRaw).toLocaleDateString() : '—';
                  const harvest = cal.estimatedHarvestDate || cal.stages?.slice(-1)?.[0]?.endDate;
                  const harvestDate = harvest ? new Date(harvest).toLocaleDateString() : '—';

                  return (
                    <div key={calId || JSON.stringify(cal)} className="p-4 border rounded-2xl bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{cal.cropName} {cal.variety ? `• ${cal.variety}` : ''}</div>
                          <div className="text-sm text-gray-600">Stage: {stageName}</div>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/growth-calendar/${calId}`} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Details</Link>
                          <button
                            onClick={async () => {
                              const idToDelete = calId;
                              if (!idToDelete) {
                                toast.error('Cannot delete calendar: missing id');
                                return;
                              }
                              if (!confirm('Delete this calendar?')) return;
                              try {
                                await deleteGrowthCalendar(idToDelete);
                                setCalendars(prev => prev.filter(c => (c._id || c.id) !== idToDelete));
                                toast.success('Calendar deleted');
                              } catch (e) {
                                toast.error(e?.message || 'Delete failed');
                              }
                            }}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                        <div className="p-3 bg-white rounded-xl border">
                          <div className="font-medium">Sowing</div>
                          <div>{sowing}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border">
                          <div className="font-medium">Transplant</div>
                          <div>{transplantDate}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border">
                          <div className="font-medium">Harvest</div>
                          <div>{harvestDate}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p>No growth calendars yet. Create one to get started!</p>
              <Link to="/growth-calendar/new" className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add New</Link>
            </div>
          )}
        </div>

        {/* Additional content area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            ref={activityRef}
            className="bg-white bg-opacity-90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] relative overflow-hidden"
            style={{ opacity: 0 }}
          >
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full z-0"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
                  Recent Activity
                </span>
              </h3>
              <div className="space-y-4">
                {[
                  { action: "Soil analysis completed", time: "Yesterday at 2:30 PM", icon: "✅" },
                  { action: "Weather alert received", time: "2 hours ago", icon: "🌧️" },
                  { action: "Crop recommendation updated", time: "This morning", icon: "🌱" }
                ].map((item) => (
                  <div key={item.action} className="flex items-start group">
                    <div className="bg-green-100 text-green-600 rounded-full p-2 mr-3 group-hover:bg-green-200 transition-colors duration-200">
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">{item.action}</p>
                      <p className="text-sm text-gray-600">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div 
            ref={actionsRef}
            className="bg-white bg-opacity-90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] relative overflow-hidden"
            style={{ opacity: 0 }}
          >
            {/* Decorative accent */}
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-50 rounded-tr-full z-0"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
                  Quick Actions
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: "🏪", label: "Marketplace", color: "hover:bg-emerald-100", to: "/warehouses" },
                  { icon: "📦", label: "My Bookings", color: "hover:bg-blue-100", to: "/my-bookings" },
                  { icon: "🌿", label: "Plant Explorer", color: "hover:bg-emerald-100", to: "/plants" },
                  { icon: "🗓️", label: "New Calendar", color: "hover:bg-green-100", to: "/growth-calendar/new" },
                  { icon: "📣", label: "Contact Us", color: "hover:bg-yellow-100", to: "/contact-us" },
                  { icon: "⚙️", label: "Settings", color: "hover:bg-gray-100", to: "/settings" }
                ].map((action) => (
                  action.to ? (
                    <Link
                      to={action.to}
                      key={action.label}
                      className={`p-4 bg-gray-50 ${action.color} rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                      <span className="text-gray-800 font-medium">{action.label}</span>
                    </Link>
                  ) : (
                    <button 
                      key={action.label}
                      className={`p-4 bg-gray-50 ${action.color} rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                      <span className="text-gray-800 font-medium">{action.label}</span>
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
    </div>
  );
}