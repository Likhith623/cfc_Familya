# cfc_Familya

Quick instructions to run the project locally (backend + frontend).

## Prerequisites
- Python 3.10+ and `pip`
- Node 18+ and `npm` (or `pnpm`/`yarn`)
- Git

## Backend (API)
1. Change into the backend folder:

```bash
cd backend
```

2. Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Copy environment example and set values:

```bash
cp .env.example .env
# Edit .env and fill in required values
```

5. Run the backend (development):

```bash
./start.sh
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000 by default.

## Frontend (Next.js)
1. Change into the frontend folder:

```bash
cd frontend
```

2. Install Node dependencies:

```bash
npm install
# or with pnpm: pnpm install
```

3. Copy environment example and set values:

```bash
cp .env.example .env
# Edit .env and fill in keys (e.g., Supabase) required by the app
```

4. Run the frontend (development):

```bash
npm run dev
# Open http://localhost:3000
```

For production:

```bash
npm run build
npm run start
```

## Notes
- Do not commit `node_modules/` or other generated files. The repository includes a `.gitignore` that excludes `node_modules/`.
- If you previously committed large files (e.g., heavy binaries in `frontend/node_modules`), consider cleaning the Git history before pushing to GitHub.
- To stop the backend, deactivate the virtualenv or kill the `uvicorn` process.



