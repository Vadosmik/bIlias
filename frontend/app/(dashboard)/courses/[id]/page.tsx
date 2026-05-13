'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
	Folder,
	FileText,
	MoreVertical,
	Plus,
	Upload,
	FolderPlus,
	FileCode,
	FileArchive,
	Download,
	Pencil,
	Trash2,
	Move,
	AlertCircle,
	Loader2,
	Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { api, Course, Material } from '@/lib/api';

export default function CourseDetailsPage() {
	const { id } = useParams();
	const { user } = useAuth();
	const [course, setCourse] = useState<Course | null>(null);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [openFolders, setOpenFolders] = useState<number[]>([]);
	const [selectedTask, setSelectedTask] = useState<Material | null>(null);
	const [editingItem, setEditingItem] = useState<Material | null>(null);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
	const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
	const [uploadType, setUploadType] = useState<'file' | 'task'>('file');
	const [newFolderName, setNewFolderName] = useState('');
	const [submittedFiles, setSubmittedFiles] = useState<File[]>([]);
	const [taskDetails, setTaskDetails] = useState({
		title: '',
		description: '',
		deadline: '',
	});

	// Mock submissions for a task
	const mockSubmissions = [
		{
			id: 1,
			student: 'Jan Kowalski',
			date: '2024-05-12 14:20',
			files: ['rozwiazanie.zip', 'dokumentacja.pdf'],
		},
		{
			id: 2,
			student: 'Anna Nowak',
			date: '2024-05-13 09:15',
			files: ['projekt.rar'],
		},
		{
			id: 3,
			student: 'Piotr Wiśniewski',
			date: '2024-05-13 18:45',
			files: ['lab1_final.zip'],
		},
	];
	const isLecturer = user?.role === 'teacher';

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setSubmittedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
		}
	};

	const removeFile = (index: number) => {
		setSubmittedFiles(prev => prev.filter((_, i) => i !== index));
	};

	useEffect(() => {
		const fetchCourse = async () => {
			if (!id) return;
			try {
				const data = await api.courses.getById(Number(id));
				if (data) {
					setCourse(data);
					if (data.materials) {
						setMaterials(data.materials);
						const folderIds = data.materials
							.filter(m => m.type === 'folder')
							.map(m => m.id);
						setOpenFolders(folderIds.slice(0, 1));
					}
				}
			} catch (err) {
				console.error('Failed to fetch course:', err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchCourse();
	}, [id]);

	const toggleFolder = (folderId: number) => {
		setOpenFolders(prev =>
			prev.includes(folderId)
				? prev.filter(id => id !== folderId)
				: [...prev, folderId],
		);
	};

	const renderIcon = (item: Material) => {
		if (item.type === 'folder')
			return <Folder className='w-5 h-5 text-brand-sand fill-brand-sand/20' />;
		if (item.type === 'task')
			return <FileArchive className='w-5 h-5 text-orange-500' />;

		switch (item.format) {
			case 'pdf':
				return <FileText className='w-5 h-5 text-red-500' />;
			case 'sql':
			case 'sh':
				return <FileCode className='w-5 h-5 text-blue-500' />;
			default:
				return <FileText className='w-5 h-5 text-gray-500' />;
		}
	};

	if (isLoading) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader2 className='w-8 h-8 text-brand-sand animate-spin' />
			</div>
		);
	}

	if (!course) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<p className='text-muted-foreground'>Kurs nie znaleziony</p>
			</div>
		);
	}

	return (
		<div className='space-y-8'>
			{/* Course Header */}
			<section className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
				<div>
					<div className='flex items-center gap-2 mb-1'>
						<span className='text-[10px] font-bold uppercase tracking-widest text-brand-sand bg-brand-sand/10 px-2 py-0.5 rounded'>
							{course.code}
						</span>
						<span className='text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 italic'>
							Semestr {course.semester}
						</span>
					</div>
					<h1 className='text-3xl font-bold text-brand-navy'>{course.name}</h1>
					<p className='text-muted-foreground mt-1'>
						{course.lecturers[0] ? `Prowadzący: ${course.lecturers[0]}` : ''}
					</p>
					{course.description && (
						<p className='text-sm text-muted-foreground mt-2 max-w-2xl'>
							{course.description}
						</p>
					)}
				</div>

				{!isLecturer && (
					<div className='flex gap-2'>
						<button
							onClick={() => setIsFolderModalOpen(true)}
							className='flex items-center gap-2 bg-white border border-brand-gray/20 text-brand-navy px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-light transition-all shadow-sm'>
							<FolderPlus className='w-4 h-4' />
							Nowy Folder
						</button>
						<button
							onClick={() => setIsUploadModalOpen(true)}
							className='flex items-center gap-2 bg-brand-navy text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-navy/90 transition-all shadow-brand-sm'>
							<Plus className='w-4 h-4' />
							Dodaj Materiał
						</button>
					</div>
				)}
			</section>

			{/* Materials List */}
			<div className='bg-white rounded-2xl border border-brand-gray/10 shadow-brand-sm overflow-hidden'>
				<div className='p-4 border-b border-brand-gray/5 bg-brand-light/30 flex justify-between items-center'>
					<h2 className='text-sm font-bold text-brand-navy uppercase tracking-wider'>
						Materiały i Zadania
					</h2>
					<span className='text-xs text-muted-foreground'>
						{materials.length} elementów
					</span>
				</div>

				<div className='divide-y divide-brand-gray/5'>
					{materials.length === 0 ? (
						<div className='p-8 text-center text-muted-foreground'>
							Brak materiałów w tym kursie
						</div>
					) : (
						materials.map(item => (
							<div key={item.id} className='flex flex-col'>
								{/* Main Item Row */}
								<div
									className={cn(
										'flex items-center justify-between px-6 py-4 hover:bg-brand-light/30 transition-colors group cursor-pointer',
										item.type === 'folder' && 'bg-white',
									)}
									onClick={() => {
										if (item.type === 'folder') toggleFolder(item.id);
										if (item.type === 'task') {
											if (isLecturer) {
												setIsSubmissionsModalOpen(true);
											} else {
												setSelectedTask(item);
											}
										}
									}}>
									<div className='flex items-center gap-4 flex-1 min-w-0'>
										<div className='flex items-center justify-center w-8 h-8 rounded-lg bg-brand-light'>
											{renderIcon(item)}
										</div>
										<div className='min-w-0'>
											<p className='font-bold text-brand-navy truncate group-hover:text-brand-sand transition-colors'>
												{item.name}
											</p>
											{item.type === 'file' && item.format && (
												<p className='text-[10px] text-muted-foreground uppercase font-bold tracking-tighter'>
													{item.format} • {item.size}
												</p>
											)}
											{item.type === 'task' && item.deadline && (
												<p className='text-[10px] text-orange-600 font-bold tracking-tighter uppercase flex items-center gap-1'>
													<AlertCircle className='w-3 h-3' /> Termin:{' '}
													{item.deadline}
												</p>
											)}
										</div>
									</div>

									<div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
										{item.type === 'file' && (
											<button className='p-2 text-muted-foreground hover:text-brand-navy transition-colors'>
												<Download className='w-4 h-4' />
											</button>
										)}
										{isLecturer && (
											<button
												onClick={e => {
													e.stopPropagation();
													setEditingItem(item);
												}}
												className='p-2 text-muted-foreground hover:text-brand-navy transition-colors'>
												<MoreVertical className='w-4 h-4' />
											</button>
										)}
									</div>
								</div>

								{/* Folder Children */}
								{item.type === 'folder' &&
									openFolders.includes(item.id) &&
									item.children && (
										<div className='bg-brand-light/10 pl-14 divide-y divide-brand-gray/5 border-l-2 border-brand-sand/20 ml-10 mb-2'>
											{item.children.map(child => (
												<div
													key={child.id}
													className='flex items-center justify-between px-6 py-3 hover:bg-white transition-colors group cursor-pointer'>
													<div className='flex items-center gap-3 flex-1 min-w-0'>
														{renderIcon(child)}
														<div>
															<p className='text-sm font-semibold text-brand-navy truncate group-hover:text-brand-sand transition-colors'>
																{child.name}
															</p>
															<p className='text-[10px] text-muted-foreground uppercase font-bold tracking-tighter'>
																{child.format} • {child.size}
															</p>
														</div>
													</div>
													<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
														<button className='p-1.5 text-muted-foreground hover:text-brand-navy transition-colors'>
															<Download className='w-3.5 h-3.5' />
														</button>
														{isLecturer && (
															<button
																onClick={e => {
																	e.stopPropagation();
																	setEditingItem(child);
																}}
																className='p-1.5 text-muted-foreground hover:text-brand-navy transition-colors'>
																<MoreVertical className='w-3.5 h-3.5' />
															</button>
														)}
													</div>
												</div>
											))}
										</div>
									)}
							</div>
						))
					)}
				</div>
			</div>

			{/* Task Assignment Modal */}
			<Modal
				isOpen={!!selectedTask}
				onClose={() => setSelectedTask(null)}
				title='Nadsyłanie Zadania'
				footer={
					<>
						<button
							onClick={() => setSelectedTask(null)}
							className='px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-brand-navy transition-colors'>
							Anuluj
						</button>
						<button className='bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm'>
							Wyślij Rozwiązanie
						</button>
					</>
				}>
				<div className='space-y-6'>
					<div className='bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-4'>
						<div className='bg-orange-100 p-2 rounded-lg text-orange-600 h-fit'>
							<AlertCircle className='w-5 h-5' />
						</div>
						<div>
							<p className='font-bold text-brand-navy'>{selectedTask?.name}</p>
							<p className='text-sm text-muted-foreground mt-1'>
								{selectedTask?.description}
							</p>
							<div className='mt-3 flex items-center gap-2 text-xs font-bold text-orange-700 uppercase'>
								Termin: {selectedTask?.deadline}
							</div>
						</div>
					</div>

					<div className='space-y-4'>
						<label className='block text-sm font-bold text-brand-navy uppercase tracking-wider'>
							Twoje Rozwiązanie
						</label>

						{/* File List */}
						{submittedFiles.length > 0 && (
							<div className='space-y-2 mb-4'>
								{submittedFiles.map((file, idx) => (
									<div
										key={idx}
										className='flex items-center justify-between p-3 bg-brand-light/50 rounded-xl border border-brand-gray/10 group'>
										<div className='flex items-center gap-3 overflow-hidden'>
											<FileText className='w-5 h-5 text-brand-navy/40' />
											<div className='overflow-hidden text-left'>
												<p className='text-xs font-bold text-brand-navy truncate'>
													{file.name}
												</p>
												<p className='text-[10px] text-muted-foreground uppercase font-medium'>
													{(file.size / 1024 / 1024).toFixed(2)} MB
												</p>
											</div>
										</div>
										<button
											onClick={() => removeFile(idx)}
											className='p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100'>
											<Trash2 className='w-4 h-4' />
										</button>
									</div>
								))}
							</div>
						)}

						{/* Dropzone */}
						<div
							onClick={() => document.getElementById('file-upload')?.click()}
							className='border-2 border-dashed border-brand-gray/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:border-brand-sand hover:bg-brand-sand/5 transition-all cursor-pointer group'>
							<input
								id='file-upload'
								type='file'
								multiple
								className='hidden'
								onChange={handleFileChange}
							/>
							<div className='w-12 h-12 bg-brand-light rounded-full flex items-center justify-center text-brand-navy group-hover:bg-brand-sand transition-colors'>
								<Upload className='w-6 h-6' />
							</div>
							<div className='text-center'>
								<p className='text-sm font-bold text-brand-navy'>
									Dodaj pliki do rozwiązania
								</p>
								<p className='text-xs text-muted-foreground mt-1'>
									Obsługiwane formaty: ZIP, PDF, RAR (max 50MB)
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			{/* Edit Material Modal (Lecturer only) */}
			<Modal
				isOpen={!!editingItem}
				onClose={() => setEditingItem(null)}
				title={`Zarządzaj: ${editingItem?.name}`}
				size='sm'>
				<div className='grid grid-cols-1 gap-2'>
					{/* {editingItem?.type === 'task' && (
						<button
							onClick={() => {
								setEditingItem(null);
								setIsSubmissionsModalOpen(true);
							}}
							className='flex items-center gap-3 w-full p-4 rounded-2xl bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors text-left group'>
							<div className='p-2 bg-white/10 text-white rounded-lg'>
								<Users className='w-4 h-4' />
							</div>
							<span className='font-bold text-sm'>
								Otwórz listę oddanych prac
							</span>
						</button>
					)} */}
					<button className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group'>
						<div className='p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100'>
							<Pencil className='w-4 h-4' />
						</div>
						<span className='font-bold text-brand-navy text-sm'>
							Zmień nazwę
						</span>
					</button>
					<button className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group'>
						<div className='p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100'>
							<Move className='w-4 h-4' />
						</div>
						<span className='font-bold text-brand-navy text-sm'>
							Przenieś do folderu...
						</span>
					</button>
					<div className='my-2 border-t border-brand-gray/5' />
					<button className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-destructive/5 text-destructive transition-colors text-left group'>
						<div className='p-2 bg-destructive/10 rounded-lg group-hover:bg-destructive/20'>
							<Trash2 className='w-4 h-4' />
						</div>
						<span className='font-bold text-sm'>Usuń element</span>
					</button>
				</div>
			</Modal>

			{/* Submissions Modal (Lecturer only) */}
			<Modal
				isOpen={isSubmissionsModalOpen}
				onClose={() => setIsSubmissionsModalOpen(false)}
				title='Nadesłane rozwiązania'
				size='lg'>
				<div className='space-y-4'>
					<div className='bg-brand-light/50 p-4 rounded-2xl mb-6 flex justify-between items-center'>
						<div>
							<p className='text-xs font-bold text-brand-sand uppercase tracking-wider'>
								Zadanie
							</p>
							<p className='font-bold text-brand-navy'>
								Zadanie Domowe 1 - Projekt E-R
							</p>
						</div>
						<div className='text-right'>
							<p className='text-xs font-bold text-brand-sand uppercase tracking-wider'>
								Oddanych
							</p>
							<p className='font-bold text-brand-navy'>
								{mockSubmissions.length} / 30
							</p>
						</div>
					</div>

					<div className='overflow-hidden border border-brand-gray/10 rounded-2xl'>
						<table className='w-full text-left border-collapse text-sm'>
							<thead className='bg-brand-light'>
								<tr>
									<th className='px-4 py-3 font-bold text-brand-navy uppercase tracking-tighter text-xs'>
										Student
									</th>
									<th className='px-4 py-3 font-bold text-brand-navy uppercase tracking-tighter text-xs'>
										Data oddania
									</th>
									<th className='px-4 py-3 font-bold text-brand-navy uppercase tracking-tighter text-xs'>
										Pliki
									</th>
									<th className='px-4 py-3 font-bold text-brand-navy uppercase tracking-tighter text-xs text-right'>
										Akcja
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-brand-gray/5'>
								{mockSubmissions.map(sub => (
									<tr
										key={sub.id}
										className='hover:bg-brand-light/20 transition-colors'>
										<td className='px-4 py-3 font-semibold text-brand-navy'>
											{sub.student}
										</td>
										<td className='px-4 py-3 text-muted-foreground'>
											{sub.date}
										</td>
										<td className='px-4 py-3'>
											<div className='flex flex-col gap-1'>
												{sub.files.map(f => (
													<div
														key={f}
														className='flex items-center gap-1.5 text-[10px] font-bold text-brand-sand'>
														<FileText className='w-3 h-3' /> {f}
													</div>
												))}
											</div>
										</td>
										<td className='px-4 py-3 text-right'>
											<button className='p-2 bg-brand-light text-brand-navy rounded-lg hover:bg-brand-sand transition-colors shadow-sm'>
												<Download className='w-4 h-4' />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</Modal>

			{/* Add/Upload Material Modal (Lecturer only) */}
			<Modal
				isOpen={isUploadModalOpen}
				onClose={() => {
					setIsUploadModalOpen(false);
					setSubmittedFiles([]);
				}}
				title='Dodaj nowy materiał'
				footer={
					<>
						<button
							onClick={() => setIsUploadModalOpen(false)}
							className='px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-brand-navy transition-colors'>
							Anuluj
						</button>
						<button className='bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm'>
							Zapisz i udostępnij
						</button>
					</>
				}>
				<div className='space-y-6'>
					<div className='space-y-2'>
						<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
							Typ elementu
						</label>
						<div className='flex gap-2 p-1 bg-brand-light rounded-2xl'>
							<button
								onClick={() => setUploadType('file')}
								className={cn(
									'flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all',
									uploadType === 'file'
										? 'bg-white shadow-sm text-brand-navy'
										: 'text-muted-foreground hover:text-brand-navy',
								)}>
								<FileText className='w-4 h-4' /> Plik
							</button>
							<button
								onClick={() => setUploadType('task')}
								className={cn(
									'flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all',
									uploadType === 'task'
										? 'bg-white shadow-sm text-brand-navy'
										: 'text-muted-foreground hover:text-brand-navy',
								)}>
								<FileArchive className='w-4 h-4' /> Zadanie
							</button>
						</div>
					</div>

					<div className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								Nazwa wyświetlana
							</label>
							<input
								type='text'
								placeholder={
									uploadType === 'file'
										? 'np. Laboratorium 1 - Instrukcja'
										: 'np. Projekt końcowy'
								}
								className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
								value={taskDetails.title}
								onChange={e =>
									setTaskDetails({ ...taskDetails, title: e.target.value })
								}
							/>
						</div>

						{uploadType === 'task' && (
							<>
								<div className='space-y-2'>
									<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
										Opis zadania
									</label>
									<textarea
										placeholder='Wpisz treść polecenia lub krótkie info...'
										className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all min-h-24'
										value={taskDetails.description}
										onChange={e =>
											setTaskDetails({
												...taskDetails,
												description: e.target.value,
											})
										}
									/>
								</div>
								<div className='space-y-2'>
									<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
										Termin oddania
									</label>
									<input
										type='datetime-local'
										className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
										value={taskDetails.deadline}
										onChange={e =>
											setTaskDetails({
												...taskDetails,
												deadline: e.target.value,
											})
										}
									/>
								</div>
							</>
						)}

						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								{uploadType === 'file'
									? 'Plik materiału'
									: 'Instrukcja / Załącznik'}
							</label>
							<div
								onClick={() =>
									document.getElementById('lecturer-upload')?.click()
								}
								className='border-2 border-dashed border-brand-gray/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-brand-sand hover:bg-brand-sand/5 transition-all cursor-pointer group'>
								<input
									id='lecturer-upload'
									type='file'
									className='hidden'
									onChange={handleFileChange}
								/>
								<Upload className='w-5 h-5 text-brand-navy/30 group-hover:text-brand-navy transition-colors' />
								<p className='text-xs font-bold text-brand-navy'>
									{submittedFiles.length > 0
										? submittedFiles[0].name
										: 'Kliknij, aby wybrać plik'}
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			{/* New Folder Modal (Lecturer only) */}
			<Modal
				isOpen={isFolderModalOpen}
				onClose={() => setIsFolderModalOpen(false)}
				title='Utwórz nowy folder'
				size='sm'
				footer={
					<button className='bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm w-full'>
						Utwórz Folder
					</button>
				}>
				<div className='space-y-4'>
					<div className='p-4 bg-brand-sand/10 rounded-2xl flex justify-center mb-6'>
						<FolderPlus className='w-12 h-12 text-brand-sand' />
					</div>
					<div className='space-y-2'>
						<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
							Nazwa folderu
						</label>
						<input
							type='text'
							placeholder='np. Laboratoria'
							className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
							autoFocus
							value={newFolderName}
							onChange={e => setNewFolderName(e.target.value)}
						/>
					</div>
				</div>
			</Modal>
		</div>
	);
}
