This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

<<<<<<< HEAD
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
Aby odpalić projekt i testować: `` docker-compose up --build ``

## Instrukcja dla Deweloperów (Workflow)

Zanim zaczniesz pracę nad nową funkcjonalnością, zawsze upewnij się, że Twój lokalny `dev` jest aktualny. 

### 1. Tworzenie nowej funkcjonalności
Zawsze pracujemy na osobnych branchach `feature/`.
```bash
git checkout dev                  # Przejdź na dev
git pull origin dev               # Pobierz najnowsze zmiany od grupy
git checkout -b feature/nazwa     # Stwórz nowy branch (np. feature/nazwa)
```
### 2. Wysyłanie zmian (Pull Request)

Nie merguj samemu do dev! Po skończeniu pracy wyślij branch na serwer i otwórz Pull Request na GitHubie (lub w VS Code).

```bash
git add .
git commit -m "Krótki opis zmian"
git push origin feature/nazwa
```

### Zasada: Nigdy nie robimy push bezpośrednio na main ani dev.
>>>>>>> dev
