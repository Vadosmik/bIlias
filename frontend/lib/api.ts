const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const isFormData = options.body instanceof FormData;

	const headers: HeadersInit = {
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...options.headers,
	};

	const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
	
	// Handle non-JSON responses (like file downloads)
	const contentType = res.headers.get('content-type');
	if (contentType && !contentType.includes('application/json')) {
		if (!res.ok) throw new Error('Request failed');
		return res as any;
	}

	const json = await res.json();

	if (!json.success) {
		throw new Error(json.error || 'Request failed');
	}
	return json.data;
}

export interface Course {
	id: number;
	name: string;
	code: string;
	department: string;
	semester: number;
	lecturers: string[];
	joined: boolean;
	backgroundImage?: string;
	description?: string;
	ects?: number;
	materials?: Material[];
}

export interface Material {
	id: string | number;
	type: 'folder' | 'file' | 'task';
	name: string;
	format?: string;
	size?: string;
	deadline?: string;
	description?: string;
	children?: Material[];
}

const mockCourses: Course[] = [
  { id: '1', name: 'Bazy Danych', code: 'BD-2024', department: 'Wydział Elektryczny', semester: 6, lecturers: ['Dr inż. Tomasz Papierowski'], joined: true, progress: 75 },
  { id: '2', name: 'Programowanie Obiektowe', code: 'PO-2024', department: 'Wydział Elektryczny', semester: 6, lecturers: ['Mgr inż. Kacper Szamszon'], joined: true, progress: 40 },
  { id: '3', name: 'Sieci Komputerowe', code: 'SK-2024', department: 'Wydział Elektryczny', semester: 6, lecturers: ['Dr Sofiia Stankevych'], joined: true, progress: 90 },
  { id: '4', name: 'Systemy Operacyjne', code: 'SO-2024', department: 'Wydział Elektryczny', semester: 5, lecturers: ['Dr inż. Vadzim Mikanovich'], joined: false },
  { id: '5', name: 'Matematyka Dyskretna', code: 'MD-2023', department: 'Wydział Elektryczny', semester: 1, lecturers: ['Mgr Monika Szczepańska'], joined: false },
];

export const api = {
	auth: {
		login: async (email: string, password: string) => {
			const data = await request<{ token: string; user: any }>('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
			});
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
			return data.user;
		},
		register: async (input: {
			email: string;
			password: string;
			imie: string;
			nazwisko: string;
			role?: string;
		}) => {
			const data = await request<{ token: string; user: any }>(
				'/auth/register',
				{
					method: 'POST',
					body: JSON.stringify(input),
				},
			);
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
			return data.user;
		},
		logout: () => {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
		},
	},
	courses: {
		getAll: async (userId?: number): Promise<Course[]> => {
			if (userId) {
				return request<Course[]>(`/courses?userId=${userId}`);
			}
			return request<Course[]>('/courses');
		},
		getUserCourses: async (userId: number): Promise<Course[]> => {
			return request<Course[]>(`/courses/my?userId=${userId}`);
		},
		getById: async (id: number): Promise<Course | undefined> => {
			return request<Course>(`/courses/${id}`);
		},
		join: async (courseId: number, userId: number): Promise<boolean> => {
			await request(`/courses/${courseId}/join`, {
				method: 'POST',
				body: JSON.stringify({ userId }),
			});
			return true;
		},
	},
	tasks: {
		create: async (
			courseId: number,
			data: { title: string; description: string; deadline: string },
		): Promise<any> => {
			return request(`/courses/${courseId}/tasks`, {
				method: 'POST',
				body: JSON.stringify(data),
			});
		},
		update: async (
			taskId: string | number,
			data: { title?: string; description?: string; deadline?: string },
		): Promise<void> => {
			const id =
				typeof taskId === 'string' && taskId.startsWith('t-')
					? taskId.substring(2)
					: taskId;
			await request(`/tasks/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			});
		},
		delete: async (taskId: string | number): Promise<void> => {
			const id =
				typeof taskId === 'string' && taskId.startsWith('t-')
					? taskId.substring(2)
					: taskId;
			await request(`/tasks/${id}`, {
				method: 'DELETE',
			});
		},
	},
	materials: {
		getByCourseId: async (courseId: number): Promise<Material[]> => {
			return request<Material[]>(`/courses/${courseId}/materials`);
		},
		upload: async (
			courseId: number,
			files: File[],
			folderName?: string,
		): Promise<Material[]> => {
			const formData = new FormData();
			files.forEach(file => {
				formData.append('files', file);
			});
			if (folderName) formData.append('folderName', folderName);

			return request<Material[]>(`/courses/${courseId}/materials`, {
				method: 'POST',
				body: formData,
			});
		},
		update: async (
			materialId: string | number,
			data: { name?: string; folderName?: string },
		): Promise<void> => {
			const id =
				typeof materialId === 'string' && materialId.startsWith('m-')
					? materialId.substring(2)
					: materialId;
			await request(`/materials/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			});
		},
		delete: async (materialId: string | number): Promise<void> => {
			const id =
				typeof materialId === 'string' && materialId.startsWith('m-')
					? materialId.substring(2)
					: materialId;
			await request(`/materials/${id}`, {
				method: 'DELETE',
			});
		},
		renameFolder: async (
			courseId: number,
			oldName: string,
			newName: string,
		): Promise<void> => {
			await request(`/courses/${courseId}/folders`, {
				method: 'PATCH',
				body: JSON.stringify({ oldName, newName }),
			});
		},
		deleteFolder: async (
			courseId: number,
			folderName: string,
		): Promise<void> => {
			await request(
				`/courses/${courseId}/folders?folderName=${encodeURIComponent(folderName)}`,
				{
					method: 'DELETE',
				},
			);
		},
		download: async (materialId: string | number): Promise<void> => {
			// Stripping 'm-' prefix if present from string IDs
			const id = typeof materialId === 'string' && materialId.startsWith('m-') 
				? materialId.substring(2) 
				: materialId;

			const response = await request<Response>(`/materials/${id}/download`);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			
			// Try to get filename from content-disposition
			const contentDisposition = response.headers.get('content-disposition');
			let filename = 'download';
			if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
				filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
			}
			
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		},
		downloadSubmissionZip: async (submissionId: number, studentName: string): Promise<void> => {
			const response = await request<Response>(`/submissions/${submissionId}/download-zip`);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			
			// Format name: Jan Kowalski -> Jan_Kowalski.zip
			const formattedName = studentName.replace(/\s+/g, '_');
			a.download = `${formattedName}.zip`;
			
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		},
	},
	submissions: {
		submitTask: async (
			taskId: string | number,
			studentId: number,
			files: File[],
		): Promise<any> => {
			const id = typeof taskId === 'string' && taskId.startsWith('t-') 
				? taskId.substring(2) 
				: taskId;

			const formData = new FormData();
			files.forEach(file => {
				formData.append('files', file);
			});
			formData.append('studentId', studentId.toString());

			return request(`/submissions/${id}/submit`, {
				method: 'POST',
				body: formData,
			});
		},
		deleteFile: async (fileId: number): Promise<void> => {
			await request(`/submissions/files/${fileId}`, {
				method: 'DELETE',
			});
		},
		getTaskSubmissions: async (taskId: string | number, studentId: number): Promise<any> => {
			const id = typeof taskId === 'string' && taskId.startsWith('t-') 
				? taskId.substring(2) 
				: taskId;
			return request(`/submissions/${id}/my-files?studentId=${studentId}`);
		},
		getAllTaskSubmissions: async (taskId: string | number): Promise<any[]> => {
			const id = typeof taskId === 'string' && taskId.startsWith('t-') 
				? taskId.substring(2) 
				: taskId;
			return request<any[]>(`/submissions/task/${id}`);
		},
	},
};
