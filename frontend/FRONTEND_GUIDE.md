# Medical Dashboard - Frontend Guide

Welcome to your new Medical Dashboard! This guide is designed to help you understand, customize, and grow your application.

## 1. Project Structure

The project is split into two main folders:
- `backend/`: Python (FastAPI) API, database, and business logic.
- `frontend/`: React (Vite) application for the user interface.

### Frontend Structure (`/frontend/src/`)
- **`components/`**: Reusable UI blocks (e.g., `Layout.jsx`).
- **`pages/`**: Full screen views (e.g., `Dashboard.jsx`, `Patients.jsx`).
- **`services/`**: API connection logic (`api.js`).
- **`App.jsx`**: The main entry point where routes are defined.
- **`index.css`**: Global styles, colors, and design system variables.

## 2. Design System & Customization

We use **Vanilla CSS** with **Variables** for a premium, maintainable design.

### Colors & Branding
Open `src/index.css` to change the look and feel.
- **Gold Theme**: `var(--color-gold-500)` is the primary brand color.
- **Sustainability**: `var(--color-green-*)` variables are available for accents.

### Reusable Classes
Instead of complex components, we use standard HTML with utility classes:
- **Buttons**: `<button className="btn btn-primary">` or `<button className="btn btn-outline">`
- **Cards**: `<div className="card">` or `<div className="glass-card">` (for that premium see-through look)
- **Inputs**: `<input className="input" />`

## 3. How-To: Common Tasks

### How to add a new page?
1. Create a new file in `src/pages/` (e.g., `Settings.jsx`).
2. Add the component: `export default function Settings() { return <div>Settings</div> }`.
3. Open `src/App.jsx` and import it.
4. Add a `<Route path="settings" element={<Settings />} />` inside the main layout route.

### How to add a new field to the Patient form?
1. Open `src/pages/NewPatient.jsx`.
2. Add the field to the `formData` state: `const [formData, setFormData] = useState({ ..., new_field: '' })`.
3. Add an `<input>` or `<select>` in the JSX (copy an existing `.form-group`).
4. **Backend**: Make sure to also update `backend/models.py` and `backend/schemas.py` to accept this new field!

### How to change the Logo?
Open `src/components/Layout.jsx`.
- Look for `.logo-container`.
- You can replace the text `INSTITUTO TATSCH` or the `.logo-icon` div with an `<img src="/path/to/logo.png" />`.

## 4. Learning Resources

Since you want to learn React, here are the best places to start:
- **React Official Tutorial**: [react.dev/learn](https://react.dev/learn) (Best for understanding components/state)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev/guide/) (For build tool questions)
- **Lucide Icons**: [lucide.dev](https://lucide.dev/icons/) (Browse available icons)

## 5. Running the Project

**Terminal 1 (Backend):**
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn api:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Happy Coding!
