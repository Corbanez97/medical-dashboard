# Frontend Documentation - Medical Dashboard

This frontend is a React + TypeScript application connected to all endpoints defined in `backend/api.py`.

## Overview

The app is now segmented into pages (route-based):

- `/patients`: patient management (list, search, create, edit, delete)
- `/lab-definitions`: lab test definition management
- `/patients/:patientId/dashboard`: consolidated patient overview
- `/patients/:patientId/labs`: patient lab results
- `/patients/:patientId/bioimpedance`: patient bioimpedance data
- `/patients/:patientId/anthropometry`: patient anthropometry data
- `/patients/:patientId/subjective`: patient subjective data

## Main Files and Responsibilities

- `frontend/src/App.tsx`
  Defines the router and page mapping.

- `frontend/src/layout/ShellLayout.tsx`
  Global shell (header, brand, top navigation).

- `frontend/src/api.ts`
  Typed API client for backend endpoints.

- `frontend/src/types.ts`
  Shared TypeScript models aligned with backend schemas.

- `frontend/src/helpers.ts`
  Generic utilities: formatters, validators, and numeric parsers.

- `frontend/src/components/common/NoticeBanner.tsx`
  Reusable feedback banner for success/error/info messages.

- `frontend/src/pages/PatientsPage.tsx`
  CRUD page for patients.

- `frontend/src/pages/LabDefinitionsPage.tsx`
  Lab test matrix setup page.

- `frontend/src/pages/PatientRouteLayout.tsx`
  Patient-level layout with tabs and nested routes.

- `frontend/src/pages/PatientDashboardPage.tsx`
  Overview page aggregating all domains for one patient.

- `frontend/src/pages/PatientLabsPage.tsx`
  Add/list lab results for one patient.

- `frontend/src/pages/PatientBioimpedancePage.tsx`
  Add/list bioimpedance entries for one patient.

- `frontend/src/pages/PatientAnthropometryPage.tsx`
  Add/list anthropometry entries for one patient.

- `frontend/src/pages/PatientSubjectivePage.tsx`
  Add/list subjective entries for one patient.

- `frontend/src/index.css`
  Global design tokens and responsive styles.

- `frontend/vite.config.ts`
  Development proxy (`/api` -> `http://127.0.0.1:8000`).

## Endpoint Coverage

All backend routes are handled by `src/api.ts`:

- `POST /patients/`
- `GET /patients/`
- `GET /patients/{patient_id}`
- `PUT /patients/{patient_id}`
- `DELETE /patients/{patient_id}`

- `POST /lab-definitions/`
- `GET /lab-definitions/`

- `POST /lab-results/`
- `GET /patients/{patient_id}/lab-results/`

- `POST /bioimpedance/`
- `GET /patients/{patient_id}/bioimpedance/`

- `POST /anthropometry/`
- `GET /patients/{patient_id}/anthropometry/`

- `POST /subjective/`
- `GET /patients/{patient_id}/subjective/`

## Data Flow

1. Pages call typed functions in `src/api.ts`.
2. `src/api.ts` sends HTTP requests to FastAPI.
3. Responses update page state.
4. After create/update/delete, pages refresh the related datasets.

## Encoding Fix

Frontend files were normalized to UTF-8, and corrupted strings were removed/replaced.

## Run Locally

1. Start backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn api:app --reload --port 8000
```

2. Start frontend:

```powershell
cd frontend
npm install
npm run dev
```

3. Open the local Vite URL shown in terminal (usually `http://localhost:5173`).

## Build

```powershell
cd frontend
npm run build
```
