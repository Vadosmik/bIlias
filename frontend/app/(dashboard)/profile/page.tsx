'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
	Lock,
	User,
	Shield,
	Layout,
	Save,
	CheckCircle2,
	AlertCircle,
	Loader2,
	ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function ProfilePage() {
	const { user } = useAuth();

	// Academic data options
	const [departments, setDepartments] = useState<any[]>([]);
	const [courses, setCourses] = useState<any[]>([]);
	const [specializations, setSpecializations] = useState<any[]>([]);

	// Form states
	const [academicData, setAcademicData] = useState({
		departmentId: (user as any)?.wydzial_id || '',
		courseId: (user as any)?.kierunek_id || '',
		specializationId: (user as any)?.specjalizacja_id || '',
	});

	const [passwords, setPasswords] = useState({
		current: '',
		new: '',
		confirm: '',
	});

	const [widgets, setWidgets] = useState({
		courses: true,
		news: true,
		timetable: true,
		events: false,
		announcements: true,
	});

	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [fullProfile, setFullProfile] = useState<any>(null);

	const isLecturer = user?.role === 'prowadzacy';

	// Fetch initial data
	useEffect(() => {
		const loadInitialData = async () => {
			if (!user?.id) return;

			try {
				// Load departments first
				const depts = await api.dictionaries.getDepartments();
				setDepartments(depts);

				// Fetch full profile from DB to get actual current IDs and dashboard settings
				const profileData = await api.profile.get(user.id);
				setFullProfile(profileData);
				const academic = profileData.academic;
				const dashboardSettings = profileData.ustawienia_dashboard; // This will be a string like '11101'

				if (dashboardSettings) {
					setWidgets({
						courses: dashboardSettings[0] === '1',
						news: dashboardSettings[1] === '1',
						timetable: dashboardSettings[2] === '1',
						events: dashboardSettings[3] === '1',
						announcements: dashboardSettings[4] === '1',
					});
				}

				if (academic) {
					const deptId = academic.wydzial_id;
					const courseId = academic.kierunek_id;
					const specId = academic.specjalizacja_id;

					setAcademicData({
						departmentId: deptId || '',
						courseId: courseId || '',
						specializationId: specId || '',
					});

					// Load nested dictionaries if IDs exist
					if (deptId) {
						const coursesData = await api.dictionaries.getCourses(
							Number(deptId),
						);
						setCourses(coursesData);
					}

					if (courseId) {
						const specsData = await api.dictionaries.getSpecializations(
							Number(courseId),
						);
						setSpecializations(specsData);
					}
				}
			} catch (err) {
				console.error('Failed to load initial profile data:', err);
			} finally {
				setIsInitialLoading(false);
			}
		};
		loadInitialData();
	}, [user?.id]);

	// Handle department change
	const handleDepartmentChange = async (deptId: string) => {
		setAcademicData({
			...academicData,
			departmentId: deptId,
			courseId: '',
			specializationId: '',
		});
		setCourses([]);
		setSpecializations([]);
		if (deptId) {
			try {
				const data = await api.dictionaries.getCourses(Number(deptId));
				setCourses(data);
			} catch (err) {
				console.error('Failed to load courses:', err);
			}
		}
	};

	// Handle course change
	const handleCourseChange = async (courseId: string) => {
		setAcademicData({
			...academicData,
			courseId: courseId,
			specializationId: '',
		});
		setSpecializations([]);
		if (courseId) {
			try {
				const data = await api.dictionaries.getSpecializations(
					Number(courseId),
				);
				setSpecializations(data);
			} catch (err) {
				console.error('Failed to load specializations:', err);
			}
		}
	};

	const handleSaveAcademic = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user?.id) return;

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const payload = isLecturer
				? { wydzial_id: Number(academicData.departmentId) }
				: {
						wydzial_id: Number(academicData.departmentId),
						kierunek_id: Number(academicData.courseId),
						specjalizacja_id: academicData.specializationId
							? Number(academicData.specializationId)
							: null,
					};

			await api.profile.update(user.id, payload);
			setSuccess('Dane akademickie zostały zaktualizowane.');
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Błąd podczas aktualizacji danych.',
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSavePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user?.id) return;

		if (!passwords.current || !passwords.new || !passwords.confirm) {
			setError('Wszystkie pola hasła są wymagane.');
			return;
		}

		const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
		if (!passwordRegex.test(passwords.new)) {
			setError('Hasło nie spełnia wymagań (8 znaków, wielka litera, cyfra).');
			return;
		}

		if (passwords.new !== passwords.confirm) {
			setError('Hasła nie są identyczne.');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			await api.profile.changePassword({
				userId: user.id,
				oldPassword: passwords.current,
				newPassword: passwords.new,
				confirmPassword: passwords.confirm,
			});
			setSuccess('Hasło zostało zmienione.');
			setPasswords({ current: '', new: '', confirm: '' });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Błąd podczas zmiany hasła.',
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveWidgets = async () => {
		if (!user?.id) return;

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Map widget state to bit string (Postgres BIT VARYING)
			const bitString = [
				widgets.courses ? '1' : '0',
				widgets.news ? '1' : '0',
				widgets.timetable ? '1' : '0',
				widgets.events ? '1' : '0',
				widgets.announcements ? '1' : '0',
			].join('');

			await api.profile.update(user.id, { dashboard_settings: bitString });
			setSuccess('Preferencje pulpitu zostały zapisane.');
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Błąd podczas zapisywania preferencji.',
			);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleWidget = (key: keyof typeof widgets) => {
		setWidgets(prev => ({ ...prev, [key]: !prev[key] }));
	};

	if (isInitialLoading) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader2 className='w-8 h-8 text-brand-sand animate-spin' />
			</div>
		);
	}

	return (
		<div className='space-y-8'>
			{/* Page Header */}
			<section>
				<h1 className='text-3xl font-bold text-brand-navy'>Profil</h1>
				<p className='text-muted-foreground mt-2'>
					W tej sekcji możesz edytować dane swojego profilu
				</p>
			</section>

			{/* Status Messages */}
			<div className='fixed top-24 right-8 z-50 space-y-4 min-w-[320px]'>
				{success && (
					<div className='flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right-4'>
						<CheckCircle2 className='w-5 h-5 flex-shrink-0' />
						<p className='text-sm font-bold'>{success}</p>
					</div>
				)}
				{error && (
					<div className='flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right-4'>
						<AlertCircle className='w-5 h-5 flex-shrink-0' />
						<p className='text-sm font-bold'>{error}</p>
					</div>
				)}
			</div>

			{/* Profile Card */}
			<div className='bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden'>
				{/* Avatar & Name Header */}
				<div className='p-8 border-b border-brand-gray/5 bg-brand-light/20 flex items-center gap-6'>
					<div className='w-[72px] h-[72px] rounded-full bg-brand-navy flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-sm'>
						{user?.firstName?.[0]}
						{user?.lastName?.[0]}
					</div>
					<div>
						<h2 className='text-2xl font-bold text-brand-navy'>
							{user?.firstName} {user?.lastName}
						</h2>
						<p className='text-brand-sand font-bold text-sm uppercase tracking-wider'>
							{user?.role === 'prowadzacy' ? 'Wykładowca' : 'Student'}
							{fullProfile?.academic?.numer_albumu &&
								` | nr albumu: ${fullProfile.academic.numer_albumu}`}
						</p>
					</div>
				</div>

				<div className='p-8 space-y-12'>
					{/* Section 1: Dane akademickie */}
					<section className='space-y-2'>
						<div className='flex items-center gap-2'>
							<h3 className='font-bold text-brand-navy uppercase tracking-wider text-sm'>
								Dane akademickie
							</h3>
						</div>

						<form onSubmit={handleSaveAcademic} className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								{/* Wydział Select */}
								<div className='space-y-2'>
									<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-widest'>
										Wydział
									</label>
									<div className='relative'>
										<select
											value={academicData.departmentId}
											onChange={e => handleDepartmentChange(e.target.value)}
											className='w-full h-11 pl-4 pr-10 rounded-xl border border-brand-gray/20 bg-brand-light/30 text-sm focus:ring-2 focus:ring-brand-sand outline-none transition-all appearance-none cursor-pointer'>
											<option value=''>Wybierz wydział</option>
											{departments.map(d => (
												<option key={d.id} value={d.id}>
													{d.nazwa}
												</option>
											))}
										</select>
										<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
									</div>
								</div>

								{!isLecturer && (
									<>
										{/* Kierunek Select */}
										<div className='space-y-2'>
											<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-widest'>
												Kierunek
											</label>
											<div className='relative'>
												<select
													value={academicData.courseId}
													disabled={!academicData.departmentId}
													onChange={e => handleCourseChange(e.target.value)}
													className='w-full h-11 pl-4 pr-10 rounded-xl border border-brand-gray/20 bg-brand-light/30 text-sm focus:ring-2 focus:ring-brand-sand outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'>
													<option value=''>Wybierz kierunek</option>
													{courses.map(c => (
														<option key={c.id} value={c.id}>
															{c.nazwa}
														</option>
													))}
												</select>
												<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
											</div>
										</div>

										{/* Specjalizacja Select */}
										<div className='space-y-2'>
											<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-widest'>
												Specjalizacja
											</label>
											<div className='relative'>
												<select
													value={academicData.specializationId}
													disabled={!academicData.courseId}
													onChange={e =>
														setAcademicData({
															...academicData,
															specializationId: e.target.value,
														})
													}
													className='w-full h-11 pl-4 pr-10 rounded-xl border border-brand-gray/20 bg-brand-light/30 text-sm focus:ring-2 focus:ring-brand-sand outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'>
													<option value=''>
														Wybierz specjalizację (opcjonalnie)
													</option>
													{specializations.map(s => (
														<option key={s.id} value={s.id}>
															{s.nazwa}
														</option>
													))}
												</select>
												<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
											</div>
										</div>
									</>
								)}
							</div>
							<div className='flex justify-end'>
								<button
									type='submit'
									disabled={isLoading}
									className='flex items-center gap-2 bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-navy/90 transition-all shadow-brand-sm cursor-pointer disabled:opacity-50'>
									{isLoading ? (
										<Loader2 className='w-4 h-4 animate-spin' />
									) : (
										<Save className='w-4 h-4' />
									)}
									Zapisz zmiany
								</button>
							</div>
						</form>
					</section>

					{/* Section 2: Bezpieczeństwo konta */}
					<section className='space-y-2'>
						<div className='flex items-center gap-2'>
							<h3 className='font-bold text-brand-navy uppercase tracking-wider text-sm'>
								Bezpieczeństwo konta
							</h3>
						</div>

						<form onSubmit={handleSavePassword} className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								{/* Obecne hasło */}
								<div className='space-y-2'>
									<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-widest'>
										Obecne hasło
									</label>
									<input
										type='password'
										placeholder='Wpisz aktualne hasło'
										value={passwords.current}
										onChange={e =>
											setPasswords({ ...passwords, current: e.target.value })
										}
										className='w-full h-11 px-4 rounded-xl border border-brand-gray/20 bg-brand-light/30 text-sm focus:ring-2 focus:ring-brand-sand outline-none transition-all'
									/>
								</div>

								{/* Nowe hasło */}
								<div className='space-y-2'>
									<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-widest'>
										Nowe hasło
									</label>
									<input
										type='password'
										placeholder='Wprowadź nowe hasło'
										value={passwords.new}
										onChange={e =>
											setPasswords({ ...passwords, new: e.target.value })
										}
										className='w-full h-11 px-4 rounded-xl border border-brand-gray/20 bg-brand-light/30 text-sm focus:ring-2 focus:ring-brand-sand outline-none transition-all'
									/>
									<PasswordStrength value={passwords.new} />
								</div>

								{/* Powtórz nowe hasło */}
								<div className='space-y-2'>
									<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-widest'>
										Powtórz nowe hasło
									</label>
									<input
										type='password'
										placeholder='Powtórz nowe hasło'
										value={passwords.confirm}
										onChange={e =>
											setPasswords({ ...passwords, confirm: e.target.value })
										}
										className='w-full h-11 px-4 rounded-xl border border-brand-gray/20 bg-brand-light/30 text-sm focus:ring-2 focus:ring-brand-sand outline-none transition-all'
									/>
								</div>
							</div>
							<div className='flex justify-end'>
								<button
									type='submit'
									disabled={isLoading}
									className='flex items-center gap-2 bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-navy/90 transition-all shadow-brand-sm cursor-pointer disabled:opacity-50'>
									{isLoading ? (
										<Loader2 className='w-4 h-4 animate-spin' />
									) : (
										<Shield className='w-4 h-4' />
									)}
									Zmień hasło
								</button>
							</div>
						</form>
					</section>

					{/* Section 3: Konfiguracja pulpitu */}
					<section className='space-y-2'>
						<div className='flex items-center gap-2'>
							<h3 className='font-bold text-brand-navy uppercase tracking-wider text-sm'>
								Konfiguracja pulpitu (Dashboard)
							</h3>
						</div>
						<p className='text-sm text-muted-foreground'>
							Zaznacz widżety i sekcje, które mają być wyświetlane na Twojej
							stronie głównej.
						</p>

						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							<WidgetTile
								label='Moje Kursy'
								checked={widgets.courses}
								onChange={() => toggleWidget('courses')}
							/>
							<WidgetTile
								label='Aktualności'
								checked={widgets.news}
								onChange={() => toggleWidget('news')}
							/>
							<WidgetTile
								label='Plan zajęć (skrót)'
								checked={widgets.timetable}
								onChange={() => toggleWidget('timetable')}
							/>
							<WidgetTile
								label='Wydarzenia'
								checked={widgets.events}
								onChange={() => toggleWidget('events')}
							/>
							<WidgetTile
								label='Ostatnie ogłoszenia'
								checked={widgets.announcements}
								onChange={() => toggleWidget('announcements')}
							/>
						</div>

						<div className='flex justify-end'>
							<button
								onClick={handleSaveWidgets}
								disabled={isLoading}
								className='flex items-center gap-2 bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-navy/90 transition-all shadow-brand-sm cursor-pointer disabled:opacity-50'>
								{isLoading ? (
									<Loader2 className='w-4 h-4 animate-spin' />
								) : (
									<Layout className='w-4 h-4' />
								)}
								Zapisz pulpit
							</button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}

function WidgetTile({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<div
			onClick={onChange}
			className={cn(
				'flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none',
				checked
					? 'bg-brand-light/30 border-brand-sand shadow-sm'
					: 'bg-white border-brand-gray/10 hover:border-brand-gray/30',
			)}>
			<div
				className={cn(
					'w-5 h-5 rounded-lg flex items-center justify-center transition-colors',
					checked
						? 'bg-brand-navy text-brand-light'
						: 'border-2 border-brand-gray/20',
				)}>
				{checked && (
					<svg
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='4'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='w-3 h-3'>
						<polyline points='20 6 9 17 4 12' />
					</svg>
				)}
			</div>
			<span
				className={cn(
					'text-xs font-bold truncate',
					checked ? 'text-brand-navy' : 'text-muted-foreground',
				)}>
				{label}
			</span>
		</div>
	);
}

function PasswordStrength({ value }: { value: string }) {
	const checks = [
		{ label: 'Min. 8 znaków', ok: value.length >= 8 },
		{ label: 'Wielka litera', ok: /[A-Z]/.test(value) },
		{ label: 'Cyfra', ok: /\d/.test(value) },
	];
	if (!value) return null;
	return (
		<div className='flex flex-wrap gap-x-3 gap-y-1 text-[10px] mt-2'>
			{checks.map(c => (
				<span
					key={c.label}
					className={`flex items-center gap-1 ${c.ok ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}`}>
					<CheckCircle2
						className={cn('h-3 w-3', c.ok ? 'opacity-100' : 'opacity-40')}
					/>
					{c.label}
				</span>
			))}
		</div>
	);
}
