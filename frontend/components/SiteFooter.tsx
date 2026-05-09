import Link from 'next/link';
import Image from 'next/image';
import logo from '../public/images/Bilias.svg';

export function SiteFooter() {
	return (
		<footer className='border-t border-border bg-[#F8FAFC] py-16'>
			<div className='container mx-auto px-6'>
				<div className='grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-24'>
					{/* Kolumna 1: Logo i opis */}
					<div className='space-y-6'>
						<div className='flex items-center gap-2'>
							{/* Miejsce na Twoje logo - wrzuć plik do public/icons/logo-bilias.svg */}
							<div className='relative overflow-hidden'>
								<Image
									src={logo}
									alt='bIlias Logo'
									className='object-contain'
									height={130}
									// Jeśli nie masz jeszcze pliku, wyświetlimy placeholder
									onError={e => {
										const target = e.target as HTMLImageElement;
										target.style.display = 'none';
										target.parentElement!.classList.add(
											'flex',
											'items-center',
											'justify-center',
											'rounded-full',
											'border-2',
											'border-primary',
											'text-primary',
											'font-bold',
										);
										target.parentElement!.innerText = 'B';
									}}
								/>
							</div>
						</div>
						<p className='max-w-xs text-sm leading-relaxed text-muted-foreground'>
							Nowoczesna platforma e-learningowa Uniwersytetu Morskiego w Gdyni.
							Wspiera proces dydaktyczny i komunikację akademicką.
						</p>
					</div>

					{/* Kolumna 2: Platforma */}
					<div>
						<h3 className='mb-6 text-sm font-bold uppercase tracking-wider text-[#002B63]'>
							Platforma
						</h3>
						<ul className='space-y-4'>
							{[
								'Materiały dydaktyczne',
								'Plan zajęć',
								'Oceny i zadania',
								'Komunikacja',
							].map(item => (
								<li key={item}>
									<Link
										href='#'
										className='text-sm text-muted-foreground hover:text-primary transition-colors'>
										{item}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Kolumna 3: Uczelnia */}
					<div>
						<h3 className='mb-6 text-sm font-bold uppercase tracking-wider text-[#002B63]'>
							Uczelnia
						</h3>
						<ul className='space-y-4'>
							{[
								{
									name: 'Uniwersytet Morski w Gdyni',
									href: 'https://umg.edu.pl',
								},
								{ name: 'umg.edu.pl', href: 'https://umg.edu.pl' },
								{ name: 'Dziekanat', href: '#' },
								{ name: 'Parlament Studencki', href: '#' },
							].map(item => (
								<li key={item.name}>
									<Link
										href={item.href}
										className='text-sm text-muted-foreground hover:text-primary transition-colors'>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Dolny pasek */}
				<div className='mt-16 border-t border-border pt-8 flex flex-col items-center justify-between gap-4 md:flex-row text-[12px] text-muted-foreground/70'>
					<p>© 2026 bIlias · Projekt zespołu studenckiego UMG</p>
					<p>v1.0 · Faza inicjalizacji projektu</p>
				</div>
			</div>
		</footer>
	);
}