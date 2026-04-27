# PartnerPulse — Production Deployment Guide

## Architecture

| Layer    | Service              | Notes                          |
|----------|----------------------|--------------------------------|
| Backend  | AWS App Runner       | Docker image pulled from ECR   |
| Image registry | Amazon ECR    | Auto-deployed via GitHub Actions |
| Frontend | AWS Amplify          | Builds from `client/` on push  |
| Database | MongoDB Atlas        | M0 free or M10 for production  |

CI/CD pipeline: **push to `main`** → GitHub Actions → builds Docker image → pushes to ECR → triggers App Runner deployment.

---

## Step 1 — MongoDB Atlas

1. Go to https://cloud.mongodb.com → create a project.
2. **Build a Cluster** → M0 Free (or M10 for production). Pick the same AWS region as App Runner.
3. **Database Access** → Add user `partnerpulse` with a strong password. Role: **Atlas Admin**.
4. **Network Access** → Add IP `0.0.0.0/0` (App Runner uses dynamic IPs; tighten later with a VPC connector if needed).
5. **Connect** → Drivers → copy the URI:
   ```
   mongodb+srv://partnerpulse:<PASSWORD>@cluster0.xxxxx.mongodb.net/partnerpulse
   ```

---

## Step 2 — Create an Amazon ECR Repository

1. AWS Console → **Elastic Container Registry** → **Create repository**.
2. Repository name: `partnerpulse-server` (private).
3. Keep all other settings as defaults → **Create repository**.
4. Copy the **repository URI** — you'll need it later.  
   Format: `<account-id>.dkr.ecr.<region>.amazonaws.com/partnerpulse-server`

---

## Step 3 — IAM User for GitHub Actions

Create a dedicated IAM user so GitHub Actions can push images and trigger deployments.

1. AWS Console → **IAM** → **Users** → **Create user**.
2. Name: `partnerpulse-deployer` → **Next**.
3. **Attach policies directly** → add these two managed policies:
   - `AmazonEC2ContainerRegistryPowerUser`
   - `AWSAppRunnerFullAccess`
4. **Create user** → open the user → **Security credentials** → **Create access key** → choose *Other*.
5. Save the **Access key ID** and **Secret access key** — you only see the secret once.

---

## Step 4 — Add GitHub Actions Secrets

In your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** — add all five:

| Secret name               | Value                                             |
|---------------------------|---------------------------------------------------|
| `AWS_ACCESS_KEY_ID`       | IAM access key from Step 3                        |
| `AWS_SECRET_ACCESS_KEY`   | IAM secret key from Step 3                        |
| `AWS_REGION`              | e.g. `us-east-1`                                  |
| `ECR_REPOSITORY`          | ECR repo name, e.g. `partnerpulse-server`         |
| `APP_RUNNER_SERVICE_ARN`  | App Runner service ARN — fill in after Step 5     |

---

## Step 5 — Push the First Image Manually

Before creating the App Runner service you need at least one image in ECR.

```bash
# Authenticate Docker with ECR (replace region + account ID)
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
    <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t partnerpulse-server .
docker tag  partnerpulse-server:latest \
            <account-id>.dkr.ecr.us-east-1.amazonaws.com/partnerpulse-server:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/partnerpulse-server:latest
```

---

## Step 6 — Create the App Runner Service

1. AWS Console → **App Runner** → **Create service**.
2. **Source**: Container registry → Amazon ECR.
3. **Container image URI**: browse and select `partnerpulse-server:latest`.
4. **Deployment trigger**: **Automatic** (App Runner watches ECR; GitHub Actions also calls `start-deployment` as a fallback).
5. **ECR access role**: click *Create new service role* — App Runner needs this to pull images.
6. **Configure service**:
   - Service name: `partnerpulse-server`
   - Port: `8080`
   - vCPU / Memory: `0.25 vCPU / 0.5 GB` (scale up if needed)
7. **Environment variables** — add all three:
   ```
   MONGODB_URI    = mongodb+srv://partnerpulse:<PASSWORD>@cluster0.xxxxx.mongodb.net/partnerpulse
   JWT_SECRET     = <run: openssl rand -hex 32>
   ALLOWED_ORIGINS= https://placeholder.amplifyapp.com   # update after Step 8
   ```
8. **Health check**:
   - Protocol: HTTP
   - Path: `/api/health`
   - Port: `8080`
9. **Create & deploy** — wait ~3 min. You'll get a URL like:
   ```
   https://abcd1234.us-east-1.awsapprunner.com
   ```
10. Copy the **Service ARN** from the service overview page and add it as the `APP_RUNNER_SERVICE_ARN` GitHub secret (Step 4).

---

## Step 7 — Test the Backend

```bash
curl https://<your-app-runner-url>/api/health
# Expected: {"status":"ready"}
```

---

## Step 8 — Deploy Frontend to AWS Amplify

1. AWS Console → **Amplify** → **New app** → **Host web app** → GitHub.
2. Pick `partnerpulse-server` repo → branch `main`.
3. Amplify auto-detects `amplify.yml` (already configured to build `client/`).
4. **Environment variables** → add:
   ```
   VITE_API_URL = https://<your-app-runner-url>.awsapprunner.com
   ```
5. Save and deploy. After ~3 min you'll get:
   ```
   https://main.xxxxxx.amplifyapp.com
   ```
6. **Go back to App Runner** → **Configuration** → edit `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://main.xxxxxx.amplifyapp.com
   ```
   App Runner rolls out the new config automatically.

---

## Step 9 — Verify End-to-End

1. Open the Amplify URL.
2. Login with `admin` / `admin123`.
3. **Immediately change the admin password** in Admin → Users.
4. Import data via the Upload tab.

---

## CI/CD — How It Works After Setup

Every push to `main`:
1. GitHub Actions builds the Docker image.
2. Pushes `:<sha>` and `:latest` tags to ECR.
3. Calls `aws apprunner start-deployment` to roll out the new image.
4. App Runner drains old containers and starts new ones (zero-downtime rolling update, ~2 min).

```bash
git add .
git commit -m "your change"
git push                    # triggers automatic deploy
```

---

## Generating a JWT Secret

```bash
openssl rand -hex 32
```

---

## Custom Domain (optional)

- **Amplify**: Domain management → Add domain.
- **App Runner**: Custom domains → Link domain (auto-provisions ACM cert + CNAME).

---

## Estimated Monthly Cost

| Service            | Config                     | Cost           |
|--------------------|----------------------------|----------------|
| MongoDB Atlas      | M0 Free                    | **Free**       |
| AWS App Runner     | 0.25 vCPU / 0.5 GB, active | ~$5–8/month    |
| Amazon ECR         | <1 GB storage              | ~$0.10/month   |
| AWS Amplify        | Free tier                  | **Free**       |
| **Total**          |                            | **~$5–8/month**|

> To cut costs further: set App Runner to **pause when idle** (auto-sleep) → drops to ~$1/month + per-request charges, with a cold-start latency on the first request after idle.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error in browser | `ALLOWED_ORIGINS` on App Runner doesn't match the Amplify URL exactly — check `https://` prefix, no trailing slash |
| Frontend calls fail | `VITE_API_URL` not set in Amplify, or set after the build (env vars are baked in at build time — trigger a redeploy from Amplify console) |
| MongoDB connection fails | Atlas Network Access doesn't have `0.0.0.0/0`, or wrong password in URI |
| App Runner can't pull image | ECR access role missing, or wrong region in `AWS_REGION` secret |
| GitHub Actions: `start-deployment` fails | `APP_RUNNER_SERVICE_ARN` secret is empty or incorrect — copy the ARN from the App Runner service overview page |
| Build fails in Actions | Check the Actions log; usually a missing secret or Docker build error |
