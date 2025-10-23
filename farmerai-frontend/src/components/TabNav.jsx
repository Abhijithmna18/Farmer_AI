import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { Home, Sprout, BarChart2, User, Settings, MessageSquare, MessageCircle, Warehouse, Calendar, Activity, Video } from "lucide-react";

export default function TabNav({ isOpen, onToggle }) {
	const { user, loading } = useAuth();
	const location = useLocation();

	// Check if user is admin
	const isAdmin = user && (user.role === 'admin' || (Array.isArray(user.roles) && user.roles.includes('admin')));

	const menu = [
		{ label: "Dashboard", to: "/dashboard", Icon: Home },
		{ label: "Assistant", to: "/assistant", Icon: MessageSquare },
		{ label: "Recommendations", to: "/recommendations", Icon: Sprout },
		{ label: "Farm Monitoring", to: "/farm-monitoring", Icon: Activity },
		{ label: "Warehouse", to: "/warehouse", Icon: Warehouse },
		{ label: "My Bookings", to: "/my-bookings", Icon: Calendar },
		{ label: "Workshop Tutorials", to: "/workshops", Icon: Video },
		{ label: "Reports", to: "/reports", Icon: BarChart2 },
		{ label: "Feedback", to: "/feedback", Icon: MessageCircle },
		// removed History entry that pointed to /interaction-history
		{ label: "Profile", to: "/profile", Icon: User },
		{ label: "Settings", to: "/settings", Icon: Settings }
	];

	// Admin menu items
	const adminMenu = [
		{ label: "Admin Dashboard", to: "/admin/dashboard", Icon: Home },
		{ label: "Users", to: "/admin/dashboard/users", Icon: User },
		{ label: "Events", to: "/admin/dashboard/events", Icon: Calendar },
		{ label: "Growth Calendar", to: "/admin/growth-calendar", Icon: Sprout },
		{ label: "Products", to: "/admin/dashboard/products", Icon: BarChart2 },
		{ label: "Contacts", to: "/admin/dashboard/contacts", Icon: MessageCircle },
		{ label: "Settings", to: "/admin/dashboard/settings", Icon: Settings }
	];

	return (
		<>
			{/* Sidebar overlay for small screens */}
			<div
				className={`fixed inset-0 bg-black/40 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
				onClick={onToggle}
				aria-hidden={!isOpen}
			/>

			<aside
				className={`fixed top-0 left-0 h-full w-64 md:w-72 p-4 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-r-2 border-green-100 dark:border-slate-800 shadow-2xl z-40 transform transition-transform duration-300 ease-out
						${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
					`}
					inert={!isOpen}
					aria-label="Sidebar navigation"
			>
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						{loading ? (
							<div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" aria-hidden />
						) : (
							<div className="relative">
								<img
									src={user?.photoURL || '/vite.svg'}
									alt="Profile avatar"
									className="w-12 h-12 rounded-full object-cover border-2 border-green-100 dark:border-slate-700"
								/>
								<span className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-600 text-white shadow">{(user?.subscription || 'Free').toString().slice(0,5)}</span>
							</div>
						)}
						<div>
							<div className="text-sm font-semibold text-gray-800 dark:text-slate-100">
								{loading ? <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" aria-hidden /> : (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.displayName || user?.name || (user?.email || 'Farmer').split('@')[0])}
							</div>
							<div className="text-xs text-green-700 font-medium flex items-center gap-1 mt-0.5">
								{loading ? <div className="h-3 w-14 bg-gray-200 dark:bg-slate-700 rounded mt-1 animate-pulse" aria-hidden /> : (<>
									<span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden />
									<span>{user?.role ? String(user.role).toUpperCase() : 'USER'}</span>
								</>)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle 
							variant="icon" 
							size="sm" 
							showToast={true}
							className="hover:scale-105"
						/>
						<button
							onClick={onToggle}
							className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors md:hidden"
							aria-label="Close sidebar"
						>
							✖
						</button>
					</div>
				</div>

				{/* Show admin menu if user is on admin route and is admin */}
				{isAdmin && location.pathname.startsWith('/admin') ? (
					<>
						<div className="text-xs uppercase tracking-wide text-gray-400 px-3 mb-2">Admin</div>
						<nav className="space-y-1" aria-label="Admin">
							{adminMenu.map(({ to, label, Icon }) => (
								<NavLink
									key={to}
									to={to}
									className={({ isActive }) => `group flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-gray-700 hover:bg-green-50/80 ${isActive ? 'bg-green-600 text-white shadow-green-300' : ''}`}
									onClick={() => { if (onToggle && window.innerWidth < 768) onToggle(); }}
								>
									<span className="grid place-items-center w-8 h-8 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-200">
										<Icon className="w-4 h-4" aria-hidden />
									</span>
									<span className="font-medium flex-1">{label}</span>
								</NavLink>
							))}
						</nav>
						{/* Logout button removed as per requirements */}
					</>
				) : (
					<>
						{/* Sections */}
						<div className="text-xs uppercase tracking-wide text-gray-400 px-3 mb-2">Main</div>
						<nav className="space-y-1" aria-label="Primary">
							{menu.slice(0,6).map(({ to, label, Icon }) => (
								<NavLink
									key={to}
									to={to}
									className={({ isActive }) => `group flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-gray-700 hover:bg-green-50/80 ${isActive ? 'bg-green-600 text-white shadow-green-300' : ''}`}
									onClick={() => { if (onToggle && window.innerWidth < 768) onToggle(); }}
								>
									<span className="grid place-items-center w-8 h-8 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-200">
										<Icon className="w-4 h-4" aria-hidden />
									</span>
									<span className="font-medium flex-1">{label}</span>
								</NavLink>
							))}
						</nav>

						<div className="text-xs uppercase tracking-wide text-gray-400 px-3 mt-4 mb-2">More</div>
						<nav className="space-y-1" aria-label="Secondary">
							{menu.slice(6).map(({ to, label, Icon }) => (
								<NavLink
									key={to}
									to={to}
									className={({ isActive }) => `group flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-gray-700 hover:bg-green-50/80 ${isActive ? 'bg-green-600 text-white shadow-green-300' : ''}`}
									onClick={() => { if (onToggle && window.innerWidth < 768) onToggle(); }}
								>
									<span className="grid place-items-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-200">
									<Icon className="w-4 h-4" aria-hidden />
								</span>
									<span className="font-medium flex-1">{label}</span>
									{label === 'Feedback' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">New</span>}
								</NavLink>
							))}
						</nav>
						{/* Logout button removed as per requirements */}
					</>
				)}

				<div className="mt-auto pt-6 text-xs text-gray-500">
					<div className="flex items-center justify-between px-1">
						<div aria-hidden>FarmerAI</div>
						<div className="text-[10px] text-gray-400">v1.0</div>
					</div>
				</div>
			</aside>
		</>
	);
}