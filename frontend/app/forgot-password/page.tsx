"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { mockApi } from "@/lib/mockApi";

export default function ForgotPasswordPage() {
  /*
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await mockApi.resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }
  */

  return (
    <AuthShell
      title="Reset hasła"
      // subtitle="Podaj swój uczelniany e-mail, a wyślemy link do ustawienia nowego hasła."
      subtitle="Odzwyskiwanie dostępu do konta."
      footer={
        <span className="text-muted-foreground">
          Pamiętasz hasło?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Wróć do logowania
          </Link>
        </span>
      }
    >
      <div className="py-4 text-center">
        <p className="text-sm text-foreground">
          Skontaktuj się z <strong className="text-primary">admin@umg.edu.pl</strong>
        </p>
      </div>

      {/*
      {sent ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <p className="mt-3 font-semibold text-foreground">Sprawdź swoją skrzynkę</p>
          <p className="mt-1 text-muted-foreground">
            Wysłaliśmy link do resetu hasła na adres <strong>{email}</strong>.
            Link wygasa po 30 minutach.
          </p>
        </div>
      ) : (
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail uczelniany</span>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="imie.nazwisko@umg.edu.pl"
                autoComplete="email"
                required
                className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-brand-sm transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </button>
        </form>
      )}
        */}
    </AuthShell>
  );
}
