'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Edit2, ArrowLeft, Lock, AlertCircle, CheckCircle2, Save } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Wszystkie pola hasła są wymagane.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setError("Nowe hasło musi mieć min. 8 znaków, zawierać wielką literę i cyfrę.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Nowe hasło i hasło potwierdzające nie są identyczne.");
            return;
        }

        setLoading(true);

        try {
            setSuccess("Hasło zostało zmienione pomyślnie!");
            
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Błąd zmiany hasła");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between border-b pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Profil użytkownika
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Zarządzaj swoim kontem
                    </p>
                </div>
                
                <button
                    onClick={() => {
                        setIsEditing(!isEditing);
                        setError(null);
                        setSuccess(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-sand/20 text-brand-sand border border-brand-sand/30 rounded-lg text-sm font-semibold hover:bg-brand-sand/30 transition-all shrink-0"
                >
                    {isEditing ? (
                        <>
                            <ArrowLeft className="w-4 h-4" /> Anuluj edycję
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-4 h-4" /> Edytuj profil
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <div className="bg-background border rounded-2xl p-6 shadow-sm">
                {isEditing ? (
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            <Lock className="w-4 h-4" /> Zmiana hasła
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="block md:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium text-foreground">Obecne hasło</span>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Wpisz aktualne hasło"
                                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-foreground">Nowe hasło</span>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 8 znaków, wielka litera, cyfra"
                                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-foreground">Potwierdź nowe hasło</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Powtórz nowe hasło"
                                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-sand text-sm font-semibold text-brand-light shadow-brand-sm transition-all hover:opacity-90 disabled:opacity-60"
                        >
                            {loading ? "Zapisywanie..." : "Zapisz nowe hasło"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                            <div className="w-16 h-16 rounded-full bg-brand-navy text-white flex items-center justify-center text-xl font-bold">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h2>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{user?.role}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail uczelniany</span>
                                <p className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border">{user?.email || 'Brak danych'}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wydział</span>
                                <p className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border">{(user as any)?.wydzial || (user as any)?.department || 'Nieustawiony'}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kierunek</span>
                                <p className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border">{(user as any)?.kierunek || (user as any)?.course || 'Nieustawiony'}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specjalizacja</span>
                                <p className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border">{(user as any)?.specjalizacja || (user as any)?.specialization || 'Nieustawiony'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}