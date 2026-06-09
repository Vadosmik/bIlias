export interface TimetableEntry {
  id: number;
  kursId: number;
  dzienId: number;
  godzinaOd: string;
  godzinaDo: string;
  salaId: number | null;
  prowadzacyId: number | null;
  wydzialId: number;
  kierunekId: number;
  specjalizacjaId: number | null;
  grupaOznaczenie: string | null;
  typZajec: 'wyklad' | 'cwiczenia' | 'laboratorium' | 'projekt' | 'seminarium';
  aktywny: boolean;
  utworzono: Date;
}

export interface TimetableEntryWithDetails extends TimetableEntry {
  kurs: {
    id: number;
    nazwa: string;
  } | null;
  dzien: {
    id: number;
    nazwa: string;
  } | null;
  sala: {
    id: number;
    budynek: string;
    numer: string;
  } | null;
  prowadzacy: {
    id: number;
    imie: string;
    nazwisko: string;
  } | null;
  wydzial: {
    id: number;
    nazwa: string;
  } | null;
  kierunek: {
    id: number;
    nazwa: string;
  } | null;
  specjalizacja: {
    id: number;
    nazwa: string;
  } | null;
}

export interface TimetableGrid {
  dni: Array<{
    id: number;
    nazwa: string;
  }>;
  godziny: string[];
  typyZajec: string[];
}

export interface TimetableSearchParams {
  q?: string;
  typ?: 'student' | 'prowadzacy' | 'sala';
  wydzialId?: number;
  kierunekId?: number;
  specjalizacjaId?: number;
  prowadzacyId?: number;
  salaId?: number;
  tydzien?: number;
  rok?: number;
}

export interface CreateTimetableInput {
  kursId: number;
  dzienId: number;
  godzinaOd: string;
  godzinaDo: string;
  salaId?: number | null;
  prowadzacyId?: number | null;
  wydzialId: number;
  kierunekId: number;
  specjalizacjaId?: number | null;
  grupaOznaczenie?: string | null;
  typZajec: 'wyklad' | 'cwiczenia' | 'laboratorium' | 'projekt' | 'seminarium';
}

export interface UpdateTimetableInput {
  kursId?: number;
  dzienId?: number;
  godzinaOd?: string;
  godzinaDo?: string;
  salaId?: number | null;
  prowadzacyId?: number | null;
  grupaOznaczenie?: string | null;
  typZajec?: 'wyklad' | 'cwiczenia' | 'laboratorium' | 'projekt' | 'seminarium';
}