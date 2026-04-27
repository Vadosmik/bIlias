'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Upload } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { Users } from 'lucide-react';
import { ClipboardList } from 'lucide-react';
import { Settings } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import latarnia from '../public/images/latarnia.svg';

const features = [
	{
		icon: BookOpen,
		title: 'Centralne materiały',
		desc: 'Wszystkie pliki kursów w jednym miejscu — PDF, DOCX, PPTX, ZIP, materiały multimedialne.',
	},
	{
		icon: Upload,
		title: 'Wysyłanie zadań',
		desc: 'Prześlij pracę z dowolnego urządzenia. System od razu zweryfikuje format i termin.',
	},
	{
		icon: ClipboardList,
		title: 'Oceny i feedback',
		desc: 'Wykładowca ocenia w panelu, Ty widzisz wynik i komentarz natychmiast po zatwierdzeniu.',
	},
	{
		icon: Calendar,
		title: 'Plan zajęć',
		desc: 'Aktualny harmonogram zawsze pod ręką, z powiadomieniami o zmianach sal i terminów.',
	},
	{
		icon: MessageSquare,
		title: 'Komunikacja',
		desc: 'Wiadomości bezpośrednie, ogłoszenia dziekanatu i wydarzenia Parlamentu Studenckiego.',
	},
	{
		icon: ShieldCheck,
		title: 'Bezpieczeństwo',
		desc: 'Hasła szyfrowane bcrypt, role RBAC, sesje JWT. Twoje dane są chronione.',
	},
];

const personas = [
	{
		icon: GraduationCap,
		title: 'Student',
		tagline: 'Cyfrowy tubylec',
		desc: 'Szybki dostęp do materiałów na telefonie. Maksymalnie 3 kliknięcia do każdego pliku.',
	},
	{
		icon: Users,
		title: 'Wykładowca',
		tagline: 'Praktyk dydaktyki',
		desc: 'Czytelny dashboard, masowe ocenianie, łatwy upload materiałów bez 50-stronicowej instrukcji.',
	},
	{
		icon: Calendar,
		title: 'Planista',
		tagline: 'Edycja drag & drop',
		desc: 'Intuicyjne ustawianie planu zajęć z automatycznym powiadamianiem grup o zmianach.',
	},
	{
		icon: Settings,
		title: 'Administrator',
		tagline: 'Pełna kontrola',
		desc: 'Import użytkowników z CSV, monitoring obciążenia serwera, zarządzanie zasobami.',
	},
];

export default function Home() {
	return (
		<div className='flex min-h-screen flex-col'>
			<SiteHeader />

			<main className='flex-1'>
				{/* HERO */}
				<section className='relative overflow-hidden gradient-navy-radial'>
					<div
						className='absolute inset-0 opacity-[0.07]'
						style={{
							backgroundImage:
								'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
							backgroundSize: '32px 32px',
						}}
					/>
					<div className='relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28'>
						<div>
							<span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur'>
								<Sparkles
									className='h-3.5 w-3.5'
									style={{ color: 'var(--brand-sand)' }}
								/>
								Uniwersytet Morski w Gdyni
							</span>
							<h1 className='mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white lg:text-6xl'>
								Nauka bez bariery.
								<br />
								<span
									className='font-serif-brand italic'
									style={{ color: 'var(--brand-sand)' }}>
									Po prostu działa.
								</span>
							</h1>
							<p className='mt-6 max-w-lg text-lg text-white/75'>
								bIlias to nowoczesna platforma e-learningowa stworzona przez
								studentów dla studentów. Materiały, zadania, oceny i plan zajęć
								— wszystko w maksymalnie 3 kliknięciach.
							</p>
							<div className='mt-8 flex flex-wrap gap-3'>
								<Link
									href='/register'
									className='group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-brand transition-all hover:scale-[1.02]'
									style={{
										backgroundColor: 'var(--brand-sand)',
										color: 'var(--brand-navy)',
									}}>
									Załóż konto studenta
									<ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
								</Link>
								<Link
									href='/login'
									className='inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10'>
									Zaloguj się
								</Link>
							</div>
							<div className='mt-10 flex items-center gap-6 text-xs text-white/60'>
								<div>
									<div className='text-2xl font-bold text-white'>3</div>
									<div>kliknięcia max</div>
								</div>
								<div className='h-8 w-px bg-white/15' />
								<div>
									<div className='text-2xl font-bold text-white'>99.9%</div>
									<div>spójność danych</div>
								</div>
								<div className='h-8 w-px bg-white/15' />
								<div>
									<div className='text-2xl font-bold text-white'>RWD</div>
									<div>desktop + mobile</div>
								</div>
							</div>
						</div>
						<div className='relative'>
							<div className='absolute -inset-4 rounded-3xl bg-white/5 blur-2xl' />
							<div className='relative aspect-[3/2] w-full overflow-hidden shadow-brand justify-center items-center flex'>
								<Image
									src={latarnia}
									alt='Ilustracja platformy bIlias'
									height={380}
									className='object-cover'
									priority
									onError={e => {
										const target = e.target as HTMLImageElement;
										target.style.display = 'none';
										target.parentElement!.innerHTML =
											'<div class="flex h-full w-full items-center justify-center bg-white/10 text-white/20 italic text-sm text-center px-4">Wgraj zdjęcie do public/images/hero-bilias.jpg</div>';
									}}
								/>
							</div>
						</div>
					</div>
				</section>

				{/* FEATURES */}
				<section id='funkcje' className='mx-auto max-w-7xl px-6 py-20 lg:py-28'>
					<div className='mx-auto max-w-2xl text-center'>
						<span className='text-xs font-semibold uppercase tracking-widest text-secondary-foreground/70'>
							Funkcjonalności
						</span>
						<h2 className='mt-3 text-balance text-4xl font-bold tracking-tight lg:text-5xl'>
							Wszystko, czego potrzebuje
							<span className='font-serif-brand italic text-primary'>
								{' '}
								akademia
							</span>
							.
						</h2>
						<p className='mt-4 text-muted-foreground'>
							Sześć filarów bIlias, zaprojektowanych w odpowiedzi na realne
							potrzeby społeczności UMG.
						</p>
					</div>

					<div className='mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{features.map(f => (
							<div
								key={f.title}
								className='group rounded-2xl border border-border bg-card p-6 transition-all'>
								<div
									className='flex h-11 w-11 items-center justify-center rounded-lg transition-transform'
									style={{ backgroundColor: 'var(--brand-sand)' }}>
									<f.icon
										className='h-5 w-5'
										style={{ color: 'var(--brand-navy)' }}
									/>
								</div>
								<h3 className='mt-5 text-lg font-semibold'>{f.title}</h3>
								<p className='mt-2 text-sm text-muted-foreground'>{f.desc}</p>
							</div>
						))}
					</div>
				</section>

				{/* PERSONAS */}
				<section
					id='dla-kogo'
					className='border-y border-border bg-muted/40 py-20 lg:py-28'>
					<div className='mx-auto max-w-7xl px-6'>
						<div className='grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start'>
							<div className='lg:sticky lg:top-24'>
								<span className='text-xs font-semibold uppercase tracking-widest text-secondary-foreground/70'>
									Dla kogo
								</span>
								<h2 className='mt-3 text-balance text-4xl font-bold tracking-tight'>
									Cztery role.
									<br />
									<span className='font-serif-brand italic text-primary'>
										Jeden ekosystem.
									</span>
								</h2>
								<p className='mt-4 text-muted-foreground'>
									bIlias projektowany jest z myślą o realnych użytkownikach UMG
									— od studenta pierwszego roku po administratora systemu.
								</p>
							</div>
							<div className='grid gap-4 sm:grid-cols-2'>
								{personas.map(p => (
									<div
										key={p.title}
										className='rounded-2xl border border-border bg-card p-6 shadow-brand-sm'>
										<p.icon className='h-7 w-7 text-primary' />
										<h3 className='mt-4 text-xl font-semibold'>{p.title}</h3>
										<p
											className='font-serif-brand text-sm italic'
											style={{ color: 'var(--brand-sand)' }}>
											„{p.tagline}"
										</p>
										<p className='mt-3 text-sm text-muted-foreground'>
											{p.desc}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* TEAM */}
				<section id='zespol' className='mx-auto max-w-7xl px-6 py-20 lg:py-28'>
					<div className='mx-auto max-w-2xl text-center'>
						<span className='text-xs font-semibold uppercase tracking-widest text-secondary-foreground/70'>
							Zespół projektowy
						</span>
						<h2 className='mt-3 text-balance text-4xl font-bold tracking-tight'>
							Sześcioro studentów.
							<br />
							<span className='font-serif-brand italic text-primary'>
								Jedna wizja.
							</span>
						</h2>
					</div>
					<div className='mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
						{[
							{ name: 'Tomasz Papierowski', role: 'Lider · Baza danych' },
							{ name: 'Sofiia Stankevych', role: 'Analiza · Backend' },
							{ name: 'Krystian Synakowski', role: 'Analiza · Backend' },
							{ name: 'Kacper Szamszon', role: 'UI/UX · Frontend' },
							{ name: 'Monika Szczepańska', role: 'UI/UX · Frontend · Tester' },
							{ name: 'Vadzim Mikanovich', role: 'Architektura · DevOps' },
						].map(m => (
							<div
								key={m.name}
								className='flex items-center gap-4 rounded-xl border border-border bg-card p-4'>
								<div
									className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold'
									style={{
										backgroundColor: 'var(--brand-navy)',
										color: 'var(--brand-sand)',
									}}>
									{m.name
										.split(' ')
										.map(n => n[0])
										.join('')}
								</div>
								<div>
									<div className='text-sm font-semibold'>{m.name}</div>
									<div className='text-xs text-muted-foreground'>{m.role}</div>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* CTA */}
				<section className='mx-auto max-w-7xl px-6 pb-20'>
					<div className='relative overflow-hidden rounded-3xl gradient-navy p-10 text-center lg:p-16'>
						<div
							className='absolute inset-0 opacity-10'
							style={{
								backgroundImage:
									'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
								backgroundSize: '24px 24px',
							}}
						/>
						<div className='relative'>
							<h2 className='text-balance text-4xl font-bold tracking-tight text-white lg:text-5xl'>
								Gotowy, by zacząć?
							</h2>
							<p className='mx-auto mt-4 max-w-xl text-white/70'>
								Dołącz do platformy i przekonaj się, jak wygląda nauka bez
								frustracji.
							</p>
							<Link
								href='/register'
								className='mt-8 inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold shadow-brand transition-all hover:scale-[1.02]'
								style={{
									backgroundColor: 'var(--brand-sand)',
									color: 'var(--brand-navy)',
								}}>
								Załóż konto
								<ArrowRight className='h-4 w-4' />
							</Link>
						</div>
					</div>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}
