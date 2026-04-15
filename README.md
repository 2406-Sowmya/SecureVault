# 🔐 SecureVault v2.0 — Production Upgrade

> Multi-factor authentication + encrypted file vault with React frontend and FastAPI backend.

---

## Architecture Overview

```
SecureVault/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── auth.py                  # JWT, bcrypt, OTP, geolocation, password reset
│   ├── database.py              # SQLite ORM layer (5 tables)
│   ├── email_service.py         # HTML emails: OTP, intruder alert, reset link
│   ├── face_recognition_module.py  # dlib-based face encoding (REST-ready)
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── auth_routes.py       # /api/auth/*
│       ├── vault_routes.py      # /api/vault/*
│       └── user_routes.py       # /api/user/*
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx              # React Router v6 setup
        ├── main.jsx
        ├── index.css            # Tailwind + custom animations
        ├── api/api.js           # Axios client with JWT interceptors
        ├── context/AuthContext.jsx
        ├── components/Layout.jsx  # Navbar + ProtectedRoute
        └── pages/
            ├── LoginPage.jsx       # Step 1: Password
            ├── FaceScanPage.jsx    # Step 2: Webcam face recognition
            ├── OTPPage.jsx         # Step 3: 6-digit OTP
            ├── DashboardPage.jsx   # Login history + location + stats
            ├── VaultPage.jsx       # File manager (upload/download/delete)
            ├── ForgotPasswordPage.jsx
            └── ResetPasswordPage.jsx
```

---

## What's New in v2.0

| Feature | Old | New |
|---------|-----|-----|
| UI | Tkinter | React + Tailwind + Framer Motion |
| Backend | Tkinter embedded | FastAPI REST API |
| Geolocation | ipinfo.io (city only) | ip-api.com (city, region, country, lat/lon, ISP) |
| Location in email | Text only | Google Maps link + full details |
| Password Reset | ❌ None | ✅ Secure UUID token, email link, 1hr expiry |
| File Storage | ❌ None | ✅ Per-user vault, upload/download/delete |
| Auth tokens | ❌ None | ✅ JWT Bearer (8hr expiry) |
| Email HTML | Basic | Rich dark-theme HTML with Maps links |
| Intruder Alert | Basic | Intruder photo + exact location + Maps + device info |

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.10+ | With pip |
| Node.js | 18+ | With npm |
| CMake | Latest | Required for dlib |
| C++ Build Tools | - | Windows: VS Build Tools; Linux: `build-essential` |
| Git | Any | - |

### Install CMake + dlib build tools

**Ubuntu/Debian:**
```bash
sudo apt-get install -y cmake build-essential libopenblas-dev liblapack-dev
```

**macOS:**
```bash
brew install cmake
```

**Windows:**
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [CMake](https://cmake.org/download/)

---

## ⚡ Quick Setup (Step-by-Step)

### Step 1 — Clone and enter the project
```bash
cd SecureVault
```

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

> ⚠️ `face-recognition` installs dlib which compiles from source. This may take 5–15 minutes.

### Step 3 — Configure environment

```bash
# Copy and edit the env file
cp .env.example .env
```

Edit `.env`:
```env
# Gmail SMTP (use App Password, NOT your real password)
SENDER_EMAIL=youremail@gmail.com
SENDER_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Generate a random 32-char secret:
# python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your_random_32_char_secret

# Frontend URL (for reset link in email)
FRONTEND_URL=http://localhost:5173
```

**How to get a Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to: myaccount.google.com → Security → App Passwords
3. Create a new app password → copy it into `.env`

### Step 4 — Start the backend

```bash
# Inside backend/ with venv active:
uvicorn main:app --reload --port 8000
```

✅ Backend running at: http://localhost:8000  
📚 API docs at: http://localhost:8000/docs

### Step 5 — Frontend Setup

```bash
# Open a new terminal
cd SecureVault/frontend

# Install Node dependencies
npm install

# Start dev server
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## Database Schema

```sql
users                    -- username, email, password_hash (bcrypt), face_encoding (JSON), active
login_attempts           -- every auth event: stage, status, location, image_path, ip, user_agent
otp_tokens               -- 6-digit OTP codes with expiry
password_reset_tokens    -- UUID reset tokens (1hr expiry)
vault_files              -- file metadata: username, stored_name, original_name, type, size
```

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (JSON: username, email, password, face_image) |
| POST | `/api/auth/login` | Step 1: Password verify → returns session_id |
| POST | `/api/auth/face-verify` | Step 2: Face match → sends OTP |
| POST | `/api/auth/verify-otp` | Step 3: OTP → returns JWT |
| POST | `/api/auth/resend-otp` | Resend OTP to email |
| POST | `/api/auth/forgot-password` | Send reset link to email |
| GET  | `/api/auth/validate-reset-token/{token}` | Check if token is valid |
| POST | `/api/auth/reset-password` | Set new password using token |
| GET  | `/api/auth/me` | 🔒 Get current user info |

### Vault (all 🔒 require JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/vault/files` | List all user's files |
| POST   | `/api/vault/upload` | Upload a file (multipart) |
| GET    | `/api/vault/download/{id}` | Download a file |
| DELETE | `/api/vault/delete/{id}` | Delete a file |
| GET    | `/api/vault/stats` | Storage stats |

### User (all 🔒 require JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/dashboard` | Dashboard: user info + history + vault summary |
| GET | `/api/user/attempts` | Full login history (50 events) |

---

## Geolocation

Uses **ip-api.com** (free, no API key required). Returns:
- City, Region, Country
- Latitude & Longitude  
- ISP name
- Google Maps link: `https://www.google.com/maps?q=LAT,LON`

---

## Vault File Storage

Files are stored in `backend/vault_storage/<username>/` with UUID filenames to prevent collisions. Maximum file size is 50 MB. All metadata is stored in SQLite.

To enable **AES encryption** at rest (optional upgrade):
```bash
pip install cryptography
```
Then wrap file read/write in `backend/routes/vault_routes.py` using `Fernet`:
```python
from cryptography.fernet import Fernet
key = Fernet.generate_key()   # store securely in .env
fernet = Fernet(key)
encrypted = fernet.encrypt(content)
```

---

## Email Alerts

All emails use a dark-themed HTML template. Intruder alerts include:
- 📷 Intruder photo (attachment)
- 🕐 Exact timestamp (UTC)
- 📍 City, Region, Country, ISP
- 🗺️ Google Maps link with coordinates
- 💻 Browser/Device User-Agent string

---

## Production Deployment Checklist

- [ ] Change `JWT_SECRET_KEY` to a cryptographically random value
- [ ] Set `FRONTEND_URL` to your actual domain
- [ ] Use HTTPS (nginx + Let's Encrypt recommended)
- [ ] Move SQLite to PostgreSQL for concurrent access
- [ ] Add Redis for session storage (replace in-memory `_sessions` dict)
- [ ] Enable Fernet encryption for vault files at rest
- [ ] Set `CORS` origins to specific domains (not wildcard)
- [ ] Add rate limiting (FastAPI SlowAPI)
- [ ] Store intruder images in cloud storage (S3/GCS) for durability

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | FastAPI + Uvicorn |
| Auth | bcrypt + python-jose (JWT) |
| Face Recognition | dlib + face-recognition |
| Database | SQLite (WAL mode) |
| Email | smtplib (SMTP_SSL) |
| Geolocation | ip-api.com (free, no key) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| HTTP Client | Axios |
| Camera | react-webcam |
| Icons | Lucide React |
