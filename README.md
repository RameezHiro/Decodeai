# Decode AI

Decode AI is a responsive React + TypeScript learning workspace with a FastAPI image-understanding backend. The backend calls Google’s hosted Gemini API for Gemma 4 image inference; the API key stays server-side.

The frontend retains its Dark, Light, High contrast, Porcelain, and Aurora themes and interactive Three.js hero scene. The backend implements the existing `/api/health`, `/api/explain`, and `/api/quiz` contract.

## Models and inference

- Primary: `gemma-4-26b-a4b-it`
- Fallback: `gemma-4-31b-it`

Each request tries the primary model first. If the provider request fails or the model returns invalid JSON or a response that does not match the API contract, the backend retries with the fallback. Uploaded images are sent as inline image data with the question. The API validates PNG, JPEG, and WebP signatures and limits uploads to 10 MB.

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). Keep it in `GEMINI_API_KEY` on the server only. Do not prefix it with `VITE_` or add it to frontend code.

## Run locally

Use Node.js 20+ and Python 3.11+.

```bash
# From the repository root
cp .env.example .env
# Add your Google AI Studio key to GEMINI_API_KEY in .env
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal, from the repository root:

```bash
npm install
npm run dev
```

Vite reads `VITE_API_BASE_URL=http://localhost:8000` from `.env`. The FastAPI process loads the same root `.env` via `python-dotenv`. The health check returns `503` until `GEMINI_API_KEY` is set.

To run the backend tests:

```bash
source .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
pytest backend/tests
```

## API contract

### `GET /api/health`

Returns `200` and the configured model IDs when the Gemini API key is present. Returns `503` with a setup message otherwise. The frontend uses this endpoint for its API connection indicator.

### `POST /api/explain`

Accepts `multipart/form-data`:

- `image`: PNG, JPEG, or WebP, up to 10 MB
- `question`: required text, up to 1,500 characters
- `level`: `Beginner`, `Intermediate`, or `Advanced`

Returns an object with `title`, `summary`, `key_concepts`, `steps`, `example`, and `uncertainties`.

### `POST /api/quiz`

Accepts `image`, `question`, `level`, and `context` as multipart fields. `context` is the latest explanation summary supplied by the frontend. Returns exactly three questions; each has four options, a zero-based `correct_index`, and an explanation.

The backend responds with `413` for oversized images, `415` for unsupported or mislabeled images, `503` when the provider key is missing, and `502` after both models fail. CORS origins are configurable through the comma-separated `ALLOWED_ORIGINS` variable.

## Deploy

### Render API

The root `render.yaml` defines a Python web service. Connect the repository to Render and create the service from the Blueprint. Render will run the build and start commands automatically. When prompted, provide `GEMINI_API_KEY`. Replace `YOUR-VERCEL-DOMAIN.vercel.app` in the Blueprint’s `ALLOWED_ORIGINS` value with the actual frontend domain. The `free` Render service may spin down after inactivity.

### Vercel frontend

The root `vercel.json` configures the SPA fallback for Vite routes. Deploy the repository root as a Vite project. In Vercel project settings, set the build-time environment variable:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

Use the exact Render service origin with no trailing slash, then redeploy the frontend. Keep `GEMINI_API_KEY` only on Render. Vercel is configured here to host the static frontend; Render hosts the FastAPI service. This keeps the frontend’s 10 MB upload workflow off Vercel Functions, which currently limit request payloads to 4.5 MB.

CORS is not authentication. Before opening the service to untrusted users, add usage limits or an authentication layer appropriate to the product.

## Project structure

```text
backend/
  app/main.py             FastAPI routes, validation, Gemini calls, fallback logic
  requirements.txt        Production Python dependencies
  requirements-dev.txt    Test dependency set
  tests/test_api.py       Offline API and fallback tests
src/
  components/             Responsive React UI, theme picker, Three.js scene
  services/api.ts         Frontend HTTP calls and response validation
  App.tsx                 Application flow and state
  types.ts                Shared frontend API/domain types
  styles.css              Responsive themed design system
render.yaml               Render FastAPI Blueprint
vercel.json               Vite SPA route fallback
```

## Official references

- [Google: Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api) — supported Gemma 4 model IDs, API key requirement, image input, and `generateContent` usage.
- [Render: Deploy a FastAPI App](https://render.com/docs/deploy-fastapi) and [Blueprint YAML Reference](https://render.com/docs/blueprint-spec).
- [Vercel: Vite](https://vercel.com/docs/frameworks/frontend/vite) and [Function request limits](https://vercel.com/docs/functions/limitations).
