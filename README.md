# bIlias (Better Ilias)

Wymagany zainstalowany **Docker**

Aby odpalić projekt i testować: `` docker-compose up --build ``

## Instrukcja dla Deweloperów (Workflow)

Zanim zaczniesz pracę nad nową funkcjonalnością, zawsze upewnij się, że Twój lokalny `dev` jest aktualny. 

### 1. Tworzenie nowej funkcjonalności
Zawsze pracujemy na osobnych branchach `feature/`.
```bash
git checkout dev                  # Przejdź na dev
git pull origin dev               # Pobierz najnowsze zmiany od grupy
git checkout -b feature/nazwa     # Stwórz nowy branch (np. feature/login)
```
### 2. Wysyłanie zmian (Pull Request)

Nie merguj samemu do dev! Po skończeniu pracy wyślij branch na serwer i otwórz Pull Request na GitHubie (lub w VS Code).

```bash
git add .
git commit -m "Krótki opis zmian"
git push origin feature/nazwa     # Wyślij branch na serwer
```

Po komendzie push wejdź na GitHub i kliknij "Compare & pull request".

### Zasada: Nigdy nie robimy push bezpośrednio na main ani dev.