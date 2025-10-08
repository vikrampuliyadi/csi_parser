# CSI Parse MVP

## Backend (FastAPI)

Prereqs: Python 3.10+

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: GET `http://127.0.0.1:8000/api/v1/health`
- Parse: POST `http://127.0.0.1:8000/api/v1/parse` (multipart form with `file`)

## Frontend (Vite + React + TS)

Prereqs: Node 18+

```bash
cd frontend
npm install
npm run dev
```

Configure backend URL via `.env` in `frontend/` (optional):

```
VITE_API_BASE=http://127.0.0.1:8000/api/v1
```

Open `http://127.0.0.1:5173`

## Notes
- PDF parsing uses PyMuPDF for speed; keywords and regex live in `backend/app/utils/keywords.py`.
- Large PDFs (700+ pages) are handled page-by-page to keep memory bounded.
- UI supports upload, parse, filter, table view, and single-page preview.
