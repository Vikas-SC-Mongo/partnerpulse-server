# PartnerPulse — Production Deployment Guide

Monorepo deployed as two services from the same GitHub repository.

## Overview
- Frontend → AWS Amplify (auto-deploys `client/` from GitHub)
- Backend  → AWS App Runner (auto-deploys `server/` from GitHub)
- Database → MongoDB Atlas

Local dev (`npm run dev`) is unchanged.

---

## Step 1 — MongoDB Atlas

1. Go to https://cloud.mongodb.com → create a project.
2. Build a Cluster → M0 Free (or M10 for production). Pick a region close to where App Runner will run.
3. Database Access → Add user `partnerpulse` with a strong password. Role: Atlas Admin.
4. Network Access → Add IP `0.0.0.0/0` (App Runner uses dynamic IPs; lock down later via VPC connector if needed).
5. Connect → Drivers → copy the URI:
   `mongodb+srv://partnerpulse:PASSWORD@cluster0.xxxxx.mongodb.net/partnerpulse`

---

## Step 2 — Push code to GitHub

```bash
cd ~/Desktop/partnerpulse-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/partnerpulse-app.git
git push -u origin main
```

---

## Step 3 — Deploy Backend to AWS App Runner

1. AWS Console → **App Runner** → Create service.
2. Source: **Source code repository** → connect your GitHub account → pick `partnerpulse-app` and branch `main`.
3. Deployment trigger: **Automatic** (redeploy on every push to `main`).
4. Configure build:
   - Configuration file: **Use a configuration file** (App Runner reads `server/apprunner.yaml`).
   - Source directory: `server`
5. Service settings:
   - Service name: `partnerpulse-server`
   - Virtual CPU/memory: 0.25 vCPU / 0.5 GB is enough to start.
   - Port: `3001` (already set in apprunner.yaml).
6. Environment variables (Add all of these):
   ```
   MONGODB_URI    = mongodb+srv://partnerpulse:PASSWORD@cluster0.xxxxx.mongodb.net/partnerpulse
   JWT_SECRET     = <run: openssl rand -hex 32>
   ALLOWED_ORIGINS= https://placeholder.amplifyapp.com   # update after Step 4
   ```
   (PORT is already exported by apprunner.yaml; no need to set it.)
7. Health check (optional, recommended):
   - Protocol: HTTP, Path: `/api/health`, Port: 3001.
8. Create & deploy. After ~5 min you'll get a URL like:
   `https://abcd1234.us-east-1.awsapprunner.com`
9. Test: open `https://<your-url>/api/health` → should return `{"status":"ok","mongodb":"connected"}`.

**Save this URL — you need it in Step 4.**

---

## Step 4 — Deploy Frontend to AWS Amplify

1. AWS Console → **Amplify** → New app → Host web app → GitHub.
2. Pick `partnerpulse-app` → branch `main`.
3. Amplify auto-detects `amplify.yml` at the repo root (already configured to build `client/`).
4. Environment variables → Add:
   ```
   VITE_API_URL = https://<your-app-runner-url>.awsapprunner.com
   ```
5. Save and deploy. After ~3 min you'll get a URL like:
   `https://main.xxxxxx.amplifyapp.com`
6. **Go back to App Runner** → Configuration → Edit environment variables:
   ```
   ALLOWED_ORIGINS = https://main.xxxxxx.amplifyapp.com
   ```
   App Runner will roll out the new config automatically.

---

## Step 5 — Test Production

1. Open the Amplify URL.
2. Login with `admin` / `admin123`.
3. **Immediately** change the admin password in Admin → Users.
4. Import data via the Upload tab.

---

## CI/CD

Both Amplify and App Runner are wired to your GitHub repo with automatic deploys.

```bash
git add .
git commit -m "Description of change"
git push
```

- Amplify rebuilds the frontend (~3 min).
- App Runner rebuilds the backend (~5 min).

No GitHub Actions or extra config needed.

---

## Local Dev (unchanged)

```bash
cd ~/Desktop/partnerpulse-app
npm run dev
```

Local uses MongoDB on `localhost`, backend on `:3001`, frontend on `:5173`.

---

## Generating a JWT Secret

```bash
openssl rand -hex 32
```

---

## Custom Domain (optional)

- Amplify: Domain management → Add domain.
- App Runner: Custom domains → Link domain (gives you ACM cert + CNAME instructions).

---

## Estimated Monthly Cost

- MongoDB Atlas M0: **Free** (512 MB).
- AWS App Runner (0.25 vCPU / 0.5 GB, always-on): **~$5–8/month**.
- AWS Amplify Hosting: **Free tier** (1000 build min/mo, 5 GB storage, 15 GB transfer).
- **Total: ~$5–8/month.**

To save more, set App Runner to **pause when idle** (auto-sleep) — drops to ~$1/month plus per-request charges, with cold-start latency on first request.

---

## Troubleshooting

- **CORS error in browser console**: `ALLOWED_ORIGINS` on App Runner doesn't match the Amplify URL exactly (check `https://`, no trailing slash).
- **Frontend calls hit Amplify domain instead of API**: `VITE_API_URL` not set in Amplify, or set after the build (env vars are baked in at build time — trigger a redeploy from Amplify console after changing).
- **MongoDB connection fails**: Atlas Network Access doesn't whitelist `0.0.0.0/0`, or wrong password in URI.
- **App Runner build fails**: Check the build log for the exact npm/node error. Most issues are missing env vars or Node version mismatch (apprunner.yaml pins Node 18).
