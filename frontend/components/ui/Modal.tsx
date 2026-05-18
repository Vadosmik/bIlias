'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size = 'md',
}: ModalProps) {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			window.addEventListener('keydown', handleEsc);
		}
		return () => {
			document.body.style.overflow = 'unset';
			window.removeEventListener('keydown', handleEsc);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-xl',
		lg: 'max-w-3xl',
		xl: 'max-w-5xl',
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-brand-navy/60 backdrop-blur-sm animate-in fade-in duration-300 h-screen'
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div
				className={cn(
					'relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-full',
					sizeClasses[size],
				)}>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-brand-gray/10'>
					<h3 className='text-xl font-bold text-brand-navy'>{title}</h3>
					<button
						onClick={onClose}
						className='p-2 hover:bg-brand-light rounded-full transition-colors text-muted-foreground'>
						<X className='w-5 h-5' />
					</button>
				</div>

				{/* Body */}
				<div className='p-6 overflow-y-auto'>{children}</div>

				{/* Footer */}
				{footer && (
					<div className='p-6 border-t border-brand-gray/10 bg-brand-light/30 flex justify-end gap-3'>
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
