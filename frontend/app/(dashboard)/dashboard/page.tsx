'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Users, Clock, ArrowRight, Loader2 } from 'lucide-react';
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
	const isLecturer = user?.role === 'prowadzacy';

	useEffect(() => {
		const abortController = new AbortController();

		const fetchCourses = async () => {
			if (!user) return;
			
			try {
				const data = await api.courses.getUserCourses(user.id);
				
				if (abortController.signal.aborted) return;

				setCourses(data);

				// Optimized: Tasks are now provided directly by the backend
				const tasks: (Material & { courseName: string; courseId: number })[] = [];
				data.forEach(course => {
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

		fetchCourses();

		return () => {
			abortController.abort();
		};
	}, [user?.id]);

	if (isLoading) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader2 className='w-8 h-8 text-brand-sand animate-spin' />
			</div>
		);
	}

	return (
		<div className='space-y-8'>
			{/* Welcome Section */}
			<section className='grid grid-cols-1 sm:grid-cols-2 gap-6 content-end '>
				<div>
					<h1 className='text-3xl font-bold text-brand-navy'>
						Witaj ponownie, {user?.firstName}! 👋
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

			{/* My Courses Section */}
			<section>
				<div className='flex items-center justify-between mb-6'>
					<h2 className='text-xl font-bold text-brand-navy'>Moje Kursy</h2>
					<Link
						href='/courses'
						className='text-sm font-semibold text-brand-navy hover:text-brand-sand transition-colors flex items-center gap-1'>
						Zobacz katalog <ArrowRight className='w-4 h-4' />
					</Link>
				</div>

				{courses.length > 0 ? (
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
						{courses.map(course => (
							<Link
								key={course.id}
								href={`/courses/${course.id}`}
								className='group bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm hover:border-brand-sand transition-all duration-300 flex flex-col overflow-hidden'>
								{course.backgroundImage && (
									<div
										className='absolute inset-0 w-full h-32 -mx-6 -mt-6 mb-4 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity'
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
					<div className='bg-white p-12 rounded-3xl border border-brand-gray/10 text-center space-y-4'>
						<div className='w-16 h-16 bg-brand-light rounded-full flex items-center justify-center text-brand-navy mx-auto'>
							<BookOpen className='w-8 h-8' />
						</div>
						<p className='text-brand-navy font-bold'>
							Nie należysz jeszcze do żadnego kursu.
						</p>
						<Link
							href='/courses'
							className='inline-block bg-brand-sand text-brand-navy px-6 py-2 rounded-xl text-sm font-bold shadow-brand-sm'>
							Przejdź do katalogu
						</Link>
					</div>
				)}
			</section>
		</div>
	);
}
