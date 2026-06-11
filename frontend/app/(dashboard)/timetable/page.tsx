'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ClassData {
	id: number;
	subject: string;
	type: string;
	room: string;
	instructor: string;
	note?: string;
	day: number; // 1-5 (Mon-Fri)
	startHour: number; // 7-20
	duration: number; // hours
	color: 'default' | 'language' | 'blue';
}

const ClassCard = ({ data }: { data: ClassData }) => {
	const colorStyles = {
		default: 'bg-[#EAE3D6] text-brand-navy',
		language: 'bg-[#D4E8DC] text-brand-navy',
		blue: 'bg-[#D6E8F5] text-brand-navy',
	};

	return (
		<div
			className={cn(
				'absolute inset-x-1 top-1 z-10 flex flex-col p-2 rounded-xl justify-center items-center',
				colorStyles[data.color],
			)}
			style={{
				height: `calc(${data.duration * 60}px - 8px)`,
			}}>
			<div className='flex gap-1 text-[10px]'>
				<span className='font-bold text-brand-sand'>{data.type}</span>
			</div>
			<div className='text-xs font-bold text-center' title={data.subject}>
				{data.subject}
			</div>
			<div className='flex gap-1 text-[10px]'>
				<span className='text-muted-foreground font-medium'>{data.room}</span>
				<span className='text-muted-foreground font-medium'> - </span>
				<span className='text-muted-foreground font-medium'>
					{data.instructor}
				</span>
			</div>
		</div>
	);
};

export default function TimetablePage() {
	const { user } = useAuth();

	// Data states
	const [timetable, setTimetable] = useState<ClassData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Dictionary states
	const [departments, setDepartments] = useState<any[]>([]);
	const [courses, setCourses] = useState<any[]>([]);
	const [specializations, setSpecializations] = useState<any[]>([]);
	const [instructors, setInstructors] = useState<any[]>([]);
	const [rooms, setRooms] = useState<any[]>([]);

	// Filter states
	const [filters, setFilters] = useState({
		search: '',
		wydzialId: '',
		kierunekId: '',
		specjalizacjaId: '',
		prowadzacyId: '',
		salaId: '',
	});

	// Derived data for display (filtered by search query if needed)
	const displayedTimetable = useMemo(() => {
		if (!filters.search) return timetable;
		const query = filters.search.toLowerCase();
		return timetable.filter(
			c =>
				c.subject.toLowerCase().includes(query) ||
				c.instructor.toLowerCase().includes(query) ||
				c.room.toLowerCase().includes(query),
		);
	}, [timetable, filters.search]);

	// Load initial dictionaries
	useEffect(() => {
		const loadDictionaries = async () => {
			try {
				const [depts, instrs, rms] = await Promise.all([
					api.dictionaries.getDepartments(),
					api.dictionaries.getInstructors(),
					api.dictionaries.getRooms(),
				]);
				setDepartments(depts);
				setInstructors(instrs);
				setRooms(rms);

				// Pre-select user's department or instructor if available
				if (user?.id) {
					const isTeacher = user.role === 'prowadzacy' || user.role === 'teacher';
					let initialFilters: any = {};
					
					if (isTeacher) {
						initialFilters.prowadzacyId = user.id.toString();
					}

					try {
						const profile = await api.profile.get(user.id);
						if (profile.academic?.wydzial_id) {
							initialFilters.wydzialId = profile.academic.wydzial_id.toString();

							// Load courses for this department
							const coursesData = await api.dictionaries.getCourses(
								profile.academic.wydzial_id,
							);
							setCourses(coursesData);

							if (profile.academic.kierunek_id) {
								initialFilters.kierunekId = profile.academic.kierunek_id.toString();
								const specsData = await api.dictionaries.getSpecializations(
									profile.academic.kierunek_id,
								);
								setSpecializations(specsData);

								if (profile.academic.specjalizacja_id) {
									initialFilters.specjalizacjaId = profile.academic.specjalizacja_id.toString();
								}
							}
						}
					} catch (e) {
						console.error('Failed to load academic profile details', e);
					}
					
					setFilters(prev => ({
						...prev,
						...initialFilters
					}));
				}
			} catch (err) {
				console.error('Failed to load timetable dictionaries:', err);
			}
		};
		loadDictionaries();
	}, [user?.id]);

	// Fetch timetable data when filters change
	useEffect(() => {
		let isMounted = true;
		
		const fetchTimetable = async () => {
			const isGroupPathComplete = filters.wydzialId && filters.kierunekId && (specializations.length === 0 || filters.specjalizacjaId);
			const canShowData = isGroupPathComplete || !!filters.prowadzacyId || !!filters.salaId;

			if (!canShowData) {
				setTimetable([]);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			try {
				const data = await api.timetable.getAll(filters);
				if (!isMounted) return;
				
				// Map backend data to frontend ClassData interface
				const mapped: ClassData[] = data.map((entry: any) => {
					// Parse PostgreSQL TIME strings ("HH:MM:SS") to hour numbers
					const parseHour = (time: string): number => {
						if (typeof time === 'number') return time;
						return parseInt(time.split(':')[0], 10);
					};
					const startH = parseHour(entry.godzinaOd);
					const endH = parseHour(entry.godzinaDo);

					return {
						id: entry.id,
						subject: entry.kurs?.nazwa || 'Nieznany przedmiot',
						type: entry.typZajec,
						room: entry.sala ? `${entry.sala.numer}` : 'Brak sali',
						instructor: entry.prowadzacy
							? `${entry.prowadzacy.imie} ${entry.prowadzacy.nazwisko}`
							: 'Brak prowadzącego',
						day: entry.dzienId,
						startHour: startH,
						duration: endH - startH,
						color:
							entry.typZajec === 'laboratorium'
								? 'language'
								: entry.typZajec === 'wyklad'
									? 'blue'
									: 'default',
						note: entry.grupaOznaczenie
							? `Grupa: ${entry.grupaOznaczenie}`
							: undefined,
					};
				});
				setTimetable(mapped);
			} catch (err) {
				if (!isMounted) return;
				console.error('Failed to fetch timetable:', err);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};
		fetchTimetable();
		
		return () => {
			isMounted = false;
		};
	}, [
		filters.wydzialId,
		filters.kierunekId,
		filters.specjalizacjaId,
		filters.prowadzacyId,
		filters.salaId,
		specializations.length,
	]);

	const handleWydzialChange = async (id: string) => {
		setFilters({
			...filters,
			wydzialId: id,
			kierunekId: '',
			specjalizacjaId: '',
		});
		setCourses([]);
		setSpecializations([]);
		if (id) {
			const data = await api.dictionaries.getCourses(Number(id));
			setCourses(data);
		}
	};

	const handleKierunekChange = async (id: string) => {
		setFilters({ ...filters, kierunekId: id, specjalizacjaId: '' });
		setSpecializations([]);
		if (id) {
			const data = await api.dictionaries.getSpecializations(Number(id));
			setSpecializations(data);
		}
	};

	const canShowData = 
		(filters.wydzialId && filters.kierunekId && (specializations.length === 0 || filters.specjalizacjaId)) || 
		!!filters.prowadzacyId || 
		!!filters.salaId;

	return (
		<div className='space-y-8'>
			{/* Page Header */}
			<section>
				<h1 className='text-3xl font-bold text-brand-navy'>Plany zajęć</h1>
				<p className='text-muted-foreground mt-2'>
					Przeglądaj plany zajęć dostępne dla różnych grup studenckich,
					prowadzących oraz sprawdź dostępność sal.
				</p>
			</section>

			{/* Filters Bar */}
			<div className='bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					{/* Wydział Select */}
					<div className='space-y-1.5'>
						<label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
							Wydział
						</label>
						<div className='relative'>
							<select
								value={filters.wydzialId}
								onChange={e => handleWydzialChange(e.target.value)}
								className='bg-brand-light border-none rounded-xl text-sm py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-brand-sand w-full appearance-none cursor-pointer transition-all'>
								<option value=''>Wszystkie Wydziały</option>
								{departments.map(d => (
									<option key={d.id} value={d.id}>
										{d.nazwa}
									</option>
								))}
							</select>
							<ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						</div>
					</div>

					{/* Kierunek Select */}
					<div className='space-y-1.5'>
						<label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
							Kierunek
						</label>
						<div className='relative'>
							<select
								value={filters.kierunekId}
								disabled={!filters.wydzialId}
								onChange={e => handleKierunekChange(e.target.value)}
								className='bg-brand-light border-none rounded-xl text-sm py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-brand-sand w-full appearance-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
								<option value=''>Wszystkie Kierunki</option>
								{courses.map(c => (
									<option key={c.id} value={c.id}>
										{c.nazwa}
									</option>
								))}
							</select>
							<ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						</div>
					</div>

					{/* Specjalizacja Select */}
					<div className='space-y-1.5'>
						<label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
							Specjalizacja
						</label>
						<div className='relative'>
							<select
								value={filters.specjalizacjaId}
								disabled={!filters.kierunekId}
								onChange={e =>
									setFilters({ ...filters, specjalizacjaId: e.target.value })
								}
								className='bg-brand-light border-none rounded-xl text-sm py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-brand-sand w-full appearance-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
								<option value=''>Wszystkie Specjalizacje</option>
								{specializations.map(s => (
									<option key={s.id} value={s.id}>
										{s.nazwa}
									</option>
								))}
							</select>
							<ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						</div>
					</div>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-brand-gray/5'>
					{/* Prowadzący Select */}
					<div className='space-y-1.5'>
						<label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
							Prowadzący
						</label>
						<div className='relative'>
							<select
								value={filters.prowadzacyId}
								onChange={e =>
									setFilters({ ...filters, prowadzacyId: e.target.value })
								}
								className='bg-brand-light border-none rounded-xl text-sm py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-brand-sand w-full appearance-none cursor-pointer transition-all'>
								<option value=''>Wszyscy Prowadzący</option>
								{instructors.map(i => (
									<option key={i.id} value={i.id}>
										{i.nazwisko} {i.imie}
									</option>
								))}
							</select>
							<ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						</div>
					</div>

					{/* Sala Select */}
					<div className='space-y-1.5'>
						<label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
							Sala
						</label>
						<div className='relative'>
							<select
								value={filters.salaId}
								onChange={e =>
									setFilters({ ...filters, salaId: e.target.value })
								}
								className='bg-brand-light border-none rounded-xl text-sm py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-brand-sand w-full appearance-none cursor-pointer transition-all'>
								<option value=''>Wszystkie Sale</option>
								{rooms.map(r => (
									<option key={r.id} value={r.id}>
										{r.budynek} {r.numer}
									</option>
								))}
							</select>
							<ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						</div>
					</div>
				</div>
			</div>

			{/* Schedule Grid */}
			<div className='overflow-x-auto rounded-2xl border border-brand-gray/10 bg-white shadow-brand-sm relative min-h-[400px]'>
				{isLoading && (
					<div className='absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-[1px]'>
						<Loader2 className='w-8 h-8 text-brand-sand animate-spin' />
					</div>
				)}

				{!isLoading && !canShowData && (
					<div className='absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8'>
						<div className='w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4'>
							<Filter className='w-8 h-8 text-brand-sand' />
						</div>
						<h3 className='text-lg font-bold text-brand-navy'>
							Wybierz filtry, aby wyświetlić plan
						</h3>
						<p className='text-muted-foreground max-w-xs mt-2'>
							Wybierz wydział, kierunek oraz specjalizację, lub wyszukaj konkretnego prowadzącego lub salę.
						</p>
					</div>
				)}

				<table
					className={cn(
						'w-full min-w-[800px] border-collapse transition-opacity duration-300',
						!canShowData
							? 'opacity-20 pointer-events-none grayscale-[0.5]'
							: 'opacity-100',
					)}>
					<thead>
						<tr className='bg-brand-gray/10 border-b border-brand-gray/20'>
							<th className='w-[60px] py-4 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
								Godzina
							</th>
							{['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'].map(
								(day, idx) => (
									<th
										key={day}
										className='border-l border-white/10 px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
										{day}
									</th>
								),
							)}
							<th className='w-[60px] border-l border-white/10 py-4 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
								Godzina
							</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-brand-gray/5 '>
						{Array.from({ length: 14 }, (_, i) => {
							const startHour = i + 7;
							const endHour = startHour + 1;
							const timeRange = `${startHour}-${endHour}`;

							return (
								<tr key={startHour} className='h-[60px] border-brand-gray/20'>
									{/* Left Time Label */}
									<td className='bg-brand-light/20 p-2 text-center align-middle'>
										<span className='inline-block px-3 py-1 text-sm font-base text-muted-foreground/70 uppercase tracking-tighter'>
											{timeRange}
										</span>
									</td>

									{/* Day Cells */}
									{[1, 2, 3, 4, 5].map(dayId => (
										<td
											key={dayId}
											className='relative border-l border-brand-gray/20 p-0'>
											{canShowData && displayedTimetable
												.filter(
													c => c.day === dayId && c.startHour === startHour,
												)
												.map(c => (
													<ClassCard key={c.id} data={c} />
												))}
										</td>
									))}

									{/* Right Time Label */}
									<td className='border-l border-brand-gray/20 bg-brand-light/20 p-2 text-center align-middle'>
										<span className='inline-block px-3 py-1 text-sm font-base text-muted-foreground/70 uppercase tracking-tighter'>
											{timeRange}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
