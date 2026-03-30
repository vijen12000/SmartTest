# SmartStudy (Next.js + SQL Server)

SmartStudy is a Next.js application backed by Microsoft SQL Server for question banks, test catalogs, and subject content.

This README combines the default project setup and the SQL Server setup summary into one contributor guide.

## Tech Stack

- Next.js 16.2.1
- React 19
- SQL Server 2019+
- Node.js + mssql (v11)

## What Is Already Implemented

### Database and seed scripts

- `scripts/01-create-database.sql`
  - Creates `SmartStudyDB`
  - Creates schema tables (`Trimesters`, `Subjects`, `Tests`, `Questions`, `QuestionOptions`, `Submissions`, and others)
  - Adds useful indexes
- `scripts/02-seed-data.sql`
  - Seeds PT/NPT tests and PT-6 sample questions/options
- `scripts/03-seed-catalog.sql`
  - Seeds trimester/subject catalog mappings and test navigation data
- `scripts/04-seed-course-content.sql`
  - Seeds course content summaries

### Backend integration

- `src/app/api/questions/route.ts` - question fetch + submission endpoint
- `src/app/api/catalog/route.ts` - trimester/subject/test catalog endpoint
- `src/app/api/subject-details/route.ts` - subject content + study materials endpoint
- `lib/db-config.js` - SQL Server configuration
- `lib/db-connection.js` and `src/lib/db.ts` - pooled DB access

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)
- Git
- SQL Server instance reachable from your machine

## 1) Install SQL Server

Choose the section for your OS.

### Windows setup (SQL Server + tools)

1. Download and install SQL Server Developer or Express edition:
	- https://www.microsoft.com/sql-server/sql-server-downloads
2. During setup, enable SQL authentication and set a strong `sa` password.
3. Install SQL Server Management Studio (SSMS):
	- https://aka.ms/ssms
4. Install SQL Server command-line tools (`sqlcmd`) if not already present:
	- https://learn.microsoft.com/sql/tools/sqlcmd/sqlcmd-utility
5. Verify SQL Server is running and reachable on your configured port (commonly 1433).

### macOS setup (Docker SQL Server recommended)

SQL Server is not natively available on macOS. Use Docker.

1. Install Docker Desktop:
	- https://www.docker.com/products/docker-desktop/
2. Pull and run SQL Server 2022 container:

```bash
docker pull mcr.microsoft.com/mssql/server:2022-latest
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrongPassword123!" -p 1433:1433 --name smartstudy-sql -d mcr.microsoft.com/mssql/server:2022-latest
```

3. Install a SQL client (pick one):
	- Azure Data Studio: https://learn.microsoft.com/azure-data-studio/download-azure-data-studio
	- DBeaver: https://dbeaver.io/download/
4. Optional: install `sqlcmd` with Homebrew:

```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew update
ACCEPT_EULA=Y brew install msodbcsql18 mssql-tools18
echo 'export PATH="/opt/homebrew/opt/mssql-tools18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 2) Clone and install project dependencies

```bash
git clone <your-fork-or-repo-url>
cd SmartTest
npm install
```

## 3) Configure environment variables

Create your local env file from the sample:

```bash
cp sample.env.local .env.local
```

Update `.env.local` values:

- `DB_SERVER` (for example `localhost`)
- `DB_PORT` (for example `1433`)
- `DB_NAME` (`SmartStudyDB`)
- `DB_USER` (`sa`)
- `DB_PASSWORD` (your actual SQL password)

Note: `lib/db-config.js` reads these values and falls back to defaults.

## 4) Create and seed the database

Run scripts in this order:

1. `scripts/01-create-database.sql`
2. `scripts/02-seed-data.sql`
3. `scripts/03-seed-catalog.sql`
4. `scripts/04-seed-course-content.sql`

You can execute with a GUI tool (SSMS/Azure Data Studio) or with `sqlcmd`.

### PowerShell (Windows) example

```powershell
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts\01-create-database.sql
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts\02-seed-data.sql
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts\03-seed-catalog.sql
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts\04-seed-course-content.sql
```

### Bash (macOS/Linux) example

```bash
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts/01-create-database.sql
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts/02-seed-data.sql
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts/03-seed-catalog.sql
sqlcmd -S localhost -U sa -P "<YourPassword>" -i scripts/04-seed-course-content.sql
```

### Optional helper script (Windows)

You can run:

```powershell
.\setup-db.ps1
```

This automates DB creation/seeding for the first 2 scripts and installs npm dependencies.

## 5) Run and validate locally

Start the app:

```bash
npm run dev
```

Open:

- App: http://localhost:3000
- Questions API example: http://localhost:3000/api/questions?testCode=pt-6&subjectCode=da-105-linear-algebra
- Catalog API: http://localhost:3000/api/catalog
- Subject details API example: http://localhost:3000/api/subject-details?subjectCode=da-105-linear-algebra

Run quick checks:

```bash
npm run test:db
npm run test:smoke:api
```

## 6) Contributing workflow

Important policy: Do not commit or push directly to `master`.

All changes must be made in a separate branch and submitted through a Pull Request (PR).

1. Fork the repository.
2. Create a feature branch from `master`:

```bash
git checkout master
git pull origin master
git checkout -b feat/short-description
```

3. Make your changes with focused commits.
4. Push your branch to your fork:

```bash
git push -u origin feat/short-description
```

5. Ensure checks pass locally:

```bash
npm run lint
npm run build
```

6. If your change affects DB schema or seed data:
	- Update SQL scripts under `scripts/`
	- Update setup docs as needed
	- Mention migration/seed impact in your PR description
7. Open a Pull Request from your branch to the upstream `master` branch with:
	- What changed
	- Why it changed
	- How you tested it
	- Any DB setup impact

## Useful project files

- `DATABASE_SETUP.md` - detailed SQL setup and troubleshooting
- `MAC_SETUP_GUIDE.md` - macOS-specific SQL setup notes
- `DATABASE_ARCHITECTURE.md` - schema/data flow reference
- `SQL_SERVER_QUICK_REFERENCE.md` - command cheat sheet
- `SPECIAL_CHARACTERS_GUIDE.md` - Unicode/LaTeX handling details

## Troubleshooting quick tips

- Login failures: verify `DB_USER`, `DB_PASSWORD`, SQL auth mode, and server port.
- Missing table errors: rerun `scripts/01-create-database.sql`.
- Empty catalog: rerun `scripts/03-seed-catalog.sql`.
- Missing subject summaries: rerun `scripts/04-seed-course-content.sql`.
- `sqlcmd` not found: install SQL Server command-line tools and re-open terminal.

## Learn More

- Next.js docs: https://nextjs.org/docs
- mssql package: https://github.com/tediousjs/node-mssql
- SQL Server docs: https://learn.microsoft.com/sql/
