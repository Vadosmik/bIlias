'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
	BookOpen,
	Users,
	Clock,
	ArrowRight,
	Loader2,
	Megaphone,
	CalendarDays,
	BellRing,
	Zap,
	Calendar,
	ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { api, Course, Material } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export default function DashboardPage() {
	const { user } = useAuth();
	const [courses, setCourses] = useState<Course[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
	const [allTasks, setAllTasks] = useState<
		(Material & { courseName: string; courseId: number })[]
	>([]);
	const [widgets, setWidgets] = useState({
		courses: true,
		news: true,
		timetable: true,
		events: true,
		announcements: true,
	});

	const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
	const [isTimetableLoading, setIsTimetableLoading] = useState(true);

	const isLecturer = user?.role === 'prowadzacy';

	useEffect(() => {
		const abortController = new AbortController();

		const fetchDashboardData = async () => {
			if (!user) return;

			try {
				const [coursesData, profileData] = await Promise.all([
					api.courses.getUserCourses(user.id),
					api.profile.get(user.id).catch(() => null),
				]);

				if (abortController.signal.aborted) return;

				setCourses(coursesData);

				if (profileData && profileData.ustawienia_dashboard) {
					const s = profileData.ustawienia_dashboard;
					setWidgets({
						courses: s[0] === '1',
						news: s[1] === '1',
						timetable: s[2] === '1',
						events: s[3] === '1',
						announcements: s[4] === '1',
					});
				}

				const isTeacher = user.role === 'prowadzacy' || user.role === 'teacher';
				let timetableFilters: any = null;
				
				if (isTeacher) {
					timetableFilters = { prowadzacyId: user.id.toString() };
				} else if (profileData?.academic?.wydzial_id && profileData?.academic?.kierunek_id) {
					timetableFilters = {
						wydzialId: profileData.academic.wydzial_id.toString(),
						kierunekId: profileData.academic.kierunek_id.toString(),
						specjalizacjaId: profileData.academic.specjalizacja_id ? profileData.academic.specjalizacja_id.toString() : ''
					};
				}

				if (timetableFilters) {
					api.timetable
						.getAll(timetableFilters)
						.then(data => {
							if (abortController.signal.aborted) return;

							const todayId = new Date().getDay(); // 1 = Mon, 5 = Fri
							if (todayId >= 1 && todayId <= 5) {
								const mapped = data
									.filter((t: any) => t.dzienId === todayId)
									.map((entry: any) => {
										// format from backend is 'HH:MM:SS' or number
										const startParts =
											typeof entry.godzinaOd === 'string'
												? entry.godzinaOd.split(':')
												: ['00', '00'];
										const endParts =
											typeof entry.godzinaDo === 'string'
												? entry.godzinaDo.split(':')
												: ['00', '00'];
										return {
											id: entry.id,
											subject: entry.kurs?.nazwa || 'Nieznany przedmiot',
											type: entry.typZajec,
											room: entry.sala ? `${entry.sala.numer}` : 'Brak sali',
											instructor: entry.prowadzacy
												? `${entry.prowadzacy.imie} ${entry.prowadzacy.nazwisko}`
												: 'Brak prowadzącego',
											startHour: `${startParts[0]}:${startParts[1]}`,
											endHour: `${endParts[0]}:${endParts[1]}`,
											sortVal:
												parseInt(startParts[0]) * 60 +
												parseInt(startParts[1]),
											color:
												entry.typZajec === 'laboratorium'
													? 'language'
													: entry.typZajec === 'wyklad'
														? 'blue'
														: 'default',
										};
									})
									.sort((a: any, b: any) => a.sortVal - b.sortVal);

								setTodayTimetable(mapped);
							}
							setIsTimetableLoading(false);
						})
						.catch(err => {
							console.error('Failed to load timetable:', err);
							setIsTimetableLoading(false);
						});
				} else {
					setIsTimetableLoading(false);
				}

				// Generate tasks logic
				const tasks: (Material & { courseName: string; courseId: number })[] =
					[];
				coursesData.forEach(course => {
					if (course.pendingTasks) {
						course.pendingTasks.forEach(task => {
							tasks.push({
								...task,
								courseName: course.name,
								courseId: course.id,
							});
						});
					}
				});

				setAllTasks(tasks);
				setIsLoading(false);
			} catch (err) {
				if (!abortController.signal.aborted) {
					console.error('Failed to fetch dashboard data:', err);
					setIsLoading(false);
				}
			}
		};

		fetchDashboardData();

		return () => {
			abortController.abort();
		};
	}, [user?.id]);

	if (isLoading) {
		return (
			<div className='flex h-[70vh] items-center justify-center'>
				<Loader2 className='w-10 h-10 text-brand-sand animate-spin' />
			</div>
		);
	}

	return (
		<div className='space-y-10 animate-in fade-in duration-500 pb-12'>
			{/* Welcome Section */}
			<section className='grid grid-cols-1 sm:grid-cols-2 gap-6 content-end'>
				<div>
					<h1 className='text-3xl font-bold text-brand-navy'>
						Witaj ponownie, {user?.firstName}!
					</h1>
					<p className='text-muted-foreground mt-2'>
						{isLecturer
							? `Prowadzisz ${courses.length} kursów w tym semestrze.`
							: `Masz ${courses.length} aktywnych kursów w tym semestrze.`}
					</p>
				</div>

				{!isLecturer && (
					<div
						onClick={() => setIsTasksModalOpen(true)}
						className='cursor-pointer hover:border-brand-sand transition-colors group w-full flex justify-end items-center gap-3'>
						<p className='text-m font-medium text-muted-foreground'>
							Zadania do oddania
						</p>
						<p className='text-2xl font-bold text-brand-navy'>
							{allTasks.length}
						</p>
						<div className='w-12 h-12 rounded-xl flex items-center justify-center text-brand-navy hover:text-brand-sand transition-text duration-300'>
							<Clock className='w-6 h-6' />
						</div>
					</div>
				)}
			</section>

			{/* Tasks Modal */}
			<Modal
				isOpen={isTasksModalOpen}
				onClose={() => setIsTasksModalOpen(false)}
				title='Wszystkie nadchodzące zadania'>
				<div className='space-y-4'>
					{allTasks.length > 0 ? (
						allTasks.map(task => (
							<Link
								key={task.id}
								href={`/courses/${task.courseId}`}
								className='flex items-center justify-between p-4 rounded-2xl border border-brand-gray/10 hover:border-brand-sand hover:bg-brand-light/30 transition-all group'>
								<div className='flex items-center gap-4'>
									<div className='w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600'>
										<Clock className='w-5 h-5' />
									</div>
									<div>
										<p className='text-[10px] font-bold text-brand-sand uppercase tracking-tighter'>
											{task.courseName}
										</p>
										<p className='font-bold text-brand-navy group-hover:text-brand-sand transition-colors'>
											{task.name}
										</p>
										<p className='text-xs text-orange-600 font-medium'>
											Termin: {task.deadline}
										</p>
									</div>
								</div>
								<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-brand-navy transition-all' />
							</Link>
						))
					) : (
						<div className='py-12 text-center'>
							<p className='text-muted-foreground italic text-sm'>
								Brak aktywnych zadań do oddania.
							</p>
						</div>
					)}
				</div>
			</Modal>

			{/* 1. Ostatnie Ogłoszenia (Mockup Carousel 1x3) */}
			{widgets.announcements && (
				<section>
					<div className='flex items-center gap-2 mb-6'>
						<h2 className='text-xl font-bold text-brand-navy'>
							Ostatnie ogłoszenia
						</h2>
					</div>
					<div className='flex overflow-x-auto gap-6 snap-x pb-4 custom-scrollbar'>
						{[1, 2, 3, 4].map((_, i) => (
							<div
								key={i}
								className='bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm hover:border-brand-sand transition-all duration-300 cursor-pointer group min-w-[300px] max-w-[350px] shrink-0 snap-center relative'>
								<span className='text-[10px] font-bold bg-brand-navy/5 text-brand-navy px-2 py-1 rounded-md uppercase tracking-wider mb-4 inline-block'>
									Dziekanat
								</span>
								<h3 className='font-bold text-brand-navy mb-2 group-hover:text-brand-sand transition-colors'>
									Przerwa rektorska - Dni Morza
								</h3>
								<p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
									Informujemy, że w związku z nadchodzącymi obchodami Święta
									Uczelni (Dni Morza), w dniu 15 czerwca br. ustala się godziny
									dziekańskie...
								</p>
							</div>
						))}
					</div>
				</section>
			)}

			{/* 2. Moje Kursy (Carousel) */}
			{widgets.courses && (
				<section>
					<div className='flex items-center justify-between mb-6'>
						<div className='flex items-center gap-2'>
							<h2 className='text-xl font-bold text-brand-navy'>Moje Kursy</h2>
						</div>
						<Link
							href='/courses'
							className='text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand-navy transition-colors flex items-center gap-1'>
							Wszystkie kursy <ArrowRight className='w-3 h-3' />
						</Link>
					</div>

					{courses.length > 0 ? (
						<div className='flex overflow-x-auto gap-6 snap-x pb-4 custom-scrollbar'>
							{courses.map(course => (
								<Link
									key={course.id}
									href={`/courses/${course.id}`}
									className='group bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm hover:border-brand-sand transition-all duration-300 flex flex-col overflow-hidden min-w-[320px] md:min-w-[400px] shrink-0 snap-center relative'>
									{course.backgroundImage && (
										<div
											className='absolute inset-0 w-full h-32 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity'
											style={{
												backgroundImage: `url(${course.backgroundImage})`,
											}}
										/>
									)}
									<div className='relative flex justify-between items-start mb-4'>
										<div>
											<span className='text-[10px] uppercase tracking-widest font-bold text-brand-sand mb-1 block'>
												{course.code}
											</span>
											<h3 className='text-lg font-bold text-brand-navy group-hover:text-brand-sand transition-colors'>
												{course.name}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{course.lecturers[0]}
											</p>
										</div>
										<div className='w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-navy group-hover:text-brand-light group-hover:bg-brand-sand transition-colors'>
											<ArrowRight className='w-5 h-5' />
										</div>
									</div>

									{/* Course Card */}
									<div className='mt-auto pt-6 border-t border-brand-gray/5'>
										<div className='flex items-center justify-between text-xs'>
											<span className='font-medium text-muted-foreground'>
												{course.materialsCount || 0} materiałów
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className='bg-brand-light/30 p-12 rounded-3xl border border-dashed border-brand-gray/20 text-center'>
							<div className='w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center text-brand-sand mx-auto mb-4'>
								<BookOpen className='w-8 h-8' />
							</div>
							<p className='text-brand-navy font-bold mb-4'>
								Nie należysz jeszcze do żadnego kursu.
							</p>
							<Link
								href='/courses'
								className='inline-block bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm hover:bg-brand-sand transition-colors'>
								Przejdź do katalogu
							</Link>
						</div>
					)}
				</section>
			)}

			{/* 3. Aktualności i Wydarzenia (2 columns, scrollable) */}
			{(widgets.news || widgets.events) && (
				<section className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{widgets.news && (
						<div className='flex flex-col bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden'>
							<div className='p-6 border-b border-brand-gray/5 flex items-center gap-2 bg-brand-light/30'>
								<Zap className='w-5 h-5 text-brand-sand' />
								<h2 className='text-lg font-bold text-brand-navy'>
									Aktualności Uczelniane
								</h2>
							</div>
							<div className='p-6 h-[400px] overflow-y-auto space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-brand-gray/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-gray/40'>
								{[1, 2, 3, 4, 5].map((_, i) => (
									<div
										key={i}
										className='p-4 rounded-xl border border-brand-gray/10 hover:border-brand-sand transition-colors cursor-pointer group'>
										<p className='text-[10px] font-bold text-brand-sand uppercase tracking-wider mb-1'>
											Dzisiaj, 09:30
										</p>
										<h3 className='font-bold text-brand-navy text-sm mb-1 group-hover:text-brand-sand transition-colors'>
											Rozpoczęcie rekrutacji na wyjazdy Erasmus+
										</h3>
										<p className='text-xs text-muted-foreground line-clamp-2'>
											Dział Współpracy Międzynarodowej ogłasza nabór wniosków na
											studia częściowe oraz praktyki w ramach programu Erasmus+
											na rok akademicki...
										</p>
									</div>
								))}
							</div>
						</div>
					)}
					{widgets.events && (
						<div className='flex flex-col bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden'>
							<div className='p-6 border-b border-brand-gray/5 flex items-center gap-2 bg-brand-light/30'>
								<CalendarDays className='w-5 h-5 text-brand-sand' />
								<h2 className='text-lg font-bold text-brand-navy'>
									Wydarzenia
								</h2>
							</div>
							<div className='p-6 h-[400px] overflow-y-auto space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-brand-gray/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-gray/40'>
								{[1, 2, 3, 4].map((_, i) => (
									<div
										key={i}
										className='flex items-start gap-4 p-4 rounded-xl border border-brand-gray/10 hover:border-brand-sand transition-colors cursor-pointer group'>
										<div className='w-14 h-14 rounded-xl bg-brand-light border border-brand-gray/10 flex flex-col items-center justify-center flex-shrink-0'>
											<span className='text-[10px] font-bold text-brand-sand uppercase tracking-widest'>
												Cze
											</span>
											<span className='text-lg font-black text-brand-navy leading-none'>
												{14 + i}
											</span>
										</div>
										<div>
											<h3 className='font-bold text-brand-navy text-sm mb-1 group-hover:text-brand-sand transition-colors'>
												Targi Pracy i Praktyk
											</h3>
											<p className='text-xs text-muted-foreground'>
												Budynek Główny UMG, godz. 10:00 - 14:00
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</section>
			)}

			{/* 4. Plan Zajęć (Dzisiaj - Mockup w stylu Timetable) */}
			{widgets.timetable && (
				<section>
					<div className='flex items-center justify-between mb-6'>
						<div className='flex items-center gap-2'>
							<h2 className='text-xl font-bold text-brand-navy'>
								Twój plan na dzisiaj
							</h2>
						</div>
						<Link
							href='/timetable'
							className='text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand-navy transition-colors flex items-center gap-1'>
							Pełny plan <ArrowRight className='w-3 h-3' />
						</Link>
					</div>

					<div className='bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden relative p-6'>
						<div className='flex flex-col gap-4'>
							{isTimetableLoading ? (
								<div className='py-8 flex justify-center items-center'>
									<Loader2 className='w-8 h-8 text-brand-sand animate-spin' />
								</div>
							) : todayTimetable.length > 0 ? (
								todayTimetable.map(item => {
									const colorClasses =
										item.color === 'language'
											? 'bg-[#D4E8DC]/30 text-brand-navy border-[#D4E8DC] border-2'
											: item.color === 'blue'
												? 'bg-[#D6E8F5]/30 text-brand-navy border-[#D6E8F5] border-2'
												: 'bg-[#EAE3D6]/30 text-brand-navy border-[#EAE3D6] border-2';

									return (
										<div key={item.id} className='flex items-center gap-6'>
											<div className='flex flex-col items-center justify-center w-16 shrink-0'>
												<span className='font-bold text-brand-navy'>
													{item.startHour}
												</span>
												<span className='text-xs text-muted-foreground font-medium'>
													{item.endHour}
												</span>
											</div>

											{/* Class Card style */}
											<div
												className={cn(
													'flex-1 flex flex-col p-4 rounded-xl justify-center items-center border',
													colorClasses,
												)}>
												<div className='flex gap-1 text-[10px] mb-1'>
													<span className='font-bold text-brand-sand capitalize'>
														{item.type}
													</span>
												</div>
												<div
													className='text-sm font-bold text-center'
													title={item.subject}>
													{item.subject}
												</div>
												<div className='flex gap-1 text-[10px] mt-1'>
													<span className='text-muted-foreground font-medium'>
														{item.room}
													</span>
													<span className='text-muted-foreground font-medium'>
														{' '}
														-{' '}
													</span>
													<span className='text-muted-foreground font-medium'>
														{item.instructor}
													</span>
												</div>
											</div>
										</div>
									);
								})
							) : (
								<div className='flex items-center gap-6 opacity-60'>
									<div className='flex-1 border border-dashed border-brand-gray/20 rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground italic text-xs'>
										<Calendar className='w-6 h-6 mb-2 text-brand-gray/40' />
										<span>Nie masz dzisiaj żadnych zaplanowanych zajęć</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
