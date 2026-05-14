'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export type UserRole =
	| 'student'
	| 'admin_uczelni'
	| 'dziekan'
	| 'prowadzacy'
	| 'super_admin';

interface User {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	role: UserRole;
	department?: string;
	semester?: number;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		const token = localStorage.getItem('token');

		if (storedUser && token) {
			const parsedUser = JSON.parse(storedUser);
			setUser({
				id: parsedUser.id,
				firstName: parsedUser.imie || parsedUser.firstName,
				lastName: parsedUser.nazwisko || parsedUser.lastName,
				email: parsedUser.email,
				role: parsedUser.role || 'student',
				department: parsedUser.department,
				semester: parsedUser.semester,
			});
		}
		setIsLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		const userData = await api.auth.login(email, password);
		setUser({
			id: userData.id,
			firstName: userData.imie,
			lastName: userData.nazwisko,
			email: userData.email,
			role: userData.role || 'student',
			department: userData.department,
			semester: userData.semester,
		});
	};

	const logout = () => {
		api.auth.logout();
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
