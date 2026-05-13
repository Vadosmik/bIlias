const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...options.headers,
	};

	const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
	id: number;
	type: 'folder' | 'file' | 'task';
	name: string;
	format?: string;
	size?: string;
	deadline?: string;
	description?: string;
	children?: Material[];
}

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
	materials: {
		getByCourseId: async (courseId: number): Promise<Material[]> => {
			return request<Material[]>(`/courses/${courseId}/materials`);
		},
	},
};
