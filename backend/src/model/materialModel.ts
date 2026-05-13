export interface Material {
  id: number;
  kurs_id: number;
  tytul: string;
  sciezka_pliku: string;
  typ_pliku_id: number | null;
  wersja: number;
  rozmiar: number | null;
  mime_type: string | null;
  deleted_at: Date | null;
  utworzono: Date;
}

export interface TypPliku {
  id: number;
  nazwa: string;
}

export interface Zadanie {
  id: number;
  kurs_id: number;
  tytul: string;
  opis: string | null;
  typ_zadania_id: number | null;
  max_punkty: number;
  termin_oddania: Date;
  status_id: number | null;
  utworzono: Date;
}

export interface MaterialItem {
  id: string;
  type: 'folder' | 'file' | 'task';
  name: string;
  format?: string;
  size?: string;
  deadline?: string;
  description?: string;
  children?: MaterialItem[];
}