export interface Course {
  id: number;
  organizacja_id: number | null;
  nazwa: string;
  opis: string | null;
  ects: number;
  typ_kursu_id: number | null;
  semestr: number;
  rok_start: number;
  rok_koniec: number;
  utworzono: Date;
}
