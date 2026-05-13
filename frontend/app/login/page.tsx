'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z.]*umg\.edu\.pl$/;
		console.log(!emailRegex.test(email));
		if (!emailRegex.test(email)) {
			setError('Wprowadź poprawny adres e-mail (np. twoj.mail@umg.edu.pl)');
			return;
		}

		setLoading(true);

		try {
			const user = await api.auth.login(email, password);
			login(email, user.role);
			router.push('/dashboard');
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Błąd połączenia z serwerem',
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthShell
			title='Witaj ponownie'
			subtitle='Zaloguj się do swojego konta bIlias'
			footer={
				<span className='text-muted-foreground'>
					Nie masz jeszcze konta?{' '}
					<Link
						href='/register'
						className='font-semibold text-primary hover:underline'>
						Załóż konto
					</Link>
				</span>
			}>
			<form onSubmit={handleSubmit} className='space-y-4' noValidate>
				<Field
					icon={<Mail className='h-4 w-4' />}
					label='E-mail uczelniany'
					type='email'
					value={email}
					onChange={setEmail}
					placeholder='twoj.email@umg.edu.pl'
					autoComplete='email'
					required
				/>
				<div>
					<Field
						icon={<Lock className='h-4 w-4' />}
						label='Hasło'
						type='password'
						value={password}
						onChange={setPassword}
						placeholder='Twoje hasło'
						autoComplete='current-password'
						required
					/>
					<div className='mt-2 text-right'>
						<Link
							href='/forgot-password'
							className='text-xs font-medium text-muted-foreground hover:text-foreground'>
							Zapomniałeś hasła?
						</Link>
					</div>
				</div>

				{error && (
					<div className='flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
						<AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
						<span>{error}</span>
					</div>
				)}

				<button
					type='submit'
					disabled={loading}
					className='flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-brand-sm transition-all hover:opacity-90 disabled:opacity-60'>
					{loading ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
					{loading ? 'Logowanie...' : 'Zaloguj się'}
				</button>
			</form>
		</AuthShell>
	);
}

function Field({
	icon,
	label,
	type,
	value,
	onChange,
	placeholder,
	autoComplete,
	required,
}: {
	icon: React.ReactNode;
	label: string;
	type: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	autoComplete?: string;
	required?: boolean;
}) {
	return (
		<label className='block'>
			<span className='mb-1.5 block text-sm font-medium text-foreground'>
				{label}
			</span>
			<div className='relative'>
				<div className='pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground'>
					{icon}
				</div>
				<input
					type={type}
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					autoComplete={autoComplete}
					required={required}
					className='h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
				/>
			</div>
		</label>
	);
}
