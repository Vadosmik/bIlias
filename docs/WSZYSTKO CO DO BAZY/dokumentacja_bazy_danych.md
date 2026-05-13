# Dokumentacja Schematu Bazy Danych - bIlias

> **Wersja:** 2.0  
> **Silnik bazy danych:** PostgreSQL  
> **Rozszerzenia:** `btree_gist`  

---

## Spis treści

1. [Przegląd architektury](#1-przegląd-architektury)
2. [Rozszerzenia](#2-rozszerzenia)
3. [Multi-tenancy — Organizacje](#3-multi-tenancy--organizacje)
4. [Słowniki](#4-słowniki)
5. [System ról (RBAC)](#5-system-ról-rbac)
6. [Kursy](#6-kursy)
7. [Zapisy](#7-zapisy)
8. [Materiały](#8-materiały)
9. [Zadania](#9-zadania)
10. [Przesłania i wersjonowanie](#10-przesłania-i-wersjonowanie)
11. [Oceny](#11-oceny)
12. [Wiadomości](#12-wiadomości)
13. [Harmonogram](#13-harmonogram)
14. [Aktualności](#14-aktualności)
15. [Audit Log](#15-audit-log)
16. [Indeksy](#16-indeksy)
17. [Diagram relacji (ERD — opis tekstowy)](#17-diagram-relacji-erd--opis-tekstowy)


---

## 1. Przegląd architektury

Schemat obsługuje wielodzierżawczy (multi-tenant) system e-learningowy. Każda instancja danych jest przypisana do konkretnej **organizacji**, co umożliwia izolację danych między klientami w ramach jednej bazy danych.

Główne obszary funkcjonalne:

| Obszar | Opis |
|---|---|
| **Organizacje** | Izolacja danych na poziomie tenanta |
| **Użytkownicy i role** | Globalne RBAC oraz role per kurs |
| **Kursy i zapisy** | Zarządzanie kursami i uczestnictwem |
| **Materiały** | Pliki dydaktyczne z soft-versioningiem |
| **Zadania i przesłania** | Workflow oceniania z historią wersji |
| **Wiadomości** | Wątkowy system wiadomości z potwierdzeniami odczytu |
| **Harmonogram** | Planowanie zajęć z ochroną przed nakładaniem się |
| **Aktualności** | Ogłoszenia kursowe i globalne |
| **Audit Log** | Ślad audytu wszystkich operacji |

---

## 2. Rozszerzenia

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Rozszerzenie `btree_gist` umożliwia tworzenie indeksów GiST na typach skalarnych (np. `INT`, `TIME`). Jest wymagane do działania ograniczenia `EXCLUDE` w tabeli `harmonogramy`, które zapobiega nakładaniu się przedziałów czasowych zajęć.

---

## 3. Multi-tenancy — Organizacje

### Tabela: `organizacje`

Tabela nadrzędna dla całego modelu danych. Każdy rekord reprezentuje oddzielną instytucję lub organizację korzystającą z systemu.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Unikalny identyfikator organizacji |
| `nazwa` | `VARCHAR(255)` | NOT NULL, UNIQUE | Nazwa organizacji |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data rejestracji organizacji |

**Powiązania:** `organizacje.id` jest kluczem obcym w tabelach `uzytkownicy` i `kursy`. Usunięcie organizacji kaskadowo usuwa wszystkich jej użytkowników i kursy (`ON DELETE CASCADE`).

---

## 4. Słowniki

Słowniki (lookup tables) przechowują dopuszczalne wartości dla pól kategorycznych. Stosowanie osobnych tabel zamiast typów `ENUM` ułatwia rozszerzanie wartości bez migracji schematu.

Wszystkie tabele słownikowe mają identyczną strukturę:

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `INT` (PK, IDENTITY) | Identyfikator wartości |
| `nazwa` | `VARCHAR(50)` (UNIQUE, NOT NULL) | Czytelna nazwa wartości |

### Lista słowników

| Tabela | Zastosowanie | Przykładowe wartości |
|---|---|---|
| `status_zapisu_slownik` | Status zapisu studenta na kurs | `aktywny`, `zawieszony`, `ukończony` |
| `status_przeslania_slownik` | Status przesłanego zadania | `oczekuje`, `sprawdzone`, `odrzucone` |
| `status_wiadomosci_slownik` | Stan wiadomości w systemie | `wysłana`, `dostarczona`, `odczytana` |
| `status_zadania_slownik` | Stan zadania w kursie | `otwarte`, `zamknięte`, `wersja robocza` |
| `typ_kursu_slownik` | Rodzaj kursu | `wykład`, `ćwiczenia`, `laboratorium` |
| `typ_pliku_slownik` | Rodzaj materiału/pliku | `PDF`, `wideo`, `prezentacja` |
| `typ_zadania_slownik` | Rodzaj zadania | `praca domowa`, `projekt`, `quiz` |
| `typ_aktualnosci_slownik` | Kategoria ogłoszenia | `informacja`, `ostrzeżenie`, `termin` |
| `dzien_tygodnia_slownik` | Dzień tygodnia dla harmonogramu | `Poniedziałek`, `Wtorek`, ... |

> **Uwaga projektowa:** Wartości słowników nie są wstępnie wypełnione w schemacie — aplikacja lub skrypt inicjalizujący powinny uzupełnić te tabele przed uruchomieniem systemu.

---

## 5. System ról (RBAC)

Schemat implementuje dwupoziomowy system kontroli dostępu oparty na rolach (Role-Based Access Control).

### Tabela: `role`

Globalny rejestr dostępnych ról w systemie.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `INT` (PK, IDENTITY) | Identyfikator roli |
| `nazwa` | `VARCHAR(50)` (UNIQUE, NOT NULL) | Nazwa roli (np. `admin`, `student`, `nauczyciel`) |

---

### Tabela: `uzytkownicy`

Centralna tabela użytkowników systemu.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator użytkownika |
| `organizacja_id` | `INT` | FK → `organizacje(id)`, CASCADE | Przynależność do organizacji |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Adres e-mail (login) |
| `hash_hasla` | `VARCHAR(255)` | NOT NULL | Zahashowane hasło |
| `imie` | `VARCHAR(100)` | NOT NULL | Imię |
| `nazwisko` | `VARCHAR(100)` | NOT NULL | Nazwisko |
| `aktywny` | `BOOLEAN` | DEFAULT TRUE | Flaga aktywności konta |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data rejestracji |
| `zaktualizowano` | `TIMESTAMPTZ` | DEFAULT NOW() | Data ostatniej modyfikacji |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Znacznik miękkiego usunięcia (soft delete) |

> **Uwaga:** Kolumna `deleted_at` umożliwia soft delete — rekordy nie są fizycznie usuwane. Aplikacja powinna filtrować rekordy, gdzie `deleted_at IS NULL`. Kolumna `zaktualizowano` wymaga ręcznej aktualizacji przez trigger lub logikę aplikacyjną.

---

### Tabela: `uzytkownik_role`

Tabela łącząca realizująca relację wiele-do-wielu między użytkownikami a globalnymi rolami.

| Kolumna | Typ | Opis |
|---|---|---|
| `user_id` | `INT` (FK → `uzytkownicy`) | Identyfikator użytkownika |
| `role_id` | `INT` (FK → `role`) | Identyfikator roli |

Klucz główny: `(user_id, role_id)`.

---

### Tabela: `kurs_role`

Role przypisywane użytkownikom w kontekście konkretnego kursu (RBAC per kurs). Pozwala np. nadać użytkownikowi rolę `prowadzący` tylko w jednym kursie, bez uprawnień globalnych.

| Kolumna | Typ | Opis |
|---|---|---|
| `kurs_id` | `INT` (FK → `kursy`) | Identyfikator kursu |
| `user_id` | `INT` (FK → `uzytkownicy`) | Identyfikator użytkownika |
| `role_id` | `INT` (FK → `role`) | Identyfikator roli kursowej |

Klucz główny: `(kurs_id, user_id, role_id)`.

> **Uwaga:** Brak jawnego `REFERENCES` dla `kurs_id` i `user_id` w DDL — w środowisku produkcyjnym należy rozważyć dodanie kluczy obcych z odpowiednią polityką kaskadowania.

---

## 6. Kursy

### Tabela: `kursy`

Główna encja dydaktyczna. Każdy kurs należy do organizacji i obejmuje określony rok akademicki oraz semestr.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator kursu |
| `organizacja_id` | `INT` | FK → `organizacje`, CASCADE | Właściciel kursu |
| `nazwa` | `VARCHAR(255)` | NOT NULL | Nazwa kursu |
| `opis` | `TEXT` | — | Opis kursu |
| `ects` | `INT` | DEFAULT 0, CHECK ≥ 0 | Liczba punktów ECTS |
| `typ_kursu_id` | `INT` | FK → `typ_kursu_slownik` | Rodzaj zajęć |
| `semestr` | `INT` | NOT NULL, CHECK IN (1,2) | Numer semestru (1 lub 2) |
| `rok_start` | `INT` | NOT NULL | Rok rozpoczęcia (np. 2024) |
| `rok_koniec` | `INT` | NOT NULL, CHECK = rok_start+1 | Rok zakończenia (np. 2025) |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data utworzenia rekordu |

**Ograniczenia:**
- `semestr IN (1, 2)` — kurs może obejmować wyłącznie semestr zimowy lub letni.
- `rok_koniec = rok_start + 1` — wymuszenie spójności roku akademickiego (np. 2024/2025).
- `ects >= 0` — brak ujemnych wartości punktów.

---

## 7. Zapisy

### Tabela: `zapisy`

Rejestruje przynależność studentów do kursów wraz ze statusem ich uczestnictwa.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `kurs_id` | `INT` | PK część, FK → `kursy`, CASCADE | Kurs |
| `student_id` | `INT` | PK część, FK → `uzytkownicy`, CASCADE | Student |
| `status_id` | `INT` | FK → `status_zapisu_slownik` | Bieżący status zapisu |
| `zapisano` | `TIMESTAMPTZ` | DEFAULT NOW() | Data zapisu |

Klucz główny: `(kurs_id, student_id)` — student może być zapisany na dany kurs tylko raz.

---

## 8. Materiały

### Tabela: `materialy`

Przechowuje metadane plików dydaktycznych powiązanych z kursem. Obsługuje soft-versioning — kolejne wersje pliku to nowe rekordy z inkrementowanym numerem `wersja`.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator materiału |
| `kurs_id` | `INT` | FK → `kursy`, CASCADE | Kurs, do którego należy materiał |
| `tytul` | `VARCHAR(255)` | NOT NULL | Tytuł materiału |
| `sciezka_pliku` | `TEXT` | NOT NULL | Ścieżka lub URL do pliku |
| `typ_pliku_id` | `INT` | FK → `typ_pliku_slownik` | Typ pliku |
| `wersja` | `INT` | DEFAULT 1 | Numer wersji materiału |
| `rozmiar` | `INT` | — | Rozmiar pliku w bajtach |
| `mime_type` | `VARCHAR(100)` | — | Typ MIME pliku |
| `deleted_at` | `TIMESTAMPTZ` | — | Znacznik miękkiego usunięcia |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data dodania |

> **Soft-versioning:** Aktualizacja materiału polega na dodaniu nowego rekordu z wyższym numerem `wersja` i opcjonalnym ustawieniu `deleted_at` na starszych wersjach. Aplikacja powinna pobierać rekordy z `deleted_at IS NULL` i maksymalnym `wersja` dla danego tytułu/kursu.

---

## 9. Zadania

### Tabela: `zadania`

Definiuje prace do wykonania przez studentów w ramach kursu.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator zadania |
| `kurs_id` | `INT` | FK → `kursy`, CASCADE | Kurs, którego dotyczy zadanie |
| `tytul` | `VARCHAR(255)` | NOT NULL | Tytuł zadania |
| `opis` | `TEXT` | — | Treść lub instrukcja |
| `typ_zadania_id` | `INT` | FK → `typ_zadania_slownik` | Rodzaj zadania |
| `max_punkty` | `INT` | DEFAULT 0, CHECK ≥ 0 | Maksymalna liczba punktów |
| `termin_oddania` | `TIMESTAMPTZ` | NOT NULL | Ostateczny termin przesłania |
| `status_id` | `INT` | FK → `status_zadania_slownik` | Status zadania |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data utworzenia |

---

## 10. Przesłania i wersjonowanie

Moduł obsługuje przesyłanie prac przez studentów z pełną historią wersji.

### Tabela: `przeslania`

Reprezentuje konkretne przesłanie studenta do zadania. Student może mieć wiele wersji tego samego przesłania.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator przesłania |
| `zadanie_id` | `INT` | FK → `zadania`, CASCADE | Powiązane zadanie |
| `student_id` | `INT` | FK → `uzytkownicy`, CASCADE | Autor przesłania |
| `current_version` | `INT` | DEFAULT 1 | Aktualny numer wersji |
| `status_id` | `INT` | FK → `status_przeslania_slownik` | Status przesłania |
| `przeslano` | `TIMESTAMPTZ` | DEFAULT NOW() | Data pierwszego przesłania |

---

### Tabela: `przeslanie_wersje`

Szczegółowy zapis każdej wersji przesłanego pliku.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator wersji |
| `przeslanie_id` | `INT` | FK → `przeslania`, CASCADE | Powiązane przesłanie |
| `sciezka_pliku` | `TEXT` | NOT NULL | Ścieżka do pliku tej wersji |
| `wersja` | `INT` | NOT NULL | Numer wersji |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data przesłania tej wersji |

Ograniczenie UNIQUE `(przeslanie_id, wersja)` gwarantuje unikalność numerów wersji w ramach jednego przesłania.

**Workflow przesłania:**
1. Student tworzy rekord w `przeslania` (wersja 1).
2. Plik zapisywany jest w `przeslanie_wersje` z `wersja = 1`.
3. Przy ponownym przesłaniu: nowy rekord w `przeslanie_wersje` z `wersja = 2`, aktualizacja `current_version` w `przeslania`.

---

## 11. Oceny

### Tabela: `oceny`

Przechowuje oceny wystawiane przez nauczycieli do przesłań. Brak ograniczenia `UNIQUE` na `przeslanie_id` umożliwia przechowywanie pełnej historii ocen (np. po korekcie lub odwołaniu).

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator oceny |
| `przeslanie_id` | `INT` | FK → `przeslania`, CASCADE | Oceniane przesłanie |
| `nauczyciel_id` | `INT` | FK → `uzytkownicy`, SET NULL | Wystawiający ocenę |
| `wartosc` | `DECIMAL(3,1)` | NOT NULL, CHECK 2–5 | Wartość oceny (2.0–5.0) |
| `komentarz` | `TEXT` | — | Opcjonalny komentarz do oceny |
| `wersja` | `INT` | DEFAULT 1 | Wersja oceny (historia zmian) |
| `utworzono` | `TIMESTAMPTZ` | DEFAULT NOW() | Data wystawienia |

**Skala ocen:** od 2.0 (niedostateczny) do 5.0 (bardzo dobry), co odpowiada polskiej skali ocen akademickich.

> **Historia ocen:** Aby pobrać aktualną ocenę, aplikacja powinna używać rekordu z maksymalną wartością `wersja` lub `utworzono` dla danego `przeslanie_id`. Usunięcie nauczyciela nie usuwa ocen — `nauczyciel_id` jest ustawiany na `NULL`.

---

## 12. Wiadomości

System wiadomości oparty na wątkach z obsługą odpowiedzi (reply) i potwierdzeń odczytu.

### Tabela: `watki_wiadomosci`

Kontener grupujący wiadomości w jeden wątek konwersacji.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `INT` (PK, IDENTITY) | Identyfikator wątku |

---

### Tabela: `watek_uczestnicy`

Definiuje, którzy użytkownicy uczestniczą w danym wątku.

| Kolumna | Typ | Opis |
|---|---|---|
| `watek_id` | `INT` (FK → `watki_wiadomosci`) | Wątek |
| `user_id` | `INT` (FK → `uzytkownicy`) | Uczestnik |

Klucz główny: `(watek_id, user_id)`.

---

### Tabela: `wiadomosci`

Pojedyncza wiadomość w wątku. Obsługuje zagnieżdżone odpowiedzi przez pole `parent_message_id`.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator wiadomości |
| `watek_id` | `INT` | FK → `watki_wiadomosci`, CASCADE | Wątek, do którego należy wiadomość |
| `nadawca_id` | `INT` | FK → `uzytkownicy`, SET NULL | Autor wiadomości |
| `parent_message_id` | `INT` | FK → `wiadomosci`, SET NULL | ID wiadomości nadrzędnej (odpowiedź) |
| `tresc` | `TEXT` | NOT NULL | Treść wiadomości |
| `status_id` | `INT` | FK → `status_wiadomosci_slownik` | Status wiadomości |
| `wyslano` | `TIMESTAMPTZ` | DEFAULT NOW() | Data wysłania |

Kolumna `parent_message_id` umożliwia tworzenie drzewiastej struktury odpowiedzi. Usunięcie konta nadawcy ustawia `nadawca_id = NULL`, zachowując treść wiadomości.

---

### Tabela: `wiadomosci_odczyt`

Rejestruje potwierdzenia odczytu wiadomości przez poszczególnych uczestników (read receipts).

| Kolumna | Typ | Opis |
|---|---|---|
| `wiadomosc_id` | `INT` (FK → `wiadomosci`, CASCADE) | Odczytana wiadomość |
| `user_id` | `INT` (FK → `uzytkownicy`, CASCADE) | Odczytujący użytkownik |
| `odczytano` | `TIMESTAMPTZ` DEFAULT NOW() | Czas odczytu |

Klucz główny: `(wiadomosc_id, user_id)` — każdy użytkownik rejestruje odczyt danej wiadomości tylko raz.

---

## 13. Harmonogram

### Tabela: `harmonogramy`

Definiuje harmonogram zajęć dla kursów z zabezpieczeniem przed nakładaniem się bloków czasowych.

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator wpisu |
| `kurs_id` | `INT` | FK → `kursy`, CASCADE | Kurs, którego dotyczy wpis |
| `dzien_id` | `INT` | FK → `dzien_tygodnia_slownik` | Dzień tygodnia |
| `godzina_start` | `TIME` | NOT NULL | Godzina rozpoczęcia zajęć |
| `godzina_koniec` | `TIME` | NOT NULL | Godzina zakończenia zajęć |
| `numer_sali` | `VARCHAR(50)` | — | Numer lub oznaczenie sali |

**Ograniczenie CHECK:** `godzina_koniec > godzina_start` — zapobiega błędnym wpisom.

**Ograniczenie EXCLUDE:**

```sql
EXCLUDE USING gist (
    kurs_id WITH =,
    dzien_id WITH =,
    tsrange(godzina_start::timestamp, godzina_koniec::timestamp) WITH &&
)
```

Mechanizm `EXCLUDE` gwarantuje, że dany kurs nie może mieć dwóch nakładających się bloków zajęć w tym samym dniu tygodnia. Wymaga rozszerzenia `btree_gist`.

> **Ograniczenie:** Aktualny constraint chroni przed nakładaniem się zajęć **tego samego kursu**. Nie chroni przed kolizją sal (ta sama sala, różne kursy, ten sam czas). Rozszerzenie na salę wymagałoby dodania `numer_sali WITH =` do klauzuli `EXCLUDE`.

---

## 14. Aktualności

### Tabela: `aktualnosci`

Ogłoszenia i komunikaty powiązane z kursem lub globalne (dla całej organizacji).

| Kolumna | Typ | Ograniczenia | Opis |
|---|---|---|---|
| `id` | `INT` | PK, IDENTITY | Identyfikator aktualności |
| `autor_id` | `INT` | FK → `uzytkownicy`, SET NULL | Autor ogłoszenia |
| `typ_id` | `INT` | FK → `typ_aktualnosci_slownik` | Kategoria aktualności |
| `tytul` | `VARCHAR(255)` | NOT NULL | Tytuł ogłoszenia |
| `tresc` | `TEXT` | NOT NULL | Treść ogłoszenia |
| `kurs_id` | `INT` | FK → `kursy`, CASCADE | Kurs (NULL = ogłoszenie globalne) |
| `opublikowano` | `TIMESTAMPTZ` | DEFAULT NOW() | Data publikacji |

> Gdy `kurs_id IS NULL`, aktualność ma zasięg globalny (widoczna dla całej organizacji). Usunięcie autora nie usuwa aktualności (`SET NULL`).

---

## 15. Audit Log

### Tabela: `audit_log`

Rejestr zdarzeń systemowych do celów audytu, debugowania i zgodności.

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | `INT` (PK, IDENTITY) | Identyfikator zdarzenia |
| `user_id` | `INT` (FK → `uzytkownicy`) | Użytkownik wykonujący akcję |
| `akcja` | `TEXT` NOT NULL | Rodzaj operacji (np. `CREATE`, `UPDATE`, `DELETE`) |
| `encja` | `TEXT` NOT NULL | Nazwa tabeli/encji, której dotyczy akcja |
| `encja_id` | `INT` | Identyfikator zmodyfikowanego rekordu |
| `timestamp` | `TIMESTAMPTZ` DEFAULT NOW() | Dokładny czas zdarzenia |

> **Uwaga:** Tabela nie przechowuje stanu przed/po zmianie (`old_value`/`new_value`). W przypadku wymagań audytowych wymagających pełnej historii zmian należy rozważyć dodanie kolumn JSONB ze stanem poprzednim i nowym.

---

## 16. Indeksy

Poniższe indeksy są zdefiniowane w celu optymalizacji najczęstszych zapytań:

| Nazwa indeksu | Tabela | Kolumny | Cel |
|---|---|---|---|
| `idx_zapisy_student` | `zapisy` | `student_id` | Pobieranie kursów danego studenta |
| `idx_zapisy_kurs` | `zapisy` | `kurs_id` | Pobieranie studentów danego kursu |
| `idx_materialy_kurs` | `materialy` | `kurs_id` | Listowanie materiałów kursu |
| `idx_zadania_kurs_termin` | `zadania` | `kurs_id, termin_oddania` | Zadania kursu sortowane po terminie |
| `idx_przeslania_zadanie_student` | `przeslania` | `zadanie_id, student_id` | Wyszukiwanie przesłań dla zadania/studenta |
| `idx_wiadomosci_watek_time` | `wiadomosci` | `watek_id, wyslano` | Wiadomości wątku posortowane chronologicznie |
| `idx_wiadomosci_nadawca` | `wiadomosci` | `nadawca_id` | Wiadomości wysłane przez użytkownika |
| `idx_aktualnosci_kurs` | `aktualnosci` | `kurs_id` | Aktualności przypisane do kursu |

---

## 17. Diagram relacji (ERD — opis tekstowy)

```
organizacje (1) ──── (N) uzytkownicy
organizacje (1) ──── (N) kursy

uzytkownicy (N) ──── (N) role              [przez: uzytkownik_role]
kursy       (N) ──── (N) uzytkownicy (N) ─ (N) role [przez: kurs_role]

kursy       (1) ──── (N) zapisy            [student_id → uzytkownicy]
kursy       (1) ──── (N) materialy
kursy       (1) ──── (N) zadania
kursy       (1) ──── (N) harmonogramy
kursy       (1) ──── (N) aktualnosci

zadania     (1) ──── (N) przeslania        [student_id → uzytkownicy]
przeslania  (1) ──── (N) przeslanie_wersje
przeslania  (1) ──── (N) oceny             [nauczyciel_id → uzytkownicy]

watki_wiadomosci (1) ──── (N) wiadomosci
watki_wiadomosci (N) ──── (N) uzytkownicy  [przez: watek_uczestnicy]
wiadomosci       (1) ──── (N) wiadomosci_odczyt
wiadomosci       (0..1) ─ (N) wiadomosci   [self-ref: parent_message_id]

uzytkownicy (1) ──── (N) audit_log
```

---

## 18. Decyzje projektowe i uwagi

### Mocne strony schematu

- **Multi-tenancy przez kolumnę** — prosta izolacja danych na poziomie `organizacja_id` bez potrzeby osobnych schematów PostgreSQL.
- **Soft delete** — tabele `uzytkownicy` i `materialy` obsługują `deleted_at`, umożliwiając odtworzenie usuniętych danych.
- **Wersjonowanie przesłań** — oddzielenie nagłówka przesłania (`przeslania`) od plików (`przeslanie_wersje`) ułatwia śledzenie historii.
- **Historia ocen** — brak `UNIQUE` na `przeslanie_id` w `oceny` umożliwia przechowywanie pełnej historii zmian ocen.
- **EXCLUDE constraint** — eleganckie rozwiązanie problemu nakładania się zajęć bez konieczności sprawdzania w kodzie aplikacji.
- **Słowniki jako tabele** — łatwe rozszerzanie bez migracji schematu DDL.

### Potencjalne obszary do rozbudowy

| Obszar | Opis |
|---|---|
| `kurs_role` brak FK | Kolumny `kurs_id` i `user_id` w `kurs_role` nie mają jawnych kluczy obcych — warto je dodać z `ON DELETE CASCADE`. |
| `zaktualizowano` bez triggera | Kolumna `zaktualizowano` w `uzytkownicy` nie jest automatycznie aktualizowana — wymaga triggera `BEFORE UPDATE`. |
| Brak `UNIQUE` na `przeslania` | Student może mieć wiele rekordów w `przeslania` dla tego samego zadania — jeśli to niezamierzone, należy dodać `UNIQUE (zadanie_id, student_id)`. |
| Ochrona kolizji sal | Constraint `EXCLUDE` w `harmonogramy` nie chroni przed konfliktami sal między różnymi kursami. |
| Brak `old_value`/`new_value` w audit_log | Tabela audytu nie rejestruje stanu przed i po zmianie — ogranicza możliwości audytu. |
| `aktywny` vs `deleted_at` | Dwa mechanizmy dezaktywacji konta w `uzytkownicy` — warto ujednolicić logikę. |
| Brak indeksu na `audit_log` | Zapytania po `user_id`, `encja` lub `timestamp` w dużej tabeli audytu mogą być powolne bez indeksów. |

---

*Dokumentacja wygenerowana na podstawie schematu DDL systemu e-learningowego.*
