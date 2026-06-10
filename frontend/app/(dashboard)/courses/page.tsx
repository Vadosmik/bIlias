'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
	Search,
	Filter,
	PlusCircle,
	CheckCircle2,
	User,
	Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, Course } from '@/lib/api';
import Link from 'next/link';

const semesters = ['Wszystkie', '1', '2', '3', '4', '5', '6', '7', '8'];

export default function CoursesPage() {
	const { user } = useAuth();
	const [courses, setCourses] = useState<Course[]>([]);
	const [departments, setDepartments] = useState<string[]>([
		'Wszystkie Wydziały',
	]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedDept, setSelectedDept] = useState('Wszystkie Wydziały');
	const [selectedSem, setSelectedSem] = useState(
		user?.semester?.toString() || semesters[0],
	);
	const [joiningId, setJoiningId] = useState<number | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [coursesData, deptsData] = await Promise.all([
					api.courses.getAll(user?.id),
					api.dictionaries.getDepartments(),
				]);

				setCourses(coursesData);
				setDepartments([
					'Wszystkie Wydziały',
					...deptsData.map((d: any) => d.nazwa),
				]);

				// Fetch profile to get latest department name from DB
				if (user?.id) {
					const profile = await api.profile.get(user.id);
					if (profile.academic?.wydzial_nazwa) {
						setSelectedDept(profile.academic.wydzial_nazwa);
					} else if (user?.department) {
						setSelectedDept(user.department);
					}
				}
			} catch (err) {
				console.error('Failed to fetch courses data:', err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [user]);

	const handleJoin = async (id: number) => {
		if (!user) return;
		setJoiningId(id);
		const success = await api.courses.join(id, user.id);
		if (success) {
			setCourses(prev =>
				prev.map(c => (c.id === id ? { ...c, joined: true } : c)),
			);
		}
		setJoiningId(null);
	};

	const filteredCourses = useMemo(() => {
		return courses.filter(course => {
			const matchesSearch =
				course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.code.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesDept =
				selectedDept === departments[0] || course.department === selectedDept;
			const matchesSem =
				selectedSem === semesters[0] ||
				course.semester.toString() === selectedSem;

			return matchesSearch && matchesDept && matchesSem;
		});
	}, [courses, searchQuery, selectedDept, selectedSem]);

	if (isLoading) {
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
				<h1 className='text-3xl font-bold text-brand-navy'>Katalog Kursów</h1>
				<p className='text-muted-foreground mt-2'>
					Przeglądaj i dołączaj do dostępnych kursów na Twoim wydziale.
				</p>
			</section>

			{/* Filters Bar */}
			<div className='bg-white p-4 rounded-2xl border border-brand-gray/10 shadow-brand-sm flex flex-col md:flex-row gap-4 items-center'>
				{/* Search */}
				<div className='relative flex-1 w-full'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
					<input
						type='text'
						placeholder='Szukaj kursu po nazwie lub kodzie...'
						className='pl-10 pr-4 py-2.5 w-full bg-brand-light rounded-xl text-sm border-none focus:ring-2 focus:ring-brand-sand transition-all'
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
					/>
				</div>

				{/* Department Select */}
				<div className='flex items-center gap-2 w-full md:w-auto'>
					<Filter className='w-4 h-4 text-muted-foreground' />
					<select
						className='bg-brand-light border-none rounded-xl text-sm py-2.5 px-4 focus:ring-2 focus:ring-brand-sand w-full'
						value={selectedDept}
						onChange={e => setSelectedDept(e.target.value)}>
						{departments.map(dept => (
							<option key={dept} value={dept}>
								{dept}
							</option>
						))}
					</select>
				</div>

				{/* Semester Select */}
				<select
					className='bg-brand-light border-none rounded-xl text-sm py-2.5 px-4 focus:ring-2 focus:ring-brand-sand w-full md:w-32'
					value={selectedSem}
					onChange={e => setSelectedSem(e.target.value)}>
					<option value='Wszystkie'>Semestr: All</option>
					{semesters.slice(1).map(sem => (
						<option key={sem} value={sem}>
							Semestr {sem}
						</option>
					))}
				</select>
			</div>

			{/* Courses List */}
			<div className='bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden'>
				<table className='w-full text-left border-collapse'>
					<thead>
						<tr className='border-b border-brand-gray/5 bg-brand-light/50'>
							<th className='px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
								Kurs
							</th>
							<th className='px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell'>
								Wydział
							</th>
							<th className='px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center'>
								Semestr
							</th>
							<th className='px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
								Prowadzący
							</th>
							<th className='px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right'>
								Akcja
							</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-brand-gray/5'>
						{filteredCourses.length > 0 ? (
							filteredCourses.map(course => (
								<tr
									key={course.id}
									className='hover:bg-brand-light/30 transition-colors group'>
									<td className='px-6 py-5'>
										<div className='flex flex-col'>
											<span className='text-[10px] font-bold text-brand-sand'>
												{course.code}
											</span>
											{course.joined ? (
												<Link
													href={`/courses/${course.id}`}
													className='font-bold text-brand-navy hover:text-brand-sand transition-colors'>
													{course.name}
												</Link>
											) : (
												<span className='font-bold text-brand-navy'>
													{course.name}
												</span>
											)}
										</div>
									</td>
									<td className='px-6 py-5 text-sm text-muted-foreground hidden lg:table-cell'>
										{course.department}
									</td>
									<td className='px-6 py-5 text-sm text-center font-semibold text-brand-navy'>
										{course.semester}
									</td>
									<td className='px-6 py-5'>
										<div className='flex flex-col gap-1'>
											{course.lecturers.map(lecturer => (
												<div
													key={lecturer}
													className='flex items-center gap-1.5 text-sm text-muted-foreground'>
													<User className='w-3 h-3' />
													{lecturer}
												</div>
											))}
										</div>
									</td>
									<td className='px-6 py-5 text-right'>
										{course.joined ? (
											<div className='inline-flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg border border-green-100'>
												<CheckCircle2 className='w-4 h-4' />
												Dołączono
											</div>
										) : (
											<button
												onClick={() => handleJoin(course.id)}
												disabled={joiningId === course.id}
												className='inline-flex items-center gap-1.5 bg-brand-sand text-brand-navy font-bold text-sm px-4 py-2 rounded-lg hover:scale-105 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100'>
												{joiningId === course.id ? (
													<Loader2 className='w-4 h-4 animate-spin' />
												) : (
													<PlusCircle className='w-4 h-4' />
												)}
												Dołącz
											</button>
										)}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={5}
									className='px-6 py-12 text-center text-muted-foreground italic'>
									Nie znaleziono kursów spełniających Twoje kryteria.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
