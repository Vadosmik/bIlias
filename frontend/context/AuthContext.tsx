'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'student' | 'teacher' | 'admin';

interface User {
	id: string;
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
		// Mock check for session
		const mockUser: User = {
			id: '1',
			firstName: 'Jan',
			lastName: 'Kowalski',
			email: 'jan.kowalski@student.umg.edu.pl',
			// role: 'teacher',
			role: 'student',
			department: 'Wydział Elektryczny',
			semester: 6,
		};

		setUser(mockUser);
		setIsLoading(false);
	}, []);

	const login = (email: string, role: UserRole) => {
		setUser({
			id: '1',
			firstName: role === 'teacher' ? 'Dr inż. Adam' : 'Jan',
			lastName: role === 'teacher' ? 'Nowak' : 'Kowalski',
			email,
			role,
			department: 'Wydział Elektryczny',
			semester: role === 'student' ? 6 : undefined,
		});
	};

	const logout = () => {
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
