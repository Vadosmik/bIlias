'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export type UserRole = 'student' | 'teacher' | 'admin';

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
	login: (email: string, role: UserRole) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const stored = localStorage.getItem('user');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setUser({
					...parsed,
					firstName: parsed.imie,
					lastName: parsed.nazwisko,
				});
			} catch {
				localStorage.removeItem('user');
				localStorage.removeItem('token');
			}
		}
		setIsLoading(false);
	}, []);

	const login = (email: string, role: UserRole) => {
		const stored = localStorage.getItem('user');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setUser({
					...parsed,
					firstName: parsed.imie,
					lastName: parsed.nazwisko,
				});
				return;
			} catch {}
		}
		setUser({
			id: 0,
			firstName: role === 'teacher' ? 'Dr inż. Adam' : 'Jan',
			lastName: role === 'teacher' ? 'Nowak' : 'Kowalski',
			email,
			role,
			department: 'Wydział Elektryczny',
			semester: role === 'student' ? 6 : undefined,
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
