'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
	Cloud,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { api, Course, Material } from '@/lib/api';

export default function CourseDetailsPage() {
	const { id } = useParams();
	const router = useRouter();
	const { user } = useAuth();
	const [course, setCourse] = useState<Course | null>(null);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [openFolders, setOpenFolders] = useState<(string | number)[]>([]);
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
	const [serverFiles, setServerFiles] = useState<
		{ name: string; path: string }[]
	>([]);
	const [submissions, setSubmissions] = useState<any[]>([]);
	const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
	const [taskForSubmissions, setTaskForSubmissions] = useState<Material | null>(
		null,
	);
	const [editForm, setEditForm] = useState({
		name: '',
		description: '',
		deadline: '',
	});
	const [isActionLoading, setIsActionLoading] = useState(false);
	const [managementStep, setManagementStep] = useState<
		'menu' | 'rename' | 'move' | 'task-edit'
	>('menu');
	const [selectedTargetFolder, setSelectedTargetFolder] = useState<
		number | null
	>(null);

	const isLecturer = user?.role === 'prowadzacy';

	const isDeadlinePassed = (deadline?: string) => {
		if (!deadline) return false;
		return new Date(deadline) < new Date();
	};

	useEffect(() => {
		if (editingItem) {
			setEditForm({
				name: editingItem.name,
				description: editingItem.description || '',
				deadline: editingItem.deadline || '',
			});
			setManagementStep('menu');
		}
	}, [editingItem]);

	const fetchMaterials = async () => {
		if (!id) return;
		try {
			const data = await api.materials.getByCourseId(Number(id));
			setMaterials(data);
		} catch (err) {
			console.error('Failed to fetch materials:', err);
		}
	};

	const handleRename = async () => {
		if (!editingItem || !id) return;
		setIsActionLoading(true);
		try {
			if (editingItem.type === 'folder' && editingItem.dbId) {
				await api.materials.renameFolder(editingItem.dbId, editForm.name);
			} else if (editingItem.type === 'task') {
				await api.tasks.update(editingItem.id, { title: editForm.name });
			} else {
				await api.materials.update(editingItem.id, { name: editForm.name });
			}
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Rename failed:', err);
			alert('Błąd podczas zmiany nazwy');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleUpdateTask = async () => {
		if (!editingItem || editingItem.type !== 'task') return;
		setIsActionLoading(true);
		try {
			await api.tasks.update(editingItem.id, {
				title: editForm.name,
				description: editForm.description,
				deadline: editForm.deadline,
			});
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Task update failed:', err);
			alert('Błąd podczas aktualizacji zadania');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleMove = async (targetFolderId: number | null) => {
		if (!editingItem) return;
		setIsActionLoading(true);
		try {
			if (editingItem.type === 'task') {
				await api.tasks.update(editingItem.id, { folderId: targetFolderId });
			} else if (editingItem.type === 'file') {
				await api.materials.update(editingItem.id, {
					folderId: targetFolderId,
				});
			}
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Move failed:', err);
			alert('Błąd podczas przenoszenia elementu');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleDelete = async () => {
		if (
			!editingItem ||
			!id ||
			!confirm(`Czy na pewno chcesz usunąć: ${editingItem.name}?`)
		)
			return;
		setIsActionLoading(true);
		try {
			if (editingItem.type === 'folder' && editingItem.dbId) {
				await api.materials.deleteFolder(editingItem.dbId);
			} else if (editingItem.type === 'task') {
				await api.tasks.delete(editingItem.id);
			} else {
				await api.materials.delete(editingItem.id);
			}
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Delete failed:', err);
			alert('Błąd podczas usuwania elementu');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleCreateFolder = async () => {
		if (!id || !newFolderName) return;
		setIsActionLoading(true);
		try {
			await api.materials.createFolder(Number(id), newFolderName);
			await fetchMaterials();
			setIsFolderModalOpen(false);
			setNewFolderName('');
		} catch (err) {
			console.error('Folder creation failed:', err);
			alert('Błąd podczas tworzenia folderu');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleLeaveCourse = async () => {
		if (!id || !user?.id) return;
		if (
			!confirm(
				'Czy na pewno chcesz opuścić ten kurs? Stracisz dostęp do wszystkich materiałów i zadań.',
			)
		)
			return;

		setIsActionLoading(true);
		try {
			await api.courses.leave(Number(id), user.id);
			router.push('/courses'); // Redirect to course catalog
		} catch (err) {
			console.error('Failed to leave course:', err);
			alert('Błąd podczas opuszczania kursu');
		} finally {
			setIsActionLoading(false);
		}
	};

	useEffect(() => {
		const abortController = new AbortController();

		const fetchSubmissions = async () => {
			if (isSubmissionsModalOpen && taskForSubmissions) {
				setIsSubmissionsLoading(true);
				try {
					const data = await api.submissions.getAllTaskSubmissions(
						taskForSubmissions.id,
					);
					if (!abortController.signal.aborted) {
						setSubmissions(data);
					}
				} catch (err) {
					if (!abortController.signal.aborted) {
						console.error('Failed to fetch submissions:', err);
						setSubmissions([]);
					}
				} finally {
					if (!abortController.signal.aborted) {
						setIsSubmissionsLoading(false);
					}
				}
			} else {
				setSubmissions([]);
			}
		};
		fetchSubmissions();

		return () => abortController.abort();
	}, [isSubmissionsModalOpen, taskForSubmissions]);

	useEffect(() => {
		const abortController = new AbortController();

		const fetchMySubmissions = async () => {
			if (selectedTask && user?.id) {
				try {
					const files = await api.submissions.getTaskSubmissions(
						selectedTask.id,
						user.id,
					);
					if (!abortController.signal.aborted) {
						setServerFiles(files);
					}
				} catch (err) {
					if (!abortController.signal.aborted) {
						console.error('Failed to fetch my submissions:', err);
					}
				}
			} else {
				setServerFiles([]);
			}
		};
		fetchMySubmissions();

		return () => abortController.abort();
	}, [selectedTask, user?.id]);

	useEffect(() => {
		if (editingItem) {
			setEditForm({
				name: editingItem.name,
				description: editingItem.description || '',
				deadline: editingItem.deadline || '',
				folderName: '', // Selected target folder
			});
			setManagementStep('menu');
		}
	}, [editingItem]);

	const isDeadlinePassed = (deadline?: string) => {
		if (!deadline) return false;
		return new Date(deadline) < new Date();
	};

	const fetchMaterials = async () => {
		if (!id) return;
		try {
			const data = await api.materials.getByCourseId(Number(id));
			setMaterials(data);
		} catch (err) {
			console.error('Failed to fetch materials:', err);
		}
	};

	const handleRename = async () => {
		if (!editingItem || !id) return;
		setIsActionLoading(true);
		try {
			if (editingItem.type === 'folder') {
				await api.materials.renameFolder(Number(id), editingItem.name, editForm.name);
			} else if (editingItem.type === 'task') {
				await api.tasks.update(editingItem.id, { title: editForm.name });
			} else {
				await api.materials.update(editingItem.id, { name: editForm.name });
			}
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Rename failed:', err);
			alert('Błąd podczas zmiany nazwy');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleUpdateTask = async () => {
		if (!editingItem || editingItem.type !== 'task') return;
		setIsActionLoading(true);
		try {
			await api.tasks.update(editingItem.id, {
				title: editForm.name,
				description: editForm.description,
				deadline: editForm.deadline,
			});
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Task update failed:', err);
			alert('Błąd podczas aktualizacji zadania');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleMove = async (targetFolder: string) => {
		if (!editingItem) return;
		setIsActionLoading(true);
		try {
			if (editingItem.type === 'task') {
				await api.tasks.update(editingItem.id, { folderName: targetFolder });
			} else if (editingItem.type === 'file') {
				await api.materials.update(editingItem.id, { folderName: targetFolder });
			}
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Move failed:', err);
			alert('Błąd podczas przenoszenia elementu');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!editingItem || !id || !confirm(`Czy na pewno chcesz usunąć: ${editingItem.name}?`)) return;
		setIsActionLoading(true);
		try {
			if (editingItem.type === 'folder') {
				await api.materials.deleteFolder(Number(id), editingItem.name);
			} else if (editingItem.type === 'task') {
				await api.tasks.delete(editingItem.id);
			} else {
				await api.materials.delete(editingItem.id);
			}
			await fetchMaterials();
			setEditingItem(null);
		} catch (err) {
			console.error('Delete failed:', err);
			alert('Błąd podczas usuwania elementu');
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setSubmittedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
		}
	};

	const removeFile = (index: number) => {
		setSubmittedFiles(prev => prev.filter((_, i) => i !== index));
	};

	const handleDownload = async (materialId: string | number) => {
		try {
			await api.materials.download(materialId);
		} catch (err) {
			console.error('Download failed:', err);
			alert('Błąd podczas pobierania pliku');
		}
	};

	const handleUpload = async () => {
		if (
			!id ||
			submittedFiles.length === 0 ||
			(uploadType === 'task' && !taskDetails.title)
		) {
			alert('Wypełnij wszystkie pola i dodaj plik');
			return;
		}

		setIsUploading(true);
		try {
			if (uploadType === 'file') {
				await api.materials.upload(
					Number(id),
					submittedFiles,
					selectedTargetFolder || undefined,
				);
			} else {
				await api.tasks.create(Number(id), {
					title: taskDetails.title,
					description: taskDetails.description,
					deadline: taskDetails.deadline,
					folderId: selectedTargetFolder || undefined,
				});
			}
			await fetchMaterials();
			setIsUploadModalOpen(false);
			setSubmittedFiles([]);
			setTaskDetails({ title: '', description: '', deadline: '' });
			setSelectedTargetFolder(null);
		} catch (err) {
			console.error('Upload failed:', err);
			alert('Błąd podczas wysyłania pliku');
		} finally {
			setIsUploading(false);
		}
	};

	const handleTaskSubmit = async () => {
		if (!selectedTask || submittedFiles.length === 0 || !user?.id) {
			alert('Dodaj nowe pliki przed wysłaniem');
			return;
		}

		setIsSubmitting(true);
		try {
			await api.submissions.submitTask(
				selectedTask.id,
				user.id,
				submittedFiles,
			);
			alert('Zadanie zostało przesłane!');

			// Refresh files from server
			const files = await api.submissions.getTaskSubmissions(
				selectedTask.id,
				user.id,
			);
			setServerFiles(files);
			setSubmittedFiles([]);
		} catch (err) {
			console.error('Submission failed:', err);
			alert('Błąd podczas przesyłania zadania');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRemoveServerFile = async (fileId: number) => {
		if (!confirm('Czy na pewno chcesz usunąć ten plik z serwera?')) return;

		try {
			await api.submissions.deleteFile(fileId);
			// Refresh files
			if (selectedTask && user?.id) {
				const files = await api.submissions.getTaskSubmissions(
					selectedTask.id,
					user.id,
				);
				setServerFiles(files);
			}
		} catch (err) {
			console.error('Delete failed:', err);
			alert('Błąd podczas usuwania pliku');
		}
	};

	useEffect(() => {
		const abortController = new AbortController();

		const fetchCourseData = async () => {
			if (!id) return;
			try {
				const data = await api.courses.getById(Number(id));

				if (abortController.signal.aborted) return;

				if (data) {
					setCourse(data);
					const mats = await api.materials.getByCourseId(Number(id));

					if (abortController.signal.aborted) return;

					setMaterials(mats);
					const folderIds = mats
						.filter(m => m.type === 'folder')
						.map(m => m.id);
					setOpenFolders(folderIds.slice(0, 1));
				}
			} catch (err) {
				if (!abortController.signal.aborted) {
					console.error('Failed to fetch course:', err);
				}
			} finally {
				if (!abortController.signal.aborted) {
					setIsLoading(false);
				}
			}
		};
		fetchCourseData();

		return () => {
			abortController.abort();
		};
	}, [id]);

	const toggleFolder = (folderId: string | number) => {
		setOpenFolders(prev =>
			prev.includes(folderId)
				? prev.filter(id => id !== folderId)
				: [...prev, folderId],
		);
	};

	const renderIcon = (item: Material) => {
		if (item.type === 'folder')
			return <Folder className='w-5 h-5 text-brand-sand fill-brand-sand/20' />;
		if (item.type === 'task') {
			const expired = isDeadlinePassed(item.deadline);
			return (
				<FileArchive
					className={cn(
						'w-5 h-5',
						expired ? 'text-gray-400 opacity-50' : 'text-orange-500',
					)}
				/>
			);
		}

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

	// Helper to get all folders in a flat list for select
	const allFolders: { id: number; name: string }[] = [];
	const extractFolders = (items: Material[]) => {
		items.forEach(item => {
			if (item.type === 'folder' && item.dbId) {
				allFolders.push({ id: item.dbId, name: item.name });
				if (item.children) extractFolders(item.children);
			}
		});
	};
	extractFolders(materials);

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
					<div className='flex items-center gap-4 mt-1'>
						<p className='text-muted-foreground'>
							{course.lecturers[0] ? `Prowadzący: ${course.lecturers[0]}` : ''}
						</p>
						{!isLecturer && (
							<button
								onClick={handleLeaveCourse}
								className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5'>
								<LogOut className='w-3 h-3' />
								Opuść kurs
							</button>
						)}
					</div>
					{course.description && (
						<p className='text-sm text-muted-foreground mt-2 max-w-2xl'>
							{course.description}
						</p>
					)}
				</div>

				{isLecturer && (
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
												setTaskForSubmissions(item);
												setIsSubmissionsModalOpen(true);
											} else {
												setSelectedTask(item);
											}
										}
										if (item.type === 'file') {
											handleDownload(item.id);
										}
									}}>
									<div className='flex items-center gap-4 flex-1 min-w-0'>
										<div className='flex items-center justify-center w-8 h-8 rounded-lg bg-brand-light'>
											{renderIcon(item)}
										</div>
										<div className='min-w-0'>
											<div className='flex items-center gap-2'>
												<p
													className={cn(
														'font-bold text-brand-navy truncate group-hover:text-brand-sand transition-colors',
														item.type === 'task' &&
															isDeadlinePassed(item.deadline) &&
															'text-gray-400',
													)}>
													{item.name}
												</p>
												{item.type === 'folder' && (
													<div className='text-brand-navy/30'>
														{openFolders.includes(item.id) ? (
															<ChevronDown className='w-4 h-4' />
														) : (
															<ChevronRight className='w-4 h-4' />
														)}
													</div>
												)}
											</div>
											{item.type === 'file' && item.format && (
												<p className='text-[10px] text-muted-foreground uppercase font-bold tracking-tighter'>
													{item.format} • {item.size}
												</p>
											)}
											{item.type === 'task' && item.deadline && (
												<p
													className={cn(
														'text-[10px] font-bold tracking-tighter uppercase flex items-center gap-1',
														isDeadlinePassed(item.deadline)
															? 'text-gray-400'
															: 'text-orange-600',
													)}>
													<AlertCircle className='w-3 h-3' />{' '}
													{isDeadlinePassed(item.deadline)
														? 'Termin minął'
														: `Termin: ${item.deadline}`}
												</p>
											)}
										</div>
									</div>

									<div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
										{item.type === 'file' && (
											<button
												onClick={e => {
													e.stopPropagation();
													handleDownload(item.id);
												}}
												className='p-2 text-muted-foreground hover:text-brand-navy transition-colors cursor-pointer'>
												<Download className='w-4 h-4' />
											</button>
										)}
										{isLecturer && (
											<button
												onClick={e => {
													e.stopPropagation();
													setEditingItem(item);
												}}
												className='p-2 text-muted-foreground hover:text-brand-navy transition-colors cursor-pointer'>
												<MoreVertical className='w-4 h-4' />
											</button>
										)}
									</div>
								</div>

								{/* Folder Children (Recursive support) */}
								{item.type === 'folder' && openFolders.includes(item.id) && (
									<div className='bg-brand-light/10 pl-6 divide-y divide-brand-gray/5 border-l-2 border-brand-sand/20 ml-10 mb-2'>
										{item.children && item.children.length > 0 ? (
											item.children.map(child => (
												<div key={child.id} className='flex flex-col'>
													<div
														className='flex items-center justify-between px-6 py-3 hover:bg-white transition-colors group cursor-pointer'
														onClick={e => {
															e.stopPropagation();
															if (child.type === 'folder')
																toggleFolder(child.id);
															if (child.type === 'task') {
																if (isLecturer) {
																	setTaskForSubmissions(child);
																	setIsSubmissionsModalOpen(true);
																} else {
																	setSelectedTask(child);
																}
															}
															if (child.type === 'file') {
																handleDownload(child.id);
															}
														}}>
														<div className='flex items-center gap-3 flex-1 min-w-0'>
															{renderIcon(child)}
															<div>
																<div className='flex items-center gap-2'>
																	<p className='text-sm font-semibold text-brand-navy truncate group-hover:text-brand-sand transition-colors'>
																		{child.name}
																	</p>
																	{child.type === 'folder' && (
																		<div className='text-brand-navy/30'>
																			{openFolders.includes(child.id) ? (
																				<ChevronDown className='w-3.5 h-3.5' />
																			) : (
																				<ChevronRight className='w-3.5 h-3.5' />
																			)}
																		</div>
																	)}
																</div>
																{child.type === 'file' && (
																	<p className='text-[10px] text-muted-foreground uppercase font-bold tracking-tighter'>
																		{child.format} • {child.size}
																	</p>
																)}
																{child.type === 'task' && child.deadline && (
																	<p
																		className={cn(
																			'text-[10px] font-bold tracking-tighter uppercase flex items-center gap-1',
																			isDeadlinePassed(child.deadline)
																				? 'text-gray-400'
																				: 'text-orange-600',
																		)}>
																		Termin: {child.deadline}
																	</p>
																)}
															</div>
														</div>
														<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
															{child.type === 'file' && (
																<button
																	onClick={e => {
																		e.stopPropagation();
																		handleDownload(child.id);
																	}}
																	className='p-1.5 text-muted-foreground hover:text-brand-navy transition-colors cursor-pointer'>
																	<Download className='w-3.5 h-3.5' />
																</button>
															)}
															{isLecturer && (
																<button
																	onClick={e => {
																		e.stopPropagation();
																		setEditingItem(child);
																	}}
																	className='p-1.5 text-muted-foreground hover:text-brand-navy transition-colors cursor-pointer'>
																	<MoreVertical className='w-3.5 h-3.5' />
																</button>
															)}
														</div>
													</div>
													{/* Nested folders support could be added here by recursively calling a renderMaterials function */}
												</div>
											))
										) : (
											<div className='px-6 py-4 text-s italic text-muted-foreground/40 cursor-default'>
												Brak materiałów
											</div>
										)}
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
						<button
							onClick={handleTaskSubmit}
							disabled={
								isSubmitting ||
								(!isLecturer && isDeadlinePassed(selectedTask?.deadline))
							}
							className='bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm flex items-center gap-2 disabled:opacity-50 disabled:bg-gray-400'>
							{isSubmitting && <Loader2 className='w-4 h-4 animate-spin' />}
							{!isLecturer && isDeadlinePassed(selectedTask?.deadline)
								? 'Termin Minął'
								: 'Wyślij Rozwiązanie'}
						</button>
					</>
				}>
				<div className='space-y-6'>
					{!isLecturer && isDeadlinePassed(selectedTask?.deadline) && (
						<div className='bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-4 text-red-700 animate-in fade-in slide-in-from-top-2'>
							<div className='bg-red-100 p-2 rounded-lg text-red-600 h-fit'>
								<AlertCircle className='w-5 h-5' />
							</div>
							<div>
								<p className='font-bold'>Czas na oddanie zadania upłynął</p>
								<p className='text-sm mt-1'>
									Nie możesz już przesyłać nowych plików ani modyfikować
									obecnych dla tego zadania.
								</p>
							</div>
						</div>
					)}
					<div className='bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-4'>
						{' '}
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
						{(submittedFiles.length > 0 || serverFiles.length > 0) && (
							<div className='space-y-2 mb-4'>
								{/* Files already on server */}
								{serverFiles.map((file: any, idx) => (
									<div
										key={`server-${idx}`}
										className='flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 group'>
										<div className='flex items-center gap-3 overflow-hidden'>
											<Cloud className='w-5 h-5 text-green-600' />
											<div className='overflow-hidden text-left'>
												<p className='text-xs font-bold text-brand-navy truncate'>
													{file.name}
												</p>
												<p className='text-[10px] text-green-700 uppercase font-bold flex items-center gap-1'>
													<CheckCircle className='w-3 h-3' /> Przesłano
												</p>
											</div>
										</div>
										<button
											onClick={() => handleRemoveServerFile(file.id)}
											className={cn(
												'p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100',
												!isLecturer &&
													isDeadlinePassed(selectedTask?.deadline) &&
													'hidden',
											)}>
											<Trash2 className='w-4 h-4' />
										</button>
									</div>
								))}

								{/* New local files */}
								{submittedFiles.map((file, idx) => (
									<div
										key={`local-${idx}`}
										className='flex items-center justify-between p-3 bg-brand-light/50 rounded-xl border border-brand-gray/10 group animate-in fade-in slide-in-from-top-2'>
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
							onClick={() => {
								if (!isLecturer && isDeadlinePassed(selectedTask?.deadline))
									return;
								document.getElementById('file-upload')?.click();
							}}
							className={cn(
								'border-2 border-dashed border-brand-gray/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group',
								!isLecturer && isDeadlinePassed(selectedTask?.deadline)
									? 'opacity-50 cursor-not-allowed bg-gray-50'
									: 'hover:border-brand-sand hover:bg-brand-sand/5',
							)}>
							<input
								id='file-upload'
								type='file'
								multiple
								className='hidden'
								disabled={
									!isLecturer && isDeadlinePassed(selectedTask?.deadline)
								}
								onChange={handleFileChange}
							/>
							<div className='w-12 h-12 bg-brand-light rounded-full flex items-center justify-center text-brand-navy group-hover:bg-brand-sand transition-colors'>
								<Upload className='w-6 h-6' />
							</div>
							<div className='text-center'>
								<p className='text-sm font-bold text-brand-navy'>
									{!isLecturer && isDeadlinePassed(selectedTask?.deadline)
										? 'Przesyłanie zablokowane'
										: 'Dodaj pliki do rozwiązania'}
								</p>
								<p className='text-xs text-muted-foreground mt-1'>
									{!isLecturer && isDeadlinePassed(selectedTask?.deadline)
										? 'Termin oddania już minął'
										: 'Obsługiwane formaty: ZIP, PDF, RAR (max 50MB)'}
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
				title={
					managementStep === 'rename'
						? 'Zmień nazwę'
						: managementStep === 'move'
							? 'Przenieś do folderu'
							: managementStep === 'task-edit'
								? 'Edytuj zadanie'
								: `Zarządzaj: ${editingItem?.name}`
				}
				size={managementStep === 'task-edit' ? 'md' : 'sm'}
				footer={
					managementStep !== 'menu' &&
					managementStep !== 'move' && (
						<div className='flex gap-2 w-full'>
							<button
								onClick={() => setManagementStep('menu')}
								className='flex-1 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-brand-navy transition-colors'>
								Powrót
							</button>
							<button
								onClick={
									managementStep === 'rename' ? handleRename : handleUpdateTask
								}
								disabled={isActionLoading}
								className='flex-1 bg-brand-navy text-white px-4 py-2 rounded-xl text-sm font-bold shadow-brand-sm disabled:opacity-50'>
								{isActionLoading ? (
									<Loader2 className='w-4 h-4 animate-spin mx-auto' />
								) : (
									'Zapisz'
								)}
							</button>
						</div>
					)
				}>
				{managementStep === 'menu' && (
					<div className='grid grid-cols-1 gap-2'>
						<button
							onClick={() => setManagementStep('rename')}
							className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group'>
							<div className='p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100'>
								<Pencil className='w-4 h-4' />
							</div>
							<span className='font-bold text-brand-navy text-sm'>
								Zmień nazwę
							</span>
						</button>

						{editingItem?.type === 'task' && (
							<button
								onClick={() => setManagementStep('task-edit')}
								className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group'>
								<div className='p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100'>
									<FileArchive className='w-4 h-4' />
								</div>
								<span className='font-bold text-brand-navy text-sm'>
									Edytuj szczegóły zadania
								</span>
							</button>
						)}

						{editingItem?.type !== 'folder' && (
							<button
								onClick={() => setManagementStep('move')}
								className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-brand-light transition-colors text-left group'>
								<div className='p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100'>
									<Move className='w-4 h-4' />
								</div>
								<span className='font-bold text-brand-navy text-sm'>
									Przenieś do folderu...
								</span>
							</button>
						)}

						<div className='my-2 border-t border-brand-gray/5' />
						<button
							onClick={handleDelete}
							className='flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-destructive/5 text-destructive transition-colors text-left group'>
							<div className='p-2 bg-destructive/10 rounded-lg group-hover:bg-destructive/20'>
								<Trash2 className='w-4 h-4' />
							</div>
							<span className='font-bold text-sm'>Usuń element</span>
						</button>
					</div>
				)}

				{managementStep === 'rename' && (
					<div className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								Nowa nazwa
							</label>
							<input
								type='text'
								className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
								autoFocus
								value={editForm.name}
								onChange={e =>
									setEditForm({ ...editForm, name: e.target.value })
								}
								onKeyDown={e => e.key === 'Enter' && handleRename()}
							/>
						</div>
					</div>
				)}

				{managementStep === 'move' && (
					<div className='space-y-2'>
						<p className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground mb-4'>
							Wybierz folder docelowy
						</p>
						<button
							onClick={() => handleMove(null)}
							disabled={isActionLoading}
							className='flex items-center gap-3 w-full p-3 rounded-xl hover:bg-brand-light transition-colors text-left border border-transparent hover:border-brand-gray/10'>
							<div className='p-2 bg-gray-100 text-gray-600 rounded-lg'>
								<Folder className='w-4 h-4' />
							</div>
							<span className='font-bold text-brand-navy text-sm'>
								Brak folderu (Główny katalog)
							</span>
						</button>

						{allFolders.map(folder => (
							<button
								key={folder.id}
								disabled={isActionLoading}
								onClick={() => handleMove(folder.id)}
								className='flex items-center gap-3 w-full p-3 rounded-xl hover:bg-brand-light transition-colors text-left border border-transparent hover:border-brand-gray/10'>
								<div className='p-2 bg-brand-sand/10 text-brand-sand rounded-lg'>
									<Folder className='w-4 h-4 fill-brand-sand/20' />
								</div>
								<span className='font-bold text-brand-navy text-sm'>
									{folder.name}
								</span>
							</button>
						))}

						<button
							onClick={() => setManagementStep('menu')}
							className='w-full mt-4 p-2 text-xs font-bold text-muted-foreground hover:text-brand-navy transition-colors'>
							Anuluj
						</button>
					</div>
				)}

				{managementStep === 'task-edit' && (
					<div className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								Nazwa zadania
							</label>
							<input
								type='text'
								className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
								value={editForm.name}
								onChange={e =>
									setEditForm({ ...editForm, name: e.target.value })
								}
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								Opis zadania
							</label>
							<textarea
								className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all min-h-24'
								value={editForm.description}
								onChange={e =>
									setEditForm({ ...editForm, description: e.target.value })
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
								value={editForm.deadline}
								onChange={e =>
									setEditForm({ ...editForm, deadline: e.target.value })
								}
							/>
						</div>
					</div>
				)}
			</Modal>

			{/* Submissions Modal (Lecturer only) */}
			<Modal
				isOpen={isSubmissionsModalOpen}
				onClose={() => {
					setIsSubmissionsModalOpen(false);
					setTaskForSubmissions(null);
				}}
				title='Nadesłane rozwiązania'
				size='lg'>
				<div className='space-y-4'>
					<div className='bg-brand-light/50 p-4 rounded-2xl mb-6 flex justify-between items-center'>
						<div>
							<p className='text-xs font-bold text-brand-sand uppercase tracking-wider'>
								Zadanie
							</p>
							<p className='font-bold text-brand-navy'>
								{taskForSubmissions?.name}
							</p>
						</div>
						<div className='text-right'>
							<p className='text-xs font-bold text-brand-sand uppercase tracking-wider'>
								Oddanych
							</p>
							<p className='font-bold text-brand-navy'>
								{submissions.length} / 30
							</p>
						</div>
					</div>

					<div className='overflow-hidden border border-brand-gray/10 rounded-2xl relative min-h-64'>
						{isSubmissionsLoading ? (
							<div className='absolute inset-0 flex items-center justify-center bg-white/50 z-10'>
								<Loader2 className='w-8 h-8 text-brand-sand animate-spin' />
							</div>
						) : null}
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
								{submissions.length > 0 ? (
									submissions.map(sub => (
										<tr
											key={sub.id}
											className='hover:bg-brand-light/20 transition-colors'>
											<td className='px-4 py-3 font-semibold text-brand-navy'>
												{sub.student}
											</td>
											<td className='px-4 py-3 text-muted-foreground'>
												{new Date(sub.date).toLocaleString()}
											</td>
											<td className='px-4 py-3'>
												<div className='flex flex-col gap-1'>
													{sub.files.map((f: string) => (
														<div
															key={f}
															className='flex items-center gap-1.5 text-[10px] font-bold text-brand-sand'>
															<FileText className='w-3 h-3' /> {f}
														</div>
													))}
												</div>
											</td>
											<td className='px-4 py-3 text-right'>
												<button
													onClick={() =>
														api.materials.downloadSubmissionZip(
															sub.id,
															sub.student,
														)
													}
													className='p-2 bg-brand-light text-brand-navy rounded-lg hover:bg-brand-sand transition-colors shadow-sm'>
													<Download className='w-4 h-4' />
												</button>
											</td>
										</tr>
									))
								) : !isSubmissionsLoading ? (
									<tr className='text-center'>
										<td colSpan={4} className='py-10 text-black/60 text-l'>
											Brak nadesłanych rozwiązań
										</td>
									</tr>
								) : (
									<tr>
										<td colSpan={4} className='py-20'></td>
									</tr>
								)}
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
						<button
							onClick={handleUpload}
							disabled={isUploading}
							className='bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm flex items-center gap-2 disabled:opacity-50'>
							{isUploading && <Loader2 className='w-4 h-4 animate-spin' />}
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
						{uploadType === 'task' && (
							<div className='space-y-2'>
								<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
									Nazwa wyświetlana
								</label>
								<input
									type='text'
									placeholder='np. Projekt końcowy'
									className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
									value={taskDetails.title}
									onChange={e =>
										setTaskDetails({ ...taskDetails, title: e.target.value })
									}
								/>
							</div>
						)}

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

						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								Folder docelowy
							</label>
							<select
								className='w-full p-3 bg-brand-light border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-sand transition-all'
								value={selectedTargetFolder || ''}
								onChange={e =>
									setSelectedTargetFolder(
										e.target.value ? Number(e.target.value) : null,
									)
								}>
								<option value=''>Główny katalog</option>
								{allFolders.map(f => (
									<option key={f.id} value={f.id}>
										{f.name}
									</option>
								))}
							</select>
						</div>

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

						<div className='space-y-2'>
							<label className='text-xs font-bold text-brand-navy uppercase tracking-wider text-muted-foreground'>
								{uploadType === 'file'
									? 'Pliki materiałów'
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
									multiple
									className='hidden'
									onChange={handleFileChange}
								/>
								<Upload className='w-6 h-6' />
								<div className='text-center'>
									<p className='text-sm font-bold text-brand-navy'>
										{uploadType === 'file' ? 'Wybierz pliki' : 'Wybierz plik'}
									</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Możesz wybrać wiele plików na raz
									</p>
								</div>
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
					<div className='flex gap-2 w-full'>
						<button
							onClick={() => setIsFolderModalOpen(false)}
							className='flex-1 px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-brand-navy transition-colors'>
							Anuluj
						</button>
						<button
							onClick={handleCreateFolder}
							disabled={isActionLoading || !newFolderName}
							className='flex-1 bg-brand-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-brand-sm disabled:opacity-50'>
							{isActionLoading ? (
								<Loader2 className='w-4 h-4 animate-spin mx-auto' />
							) : (
								'Utwórz'
							)}
						</button>
					</div>
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
