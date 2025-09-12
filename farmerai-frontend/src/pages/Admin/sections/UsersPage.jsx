import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Download, FileDown, Shield, Leaf, CheckCircle2, AlertTriangle, Pencil, UserCog, User, BadgeCheck, Trash2, X, Search, Filter } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import Modal from '../../../components/Modal';
import { gsap } from 'gsap';

function useTable(data, { roleFilter, verifiedFilter, query }) {
	const [page, setPage] = useState(1);
	const [rows, setRows] = useState(10);

	const filtered = useMemo(() => {
		const s = (query || '').trim().toLowerCase();
		return (data || [])
			.filter((u) => [u.name, u.email, (u.roles||[]).join(','), u.role]
				.some(v => String(v||'').toLowerCase().includes(s)))
			.filter((u) => {
				if (roleFilter === 'all') return true;
				const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
				return roleFilter === 'admin' ? roles.includes('admin') : roles.includes('farmer');
			})
			.filter((u) => {
				if (verifiedFilter === 'all') return true;
				return verifiedFilter === 'verified' ? !!u.verified : !u.verified;
			});
	}, [data, query, roleFilter, verifiedFilter]);

	const total = filtered.length;
	const start = (page - 1) * rows;
	const pageData = filtered.slice(start, start + rows);
	return { page, setPage, rows, setRows, total, pageData };
}

export default function UsersPage() {
	const [items, setItems] = useState([]);
	const [query, setQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState('all'); // all | admin | farmer
	const [verifiedFilter, setVerifiedFilter] = useState('all'); // all | verified | unverified
	const { page, setPage, rows, setRows, total, pageData } = useTable(items, { roleFilter, verifiedFilter, query });
	const rowsRef = useRef([]);

	const load = async () => {
		try {
			const { data } = await apiClient.get('/admin/users');
			setItems(data);
		} catch {
			toast.error('Failed to load users');
		}
	};

	useEffect(() => { load(); }, []);

	// GSAP subtle fade-in for table rows on load/page change
	useEffect(() => {
		if (!rowsRef.current) return;
		gsap.fromTo(rowsRef.current.filter(Boolean), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
	}, [pageData]);

	const updateUser = async (id, patch) => {
		try {
			await apiClient.patch(`/admin/users/${id}`, patch);
			toast.success('Updated');
			load();
		} catch {
			toast.error('Update failed');
		}
	};

	const [edit, setEdit] = useState(null);

	const delUser = async (id) => {
		if (!confirm('Delete this user?')) return;
		try {
			await apiClient.delete(`/admin/users/${id}`);
			toast.success('Deleted');
			load();
		} catch {
			toast.error('Delete failed');
		}
	};

	const hasRole = (u, role) => {
		const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
		return roles.includes(role);
	};

	return (
		<div className="space-y-4">
			{/* Header & Export */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Users</h2>
					<p className="text-slate-500">Manage roles and status</p>
				</div>
				<div className="flex items-center gap-2">
					<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} title="Download as CSV" onClick={async()=>{
						const s = query.trim().toLowerCase();
						const filtered = (items||[]).filter((u)=>[u.name,u.email,(u.roles||[]).join(','), u.role].some(v=>String(v||'').toLowerCase().includes(s)));
						const header = ['Name','Email','Roles','Verified'];
						const rowsCsv = [header.join(',')].concat(filtered.map(u=>[
							JSON.stringify(u.name||'-'),
							JSON.stringify(u.email||'-'),
							JSON.stringify((Array.isArray(u.roles)?u.roles:(u.role?[u.role]:[])).join(' ')),
							JSON.stringify(u.verified?'Yes':'No')
						]).join(',') ).join('\n');
						const blob = new Blob([rowsCsv], { type: 'text/csv;charset=utf-8' });
						const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='users.csv'; a.click(); URL.revokeObjectURL(url);
					}} className="px-3 py-2 border rounded-lg bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2">
						<Download className="w-4 h-4" /> Export CSV
					</motion.button>
					<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} title="Download as PDF" onClick={async()=>{
						try {
							const s = query.trim().toLowerCase();
							const filtered = (items||[]).filter((u)=>[u.name,u.email,(u.roles||[]).join(','), u.role].some(v=>String(v||'').toLowerCase().includes(s)));
							const { jsPDF } = await import('jspdf');
							const autoTable = (await import('jspdf-autotable')).default;
							const doc = new jsPDF();
							autoTable(doc, {
								head: [['Name','Email','Roles','Verified']],
								body: filtered.map(u=>[u.name||'-', u.email||'-', (Array.isArray(u.roles)?u.roles:(u.role?[u.role]:[])).join(' '), u.verified?'Yes':'No'])
							});
							doc.save('users.pdf');
						} catch (e) {
							toast.error('Install dependencies: npm i jspdf jspdf-autotable');
						}
					}} className="px-3 py-2 border rounded-lg bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2">
						<FileDown className="w-4 h-4" /> Export PDF
					</motion.button>
				</div>
			</div>

			{/* Search & Filters */}
			<div className="rounded-2xl bg-white/60 backdrop-blur border border-slate-200 shadow-sm p-3">
				<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
					<div className="flex-1 relative">
						<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input value={query} onChange={e=>{ setQuery(e.target.value); setPage(1); }} placeholder="Search users by name, email, or role" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white/70 backdrop-blur focus:outline-none focus:ring-2 focus:ring-emerald-500" />
					</div>
					<div className="flex gap-2">
						<div className="relative">
							<Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<select value={roleFilter} onChange={e=>{ setRoleFilter(e.target.value); setPage(1); }} className="appearance-none pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white/70">
								<option value="all">All roles</option>
								<option value="admin">Admin</option>
								<option value="farmer">Farmer</option>
							</select>
						</div>
						<select value={verifiedFilter} onChange={e=>{ setVerifiedFilter(e.target.value); setPage(1); }} className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white/70">
							<option value="all">All statuses</option>
							<option value="verified">Verified</option>
							<option value="unverified">Unverified</option>
						</select>
						<motion.button whileHover={{ y: -1 }} whileTap={{ y: 0 }} onClick={()=>{ setQuery(''); setRoleFilter('all'); setVerifiedFilter('all'); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white inline-flex items-center gap-2 text-slate-700">
							<X className="w-4 h-4" /> Clear Filters
						</motion.button>
						<select value={rows} onChange={e=>{ setRows(+e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/70">
							{[10,20,50].map(n=> <option key={n} value={n}>{n}/page</option>)}
						</select>
					</div>
				</div>
			</div>

			{/* Table Card */}
			<div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 backdrop-blur border border-gray-200 shadow-lg overflow-hidden">
				{/* Desktop table */}
				<div className="overflow-x-auto hidden md:block">
					<table className="min-w-full text-sm">
						<thead className="sticky top-0 bg-white/90 backdrop-blur z-10 shadow-sm text-slate-600">
							<tr>
								<th className="text-left px-4 py-3">Name</th>
								<th className="text-left px-4 py-3">Email</th>
								<th className="text-left px-4 py-3">Roles</th>
								<th className="text-left px-4 py-3">Verified</th>
								<th className="text-right px-4 py-3">Actions</th>
							</tr>
						</thead>
						<tbody>
							{pageData.map((u, idx) => (
								<tr
									key={u._id}
									ref={el => rowsRef.current[idx] = el}
									className="border-t odd:bg-slate-50/50 hover:bg-emerald-50/30 transition-colors"
								>
									<td className="px-4 py-3">
										<div className="font-medium text-slate-800">{u.name || '-'}</div>
										<div className="text-xs text-slate-500 md:hidden">{u.email}</div>
									</td>
									<td className="px-4 py-3">{u.email}</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2 flex-wrap">
											{hasRole(u, 'admin') && (
												<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">
													<Shield className="w-3.5 h-3.5" /> Admin
												</span>
											)}
											{(!hasRole(u, 'admin') || hasRole(u, 'farmer')) && (
												<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
													<Leaf className="w-3.5 h-3.5" /> Farmer
												</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										{u.verified ? (
											<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
												<CheckCircle2 className="w-3.5 h-3.5" /> Verified
											</span>
										) : (
											<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">
												<AlertTriangle className="w-3.5 h-3.5" /> Unverified
											</span>
										)}
									</td>
									<td className="px-4 py-2 text-right">
										<div className="flex justify-end gap-1.5">
											<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-200 inline-flex items-center gap-1 text-slate-700" onClick={() => setEdit(u)}>
												<Pencil className="w-3.5 h-3.5" /> Edit
											</motion.button>
											<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-2.5 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1" onClick={() => updateUser(u._id, { roles: ['admin'] })}>
												<UserCog className="w-3.5 h-3.5" /> Make Admin
											</motion.button>
											<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-2.5 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1" onClick={() => updateUser(u._id, { roles: ['farmer'] })}>
												<User className="w-3.5 h-3.5" /> Make Farmer
											</motion.button>
											<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-2.5 py-1.5 text-xs rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 inline-flex items-center gap-1" onClick={() => updateUser(u._id, { verified: !u.verified })}>
												<BadgeCheck className="w-3.5 h-3.5" /> {u.verified ? 'Unverify' : 'Verify'}
											</motion.button>
											<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-2.5 py-1.5 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1" onClick={() => delUser(u._id)}>
												<Trash2 className="w-3.5 h-3.5" /> Delete
											</motion.button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile cards */}
				<div className="md:hidden divide-y">
					{pageData.map((u) => (
						<div key={u._id} className="p-4">
							<div className="flex items-start justify-between">
								<div>
									<div className="font-semibold text-slate-800">{u.name || '-'}</div>
									<div className="text-sm text-slate-600">{u.email}</div>
								</div>
								<div className="flex items-center gap-2">
									{u.verified ? (
										<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
											<CheckCircle2 className="w-3.5 h-3.5" /> Verified
										</span>
									) : (
										<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">
											<AlertTriangle className="w-3.5 h-3.5" /> Unverified
										</span>
									)}
								</div>
							</div>
							<div className="mt-2 flex items-center gap-2 flex-wrap">
								{hasRole(u, 'admin') && (
									<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">
										<Shield className="w-3.5 h-3.5" /> Admin
									</span>
								)}
								{(!hasRole(u, 'admin') || hasRole(u, 'farmer')) && (
									<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
										<Leaf className="w-3.5 h-3.5" /> Farmer
									</span>
								)}
							</div>
							<div className="mt-3 grid grid-cols-2 gap-2">
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 inline-flex items-center justify-center gap-1 text-slate-700" onClick={() => setEdit(u)}>
									<Pencil className="w-3.5 h-3.5" /> Edit
								</motion.button>
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-3 py-2 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 inline-flex items-center justify-center gap-1" onClick={() => updateUser(u._id, { roles: ['admin'] })}>
									<UserCog className="w-3.5 h-3.5" /> Admin
								</motion.button>
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-3 py-2 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center justify-center gap-1" onClick={() => updateUser(u._id, { roles: ['farmer'] })}>
									<User className="w-3.5 h-3.5" /> Farmer
								</motion.button>
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-3 py-2 text-xs rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 inline-flex items-center justify-center gap-1" onClick={() => updateUser(u._id, { verified: !u.verified })}>
									<BadgeCheck className="w-3.5 h-3.5" /> {u.verified ? 'Unverify' : 'Verify'}
								</motion.button>
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 px-3 py-2 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center justify-center gap-1" onClick={() => delUser(u._id)}>
									<Trash2 className="w-3.5 h-3.5" /> Delete
								</motion.button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between text-sm">
				<div>Showing {(total === 0 ? 0 : (page-1)*rows+1)}-{Math.min(page*rows, total)} of {total}</div>
				<div className="flex gap-1">
					{Array.from({ length: Math.max(1, Math.ceil(total / rows)) }).map((_, i) => {
						const p = i + 1;
						const active = p === page;
						return (
							<button key={p} onClick={()=>setPage(p)} className={`px-3 py-1 rounded-full border transition-colors ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
								{p}
							</button>
						);
					})}
				</div>
			</div>

			{/* Edit Modal */}
			<Modal open={!!edit} onClose={()=>setEdit(null)} title="Edit User">
				{edit && (
					<form onSubmit={async (e)=>{e.preventDefault(); await updateUser(edit._id, { roles: edit.roles, verified: edit.verified }); setEdit(null);}} className="space-y-4">
						<div>
							<label className="block text-sm text-slate-600 mb-1">Roles (comma separated)</label>
							<input value={(edit.roles||[]).join(',')} onChange={e=>setEdit({...edit, roles: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full px-3 py-2 border rounded" />
						</div>
						<div className="flex items-center gap-2">
							<input id="verified" type="checkbox" checked={!!edit.verified} onChange={e=>setEdit({...edit, verified: e.target.checked})} />
							<label htmlFor="verified" className="text-sm">Verified</label>
						</div>
						<div className="flex justify-end gap-2">
							<button type="button" className="px-3 py-2 border rounded" onClick={()=>setEdit(null)}>Cancel</button>
							<button type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded">Save</button>
						</div>
					</form>
				)}
			</Modal>
		</div>
	);
}