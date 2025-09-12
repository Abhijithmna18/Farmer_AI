import React, { useMemo, useRef, useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import PageHeader from "../components/PageHeader";
import Section from "../components/Section";
import Toast from "../components/Toast";
import { fetchProfile, updateProfile as apiUpdateProfile, uploadProfilePicture, removeProfilePicture } from "../services/profileService";
import HomeButton from "../components/HomeButton";

export default function Profile() {
	const { user, setUser } = useAuth();
	const fileInputRef = useRef(null);
	const [toast, setToast] = useState(null);
	const [saving, setSaving] = useState(false);
	const [twoFAEnabled, setTwoFAEnabled] = useState(false);
	const [sectionsOpen, setSectionsOpen] = useState({
		basic: true,
		personal: true,
		farm: true,
		security: false,
	});

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		name: "",
		email: "",
		location: "",
		state: "",
		district: "",
		pincode: "",
		soilType: "Loamy",
		crops: [],
		language: "English",
		photoFile: null,
	});

	useEffect(() => {
		const load = async () => {
			if (!user) return;
			try {
				const full = await fetchProfile();
				setForm((f) => ({
					...f,
					firstName: full.firstName || user.firstName || "",
					lastName: full.lastName || user.lastName || "",
					name: full.name || user.name || (full.firstName && full.lastName ? `${full.firstName} ${full.lastName}` : "") || user.displayName || "",
					email: full.email || user.email || "",
					location: full.location || "",
					state: full.state || "",
					district: full.district || "",
					pincode: full.pincode || "",
					soilType: full.soilType || "Loamy",
					crops: Array.isArray(full.crops) ? full.crops : [],
					language: full.language || "English",
				}));
				setUser((prev) => ({ ...(prev || {}), ...full }));
			} catch (_) {}
		};
		load();
	}, [user, setUser]);

	const previewUrl = useMemo(() => {
		if (form.photoFile) return URL.createObjectURL(form.photoFile);
		return user?.photoURL || "/vite.svg";
	}, [form.photoFile, user?.photoURL]);

	const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

	const onPickPhoto = () => fileInputRef.current?.click();
	const onPhotoChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const isValidType = ["image/png", "image/jpeg"].includes(file.type);
		const isValidSize = file.size <= 2 * 1024 * 1024;
		if (!isValidType) {
			setToast({ type: "error", message: "Only PNG or JPEG images are allowed." });
			return;
		}
		if (!isValidSize) {
			setToast({ type: "error", message: "Image must be under 2MB." });
			return;
		}
		update("photoFile", file);
	};

	// Profile completion progress
	const completionPercent = useMemo(() => {
		const fields = [
			form.firstName,
			form.lastName,
			form.email,
			form.location,
			form.state,
			form.district,
			form.pincode,
			form.soilType,
			(Array.isArray(form.crops) && form.crops.length > 0) ? "yes" : "",
			form.language,
		];
		const filled = fields.filter((v) => v && String(v).trim().length > 0).length;
		return Math.round((filled / fields.length) * 100);
	}, [form]);

	const toggleSection = (key) => setSectionsOpen((s) => ({ ...s, [key]: !s[key] }));

	const onUploadPhoto = async () => {
		if (!form.photoFile) return;
		try {
			setSaving(true);
			const res = await uploadProfilePicture(form.photoFile);
			setUser((prev) => ({ ...(prev || {}), photoURL: res.photoURL }));
			update("photoFile", null);
			setToast({ type: "success", message: "Profile picture updated." });
		} catch (err) {
			setToast({ type: "error", message: err?.response?.data?.message || "Upload failed." });
		} finally {
			setSaving(false);
		}
	};

	const onRemovePhoto = async () => {
		try {
			setSaving(true);
			await removeProfilePicture();
			setUser((prev) => ({ ...(prev || {}), photoURL: null }));
			setToast({ type: "success", message: "Profile picture removed." });
		} catch (err) {
			setToast({ type: "error", message: err?.response?.data?.message || "Remove failed." });
		} finally {
			setSaving(false);
		}
	};

	const onCropsKeyDown = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const value = e.currentTarget.value.trim().replace(/,$/, "");
			if (value && !form.crops.includes(value)) update("crops", [...form.crops, value]);
			e.currentTarget.value = "";
		}
	};

	const removeCrop = (crop) => update("crops", form.crops.filter((c) => c !== crop));

	const onSave = async (e) => {
		e.preventDefault();
		// Basic validation
		if (!/^[A-Za-z]{2,}$/.test(form.firstName || "")) {
			setToast({ type: "error", message: "First name is required and must be letters only." });
			return;
		}
		if (!/^[A-Za-z]{2,}$/.test(form.lastName || "")) {
			setToast({ type: "error", message: "Last name is required and must be letters only." });
			return;
		}
		if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
			setToast({ type: "error", message: "Pincode must be 6 digits." });
			return;
		}
		if (Array.isArray(form.crops) && form.crops.some((c) => !c || !c.trim())) {
			setToast({ type: "error", message: "Crop tags cannot be empty." });
			return;
		}
		try {
			setSaving(true);
			const payload = {
				firstName: form.firstName,
				lastName: form.lastName,
				name: form.name || (form.firstName && form.lastName ? `${form.firstName} ${form.lastName}` : ""),
				location: form.location,
				state: form.state,
				district: form.district,
				pincode: form.pincode,
				soilType: form.soilType,
				crops: form.crops,
				language: form.language,
			};
			const updated = await apiUpdateProfile(payload);
			setUser((prev) => ({ ...(prev || {}), ...updated }));
			setToast({ type: "success", message: "Profile saved successfully." });
		} catch (err) {
			console.error("Profile save failed", err);
			setToast({ type: "error", message: err?.response?.data?.message || err.message || "Failed to save profile." });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto">
			<HomeButton />
			<PageHeader
				title="Your Profile"
				subtitle="Edit your personal information, farm preferences, and security settings."
				icon="👤"
			/>

			<form onSubmit={onSave}>
				{/* Progress Bar */}
				<div className="mb-4">
					<div className="flex justify-between items-center mb-1">
						<span className="text-sm text-gray-600">Profile Completed</span>
						<span className="text-sm font-medium text-gray-800">{completionPercent}%</span>
					</div>
					<div className="w-full h-3 bg-gray-100 rounded-full">
						<div className="h-3 bg-green-500 rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
					</div>
				</div>

				<Section className="space-y-6">
					{/* Avatar and basic info */}
					<div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
						<button type="button" onClick={() => toggleSection("basic")} className="w-full text-left flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-800">Basic Info</h3>
							<span className="text-sm text-green-700">{sectionsOpen.basic ? "Hide" : "Show"}</span>
						</button>
						{sectionsOpen.basic && (
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
							<div className="relative">
								<img src={previewUrl} alt="Profile avatar" className="w-24 h-24 rounded-full object-cover border-2 border-green-100" />
								<div className="mt-2 flex gap-2">
									<button type="button" onClick={onPickPhoto} className="px-3 py-1.5 text-sm bg-white/80 backdrop-blur rounded-lg border border-green-100 hover:bg-green-50 transition disabled:opacity-60" aria-label="Choose profile picture" disabled={saving}>Choose</button>
									<button type="button" onClick={onUploadPhoto} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60" aria-label="Upload profile picture" disabled={saving || !form.photoFile}>Save</button>
									<button type="button" onClick={onRemovePhoto} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition disabled:opacity-60" aria-label="Remove profile picture" disabled={saving || !user?.photoURL}>Remove</button>
								</div>
								<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
							</div>

							<div className="w-full">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
										<input
											value={form.firstName}
											onChange={(e) => update("firstName", e.target.value)}
											className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
											disabled={saving}
											pattern="[A-Za-z]{2,}"
											title="First name must contain only letters and be at least 2 characters"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
										<input
											value={form.lastName}
											onChange={(e) => update("lastName", e.target.value)}
											className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
											disabled={saving}
											pattern="[A-Za-z]{2,}"
											title="Last name must contain only letters and be at least 2 characters"
										/>
									</div>
								</div>

								<label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Email</label>
								<input
									type="email"
									value={form.email}
									onChange={(e) => update("email", e.target.value)}
									className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
									disabled
								/>
								{user?.emailVerified && (
									<span className="inline-flex items-center mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Verified ✓</span>
								)}
						</div>
						</div>
						)}
					</div>

					{/* Personal Info */}
					<div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
						<button type="button" onClick={() => toggleSection("personal")} className="w-full text-left flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-800">Personal Info</h3>
							<span className="text-sm text-green-700">{sectionsOpen.personal ? "Hide" : "Show"}</span>
						</button>
						{sectionsOpen.personal && (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
									<input value={form.location} onChange={(e) => update("location", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30" disabled={saving} />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">State</label>
									<input value={form.state} onChange={(e) => update("state", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30" disabled={saving} />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">District</label>
									<input value={form.district} onChange={(e) => update("district", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30" disabled={saving} />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
									<input value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/[^\d]/g, "").slice(0,6))} className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30" disabled={saving} inputMode="numeric" placeholder="6-digit code" />
								</div>
							</div>
						)}
					</div>

					{/* Farm Preferences */}
					<div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">Farm Preferences</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
								<select value={form.soilType} onChange={(e) => update("soilType", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30" disabled={saving}>
									<option>Loamy</option>
									<option>Sandy</option>
									<option>Clay</option>
									<option>Silty</option>
									<option>Peaty</option>
									<option>Chalky</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Crops of Interest</label>
								<div className="flex flex-wrap gap-2 mb-2">
									{form.crops.map((crop) => (
										<span key={crop} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full border border-green-200">
											{crop}
											<button type="button" className="ml-1 text-green-700 hover:text-green-900 disabled:opacity-60" aria-label={`Remove ${crop}`} onClick={() => removeCrop(crop)} disabled={saving}>×</button>
										</span>
									))}
								</div>
								<input
									placeholder="Type a crop and press Enter"
									onKeyDown={onCropsKeyDown}
									className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
									disabled={saving}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
								<select value={form.language} onChange={(e) => update("language", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30" disabled={saving}>
									<option>English</option>
									<option>Hindi</option>
									<option>Kannada</option>
								</select>
							</div>
						</div>
					</div>

					{/* Security Settings */}
					<div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
						<button type="button" onClick={() => toggleSection("security")} className="w-full text-left flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-800">Security Settings</h3>
							<span className="text-sm text-green-700">{sectionsOpen.security ? "Hide" : "Show"}</span>
						</button>
						{sectionsOpen.security && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-gray-800">Two-Factor Authentication (2FA)</div>
										<div className="text-sm text-gray-600">Add an extra layer of security to your account.</div>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" className="sr-only peer" checked={twoFAEnabled} onChange={(e) => setTwoFAEnabled(e.target.checked)} />
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
									</label>
								</div>
								<div className="text-sm text-gray-600">To change your password, go to Settings → Security.</div>
							</div>
						)}
					</div>

					<div className="flex justify-end">
						<button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow disabled:opacity-60" disabled={saving}>
							{saving ? "Saving..." : "Confirm & Save"}
						</button>
					</div>
				</Section>
			</form>

			<Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
		</div>
	);
}