# ResumeIQ — AI-Powered Resume Analyzer & Job Matcher

ResumeIQ is a professional, full-stack SaaS web application built for B.Tech IT portfolios and technical interviews. It allows users to upload PDF resumes, compare them against job descriptions, calculate transparent deterministic compatibility scores, identify missing skills and keywords, and receive AI-assisted resume recommendations and bullet-point rewrites.

---

## 🌟 Key Features

1. **Authentication & User Management**: Secure registration and login with JWT and bcrypt password hashing. Protected routes and user data isolation.
2. **PDF Resume Parser**: Extracts text from PDF resumes, normalizes whitespace, detects sections (Skills, Education, Experience, Projects, Certifications), calculates word/page counts, and checks for scanned image PDFs.
3. **Job Description NLP Analyzer**: Extracts required skills, preferred skills, important keywords, experience requirements, and education requirements using alias mapping and phrase matching.
4. **Deterministic Scoring Engine**: Calculates an overall 0–100 ResumeIQ Compatibility Score across 5 weighted categories (Skills Match 40%, Keyword Match 25%, Project Relevance 15%, Experience Relevance 10%, Resume Structure 10%).
5. **AI-Powered Recommendations**: Integrates OpenAI GPT (optional) with strict factual-integrity guardrails to provide prioritized action items, project highlighting suggestions, and reworded resume bullets with copy-to-clipboard functionality.
6. **Analysis History & Management**: Save, view, search, filter, and delete past analyses and uploaded resumes.
7. **Production-Ready Security**: Helmet security headers, CORS configuration, rate limiting, request size limits, and robust input validation with Zod.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend**: Node.js, Express, MongoDB & Mongoose, JWT, bcryptjs, Zod, pdf-parse, multer, OpenAI SDK
- **Testing**: Jest, Supertest (53 backend and scoring engine tests passing)

---

## 📁 Project Structure

```text
Project/
├── client/                 # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # UI & layout components (Navbar, Footer, Layout)
│   │   ├── pages/          # Landing, Login, Register, Dashboard, Resumes, Analyze, Results, History, Settings
│   │   ├── services/       # Axios API client
│   │   └── store/          # Auth Context
│   └── package.json
├── server/                 # Node.js & Express backend
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers (Auth, Resumes, Analyses)
│   │   ├── middleware/     # Auth verification, error handling, multer upload
│   │   ├── models/         # Mongoose schemas (User, Resume, Analysis)
│   │   ├── routes/         # API routes
│   │   ├── services/       # PDF parser, NLP analyzer, scoring engine, AI service, skill dictionary
│   │   ├── validators/     # Zod validation schemas
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── tests/              # Jest automated tests (scoring, NLP, PDF parsing)
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20 LTS or newer (the working environment used Node.js 22.16.0)
- MongoDB running locally or MongoDB Atlas connection string

### 1. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI and optional OPENAI_API_KEY
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

To run backend tests:
```bash
npm test
```

### 2. Frontend Setup
```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

For local development, leave `VITE_API_URL` empty so Vite uses its `/api` proxy. For a deployed frontend, set `VITE_API_URL` to the backend URL ending in `/api`, for example `https://your-api.onrender.com/api`. Vite variables are public build-time values; never put secrets in them.
The frontend dev server will start on `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:5000` during local development.

To build frontend for production:
```bash
npm run build
```

---

## ⚙️ Environment Variables

### Server (`server/.env`)

Copy `server/.env.example` to `server/.env` and configure:

- `PORT=5000` — server port (hosting providers usually inject this).
- `NODE_ENV=development` — use `production` when deployed.
- `MONGODB_URI=mongodb://localhost:27017/resumeiq` — local MongoDB or Atlas URI.
- `JWT_SECRET` — use a unique, random secret of at least 32 characters. Production startup exits if it is missing/too short.
- `JWT_EXPIRES_IN=7d` — JWT lifetime.
- `OPENAI_API_KEY` — optional; leave unset to use deterministic analysis without AI recommendations.
- `CLIENT_URL=http://localhost:5173` — allowed frontend origin. Multiple comma-separated origins are supported for deployments.
- `MAX_FILE_SIZE_MB=5`, `UPLOAD_DIR=uploads`, `RATE_LIMIT_WINDOW_MS=900000`, `RATE_LIMIT_MAX_REQUESTS=100`, `AUTH_RATE_LIMIT_MAX=10`, `ANALYSIS_RATE_LIMIT_MAX=20` — optional runtime tuning.

### Frontend (`client/.env.local`)

- `VITE_API_URL` — leave empty locally; set to the deployed backend URL ending in `/api` for production. Do not store credentials here.

---

## 📊 Scoring Formula

The ResumeIQ compatibility score is calculated deterministically from application code (never invented by an LLM):
$$\text{Score} = (\text{Skills} \times 0.40) + (\text{Keywords} \times 0.25) + (\text{Projects} \times 0.15) + (\text{Experience} \times 0.10) + (\text{Structure} \times 0.10)$$

---

## 🚢 Deployment

### Backend on Render

1. Push this repository to GitHub (ensure `.env` files are not committed).
2. Create a Render Web Service with the repository root as the root directory `server/`.
3. Build command: `npm ci`.
4. Start command: `npm start`.
5. Add `MONGODB_URI` (MongoDB Atlas), `JWT_SECRET` (generated secret, 32+ characters), `CLIENT_URL` (your deployed Vercel origin), and optionally `OPENAI_API_KEY` as Render environment variables. Set `NODE_ENV=production`.
6. Set the health-check path to `/api/health`. A healthy response with `database: "disconnected"` means the process is up but MongoDB is not connected; database-backed operations will not work until the URI/network access is correct.

### Frontend on Vercel

1. Import the repository into Vercel and set the project root to `client/`.
2. Framework preset: Vite; build command: `npm run build`; output directory: `dist`.
3. Add `VITE_API_URL=https://your-api.onrender.com/api` and redeploy after setting it.
4. The included `client/vercel.json` routes client-side paths back to `index.html`.
5. Set the backend `CLIENT_URL` to the exact deployed frontend origin. If using a custom domain, include that origin in the comma-separated list.

### Important production checks

- Add your Render service's outbound access to MongoDB Atlas IP/network rules as appropriate; do not allow broad access unless you understand the risk.
- Confirm registration/login, PDF upload, analysis polling, history, and deletion against the deployed services.
- The API currently uses bearer JWTs stored by the client in `localStorage`; this is convenient for a portfolio app but remains exposed to successful same-origin XSS. A production product with a stronger threat model should move to secure, HttpOnly, SameSite cookies and add CSRF protections.
- Logout is stateless JWT logout: the client removes the token. Already-issued tokens remain valid until expiry unless the JWT/session design is extended with revocation.
- PDF extraction is text-based; scanned PDFs require OCR, which is not implemented.

## 🧪 Verification

Backend checks in the supplied environment:

```bash
cd server
npm run lint
npm test
```

The test suite currently contains 53 tests across PDF parsing, NLP extraction, deterministic scoring (including student-friendly experience scoring), the health endpoint, unauthenticated access to protected endpoints, and unknown API routes. The frontend production build should be verified on a platform that can install the Linux Rollup optional dependency; the uploaded archive's `node_modules` contains Windows-specific Rollup binaries, and dependency installation could not complete in the current network-restricted environment.

## 🛡️ License & Attribution
🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude Code <noreply@anthropic.com>
