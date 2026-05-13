-- =========================
-- EXTENSIONS
-- =========================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================
-- MULTI-TENANCY (ORGANIZACJE)
-- =========================

CREATE TABLE organizacje (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL UNIQUE,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- SŁOWNIKI
-- =========================

CREATE TABLE status_zapisu_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE status_przeslania_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE status_wiadomosci_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE status_zadania_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE typ_kursu_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE typ_pliku_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE typ_zadania_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE typ_aktualnosci_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE dzien_tygodnia_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(20) UNIQUE NOT NULL
);

-- =========================
-- ROLE SYSTEM (RBAC GLOBAL + KURSOWY)
-- =========================

CREATE TABLE role (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE uzytkownicy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizacja_id INT REFERENCES organizacje(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_hasla VARCHAR(255) NOT NULL,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    aktywny BOOLEAN DEFAULT TRUE,
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    zaktualizowano TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE uzytkownik_role (
    user_id INT NOT NULL REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- RBAC per kurs
CREATE TABLE kurs_role (
    kurs_id INT NOT NULL,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (kurs_id, user_id, role_id)
);

-- =========================
-- KURSY
-- =========================

CREATE TABLE kursy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizacja_id INT REFERENCES organizacje(id) ON DELETE CASCADE,
    nazwa VARCHAR(255) NOT NULL,
    opis TEXT,
    ects INT DEFAULT 0 CHECK (ects >= 0),
    typ_kursu_id INT REFERENCES typ_kursu_slownik(id),
    semestr INT NOT NULL CHECK (semestr IN (1,2)),
    rok_start INT NOT NULL,
    rok_koniec INT NOT NULL,
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    CHECK (rok_koniec = rok_start + 1)
);

-- =========================
-- ZAPISY
-- =========================

CREATE TABLE zapisy (
    kurs_id INT REFERENCES kursy(id) ON DELETE CASCADE,
    student_id INT REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    status_id INT REFERENCES status_zapisu_slownik(id),
    zapisano TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (kurs_id, student_id)
);

-- =========================
-- MATERIAŁY (soft versioning logic)
-- =========================

CREATE TABLE materialy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT REFERENCES kursy(id) ON DELETE CASCADE,
    tytul VARCHAR(255) NOT NULL,
    sciezka_pliku TEXT NOT NULL,
    typ_pliku_id INT REFERENCES typ_pliku_slownik(id),
    wersja INT DEFAULT 1,
    rozmiar INT,
    mime_type VARCHAR(100),
    deleted_at TIMESTAMPTZ,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- ZADANIA
-- =========================

CREATE TABLE zadania (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT REFERENCES kursy(id) ON DELETE CASCADE,
    tytul VARCHAR(255) NOT NULL,
    opis TEXT,
    typ_zadania_id INT REFERENCES typ_zadania_slownik(id),
    max_punkty INT DEFAULT 0 CHECK (max_punkty >= 0),
    termin_oddania TIMESTAMPTZ NOT NULL,
    status_id INT REFERENCES status_zadania_slownik(id),
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- PRZESŁANIA
-- =========================

CREATE TABLE przeslania (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zadanie_id INT REFERENCES zadania(id) ON DELETE CASCADE,
    student_id INT REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    current_version INT DEFAULT 1,
    status_id INT REFERENCES status_przeslania_slownik(id),
    przeslano TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE przeslanie_wersje (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    przeslanie_id INT REFERENCES przeslania(id) ON DELETE CASCADE,
    sciezka_pliku TEXT NOT NULL,
    wersja INT NOT NULL,
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (przeslanie_id, wersja)
);

-- =========================
-- OCENY (HISTORIA + BRAK UNIQUE)
-- =========================

CREATE TABLE oceny (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    przeslanie_id INT REFERENCES przeslania(id) ON DELETE CASCADE,
    nauczyciel_id INT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    wartosc DECIMAL(3,1) NOT NULL CHECK (wartosc BETWEEN 2 AND 5),
    komentarz TEXT,
    wersja INT DEFAULT 1,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- WIADOMOŚCI (THREAD + REPLY + READ RECEIPTS)
-- =========================

CREATE TABLE watki_wiadomosci (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

CREATE TABLE watek_uczestnicy (
    watek_id INT REFERENCES watki_wiadomosci(id) ON DELETE CASCADE,
    user_id INT REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    PRIMARY KEY (watek_id, user_id)
);

CREATE TABLE wiadomosci (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    watek_id INT REFERENCES watki_wiadomosci(id) ON DELETE CASCADE,
    nadawca_id INT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    parent_message_id INT REFERENCES wiadomosci(id) ON DELETE SET NULL,
    tresc TEXT NOT NULL,
    status_id INT REFERENCES status_wiadomosci_slownik(id),
    wyslano TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wiadomosci_odczyt (
    wiadomosc_id INT REFERENCES wiadomosci(id) ON DELETE CASCADE,
    user_id INT REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    odczytano TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (wiadomosc_id, user_id)
);

-- =========================
-- HARMONOGRAM (BLOKADA OVERLAP)
-- =========================

CREATE TABLE harmonogramy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT REFERENCES kursy(id) ON DELETE CASCADE,
    dzien_id INT REFERENCES dzien_tygodnia_slownik(id),
    godzina_start TIME NOT NULL,
    godzina_koniec TIME NOT NULL,
    numer_sali VARCHAR(50),
    CHECK (godzina_koniec > godzina_start)
);

ALTER TABLE harmonogramy
ADD CONSTRAINT brak_nakladania_zajec
EXCLUDE USING gist (
    kurs_id WITH =,
    dzien_id WITH =,
    tsrange(
        (DATE '1970-01-01' + godzina_start), 
        (DATE '1970-01-01' + godzina_koniec)
    ) WITH &&
);

-- =========================
-- AKTUALNOŚCI
-- =========================

CREATE TABLE aktualnosci (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    autor_id INT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    typ_id INT REFERENCES typ_aktualnosci_slownik(id),
    tytul VARCHAR(255) NOT NULL,
    tresc TEXT NOT NULL,
    kurs_id INT REFERENCES kursy(id) ON DELETE CASCADE,
    opublikowano TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- AUDYT LOG
-- =========================

CREATE TABLE audit_log (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT REFERENCES uzytkownicy(id),
    akcja TEXT NOT NULL,
    encja TEXT NOT NULL,
    encja_id INT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- INDEKSY (POPRAWIONE)
-- =========================

CREATE INDEX idx_zapisy_student ON zapisy(student_id);
CREATE INDEX idx_zapisy_kurs ON zapisy(kurs_id);

CREATE INDEX idx_materialy_kurs ON materialy(kurs_id);

CREATE INDEX idx_zadania_kurs_termin ON zadania(kurs_id, termin_oddania);

CREATE INDEX idx_przeslania_zadanie_student ON przeslania(zadanie_id, student_id);

CREATE INDEX idx_wiadomosci_watek_time ON wiadomosci(watek_id, wyslano);

CREATE INDEX idx_wiadomosci_nadawca ON wiadomosci(nadawca_id);

CREATE INDEX idx_aktualnosci_kurs ON aktualnosci(kurs_id);

-- =========================
-- SEED DATA: ROLE (RBAC)
-- =========================
-- ========================================
-- PRZYKŁADOWE DANE TESTOWE DLA bIlias
-- ========================================
-- ----------------------------------------
-- 1. SŁOWNIKI (muszą być przed FK)
-- ----------------------------------------

INSERT INTO organizacje (nazwa) VALUES ('Uniwersytet Morski w Gdyni');

INSERT INTO status_zapisu_slownik (nazwa) VALUES
    ('aktywny'),
    ('zakończony'),
    ('w trakcie');

INSERT INTO status_przeslania_slownik (nazwa) VALUES
    ('oczekuje'),
    ('sprawdzone'),
    ('odbr reje');

INSERT INTO status_wiadomosci_slownik (nazwa) VALUES
    ('nowa'),
    ('przeczytana'),
    ('usunieta');

INSERT INTO status_zadania_slownik (nazwa) VALUES
    ('aktywne'),
    ('zakończone'),
    ('archiwalne');

INSERT INTO typ_kursu_slownik (nazwa) VALUES
    ('wykład'),
    ('laboratorium'),
    ('projekt');

INSERT INTO typ_pliku_slownik (nazwa) VALUES
    ('pdf'),
    ('docx'),
    ('zip'),
    ('txt');

INSERT INTO typ_zadania_slownik (nazwa) VALUES
    ('domowe'),
    ('laboratoryjne'),
    ('projektowe');

INSERT INTO typ_aktualnosci_slownik (nazwa) VALUES
    ('ogłoszenie'),
    ('zmiana'),
    ('przypomnienie');

INSERT INTO dzien_tygodnia_slownik (nazwa) VALUES
    ('Poniedziałek'),
    ('Wtorek'),
    ('Środa'),
    ('Czwartek'),
    ('Piątek');

-- ----------------------------------------
-- 2. ROLE (RBAC)
-- ----------------------------------------

INSERT INTO role (nazwa) VALUES
    ('student'),
    ('teacher'),
    ('admin');

-- ----------------------------------------
-- 3. UŻYTKOWNICY (hasła to bcrypt 'test1234')
-- ----------------------------------------

-- Teacher: jan.kowalski@umg.edu.pl / Test1234
INSERT INTO uzytkownicy (email, hash_hasla, imie, nazwisko, organizacja_id, aktywny) VALUES
('jan.kowalski@umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Jan', 'Kowalski', 1, true);

-- Student: anna.nowak@student.umg.edu.pl / Test1234
INSERT INTO uzytkownicy (email, hash_hasla, imie, nazwisko, organizacja_id, aktywny) VALUES
('anna.nowak@student.umg.edu.pl', '$2b$10$Yspcuf8tSyOUcUK.pNp.EepEdK1LsWxYODfAnRoqi7JQCYUhRREcy', 'Anna', 'Nowak', 1, true);

-- Student: piotr.zielinski@student.umg.edu.pl / Test1234
INSERT INTO uzytkownicy (email, hash_hasla, imie, nazwisko, organizacja_id, aktywny) VALUES
('piotr.zielinski@student.umg.edu.pl', '$2b$10$Yspcuf8tSyOUcUK.pNp.EepEdK1LsWxYODfAnRoqi7JQCYUhRREcy', 'Piotr', 'Zieliński', 1, true);

-- ----------------------------------------
-- 4. PRZYPISANIE ROL
-- ----------------------------------------

INSERT INTO uzytkownik_role (user_id, role_id)
SELECT u.id, r.id FROM uzytkownicy u, role r
WHERE u.email = 'jan.kowalski@umg.edu.pl' AND r.nazwa = 'teacher';

INSERT INTO uzytkownik_role (user_id, role_id)
SELECT u.id, r.id FROM uzytkownicy u, role r
WHERE u.email = 'anna.nowak@student.umg.edu.pl' AND r.nazwa = 'student';

INSERT INTO uzytkownik_role (user_id, role_id)
SELECT u.id, r.id FROM uzytkownicy u, role r
WHERE u.email = 'piotr.zielinski@student.umg.edu.pl' AND r.nazwa = 'student';

-- ----------------------------------------
-- 5. KURSY
-- ----------------------------------------

INSERT INTO kursy (organizacja_id, nazwa, opis, ects, semestr, rok_start, rok_koniec) VALUES
(1, 'Programowanie Obiektowe', 'Wprowadzenie do programowania obiektowego w C++ i Java. Studenci poznają zasady OOP: dziedziczenie, polimorfizm, enkapsulację.', 5, 1, 2025, 2026);

INSERT INTO kursy (organizacja_id, nazwa, opis, ects, semestr, rok_start, rok_koniec) VALUES
(1, 'Bazy Danych', 'Projektowanie relacyjnych baz danych, SQL, normalizacja, optymalizacja zapytań.', 4, 1, 2025, 2026);

INSERT INTO kursy (organizacja_id, nazwa, opis, ects, semestr, rok_start, rok_koniec) VALUES
(1, 'Matematyka Dyskretna', 'Logika, zbiory, kombinatoryka, teoria grafów i algorytmy grafowe.', 3, 1, 2025, 2026);

INSERT INTO kursy (organizacja_id, nazwa, opis, ects, semestr, rok_start, rok_koniec) VALUES
(1, 'Sieci Komputerowe', 'Architektura sieci OSI/TCP-IP, protokoły, bezpieczeństwo sieci.', 4, 2, 2025, 2026);

-- ----------------------------------------
-- 6. HARMONOGRAMY (opcjonalne)
-- ----------------------------------------

INSERT INTO harmonogramy (kurs_id, dzien_id, godzina_start, godzina_koniec, numer_sali) VALUES
(1, 1, '08:00', '10:00', 'Sala 101'),
(1, 3, '10:15', '12:00', 'Laboratorium L3'),
(2, 2, '08:00', '10:00', 'Sala 202'),
(2, 4, '10:15', '12:00', 'Laboratorium L1'),
(3, 1, '12:15', '14:00', 'Sala 105'),
(4, 2, '14:15', '16:00', 'Sala 301');

-- ----------------------------------------
-- 7. ZAPISY (enrollment)
-- ----------------------------------------

-- Jan Kowalski (teacher) prowadzi Kurs 1 i 2
-- Anna Nowak (student) zapisana na 1, 2, 3
-- Piotr Zieliński (student) zapisany na 1 i 2

INSERT INTO zapisy (kurs_id, student_id, status_id)
SELECT k.id, u.id, s.id FROM kursy k, uzytkownicy u, status_zapisu_slownik s
WHERE k.nazwa = 'Programowanie Obiektowe' AND u.email = 'anna.nowak@student.umg.edu.pl' AND s.nazwa = 'aktywny';

INSERT INTO zapisy (kurs_id, student_id, status_id)
SELECT k.id, u.id, s.id FROM kursy k, uzytkownicy u, status_zapisu_slownik s
WHERE k.nazwa = 'Bazy Danych' AND u.email = 'anna.nowak@student.umg.edu.pl' AND s.nazwa = 'aktywny';

INSERT INTO zapisy (kurs_id, student_id, status_id)
SELECT k.id, u.id, s.id FROM kursy k, uzytkownicy u, status_zapisu_slownik s
WHERE k.nazwa = 'Matematyka Dyskretna' AND u.email = 'anna.nowak@student.umg.edu.pl' AND s.nazwa = 'aktywny';

INSERT INTO zapisy (kurs_id, student_id, status_id)
SELECT k.id, u.id, s.id FROM kursy k, uzytkownicy u, status_zapisu_slownik s
WHERE k.nazwa = 'Programowanie Obiektowe' AND u.email = 'piotr.zielinski@student.umg.edu.pl' AND s.nazwa = 'aktywny';

INSERT INTO zapisy (kurs_id, student_id, status_id)
SELECT k.id, u.id, s.id FROM kursy k, uzytkownicy u, status_zapisu_slownik s
WHERE k.nazwa = 'Bazy Danych' AND u.email = 'piotr.zielinski@student.umg.edu.pl' AND s.nazwa = 'aktywny';

-- ----------------------------------------
-- 8. MATERIAŁY
-- ----------------------------------------

INSERT INTO materialy (kurs_id, tytul, sciezka_pliku, typ_pliku_id, rozmiar, mime_type) VALUES
(1, 'Wykład 1 - Wprowadzenie do OOP', '/materials/projektowanie/w1.pdf', 1, 1024000, 'application/pdf'),
(1, 'Wykład 2 - Klasy i Obiekty', '/materials/projektowanie/w2.pdf', 1, 2048000, 'application/pdf'),
(1, 'Wykład 3 - Dziedziczenie', '/materials/projektowanie/w3.pdf', 1, 1536000, 'application/pdf'),
(1, 'Laboratorium 1 - Zadania', '/materials/projektowanie/lab1.zip', 3, 512000, 'application/zip'),
(1, 'Laboratorium 2 - Zadania', '/materials/projektowanie/lab2.zip', 3, 768000, 'application/zip'),
(2, 'SQL - Wprowadzenie', '/materials/bazy/sql_wstep.pdf', 1, 768000, 'application/pdf'),
(2, 'Normalizacja - Prezentacja', '/materials/bazy/normalizacja.pptx', 1, 1536000, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
(2, 'Ćwiczenia SQL', '/materials/bazy/cwiczenia_sql.zip', 3, 1024000, 'application/zip'),
(3, 'Logika - Wykład', '/materials/matematyka/logika.pdf', 1, 896000, 'application/pdf'),
(3, 'Grafy - Teoria', '/materials/matematyka/grafy.pdf', 1, 1280000, 'application/pdf');

-- ----------------------------------------
-- 9. ZADANIA
-- ----------------------------------------

INSERT INTO zadania (kurs_id, tytul, opis, typ_zadania_id, max_punkty, termin_oddania, status_id) VALUES
(1, 'Laboratorium 1', 'Implementacja klasy w C++ z konstruktorami i destruktorami', 2, 10, '2026-02-15 23:59:00', 1),
(1, 'Projekt grupowy', 'Stworzyć system zarządzania biblioteką', 3, 30, '2026-03-01 23:59:00', 1),
(2, 'Zadanie z SQL', 'Napisać zapytania SQL do bazy danych sklepu', 1, 15, '2026-02-20 23:59:00', 1),
(3, 'Sprawdzian z logiki', 'Logika zdaniowa i kwantyfikatory', 2, 20, '2026-02-10 12:00:00', 1);

-- ----------------------------------------
-- WERYFIKACJA DANYCH
-- ----------------------------------------

-- SELECT '=== Użytkownicy ===' as info;
-- SELECT u.id, u.imie, u.nazwisko, u.email, r.nazwa as rola FROM uzytkownicy u LEFT JOIN uzytkownik_role ur ON u.id = ur.user_id LEFT JOIN role r ON ur.role_id = r.id;

-- SELECT '=== Kursy ===' as info;
-- SELECT id, nazwa, ects, semestr FROM kursy;

-- SELECT '=== Zapisy ===' as info;
-- SELECT k.nazwa as kurs, u.email as student, s.nazwa as status FROM zapisy z JOIN kursy k ON z.kurs_id = k.id JOIN uzytkownicy u ON z.student_id = u.id JOIN status_zapisu_slownik s ON z.status_id = s.id;
