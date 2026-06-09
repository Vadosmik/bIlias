'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	Loader2,
	Mail,
	Lock,
	User,
	AlertCircle,
	CheckCircle2,
} from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { api } from '@/lib/api';

export default function RegisterPage() {
	const router = useRouter();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<'student' | 'wykladowca'>('student');
	const [accepted, setAccepted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const cleanEmail = email.trim().toLowerCase();
		const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)*umg\.edu\.pl$/;
		const nameRegex = /^[A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ]{3,}$/;
		const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

		if (!nameRegex.test(firstName)) {
			setError('Imię powinno zawierać tylko litery (min. 3)');
			return;
		}

		if (!nameRegex.test(lastName)) {
			setError('Nazwisko powinno zawierać tylko litery (min. 3)');
			return;
		}

		if (!emailRegex.test(cleanEmail)) {
			setError('Użyj oficjalnego maila UMG (@umg.edu.pl)');
			return;
		}

		if (!passwordRegex.test(password)) {
			setError('Hasło nie spełnia wymagań (8 znaków, wielka litera, cyfra)');
			return;
		}

		if (!accepted) {
			setError('Musisz zaakceptować regulamin platformy');
			return;
		}
		setLoading(true);

		try {
			const roleToSend = role === 'wykladowca' ? 'prowadzacy' : 'student';
			await api.auth.register({
				email: cleanEmail,
				password,
				imie: firstName,
				nazwisko: lastName,
				role: roleToSend,
			});
			router.push('/login');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Wystąpił błąd');
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthShell
			title='Załóż konto'
			subtitle='Dołącz do platformy bIlias w mniej niż minutę'
			footer={
				<span className='text-muted-foreground'>
					Masz już konto?{' '}
					<Link
						href='/login'
						className='font-semibold text-primary hover:underline'>
						Zaloguj się
					</Link>
				</span>
			}>
			<form onSubmit={handleSubmit} className='space-y-4' noValidate>
				{/* Role toggle */}
				<div>
					<span className='mb-1.5 block text-sm font-medium'>Jestem</span>
					<div className='grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-1'>
						{(['student', 'wykladowca'] as const).map(r => (
							<button
								key={r}
								type='button'
								onClick={() => setRole(r)}
								className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
									role === r
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}>
								{r === 'student' ? 'Studentem' : 'Wykładowcą'}
							</button>
						))}
					</div>
				</div>

				<div className='grid grid-cols-2 gap-3'>
					<Field
						icon={<User className='h-4 w-4' />}
						label='Imię'
						value={firstName}
						onChange={setFirstName}
						placeholder='Jan'
						autoComplete='given-name'
						required
					/>
					<Field
						icon={<User className='h-4 w-4' />}
						label='Nazwisko'
						value={lastName}
						onChange={setLastName}
						placeholder='Kowalski'
						autoComplete='family-name'
						required
					/>
				</div>

				<Field
					icon={<Mail className='h-4 w-4' />}
					type='email'
					label='E-mail uczelniany'
					value={email}
					onChange={setEmail}
					placeholder='twoj.mail@umg.edu.pl'
					autoComplete='email'
					required
				/>

				<Field
					icon={<Lock className='h-4 w-4' />}
					type='password'
					label='Hasło'
					value={password}
					onChange={setPassword}
					placeholder='Min. 8 znaków'
					autoComplete='new-password'
					required
				/>
				<PasswordStrength value={password} />

				<label className='flex items-start gap-2 text-sm text-muted-foreground'>
					<input
						type='checkbox'
						checked={accepted}
						onChange={e => setAccepted(e.target.checked)}
						className='mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/20'
					/>
					<span>
						Akceptuję regulamin oraz politykę prywatności platformy bIlias UMG.
					</span>
				</label>

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
					{loading ? 'Tworzenie konta...' : 'Załóż konto'}
				</button>
			</form>
		</AuthShell>
	);
}

function PasswordStrength({ value }: { value: string }) {
	const checks = [
		{ label: 'Min. 8 znaków', ok: value.length >= 8 },
		{ label: 'Wielka litera', ok: /[A-Z]/.test(value) },
		{ label: 'Cyfra', ok: /\d/.test(value) },
	];
	if (!value) return null;
	return (
		<div className='flex flex-wrap gap-x-3 gap-y-1 text-xs'>
			{checks.map(c => (
				<span
					key={c.label}
					className={`flex items-center gap-1 ${c.ok ? 'text-primary' : 'text-muted-foreground'}`}>
					<CheckCircle2 className={`h-3 w-3 ${c.ok ? '' : 'opacity-40'}`} />
					{c.label}
				</span>
			))}
		</div>
	);
}

function Field({
	icon,
	label,
	type = 'text',
	value,
	onChange,
	placeholder,
	autoComplete,
	required,
}: {
	icon: React.ReactNode;
	label: string;
	type?: string;
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
