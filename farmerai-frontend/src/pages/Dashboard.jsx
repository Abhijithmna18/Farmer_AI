import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { gsap } from "gsap";
import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";
import DashboardSummary from "../components/DashboardSummary";
import ErrorBoundary from "../components/ErrorBoundary";
import SoilTrendsChart from "../components/charts/SoilTrendsChart";
import RainfallForecastChart from "../components/charts/RainfallForecastChart";
import GrowthProgressChart from "../components/charts/GrowthProgressChart";
import NotificationCenter from "../components/NotificationCenter";
import ThemeToggle from "../components/ThemeToggle";
import assistantService from "../services/assistantService"; // Import the new service
import { getGrowthCalendars, deleteGrowthCalendar, getCalendarsWithRemainingDays, getActiveCalendarsByUser } from "../services/calendarService";
import { registerPushToken, onForegroundMessage } from "../firebase";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import HomeButton from "../components/HomeButton";
import { Link, useNavigate } from "react-router-dom";
import GrowthCalendar from "./GrowthCalendar";

export default function Dashboard() {
  const { user, loading: userLoading } = useAuth();
  const navigate = useNavigate();

  // Authentication guard
  useEffect(() => {
    if (!userLoading && !user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, userLoading, navigate]);
  const [isReady, setIsReady] = useState(false);
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [dashboardCalendars, setDashboardCalendars] = useState([]);
  const [activeCalendars, setActiveCalendars] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropForm, setCropForm] = useState({ N:'', P:'', K:'', temperature:'', humidity:'', ph:'', rainfall:'' });
  const [cropLoading, setCropLoading] = useState(false);
  const [cropResult, setCropResult] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);


  const dashboardRef = useRef();
  const welcomeRef = useRef();
  const cardsRef = useRef([]);
  const activityRef = useRef();
  const actionsRef = useRef();
  const leafRefs = useRef([]);
  const previousUserId = useRef(null);

  // Clear data when user changes
  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (previousUserId.current && previousUserId.current !== currentUserId) {
      // User changed, clear all data
      setInteractionHistory([]);
      setCalendars([]);
      setDashboardCalendars([]);
      setActiveCalendars([]);
      setCropResult(null);
      console.log('User changed, cleared dashboard data');
    }
    previousUserId.current = currentUserId;
  }, [user]);

  // Fetch interaction history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return; // Don't fetch if no user
      
      try {
        setLoadingHistory(true);
        setDashboardError(null);
        const data = await assistantService.getInteractionHistory();
        setInteractionHistory(data.interactions);
      } catch (err) {
        console.error('Dashboard error:', err);
        setHistoryError(err.message || "Failed to fetch interaction history.");
        // Set dashboard error for critical failures
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setDashboardError(err);
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [user]); // Add user as dependency

  useEffect(() => {
    const fetchCalendars = async () => {
      if (!user) return; // Don't fetch if no user
      
      try {
        setLoadingCalendars(true);
        const [calendarsData, dashboardData] = await Promise.all([
          getGrowthCalendars(),
          getCalendarsWithRemainingDays()
        ]);
        setCalendars(Array.isArray(calendarsData) ? calendarsData : []);
        setDashboardCalendars(Array.isArray(dashboardData.data) ? dashboardData.data : []);
      } catch (err) {
        toast.error(err?.message || "Failed to fetch growth calendar.");
      } finally {
        setLoadingCalendars(false);
      }
    };
    fetchCalendars();
  }, [user]); // Add user as dependency

  // Active calendars + push registration
  useEffect(() => {
    if (!userLoading && user) {
      getActiveCalendarsByUser(user.id || user._id).then((res) => {
        setActiveCalendars(Array.isArray(res.data) ? res.data : []);
      }).catch(() => {});

      registerPushToken(import.meta.env.VITE_FIREBASE_VAPID_KEY).then(async (token) => {
        if (token) {
          try {
            await fetch('/api/settings/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
              body: JSON.stringify({ pushToken: token, pushTokens: [token] })
            });
          } catch {}
        }
      });

      onForegroundMessage((payload) => {
        if (payload?.notification?.title) {
          toast(payload.notification.title + (payload.notification.body ? `: ${payload.notification.body}` : ''));
        }
      });
    }
  }, [userLoading, user]);

  const lastInteraction = interactionHistory.length > 0 ? interactionHistory[0] : null; // Get the most recent interaction

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
    if (userLoading || loadingHistory) return;

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
  }, [userLoading, loadingHistory]);

  // Show error boundary for critical errors
  if (dashboardError) {
    return <ErrorBoundary error={dashboardError} resetError={() => setDashboardError(null)} showRelogin={true} />;
  }

  if (userLoading || loadingHistory) return <Loader size="lg" text={t('common:loadingInsights')} />;

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.text("FarmerAI Interaction History", 14, 15);

    const head = [["Date", "Soil Type", "Season", "Location", "Recommended Crops", "Selected Crop"]];
    const body = interactionHistory.map(interaction => ([
      new Date(interaction.recommendationDate).toLocaleDateString(),
      interaction.soilType,
      interaction.season,
      interaction.location,
      interaction.recommendedCrops.map(c => c.name).join(", "),
      interaction.selectedCrop || "—"
    ]));

    autoTable(doc, {
      head,
      body,
      startY: 20,
    });
    doc.save("farmerai_history.pdf");
  };

  const exportToExcel = () => {
    const data = interactionHistory.map(interaction => ({
      Date: new Date(interaction.recommendationDate).toLocaleDateString(),
      "Soil Type": interaction.soilType,
      Season: interaction.season,
      Location: interaction.location,
      "Recommended Crops": interaction.recommendedCrops.map(c => c.name).join(", "),
      "Selected Crop": interaction.selectedCrop || "—"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interaction History");
    XLSX.writeFile(wb, "farmerai_history.xlsx");
  };

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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Dashboard Summary */}
        <DashboardSummary user={user} />

        {/* Personalized welcome */}
        <div 
          ref={welcomeRef}
          className={`mb-8 p-6 rounded-3xl bg-.bg-opacity-90 backdrop-blur-xl
                    border-2 border-green-100 border-opacity-60 
                    shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)]
                    relative overflow-hidden`}
          style={{ opacity: 0 }}
        >
          {/* Decorative accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full z-0"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-50 rounded-tr-full z-0"></div>
          
          <div className="relative z-10">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <ThemeToggle 
                variant="icon" 
                size="sm" 
                showToast={true}
                className="hover:scale-105"
              />
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-400 backdrop-blur rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all relative"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 7h5l-5-5v5z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <LanguageSwitcher />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
                {getGreeting()}
              </span>, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.displayName || user?.name || user?.email.split('@')[0] || "Farmer"}!
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
              {t('dashboard:welcome')}
            </p>
            {lastInteraction && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl text-sm text-gray-800 dark:text-gray-200">
                <div><strong>{t('dashboard:lastRecommendation')}</strong> {new Date(lastInteraction.recommendationDate).toLocaleString()}</div>
                <div><strong>{t('dashboard:soil')}:</strong> {lastInteraction.soilType} • <strong>{t('dashboard:season')}:</strong> {lastInteraction.season}</div>
                <div><strong>{t('dashboard:selectedCrop')}:</strong> {lastInteraction.selectedCrop || '—'}</div>
              </div>
            )}
            {/* {historyError && <div className="text-red-500 mt-2">Error loading last interaction: {historyError}</div>} */}
          </div>
        </div>
        
        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              id: 1,
              title: "Crop Recommendations",
              icon: "🌱",
              description: "AI-curated planting strategies tailored to your soil and climate.",
              color: "bg-gradient-to-br from-green-50 to-green-100",
              accent: "text-green-600",
              cta: {
                label: 'Get Recommendation',
                onClick: () => setShowCropModal(true)
              }
            },
            {
              id: 2,
              title: "Weather Updates",
              icon: "🌦️",
              description: "Real-time forecasts to protect your crops from surprises.",
              color: "bg-gradient-to-br from-blue-50 to-blue-100",
              accent: "text-blue-600",
            },
            {
              id: 3,
              title: "Soil Health Insights",
              icon: "🌿",
              description: "Clear analysis and actionable tips to nourish your land.",
              color: "bg-gradient-to-br from-emerald-50 to-emerald-100",
              accent: "text-emerald-600",
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
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-700 mb-4">{feature.description}</p>
                {feature.cta ? (
                  <button onClick={feature.cta.onClick} className={`${feature.accent} font-medium hover:underline flex items-center group-hover:translate-x-1 transition-transform duration-200`}>
                    {feature.cta.label}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button className={`${feature.accent} font-medium hover:underline flex items-center group-hover:translate-x-1 transition-transform duration-200`}>
                    View details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Interaction History / Reports */}
        <div 
          className="bg-white bg-opacity-90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] relative overflow-hidden mb-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
              Your Interaction History
            </span>
          </h3>
          {loadingHistory ? (
            <p>Loading history...</p>
          ) : historyError ? (
            <p className="text-red-500">Error: {historyError}</p>
          ) : interactionHistory.length === 0 ? (
            <p>No past interactions found. Start using the Smart Assistant!</p>
          ) : (
            <div className="space-y-4">
              {interactionHistory.map((interaction) => (
                <div key={interaction._id} className="p-3 border rounded-xl bg-gray-50">
                  <div className="font-medium">Recommended on: {new Date(interaction.recommendationDate).toLocaleString()}</div>
                  <div className="text-sm text-gray-700">
                    <strong>Soil:</strong> {interaction.soilType} • 
                    <strong>Season:</strong> {interaction.season} • 
                    <strong>Location:</strong> {interaction.location}
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Recommended Crops:</strong> {interaction.recommendedCrops.map(c => c.name).join(", ")}
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Selected Crop:</strong> {interaction.selectedCrop || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={exportToPdf} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Export to PDF</button>
            <button onClick={exportToExcel} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Export to Excel</button>
          </div>
        </div>

        {/* Crop Recommendation Modal */}
        {showCropModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCropModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Get Crop Recommendation</h3>
              <div className="grid grid-cols-2 gap-4">
                {['N','P','K','temperature','humidity','ph','rainfall'].map((key) => (
                  <div key={key} className="col-span-2 sm:col-span-1">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">{key.toUpperCase()}</label>
                    <input
                      type="number"
                      step="any"
                      value={cropForm[key]}
                      onChange={(e)=>setCropForm({ ...cropForm, [key]: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={async ()=>{
                    try {
                      setCropLoading(true);
                      const payload = Object.fromEntries(Object.entries(cropForm).map(([k,v])=>[k, Number(v)]));
                      const { getRecommendation } = await import('../services/cropService');
                      const data = await getRecommendation(payload);
                      setCropResult(data);
                    } catch (e) {
                      setCropResult({ error: e?.response?.data?.message || e?.message || 'Failed to fetch recommendation' });
                    } finally {
                      setCropLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                  disabled={cropLoading}
                >
                  {cropLoading ? 'Calculating…' : 'Recommend'}
                </button>
                <button onClick={()=>setShowCropModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-100">Close</button>
              </div>
              {cropResult && (
                <div className="mt-4 p-3 border rounded-lg bg-gray-50 dark:bg-slate-700/50 text-gray-800 dark:text-gray-100">
                  {cropResult.error ? (
                    <div className="text-red-600">{cropResult.error}</div>
                  ) : (
                    <div>
                      <div className="font-semibold">Top Recommendation: {cropResult.top || '—'}</div>
                      <ul className="list-disc pl-5 mt-2 text-sm">
                        {(cropResult.recommendations || []).map(r => (
                          <li key={r.label}>{r.label} (score {r.score})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Growth Calendar */}
        <div 
          className="bg-white bg-opacity-90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] relative overflow-hidden mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
                Growth Calendar
              </span>
            </h3>
            <Link to="/growth-calendar" className="text-sm text-green-600 hover:text-green-700 font-medium">
              View Full Dashboard →
            </Link>
          </div>
          
          {loadingCalendars ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600">Loading calendars...</span>
            </div>
          ) : dashboardCalendars.length > 0 ? (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-green-600">{dashboardCalendars.length}</div>
                  <div className="text-xs text-green-700">Active Crops</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {dashboardCalendars.reduce((sum, cal) => sum + (cal.upcomingTasks?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-blue-700">Upcoming Tasks</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {dashboardCalendars.filter(cal => cal.remainingDaysToHarvest !== null && cal.remainingDaysToHarvest <= 7).length}
                  </div>
                  <div className="text-xs text-orange-700">Urgent Harvests</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {dashboardCalendars.length > 0 ? Math.round(
                      dashboardCalendars.reduce((sum, cal) => sum + (cal.stageProgress || 0), 0) / dashboardCalendars.length
                    ) : 0}%
                  </div>
                  <div className="text-xs text-purple-700">Avg Progress</div>
                </div>
              </div>

              {/* Calendar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardCalendars.slice(0, 4).map((cal) => {
                  const calId = cal._id || cal.id;
                  const daysLeft = cal.remainingDaysToHarvest;
                  const currentStage = cal.currentStage;
                  const upcomingTasks = cal.upcomingTasks || [];
                  
                  const getUrgencyColor = () => {
                    if (daysLeft === null) return 'text-gray-600';
                    if (daysLeft <= 0) return 'text-green-600';
                    if (daysLeft <= 3) return 'text-red-600';
                    if (daysLeft <= 7) return 'text-orange-600';
                    return 'text-blue-600';
                  };

                  const getUrgencyBg = () => {
                    if (daysLeft === null) return 'bg-gray-100';
                    if (daysLeft <= 0) return 'bg-green-100';
                    if (daysLeft <= 3) return 'bg-red-100';
                    if (daysLeft <= 7) return 'bg-orange-100';
                    return 'bg-blue-100';
                  };

                  return (
                    <div key={calId} className="p-4 border rounded-2xl bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 mb-1">
                            {cal.cropName}
                            {cal.variety && <span className="text-sm text-gray-500 ml-1">• {cal.variety}</span>}
                          </div>
                          {currentStage && (
                            <div className="text-sm text-gray-600 mb-2">
                              Current Stage: <span className="font-medium text-green-600">{currentStage.stageName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/growth-calendar/${calId}`} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            View
                          </Link>
                        </div>
                      </div>

                      {/* Harvest Countdown */}
                      {daysLeft !== null && (
                        <div className={`${getUrgencyBg()} rounded-lg p-3 mb-3`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-700">Harvest Countdown</div>
                              <div className={`text-lg font-bold ${getUrgencyColor()}`}>
                                {daysLeft <= 0 ? 'Ready!' : `${daysLeft} days left`}
                              </div>
                            </div>
                            <div className="text-2xl">
                              {daysLeft <= 0 ? '🎉' : daysLeft <= 3 ? '⚠️' : daysLeft <= 7 ? '📅' : '🌱'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Upcoming Tasks */}
                      {upcomingTasks.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Upcoming Tasks ({upcomingTasks.length})
                          </div>
                          <div className="space-y-1">
                            {upcomingTasks.slice(0, 2).map((task, index) => (
                              <div key={index} className="flex items-center text-xs text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span className="truncate">{task.name}</span>
                              </div>
                            ))}
                            {upcomingTasks.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{upcomingTasks.length - 2} more tasks
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {cal.stageProgress !== undefined && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs font-medium text-green-600">{cal.stageProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${cal.stageProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Updated: {new Date(cal.updatedAt || cal.createdAt).toLocaleDateString()}
                        </span>
                        <Link 
                          to="/growth-calendar" 
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Manage →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {dashboardCalendars.length > 4 && (
                <div className="text-center pt-4">
                  <Link 
                    to="/growth-calendar" 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View All {dashboardCalendars.length} Calendars
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🌱</div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">No Growth Calendars Yet</h4>
              <p className="text-gray-600 mb-4">Start tracking your crops' journey from seed to harvest</p>
              <Link to="/growth-calendar/new" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Create Your First Calendar
              </Link>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <SoilTrendsChart />
          <RainfallForecastChart />
          <GrowthProgressChart />
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
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "📝", label: "Add Note", color: "hover:bg-green-100" },
                  { icon: "🔄", label: "Sync Data", color: "hover:bg-blue-100" },
                  { icon: "📊", label: "Reports", color: "hover:bg-yellow-100" },
                  { icon: "⚙️", label: "Settings", color: "hover:bg-gray-100" },
                  { icon: "🌿", label: "Plant Explorer", color: "hover:bg-emerald-100", to: "/plants" }
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
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}