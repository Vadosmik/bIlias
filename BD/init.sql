-- =========================
-- EXTENSIONS
-- =========================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================
-- MULTI-TENANCY (ORGANIZACJE + STRUKTURA UCZELNI)
-- =========================

CREATE TABLE public.organizacje (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL UNIQUE,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wydzialy (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL UNIQUE,
    skrot VARCHAR(20),
    opis TEXT
);

CREATE TABLE public.kierunki (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wydzial_id INTEGER NOT NULL REFERENCES public.wydzialy(id) ON DELETE CASCADE,
    nazwa VARCHAR(255) NOT NULL,
    stopien_studiow VARCHAR(20) CHECK (stopien_studiow IN ('licencjat', 'inzynier', 'magister', 'doktor')),
    tryb VARCHAR(20) CHECK (tryb IN ('stacjonarne', 'niestacjonarne')),
    UNIQUE (wydzial_id, nazwa, stopien_studiow)
);

CREATE TABLE public.specjalizacje (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kierunek_id INTEGER NOT NULL REFERENCES public.kierunki(id) ON DELETE CASCADE,
    nazwa VARCHAR(255) NOT NULL,
    semestr_start INTEGER CHECK (semestr_start BETWEEN 1 AND 10),
    semestr_koniec INTEGER CHECK (semestr_koniec BETWEEN 1 AND 10),
    UNIQUE (kierunek_id, nazwa)
);

-- =========================
-- SŁOWNIKI
-- =========================

CREATE TABLE public.status_zapisu_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.status_przeslania_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.status_wiadomosci_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.status_zadania_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.typ_kursu_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.typ_pliku_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.typ_zadania_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.typ_aktualnosci_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.dzien_tygodnia_slownik (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(20) UNIQUE NOT NULL
);

-- =========================
-- ROLE SYSTEM (RBAC GLOBAL + KURSOWY)
-- =========================

CREATE TABLE public.role (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.uzytkownicy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizacja_id INT REFERENCES public.organizacje(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_hasla VARCHAR(255) NOT NULL,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    ustawienia_dashboard BIT VARYING(64),
    aktywny BOOLEAN DEFAULT TRUE,
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    zaktualizowano TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE public.studenci (
    student_id INTEGER PRIMARY KEY REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    wydzial_id INTEGER NOT NULL REFERENCES public.wydzialy(id),
    kierunek_id INTEGER NOT NULL REFERENCES public.kierunki(id),
    specjalizacja_id INTEGER REFERENCES public.specjalizacje(id),
    rok_studiow INTEGER NOT NULL CHECK (rok_studiow BETWEEN 1 AND 6),
    numer_albumu VARCHAR(20) UNIQUE,
    data_rozpoczecia DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'aktywny'
);

CREATE TABLE public.prowadzacy ( 
    prowadzacy_id INTEGER PRIMARY KEY REFERENCES public.uzytkownicy(id) ON DELETE CASCADE, 
    wydzial_id INTEGER NOT NULL REFERENCES public.wydzialy(id),
    status VARCHAR(20) DEFAULT 'aktywny'
);

CREATE TABLE public.grupy (
    id SERIAL PRIMARY KEY,
    nazwa TEXT NOT NULL
);

CREATE TABLE public.uzytkownicy_grupy (
    user_id INT REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    group_id INT REFERENCES public.grupy(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE public.uzytkownik_role (
    user_id INT NOT NULL REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES public.role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- RBAC per kurs
CREATE TABLE public.kurs_role (
    kurs_id INT NOT NULL,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (kurs_id, user_id, role_id)
);

-- =========================
-- KURSY
-- =========================

CREATE TABLE public.kursy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizacja_id INT REFERENCES public.organizacje(id) ON DELETE CASCADE,
    nazwa VARCHAR(255) NOT NULL,
    opis TEXT,
    ects INT DEFAULT 0 CHECK (ects >= 0),
    typ_kursu_id INT REFERENCES public.typ_kursu_slownik(id),
    semestr INT NOT NULL CHECK (semestr IN (1,2,3,4,5,6,7)),
    rok_start INT NOT NULL,
    rok_koniec INT NOT NULL,
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    CHECK (rok_koniec = rok_start + 1)
);

-- =========================
-- INFRASTRUKTURA (SALE)
-- =========================

CREATE TABLE public.sale (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    budynek VARCHAR(100),
    numer VARCHAR(50) NOT NULL,
    pojemnosc INT CHECK (pojemnosc > 0),
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (budynek, numer)
);

-- =========================
-- PLANY ZAJĘĆ
-- =========================

CREATE TABLE public.plany_zajec (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT NOT NULL REFERENCES public.kursy(id) ON DELETE CASCADE,
    dzien_id INT NOT NULL REFERENCES public.dzien_tygodnia_slownik(id),
    godzina_od TIME NOT NULL,
    godzina_do TIME NOT NULL,
    sala_id INT REFERENCES public.sale(id) ON DELETE SET NULL,
    prowadzacy_id INT REFERENCES public.prowadzacy(prowadzacy_id) ON DELETE SET NULL,
    wydzial_id INT NOT NULL REFERENCES public.wydzialy(id),
    kierunek_id INT NOT NULL REFERENCES public.kierunki(id),
    specjalizacja_id INT REFERENCES public.specjalizacje(id),
    grupa_oznaczenie VARCHAR(20),
    typ_zajec VARCHAR(30) CHECK (typ_zajec IN ('wyklad', 'cwiczenia', 'laboratorium', 'projekt', 'seminarium')),
    aktywny BOOLEAN DEFAULT TRUE,
    utworzono TIMESTAMPTZ DEFAULT NOW(),
    CHECK (godzina_do > godzina_od)
);

-- Blokada kolizji sali
ALTER TABLE public.plany_zajec
ADD CONSTRAINT brak_kolizji_sali
EXCLUDE USING gist (
    sala_id WITH =,
    dzien_id WITH =,
    tsrange(
        (DATE '1970-01-01' + godzina_od),
        (DATE '1970-01-01' + godzina_do)
    ) WITH &&
);

-- Blokada kolizji prowadzącego
ALTER TABLE public.plany_zajec
ADD CONSTRAINT brak_kolizji_prowadzacego
EXCLUDE USING gist (
    prowadzacy_id WITH =,
    dzien_id WITH =,
    tsrange(
        (DATE '1970-01-01' + godzina_od),
        (DATE '1970-01-01' + godzina_do)
    ) WITH &&
);

-- =========================
-- ZAPISY
-- =========================

CREATE TABLE public.zapisy (
    kurs_id INT REFERENCES public.kursy(id) ON DELETE CASCADE,
    student_id INT REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    status_id INT REFERENCES public.status_zapisu_slownik(id),
    zapisano TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (kurs_id, student_id)
);

-- =========================
-- FOLDERY
-- =========================

CREATE TABLE public.foldery (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT NOT NULL REFERENCES public.kursy(id) ON DELETE CASCADE,
    parent_id INT REFERENCES public.foldery(id) ON DELETE CASCADE,
    nazwa VARCHAR(255) NOT NULL,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- MATERIAŁY (soft versioning logic)
-- =========================

CREATE TABLE public.materialy (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT REFERENCES public.kursy(id) ON DELETE CASCADE,
    folder_id INT REFERENCES public.foldery(id) ON DELETE SET NULL,
    tytul VARCHAR(255) NOT NULL,
    sciezka_pliku TEXT NOT NULL,
    typ_pliku_id INT REFERENCES public.typ_pliku_slownik(id),
    wersja INT DEFAULT 1,
    rozmiar INT,
    mime_type VARCHAR(100),
    deleted_at TIMESTAMPTZ,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- ZADANIA
-- =========================

CREATE TABLE public.zadania (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kurs_id INT REFERENCES public.kursy(id) ON DELETE CASCADE,
    folder_id INT REFERENCES public.foldery(id) ON DELETE SET NULL,
    tytul VARCHAR(255) NOT NULL,
    opis TEXT,
    typ_zadania_id INT REFERENCES public.typ_zadania_slownik(id),
    max_punkty INT DEFAULT 0 CHECK (max_punkty >= 0),
    termin_oddania TIMESTAMPTZ NOT NULL,
    status_id INT REFERENCES public.status_zadania_slownik(id),
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- PRZESŁANIA
-- =========================

CREATE TABLE public.przeslania (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zadanie_id INT REFERENCES public.zadania(id) ON DELETE CASCADE,
    student_id INT REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    current_version INT DEFAULT 1,
    status_id INT REFERENCES public.status_przeslania_slownik(id),
    przeslano TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.przeslanie_wersje (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    przeslanie_id INT REFERENCES public.przeslania(id) ON DELETE CASCADE,
    sciezka_pliku TEXT NOT NULL,
    oryginalna_nazwa VARCHAR(255),
    wersja INT NOT NULL,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- OCENY (HISTORIA + BRAK UNIQUE)
-- =========================

CREATE TABLE public.oceny (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    przeslanie_id INT REFERENCES public.przeslania(id) ON DELETE CASCADE,
    nauczyciel_id INT REFERENCES public.uzytkownicy(id) ON DELETE SET NULL,
    wartosc DECIMAL(3,1) NOT NULL CHECK (wartosc BETWEEN 2 AND 5),
    komentarz TEXT,
    wersja INT DEFAULT 1,
    utworzono TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- WIADOMOŚCI (THREAD + REPLY + READ RECEIPTS)
-- =========================

CREATE TABLE public.watki_wiadomosci (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

CREATE TABLE public.watek_uczestnicy (
    watek_id INT REFERENCES public.watki_wiadomosci(id) ON DELETE CASCADE,
    user_id INT REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    PRIMARY KEY (watek_id, user_id)
);

CREATE TABLE public.wiadomosci (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    watek_id INT REFERENCES public.watki_wiadomosci(id) ON DELETE CASCADE,
    nadawca_id INT REFERENCES public.uzytkownicy(id) ON DELETE SET NULL,
    parent_message_id INT REFERENCES public.wiadomosci(id) ON DELETE SET NULL,
    tresc TEXT NOT NULL,
    status_id INT REFERENCES public.status_wiadomosci_slownik(id),
    wyslano TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wiadomosci_odczyt (
    wiadomosc_id INT REFERENCES public.wiadomosci(id) ON DELETE CASCADE,
    user_id INT REFERENCES public.uzytkownicy(id) ON DELETE CASCADE,
    odczytano TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (wiadomosc_id, user_id)
);

-- =========================
-- AKTUALNOŚCI
-- =========================

CREATE TABLE public.aktualnosci (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    autor_id INT REFERENCES public.uzytkownicy(id) ON DELETE SET NULL,
    typ_id INT REFERENCES public.typ_aktualnosci_slownik(id),
    tytul VARCHAR(255) NOT NULL,
    tresc TEXT NOT NULL,
    kurs_id INT REFERENCES public.kursy(id) ON DELETE CASCADE,
    opublikowano TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- AUDYT LOG
-- =========================

CREATE TABLE public.audit_log (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT REFERENCES public.uzytkownicy(id),
    akcja TEXT NOT NULL,
    encja TEXT NOT NULL,
    encja_id INT,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- FKEY DO KURS_ROLE
-- =========================

ALTER TABLE public.kurs_role
    ADD CONSTRAINT fk_kurs_role_kurs FOREIGN KEY (kurs_id) REFERENCES public.kursy(id) ON DELETE CASCADE;

ALTER TABLE public.kurs_role
    ADD CONSTRAINT fk_kurs_role_role FOREIGN KEY (role_id) REFERENCES public.role(id) ON DELETE CASCADE;

ALTER TABLE public.kurs_role
    ADD CONSTRAINT fk_kurs_role_user FOREIGN KEY (user_id) REFERENCES public.uzytkownicy(id) ON DELETE CASCADE;

-- =========================
-- INDEKSY
-- =========================

CREATE INDEX idx_zapisy_student ON public.zapisy(student_id);
CREATE INDEX idx_zapisy_kurs ON public.zapisy(kurs_id);

CREATE INDEX idx_materialy_kurs ON public.materialy(kurs_id);

CREATE INDEX idx_zadania_kurs_termin ON public.zadania(kurs_id, termin_oddania);

CREATE INDEX idx_przeslania_zadanie_student ON public.przeslania(zadanie_id, student_id);

CREATE INDEX idx_wiadomosci_watek_time ON public.wiadomosci(watek_id, wyslano);

CREATE INDEX idx_wiadomosci_nadawca ON public.wiadomosci(nadawca_id);

CREATE INDEX idx_aktualnosci_kurs ON public.aktualnosci(kurs_id);

CREATE INDEX idx_plany_zajec_wydzial ON public.plany_zajec(wydzial_id);

CREATE INDEX idx_plany_zajec_kierunek ON public.plany_zajec(kierunek_id);

CREATE INDEX idx_plany_zajec_specjalizacja ON public.plany_zajec(specjalizacja_id);

CREATE INDEX idx_plany_zajec_prowadzacy ON public.plany_zajec(prowadzacy_id);

CREATE INDEX idx_plany_zajec_sala ON public.plany_zajec(sala_id);

CREATE INDEX idx_plany_zajec_dzien_godziny ON public.plany_zajec(dzien_id, godzina_od, godzina_do);

-- =========================
-- INSERT
-- ========================

BEGIN;

-- =========================
-- ORGANIZACJA
-- =========================

INSERT INTO public.organizacje (nazwa)
VALUES ('Uniwersytet Morski w Gdyni');

-- =========================
-- SŁOWNIKI
-- =========================

INSERT INTO public.status_zapisu_slownik (nazwa)
VALUES
    ('aktywny'),
    ('wypisany'),
    ('oczekujacy'),
    ('ukonczony');

INSERT INTO public.status_przeslania_slownik (nazwa)
VALUES
    ('robocze'),
    ('przeslane'),
    ('ocenione'),
    ('do_poprawy');

INSERT INTO public.status_wiadomosci_slownik (nazwa)
VALUES
    ('wyslana'),
    ('dostarczona'),
    ('odczytana');

INSERT INTO public.status_zadania_slownik (nazwa)
VALUES
    ('aktywne'),
    ('zamkniete'),
    ('ukryte');

INSERT INTO public.typ_kursu_slownik (nazwa)
VALUES
    ('wyklad'),
    ('laboratorium'),
    ('cwiczenia'),
    ('projekt'),
    ('seminarium');

INSERT INTO public.typ_pliku_slownik (nazwa)
VALUES
    ('pdf'),
    ('docx'),
    ('pptx'),
    ('zip'),
    ('png'),
    ('jpg');

INSERT INTO public.typ_zadania_slownik (nazwa)
VALUES
    ('projekt'),
    ('sprawozdanie'),
    ('kolokwium'),
    ('zadanie_domowe');

INSERT INTO public.typ_aktualnosci_slownik (nazwa)
VALUES
    ('organizacyjne'),
    ('egzamin'),
    ('projekt'),
    ('ogloszenie');

INSERT INTO public.dzien_tygodnia_slownik (nazwa)
VALUES
    ('Poniedzialek'),
    ('Wtorek'),
    ('Sroda'),
    ('Czwartek'),
    ('Piatek'),
    ('Sobota'),
    ('Niedziela');

-- =========================
-- ROLE
-- =========================

INSERT INTO public.role (nazwa)
VALUES
    ('super_admin'),
    ('admin_uczelni'),
    ('dziekan'),
    ('prowadzacy'),
    ('planista'),
    ('student');

-- =========================
-- WYDZIAŁY
-- =========================

INSERT INTO public.wydzialy (nazwa, skrot, opis)
VALUES
    (
        'Wydział Elektryczny',
        'we',
        'Wydział Elektryczny Uniwersytetu Morskiego w Gdyni'
    ),
    (
        'Wydział Informatyczny',
        'wi',
        'Wydzial Informatyczny Uniwersytetu Morskiego w Gdyni'
    );

-- =========================
-- KIERUNKI
-- =========================

INSERT INTO public.kierunki (
    wydzial_id,
    nazwa,
    stopien_studiow,
    tryb
)
VALUES
    (
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        'Elektrotechnika',
        'inzynier',
        'stacjonarne'
    ),
    (
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        'Automatyka i Robotyka',
        'inzynier',
        'stacjonarne'
    ),
    (
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        'Informatyka',
        'inzynier',
        'stacjonarne'
    ),
    (
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        'Cyberbezpieczenstwo',
        'inzynier',
        'stacjonarne'
    );

-- =========================
-- SPECJALIZACJE
-- =========================

INSERT INTO public.specjalizacje (
    kierunek_id,
    nazwa,
    semestr_start,
    semestr_koniec
)
VALUES
    (
        (SELECT id FROM public.kierunki WHERE nazwa = 'Informatyka'),
        'Aplikacje Internetowe i Mobilne',
        5,
        7
    ),
    (
        (SELECT id FROM public.kierunki WHERE nazwa = 'Informatyka'),
        'Aplikacje Internetu Rzeczy',
        5,
        7
    ),
    (
        (SELECT id FROM public.kierunki WHERE nazwa = 'Cyberbezpieczenstwo'),
        'Bezpieczenstwo Sieci',
        5,
        7
    ),
    (
        (SELECT id FROM public.kierunki WHERE nazwa = 'Elektrotechnika'),
        'Systemy Okretowe',
        5,
        7
    );

-- =========================
-- PROWADZĄCY
-- haslo testowe dla wszystkich:
-- Test1234
-- =========================

INSERT INTO public.uzytkownicy (
    organizacja_id,
    email,
    hash_hasla,
    imie,
    nazwisko
)
VALUES
    (
        1,
        'j.kowalski@wi.umg.edu.pl',
        '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq',
        'Jan',
        'Kowalski'
    ),
    (
        1,
        'a.nowak@wi.umg.edu.pl',
        '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq',
        'Anna',
        'Nowak'
    ),
    (
        1,
        'p.zielinski@we.umg.edu.pl',
        '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq',
        'Piotr',
        'Zielinski'
    ),
    (
        1,
        'm.wisniewska@we.umg.edu.pl',
        '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq',
        'Maria',
        'Wisniewska'
    );

INSERT INTO public.prowadzacy (
    prowadzacy_id,
    wydzial_id,
    status
)
VALUES
    (
        (SELECT id FROM public.uzytkownicy WHERE email = 'j.kowalski@wi.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = 'a.nowak@wi.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = 'p.zielinski@we.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = 'm.wisniewska@we.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        'aktywny'
    );

-- =========================
-- STUDENCI
-- email format:
-- [index]@student.umg.edu.pl
-- haslo testowe dla wszystkich:
-- Test1234
-- =========================

INSERT INTO public.uzytkownicy (
    organizacja_id,
    email,
    hash_hasla,
    imie,
    nazwisko
)
VALUES
    (1, '10001@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Kacper', 'Lewandowski'),
    (1, '10002@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Michal', 'Wojcik'),
    (1, '10003@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Julia', 'Kaminska'),
    (1, '10004@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Aleksandra', 'Dabrowska'),
    (1, '10005@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Mateusz', 'Kaczmarek'),
    (1, '10006@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Natalia', 'Mazur'),
    (1, '10007@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Patryk', 'Krawczyk'),
    (1, '10008@student.umg.edu.pl', '$2b$10$KQGVLgpuIXTm40aFyPyQiuAto62CYaYoDTmJhTI3bkusTlFiy8rtq', 'Karolina', 'Piotrowska');

INSERT INTO public.studenci (
    student_id,
    wydzial_id,
    kierunek_id,
    specjalizacja_id,
    rok_studiow,
    numer_albumu,
    status
)
VALUES
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10001@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Informatyka'),
        (SELECT id FROM public.specjalizacje WHERE nazwa = 'Aplikacje Internetowe i Mobilne'),
        2,
        '10001',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10002@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Informatyka'),
        (SELECT id FROM public.specjalizacje WHERE nazwa = 'Aplikacje Internetowe i Mobilne'),
        3,
        '10002',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10003@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Cyberbezpieczenstwo'),
        (SELECT id FROM public.specjalizacje WHERE nazwa = 'Bezpieczenstwo Sieci'),
        2,
        '10003',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10004@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'wi'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Cyberbezpieczenstwo'),
        (SELECT id FROM public.specjalizacje WHERE nazwa = 'Bezpieczenstwo Sieci'),
        1,
        '10004',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10005@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Elektrotechnika'),
        (SELECT id FROM public.specjalizacje WHERE nazwa = 'Systemy Okretowe'),
        3,
        '10005',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10006@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Elektrotechnika'),
        (SELECT id FROM public.specjalizacje WHERE nazwa = 'Systemy Okretowe'),
        2,
        '10006',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10007@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Automatyka i Robotyka'),
        NULL,
        1,
        '10007',
        'aktywny'
    ),
    (
        (SELECT id FROM public.uzytkownicy WHERE email = '10008@student.umg.edu.pl'),
        (SELECT id FROM public.wydzialy WHERE skrot = 'we'),
        (SELECT id FROM public.kierunki WHERE nazwa = 'Automatyka i Robotyka'),
        NULL,
        1,
        '10008',
        'aktywny'
    );

-- =========================
-- ROLE PRZYPISANIE
-- =========================

INSERT INTO public.uzytkownik_role (user_id, role_id)
SELECT u.id, r.id
FROM public.uzytkownicy u
JOIN public.role r ON r.nazwa = 'prowadzacy'
WHERE u.email LIKE '%@wi.umg.edu.pl'
   OR u.email LIKE '%@we.umg.edu.pl';

INSERT INTO public.uzytkownik_role (user_id, role_id)
SELECT u.id, r.id
FROM public.uzytkownicy u
JOIN public.role r ON r.nazwa = 'student'
WHERE u.email LIKE '%@student.umg.edu.pl';

-- =========================
-- KURSY
-- =========================

INSERT INTO public.kursy (
    organizacja_id,
    nazwa,
    opis,
    ects,
    typ_kursu_id,
    semestr,
    rok_start,
    rok_koniec
)
VALUES
    (
        1,
        'Programowanie w Java',
        'Podstawy programowania obiektowego w Java',
        5,
        (SELECT id FROM public.typ_kursu_slownik WHERE nazwa = 'laboratorium'),
        3,
        2025,
        2026
    ),
    (
        1,
        'Bazy Danych',
        'Projektowanie i administracja bazami danych PostgreSQL',
        6,
        (SELECT id FROM public.typ_kursu_slownik WHERE nazwa = 'wyklad'),
        4,
        2025,
        2026
    ),
    (
        1,
        'Systemy Wbudowane',
        'Architektura i programowanie systemow wbudowanych',
        5,
        (SELECT id FROM public.typ_kursu_slownik WHERE nazwa = 'laboratorium'),
        5,
        2025,
        2026
    ),
    (
        1,
        'Sieci Komputerowe',
        'Podstawy konfiguracji i administracji sieciami',
        4,
        (SELECT id FROM public.typ_kursu_slownik WHERE nazwa = 'cwiczenia'),
        3,
        2025,
        2026
    );

-- =========================
-- ROLE KURSOWE
-- =========================

INSERT INTO public.kurs_role (kurs_id, user_id, role_id)
VALUES
    (
        (SELECT id FROM public.kursy WHERE nazwa = 'Programowanie w Java'),
        (SELECT id FROM public.uzytkownicy WHERE email = 'j.kowalski@wi.umg.edu.pl'),
        (SELECT id FROM public.role WHERE nazwa = 'prowadzacy')
    ),
    (
        (SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych'),
        (SELECT id FROM public.uzytkownicy WHERE email = 'a.nowak@wi.umg.edu.pl'),
        (SELECT id FROM public.role WHERE nazwa = 'prowadzacy')
    ),
    (
        (SELECT id FROM public.kursy WHERE nazwa = 'Systemy Wbudowane'),
        (SELECT id FROM public.uzytkownicy WHERE email = 'p.zielinski@we.umg.edu.pl'),
        (SELECT id FROM public.role WHERE nazwa = 'prowadzacy')
    ),
    (
        (SELECT id FROM public.kursy WHERE nazwa = 'Sieci Komputerowe'),
        (SELECT id FROM public.uzytkownicy WHERE email = 'm.wisniewska@we.umg.edu.pl'),
        (SELECT id FROM public.role WHERE nazwa = 'prowadzacy')
    );

-- =========================
-- ZAPISY NA KURSY
-- =========================

INSERT INTO public.zapisy (
    kurs_id,
    student_id,
    status_id
)
SELECT
    k.id,
    u.id,
    szs.id
FROM public.kursy k
CROSS JOIN public.uzytkownicy u
CROSS JOIN public.status_zapisu_slownik szs
WHERE u.email LIKE '%@student.umg.edu.pl'
  AND szs.nazwa = 'aktywny'
  AND k.nazwa IN (
      'Programowanie w Java',
      'Bazy Danych'
  );

-- =========================
-- FOLDERY (SEED)
-- =========================

INSERT INTO public.foldery (kurs_id, nazwa)
VALUES
    ((SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych'), 'Laboratorium 1'),
    ((SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych'), 'Laboratorium 2'),
    ((SELECT id FROM public.kursy WHERE nazwa = 'Programowanie w Java'), 'Wykłady');

-- =========================
-- MATERIAŁY (SEED)
-- =========================

INSERT INTO public.materialy (kurs_id, folder_id, tytul, sciezka_pliku, typ_pliku_id, rozmiar, mime_type)
VALUES
    (
        (SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych'),
        (SELECT id FROM public.foldery WHERE nazwa = 'Laboratorium 1' AND kurs_id = (SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych')),
        'Instrukcja SQL',
        '/uploads/files-1778701675669-453520548.pdf',
        (SELECT id FROM public.typ_pliku_slownik WHERE nazwa = 'pdf'),
        512000,
        'application/pdf'
    );

-- =========================
-- ZADANIA (SEED)
-- =========================

INSERT INTO public.zadania (kurs_id, folder_id, tytul, opis, typ_zadania_id, max_punkty, termin_oddania, status_id)
VALUES
    (
        (SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych'),
        (SELECT id FROM public.foldery WHERE nazwa = 'Laboratorium 1' AND kurs_id = (SELECT id FROM public.kursy WHERE nazwa = 'Bazy Danych')),
        'Zadanie 1 - SELECT',
        'Podstawowe zapytania SELECT',
        (SELECT id FROM public.typ_zadania_slownik WHERE nazwa = 'projekt'),
        10,
        NOW() + INTERVAL '7 days',
        (SELECT id FROM public.status_zadania_slownik WHERE nazwa = 'aktywne')
    );

-- =========================
-- BUDYNKI (SEED)
-- =========================

INSERT INTO public.sale (budynek, numer, pojemnosc)
VALUES
    ('Budynek Główny', 'B202', 120),
    ('Budynek Główny', 'B210', 120),
    ('Budynek Główny', 'B122', 30),
    ('Wydział Elektryczny', 'C122', 25),
    ('Wydział Elektryczny', 'C215', 45),
    ('Wydział Elektryczny', 'C47a', 250),
    ('Wydział Informatyczny', 'F08', 15),
    ('Wydział Informatyczny', 'F112', 15),
    ('Wydział Informatyczny', 'F110', 40),
    ('Wydział Informatyczny', 'F67', 60),
    ('Hala Sportowa', 'S1', 100),
    ('Budynek Nawigacji', 'N14', 20),
    ('Budynek Nawigacji', 'N145', 12);

COMMIT;
