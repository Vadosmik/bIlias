import Image from 'next/image';
import Link from 'next/link';
import logo from '../public/images/Bilias.svg';

export function SiteHeader() {
	return (
		<header className='sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container mx-auto flex h-16 items-center justify-between px-6'>
				<Link href='/' className='flex items-center gap-2'>
					<Image src={logo} alt='bIlias' height={40} />
				</Link>
				<nav className='flex items-center gap-6'>
					<Link
						href='/login'
						className='text-sm font-medium hover:text-primary transition-colors'>
						Zaloguj się
					</Link>
					<Link
						href='/register'
						className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-all'>
						Załóż konto
					</Link>
				</nav>
			</div>
		</header>
	);
}