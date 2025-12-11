# Backend for Street Scan (Pothole Patrol)

This backend is a minimal Flask API providing authentication and a simple SQLite database for user storage.

Features
- Signup (hashes password with bcrypt)
- Login (returns JWT access token)
- `GET /api/me` — get current user (requires JWT)

Quickstart

1. Create a Python virtual environment and install deps:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and update the secrets (recommended):

```powershell
copy .env.example .env
# edit .env and set strong secrets
```

3. Initialize the database:

```powershell
python init_db.py
```

4. Run the server:

```powershell
python app.py
```

The API will be available at `http://localhost:5000`.

Endpoints
- POST `/api/signup` — JSON `{name,email,password}` → 201 + `{user, access_token}`
- POST `/api/login` — JSON `{email,password}` → `{user, access_token}`
- GET `/api/me` — Bearer token required → `{user}`

Notes
- This is a minimal example intended for local development. For production:
  - Use HTTPS.
  - Use a stronger database (Postgres, MySQL) and connection pooling.
  - Add rate limiting, input validation and email verification.
