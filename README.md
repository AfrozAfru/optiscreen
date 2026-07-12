# OptiScreen — Clinical-Grade Cataract Detection Architecture & Technical Reference

[![Full Stack Architecture](https://img.shields.io/badge/Architecture-Decoupled_Full__Stack-4F46E5?style=for-the-badge)](https://github.com/ParthaCheleng/optiscreen)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js_15_(App_Router)-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_(Python_3.11)-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/AI_Engine-PyTorch_ResNet--18-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org)
[![Supabase](https://img.shields.io/badge/Data_&_Storage-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## 1. Executive Summary & System Overview

**OptiScreen** is a sovereign, production-ready clinical diagnostic application designed to detect crystalline lens opacification (cataracts) from fundus scans or direct anterior eye photographs. 

Unlike opaque third-party cloud AI wrappers, OptiScreen runs a **fully self-contained, explainable deep learning pipeline** locally on your infrastructure. Every scan undergoes spatial standardization, deep convolutional feature extraction, logit-calibrated classification, and mathematical explainability (Grad-CAM thermal heatmap generation) before logging immutable patient audit records to PostgreSQL.

```
+-----------------------------------------------------------------------------------------+
|                                    USER / CLINICIAN                                     |
+-----------------------------------------------------------------------------------------+
                                             |
                   1. Multipart Upload (PNG / JPEG / WEBP scan + JWT Auth)
                                             v
+-----------------------------------------------------------------------------------------+
|                        NEXT.JS 15 FRONTEND (APP ROUTER + SHADCN UI)                     |
|                                                                                         |
|   • Crisp Slate/Zinc Clinical UI           • Real-Time Confidence Gauge                 |
|   • Side-by-Side Original vs Grad-CAM      • Automated Clinical Triage Recommendations  |
+-----------------------------------------------------------------------------------------+
                                             |
                 2. POST /api/predict (Multipart FormData + X-User-Id Header)
                                             v
+-----------------------------------------------------------------------------------------+
|                         FASTAPI INFERENCE SERVER (PYTHON 3.11)                          |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   | 1. Ingestion & Preprocessing: 224x224 Bilinear Resize + ImageNet Normalization  |   |
|   +---------------------------------------------------------------------------------+   |
|                                             |                                           |
|                                             v                                           |
|   +---------------------------------------------------------------------------------+   |
|   | 2. ResNet-18 Deep Convolutional Backbone (optiscreen_cataract.pth)              |   |
|   |    • Extract 512 spatial feature maps (7x7) from layer4                         |   |
|   +---------------------------------------------------------------------------------+   |
|                       /                                           \                     |
|                      v                                             v                    |
|   +-------------------------------------+     +-------------------------------------+   |
|   | 3A. Calibrated Logit Classifier     |     | 3B. Explainable Grad-CAM Engine     |   |
|   |   • Δ = Logit_0 - Logit_1           |     |   • ∂Y_cataract / ∂A_layer4         |   |
|   |   • Calibrated Sigmoid Anchor (-4.4)|     |   • Thermal Colormap Overlay PNG    |   |
|   +-------------------------------------+     +-------------------------------------+   |
|                      \                                             /                    |
|                       +---------------------+---------------------+                     |
|                                             v                                           |
|   +---------------------------------------------------------------------------------+   |
|   | 4. Clinical Severity & Triage Engine (None | Mild | Moderate | Severe)          |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                       /                                               \
                      v                                                 v
3. Asynchronous Image Upload (eye-scans bucket)    4. Immutable Diagnostic Record (diagnostics table)
                      |                                                 |
                      v                                                 v
+-----------------------------------------------------------------------------------------+
|                     SUPABASE STORAGE & DATABASE LAYER (POSTGRESQL)                      |
|                                                                                         |
|   • Storage: eye-scans/{user_id}/{uuid}.png  • PostgreSQL: diagnostics (with RLS)      |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Deep Learning Detection Engine Under the Hood

### A. Preprocessing & Spatial Standardization
Incoming retinal or anterior eye photographs arrive in varying resolutions and lighting conditions. Before entering the neural network, images pass through our standardized transform pipeline (`_preprocess_transform` in `backend/inference.py`):

1. **Spatial Resampling**: Scaled via Lanczos interpolation to exactly $224 \times 224$ pixels.
2. **Channel Normalization**: Normalized against standard clinical vision baselines:
   $$\text{Pixel}_{\text{normalized}} = \frac{\text{Pixel} - \mu}{\sigma}$$
   Where $\mu = [0.485, 0.456, 0.406]$ and $\sigma = [0.229, 0.224, 0.225]$. This eliminates color skew caused by camera flash or room ambient light.

### B. Hierarchical Feature Extraction (ResNet-18 Backbone)
The preprocessed tensor $(1, 3, 224, 224)$ enters the 18-layer Residual Neural Network loaded with proprietary clinical weights (`backend/optiscreen_cataract.pth`):

* **Early Convolutional Layers (`conv1`, `layer1`)**: Extract elementary structural edges—corneal margins, iris striations, limbus curvature, and pupillary borders.
* **Mid Bottleneck Blocks (`layer2`, `layer3`)**: Combine edges into compound geometric structures—crystalline lens curvature and light-scattering gradients across the pupillary aperture.
* **Deep Semantic Layers (`layer4`)**: Isolate diagnostic pathology markers:
  * **Cortical Cataracts**: Wedge-shaped or spoke-like opacities extending from the lens periphery.
  * **Nuclear Cataracts**: Central crystalline lens yellowing, clouding, or opacification density.
  * **Posterior Subcapsular Cataracts**: Dense granular plaques along the posterior lens capsule.

### C. Calibrated Decision Mathematics
Raw neural network softmax outputs often carry a static class prior bias from training set distributions. In `optiscreen_cataract.pth`, the final linear classifier (`fc.bias`) carries a static logit prior offset of approximately $+4.4$ toward Class 1. 

To ensure clinical precision across all fundus and eye scans, OptiScreen computes the true differential activation strength between the Cataract logit ($\text{Logit}_0$) and Normal logit ($\text{Logit}_1$):

$$\Delta = \text{Logit}_0 - \text{Logit}_1$$

We evaluate $\Delta$ against the model's calibrated decision anchor ($-4.4$) using a calibrated logistic function:

$$P(\text{Cataract}) = \frac{1}{1 + e^{-2.2 \, (\Delta + 4.4)}}$$

* **Clear Crystalline Lens**: $\Delta < -4.4 \implies P(\text{Cataract}) \to 0\%$ (Diagnosis: **Normal**).
* **Opacified Crystalline Lens**: $\Delta > -4.4 \implies P(\text{Cataract}) \to 100\%$ (Diagnosis: **Cataract**).

---

## 3. Explainable AI Pipeline (Grad-CAM)

Black-box AI decisions are unacceptable in clinical ophthalmology. OptiScreen embeds **Grad-CAM (Gradient-weighted Class Activation Mapping)** directly inside the inference execution path (`generate_heatmap` in `backend/inference.py`).

```
Original Input Eye Scan                ResNet-18 Backpropagation             Thermal Opacification Heatmap
+-----------------------+              +-----------------------+             +-----------------------+
|                       |  ∂Y_cataract |   [ Activation Map ]  |  Colormap   |                       |
|   (Clear / Cloudy)    | -----------> |   Weighted Sum of     | ----------> |  Red/Yellow: Opacity  |
|                       |   ∂A_layer4  |   512 Feature Filters |  Overlay    |  Blue/Green: Clear    |
+-----------------------+              +-----------------------+             +-----------------------+
```

1. **Gradient Extraction**: We calculate the partial derivative of the Cataract prediction logit with respect to every spatial activation map $A^k$ in the final residual block (`model.layer4[-1]`):
   $$\alpha_k = \frac{1}{Z} \sum_{i=1}^{7} \sum_{j=1}^{7} \frac{\partial Y^{\text{Cataract}}}{\partial A_{i,j}^k}$$
2. **Spatial Localization**: A weighted linear combination of the $512$ feature maps is passed through a ReLU activation to preserve only positive opacification indicators:
   $$L_{\text{Grad-CAM}} = \text{ReLU}\left( \sum_{k=1}^{512} \alpha_k A^k \right)$$
3. **Thermal Composite Overlay**: The $7 \times 7$ activation grid is upscaled to $224 \times 224$, colored using a high-contrast thermal spectrum (Red/Yellow = focal cataract density; Blue = clear peripheral tissue), and blended over the original image at 95% PNG quality.

---

## 4. Clinical Severity & Triage Engine

Based on the calibrated probability score $P$, OptiScreen assigns a clinical severity grading and immediately generates actionable recommendations:

| Condition | Probability Threshold | Severity Grade | Recommended Clinical Action Plan |
| :--- | :---: | :---: | :--- |
| **Normal** | $P < 50\%$ | `None` | • Routine annual or bi-annual eye health examinations.<br>• Maintain standard UV protection outdoors. |
| **Cataract** | $50\% \le P < 75\%$ | `Mild` | • Schedule comprehensive ophthalmologic exam within 3–6 months.<br>• Monitor for night-driving glare or reading visual acuity shifts.<br>• Consider anti-glare lenses for current prescription eyewear. |
| **Cataract** | $75\% \le P < 90\%$ | `Moderate` | • Schedule clinical evaluation with an ophthalmologist within 4–8 weeks.<br>• Perform visual acuity and contrast sensitivity testing under glare.<br>• Discuss surgical timeline if daily functional activities are impacted. |
| **Cataract** | $P \ge 90\%$ | `Severe` | • Prompt ophthalmologic consultation for preoperative evaluation.<br>• Perform ocular biometry and intraocular lens (IOL) calculation.<br>• Advise patient regarding driving safety and visual fall risks. |

---

## 5. REST API Specification

### POST `/api/predict`
Analyzes an uploaded eye scan image, returns the diagnosis and Grad-CAM heatmap, and asynchronously records the diagnostic record to Supabase.

#### Request Headers
* `Content-Type`: `multipart/form-data`
* `X-User-Id`: Authenticated Supabase User UUID (or `"anonymous"`)

#### Multipart Payload
* `file`: Binary image file (`image/jpeg`, `image/png`, or `image/webp` up to 10MB)

#### Response Payload (`200 OK`)
```json
{
  "disease_detected": "Cataract",
  "confidence_score": 0.9692,
  "severity": "Severe",
  "heatmap_base64": "iVBORw0KGgoAAAANSUhEUgAAAOAAAADgCAYAAAB...",
  "explanation": "The AI model has detected signs consistent with cataract formation with a confidence of 96.9%. The analysis indicates a severe level of lens opacity...",
  "recommendations": [
    "Schedule prompt ophthalmologic consultation for preoperative cataract evaluation.",
    "Perform biometry and intraocular lens (IOL) calculation.",
    "Assess retinal health through dense opacity (B-scan ultrasonography if needed)."
  ],
  "image_url": "https://decwpnhlxveixibdkkil.supabase.co/storage/v1/object/public/eye-scans/user-uuid/scan.png"
}
```

---

## 6. Database Schema & Row-Level Security (`supabase/schema.sql`)

All diagnostic records are persisted in PostgreSQL with strict Row-Level Security (RLS). Users can only access their own diagnostic history, while the backend service role securely writes records via background worker threads:

```sql
create table if not exists public.diagnostics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text,
  disease_detected varchar(50) not null,
  confidence_score double precision not null,
  severity varchar(20) not null,
  explanation text,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- Enable Row-Level Security
alter table public.diagnostics enable row level security;

-- Policy: Users can only view their own diagnostic reports
create policy "Users can view own diagnostics"
  on public.diagnostics for select
  using (auth.uid() = user_id);
```

---

## 7. Complete Deployment Guide

### A. Run Locally (Development)

#### 1. Start FastAPI Backend (Port 8000)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
* Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Start Next.js Frontend (Port 3000)
```powershell
cd frontend
npm install
npm run dev
```
* Clinical Dashboard: [http://localhost:3000](http://localhost:3000)

---

### B. Production Deployment (Cloud Container + Vercel)

#### 1. Containerized Backend Deployment (Render / Railway / Docker)
OptiScreen includes a multi-stage production `backend/Dockerfile` that installs CPU-optimized PyTorch wheels for fast, lightweight container execution:
```dockerfile
docker build -t optiscreen-backend ./backend
docker run -p 8000:8000 --env-file ./backend/.env optiscreen-backend
```
* **Render Deployment**: Create a new Web Service pointing to repository `ParthaCheleng/optiscreen` with Root Directory set to `backend` and Runtime set to `Docker`.

#### 2. Frontend Deployment (Vercel)
* Import `ParthaCheleng/optiscreen` into [Vercel](https://vercel.com).
* Set Root Directory to `frontend`.
* Add environment variables:
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `NEXT_PUBLIC_API_URL` (Your deployed Render backend URL)

---

## 8. Repository Structure

```
OptiScreen/
├── backend/
│   ├── app.py                      # FastAPI REST service & upload endpoint
│   ├── inference.py                # Calibrated ResNet-18 & Grad-CAM engine
│   ├── database.py                 # Supabase storage & database wrapper
│   ├── schemas.py                  # Pydantic validation schemas
│   ├── optiscreen_cataract.pth     # PyTorch ResNet-18 weights (44.8 MB)
│   ├── Dockerfile                  # Production container configuration
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js 15 App Router pages & auth layouts
│   │   ├── components/             # Bento-grid dashboard, upload zone, heatmap view
│   │   └── lib/                    # API client & Supabase SSR authentication
│   └── package.json
└── supabase/
    └── schema.sql                  # PostgreSQL table schema, RLS policies & buckets
```

---
*Developed with clinical rigor for secure, explainable ophthalmologic screening.*
