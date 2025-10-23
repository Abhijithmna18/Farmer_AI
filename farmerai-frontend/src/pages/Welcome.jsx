import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Button from "../components/Button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import SearchBar from "../components/SearchBar";
import EventsSection from "../components/home/EventsSection";

// Enhanced decorative icon with animations
const Icon = ({ children, className = "" }) => (
  <div className={`w-16 h-16 rounded-2xl border-2 border-green-200 flex items-center justify-center text-2xl bg-gradient-to-br from-green-50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${className}`}>
    <span aria-hidden className="transform hover:rotate-12 transition-transform duration-300">{children}</span>
  </div>
);

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span className="font-bold text-green-600">{count.toLocaleString()}</span>;
};

export default function Welcome() {
  const nav = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const navItems = [
    { label: t('common:home'), path: '/' },
    { label: t('common:events'), path: '/events' },
    { label: t('common:blog'), path: '/blog' },
    { label: t('common:community'), path: '/community' },
    { label: t('common:aboutUs'), path: '/about-us' },
    { label: t('common:gallery'), path: '/gallery' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 text-gray-800 overflow-x-hidden" style={{
        background: "linear-gradient(135deg, #e8f5e8 0%, #f0f9eb 25%, #e6f4ea 50%, #d4ede1 75%, #c8e6c8 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 15s ease infinite"
      }}>
      {/* Enhanced announcement bar */}
      <div className="text-center text-sm py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium shadow-sm">
        🌱 {t('welcome:announcement')}
      </div>

      {/* Enhanced top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-6">
        <div className="flex-1 relative">
          <SearchBar />
        </div>
        
        <LanguageSwitcher compact />
        <button
          type="button"
          className="px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 font-medium"
          onClick={() => nav("/login")}
        >
          {t('common:signIn')}
        </button>
        <Button className="ml-2 shadow-lg" onClick={() => nav("/contact-us")}>{t('common:contactUs')}</Button>
      </div>

      {/* Enhanced navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-2 flex-wrap text-sm">
          {navItems.map((item, i) => (
            <NavLink
              key={i}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl font-medium transition-all duration-300 cursor-pointer ${ 
                  isActive
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "hover:bg-gray-100 hover:shadow-md"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Enhanced Hero section */}
      <section className={`relative mt-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="py-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              🌿 {t('welcome:sustainableCommunity')}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
              {t('welcome:heroTitle1')}{" "}
              <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
                {t('welcome:heroTitleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
              {t('welcome:heroSub')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => nav("/login")} className="text-lg px-8 py-4">
                {t('common:startYourJourney')}
              </Button>
              <Button variant="secondary" onClick={() => nav("/about")} className="text-lg px-8 py-4">
                {t('common:learnMore')}
              </Button>
              <Button variant="accent" onClick={() => nav("/workshops")} className="text-lg px-8 py-4">
                Workshop Tutorials
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600"><AnimatedCounter end={2000} /></div>
                <div className="text-sm text-gray-500">{t('common:happyFarmers')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600"><AnimatedCounter end={150} /></div>
                <div className="text-sm text-gray-500">{t('common:eventsThisYear')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600"><AnimatedCounter end={50} /></div>
                <div className="text-sm text-gray-500">{t('common:expertMentors')}</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
                             <img
                 src="/farm.jpg"
                 alt="Farm landscape"
                 className="w-full h-[450px] object-cover rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
               />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-200 rounded-full opacity-60 animate-pulse delay-1000"></div>
          </div>
        </div>
       
      </section>

      {/* Public Upcoming Events */}
      <EventsSection />

      {/* Enhanced Events and Workshops section */}
      <section className="relative bg-gradient-to-br from-[#2f3640] to-[#34495e] text-white pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="relative w-full max-w-xl ml-4">
              <div className="rounded-[48%_52%_53%_47%/60%_53%_47%_40%] overflow-hidden shadow-2xl transform hover:rotate-2 transition-transform duration-500">
                <img
                  src="/image.png"
                  alt="See"
                  className="w-full h-[320px] object-cover"
                />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full animate-bounce delay-500"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium">
              🎓 Educational Programs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">{t('welcome:whyChooseUs')}</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full" />
            <p className="text-lg text-white/90 leading-relaxed">
              Our team consists of knowledgeable agricultural specialists and passionate volunteers.
            </p>
            <p className="text-white/80 leading-relaxed">
              We offer workshops and activities that promote sustainable farming practices and community engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="secondary" onClick={() => nav("/events")} className="text-lg px-8 py-4">
                {t('welcome:exploreEvents')}
              </Button>
              <Button variant="accent" onClick={() => nav("/workshops")} className="text-lg px-8 py-4">
                {t('welcome:joinWorkshop')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Three features section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Choose Us</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[{
              img: "/mission.png",
              title: "Our Mission",
              text: "Our aim is to support local farmers and provide fresh, organic produce to our community.",
              icon: "🎯"
            }, {
              img: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop",
              title: "For Every Farmer",
              text: "All programs are designed to meet the diverse needs of our members, fostering growth and sustainability.",
              icon: "👨‍🌾"
            }, {
              img: "https://images.unsplash.com/photo-1520072959219-c595dc870360?q=80&w=1000&auto=format&fit=crop",
              title: "Open-Door Policy",
              text: "We invite you to visit our cooperative and meet our dedicated team at your convenience.",
              icon: "🚪"
            }].map((card, i) => (
              <div key={i} className="text-center group">
                <div className="relative mx-auto w-72 h-80 rounded-[46%_54%_51%_49%/58%_46%_54%_42%] overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-500">
                  <img src={card.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="text-4xl">{card.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800">{card.title}</h3>
                  <div className="h-1 w-16 bg-gray-300 mx-auto rounded-full"></div>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Premium produce quick links */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Premium Services</h2>
          <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mx-auto mb-12"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {[{ label: "Expert Consultation", icon: "🏢", color: "from-blue-400 to-blue-500" },
              { label: "Equipment Rental", icon: "👥", color: "from-green-400 to-green-500" },
              { label: "Community\nGarden", icon: "🌱", color: "from-yellow-400 to-yellow-500" },
              { label: "Agri-Tourism & Farm Stays", icon: "🌳", color: "from-purple-400 to-purple-500" },
              { label: "Farm Fresh Products", icon: "🍎", color: "from-purple-400 to-purple-500" },
            ].map((x, idx) => (
              <button
                key={idx}
                onClick={() => nav("/" + x.label.toLowerCase().replace(/\s+/g, "-"))}
                className="text-left p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-white hover:shadow-xl transition-all duration-300 group transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${x.color} flex items-center justify-center text-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    {x.icon}
                  </div>
                  <div className="font-semibold text-gray-800 whitespace-pre-line group-hover:text-gray-900">{x.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Mid-page CTA */}
      <section className="relative py-20 bg-gradient-to-br from-green-500 to-blue-600 text-white overflow-hidden">
        {/* Enhanced floating shapes */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-10 top-10 w-12 h-12 rounded-2xl border-4 border-white animate-pulse"></div>
          <div className="absolute right-16 top-20 w-8 h-8 rounded-full bg-white animate-bounce"></div>
          <div className="absolute left-1/3 top-1/2 w-16 h-16 border-4 border-white rotate-45 animate-pulse delay-1000"></div>
          <div className="absolute right-1/4 bottom-16 w-20 h-3 bg-white rotate-12 animate-bounce delay-500"></div>
          <div className="absolute left-8 bottom-10 w-10 h-10 border-4 border-white rounded-full animate-pulse delay-1500"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold mb-4">
            <AnimatedCounter end={2000} /> families
          </h3>
          <p className="text-xl text-white/90 leading-relaxed mb-8">
            have joined our cooperative for fresh produce. Trust us with your agricultural needs and enjoy the benefits of community farming.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => nav("/register")} variant="accent" className="text-lg px-8 py-4">
              Join Our Community
            </Button>
            <Button variant="secondary" onClick={() => nav("/contact")} className="text-lg px-8 py-4">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-20 bg-gradient-to-br from-green-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Have questions about our services? Need help with your farming journey? 
              We're here to help you succeed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Email Support</h3>
                  <p className="text-white/80">info@farmerai.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Phone Support</h3>
                  <p className="text-white/80">+1 (555) 555-5556</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🕒</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Business Hours</h3>
                  <p className="text-white/80">Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => nav("/contact-us")} 
                variant="accent" 
                className="text-lg px-8 py-4 bg-white text-green-600 hover:bg-gray-100"
              >
                Contact Us Now
              </Button>
              <p className="mt-4 text-white/80">
                We typically respond within 24 hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-xl font-bold text-white mb-4">FarmerAI</h4>
              <p className="text-gray-400 leading-relaxed">
                Empowering farmers with sustainable practices and community support.
              </p>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">Services</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Farming Workshops</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Garden</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Expert Consultation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Equipment Rental</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">Connect</h5>
              <div className="flex gap-4 mb-4">
                <a href="https://www.facebook.com/" aria-label="Facebook" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">📘</a>
                <a href="https://twitter.com/" aria-label="Twitter" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">🐦</a>
                <a href="https://www.linkedin.com/" aria-label="LinkedIn" className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">💼</a>
                <a href="https://www.instagram.com/" aria-label="Instagram" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors">📷</a>
              </div>
              <p className="text-sm text-gray-400">
                Subscribe to our newsletter for updates
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <div className="text-sm text-gray-400 mb-4">
              250 Executive Park Blvd, Suite 3400 · San Francisco CA 94134 · United States
              <br /> +1 555-555-5556 · info@farmerai.example
            </div>
            <div className="flex justify-center items-center gap-4">
              <div className="px-6 py-3 rounded-xl bg-gray-800/80 text-white font-semibold">FarmerAI</div>
              <div className="text-sm text-gray-400">© 2024 All rights reserved</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}