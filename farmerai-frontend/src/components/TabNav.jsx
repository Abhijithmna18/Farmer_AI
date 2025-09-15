import React from "react";
import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
import { Home, Sprout, BarChart2, User, Settings, MessageSquare, MessageCircle, Warehouse } from "lucide-react";

export default function TabNav({ isOpen, onToggle }) {
	const { user, loading } = useAuth();

		const menu = [
		{ label: "Dashboard", to: "/dashboard", Icon: Home },
		{ label: "Assistant", to: "/assistant", Icon: MessageSquare },
		{ label: "Recommendations", to: "/recommendations", Icon: Sprout },
		{ label: "Warehouse", to: "/warehouse", Icon: Warehouse },
		{ label: "Reports", to: "/reports", Icon: BarChart2 },
		{ label: "Feedback", to: "/feedback", Icon: MessageCircle },
		{ label: "Profile", to: "/profile", Icon: User },
		{ label: "Settings", to: "/settings", Icon: Settings }
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
				className={`fixed top-0 left-0 h-full w-64 md:w-72 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r-2 border-green-100 dark:border-slate-800 shadow-xl z-40 transform transition-transform duration-300 ease-out
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
							<img
								src={user?.photoURL || '/vite.svg'}
								alt="Profile avatar"
								className="w-12 h-12 rounded-full object-cover border-2 border-green-100 dark:border-slate-700"
							/>
						)}
						<div>
							<div className="text-sm font-semibold text-gray-800 dark:text-slate-100">
								{loading ? <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" aria-hidden /> : (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.displayName || user?.name || (user?.email || 'Farmer').split('@')[0])}
							</div>
							<div className="text-xs text-green-600 font-medium">
								{loading ? <div className="h-3 w-14 bg-gray-200 dark:bg-slate-700 rounded mt-1 animate-pulse" aria-hidden /> : (user?.subscription || 'Free')}
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

				<nav className="space-y-1" aria-label="Primary">
					{menu.map(({ to, label, Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-gray-700 hover:bg-green-50 hover:shadow-sm hover:shadow-green-200/60 ${isActive ? 'bg-green-600 text-white shadow-green-300' : ''}`}
							onClick={() => {
								if (onToggle && window.innerWidth < 768) onToggle();
							}}
						>
							<Icon className="w-5 h-5" aria-hidden />
							<span className="font-medium">{label}</span>
						</NavLink>
					))}
				</nav>

				{/* Logout Button */}
				<div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
					<LogoutButton 
						className="w-full justify-center" 
						showText={true}
					/>
				</div>

				<div className="mt-auto pt-6 text-xs text-gray-500">
					<div aria-hidden>FarmerAI</div>
				</div>
			</aside>
		</>
	);
}
