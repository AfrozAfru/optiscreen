# OptiScreen — Clinical-Grade Cataract Detection Application

OptiScreen is a modern, clinical-grade full-stack cataract detection application designed for ophthalmologists and clinical environments. It combines high-end visual aesthetics with a strictly decoupled architecture:

- **Frontend**: Next.js App Router (TypeScript), Tailwind CSS v4, custom Shadcn UI primitives
- **Backend**: FastAPI (Python), structured modular inference pipeline
- **Auth, Database & Storage**: Supabase (PostgreSQL, Row Level Security, Supabase Storage Buckets)

---

## 🏗 Architecture & Project Structure

```
OptiScreen/
├── frontend/                          # Next.js App Router (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with clinical Inter typography
│   │   │   ├── page.tsx               # Root redirector (/dashboard or /login)
│   │   │   ├── globals.css            # Tailwind v4 CSS-first design system (@theme)
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx     # Sign In page
│   │   │   │   └── signup/page.tsx    # Create Account page
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx         # Protected clinical dashboard layout
│   │   │   │   └── page.tsx           # Interactive upload & Bento results view
│   │   │   └── api/auth/callback/     # Supabase Auth callback handler
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn UI primitives (cva + cn utility)
│   │   │   ├── auth-form.tsx          # Reusable auth interface
│   │   │   ├── logo.tsx               # OptiScreen SVG logo
│   │   │   ├── navbar.tsx             # Clinical top navigation bar
│   │   │   ├── upload-zone.tsx        # Drag-and-drop diagnostic image uploader
│   │   │   ├── confidence-meter.tsx   # Animated SVG confidence ring
│   │   │   └── results-view.tsx       # Premium Bento-grid diagnostic view
│   │   ├── lib/
│   │   │   ├── api.ts                 # FastAPI client wrapper
│   │   │   └── supabase/              # Supabase browser & server clients
│   │   └── middleware.ts              # Route protection middleware
│   ├── components.json                # Shadcn configuration
│   └── .env.local                     # Supabase & backend configuration
│
├── backend/                           # FastAPI Application (Port 8000)
│   ├── app.py                         # FastAPI instance & /api/predict POST endpoint
│   ├── database.py                    # Supabase DB & Storage client wrapper
│   ├── inference.py                   # Preprocessing, model inference & Grad-CAM heatmap
│   ├── schemas.py                     # Pydantic request & response payloads
│   ├── requirements.txt               # Python dependencies
│   └── .env                           # Backend Supabase credentials
│
└── supabase/
    └── schema.sql                     # PostgreSQL schema + RLS policies + Storage bucket
```

---

## ✨ Features & Clinical UX

1. **Authentication & Session Security**:
   - Built on Supabase Auth (`@supabase/ssr` with cookie-backed tokens).
   - Route protection middleware ensuring only authenticated clinicians access diagnostic tools.

2. **Supabase Database & Storage Integration**:
   - `diagnostics` PostgreSQL table with complete Row Level Security (RLS).
   - `eye-scans` private Storage bucket for securely retaining diagnostic fundus/slit-lamp imagery.
   - Asynchronous fire-and-forget logging to Supabase so inference responses remain fast.

3. **Bento-Grid Diagnostic Results**:
   - Side-by-side comparison of the raw fundus image and the **Grad-CAM Heatmap overlay**.
   - **Confidence Meter**: Animated circular gauge color-coded by model certainty.
   - **Diagnosis & Severity**: Clinical classification (`Normal` vs `Cataract`) with structured severity stratification (`None`, `Mild`, `Moderate`, `Severe`).
   - Actionable ophthalmological recommendations and structured clinical explanation.

---

## 🚀 Quick Start Instructions

### 1. Database Setup (Supabase)
Execute `supabase/schema.sql` in your Supabase project SQL Editor to create the `diagnostics` table, RLS policies, and the `eye-scans` storage bucket.

### 2. Start the FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
- App URL: [http://localhost:3000](http://localhost:3000)

---

## 🧠 Integrating Your PyTorch Model (`.pth`)

The backend is currently structured with modular placeholders in `backend/inference.py`. To plug in your trained PyTorch `.pth` weights:

1. Place your model weights file (e.g., `cataract_model.pth`) inside `backend/`.
2. Open `backend/inference.py` and replace:
   - `preprocess_image()`: Adjust normalization mean/std to match your training set (e.g., ImageNet `[0.485, 0.456, 0.406]`).
   - `run_inference()`: Load your PyTorch model (`torch.load(...)`) and run forward pass probabilities.
   - `generate_heatmap()`: Use `pytorch-grad-cam` (`GradCAM`) on your target convolution layer to generate the real Grad-CAM overlay.
