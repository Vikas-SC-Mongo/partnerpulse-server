# PartnerPulse — Setup Guide
## From Zero to Running in ~15 Minutes

---

## What You're Setting Up

```
Your Mac
├── MongoDB (database — runs in background)
├── Node.js / Express (backend server — port 3001)
└── React / Vite (frontend — port 5173, opens in browser)
```

---

## STEP 1 — Install MongoDB on your Mac

MongoDB runs silently in the background on your Mac and stores all your data.

### 1a. Install Homebrew (if you don't have it)
Open **Terminal** (press Cmd+Space, type "Terminal") and paste:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the prompts. This takes 2–5 minutes.

### 1b. Install MongoDB
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### 1c. Start MongoDB (runs in background)
```bash
brew services start mongodb-community
```

### 1d. Verify MongoDB is running
```bash
brew services list
```
You should see `mongodb-community` with status **started** ✅

> 💡 MongoDB will now start automatically every time your Mac boots.
> To stop it manually: `brew services stop mongodb-community`

---

## STEP 2 — Install Node.js (if you don't have it)

```bash
brew install node
```

Verify it worked:
```bash
node --version    # should show v18 or higher
npm --version     # should show v9 or higher
```

---

## STEP 3 — Set Up the Project

### 3a. Move the project folder to your Desktop
Unzip the downloaded file and place the `partnerpulse-app` folder on your Desktop:
```
~/Desktop/partnerpulse-app/
```

### 3b. Open Terminal and navigate to the project
```bash
cd ~/Desktop/partnerpulse-app
```

### 3c. Install all dependencies (one command)
```bash
npm run install:all
```
This installs packages for the root, server, and client. Takes 1–2 minutes.

---

## STEP 4 — Seed the Database with Sample Data

This loads the initial sample data (Iman, Deepak, Meena, Shivani + all partners + opportunities):

```bash
cd ~/Desktop/partnerpulse-app
npm run seed
```

You should see:
```
✅ MongoDB connected
Cleared existing data
  ✅ Iman Roy — 3 partners, 3 opps
  ✅ Deepak Mirchandani — 2 partners, 2 opps
  ✅ Meena M — 2 partners, 2 opps
  ✅ Shivani Tripathy — 3 partners, 3 opps

🎉 Seed complete!
```

---

## STEP 5 — Run the App

From the project folder:
```bash
cd ~/Desktop/partnerpulse-app
npm run dev
```

This starts both the backend and frontend at the same time. You'll see:
```
[server] ✅ MongoDB connected: mongodb://localhost:27017/partnerpulse
[server] 🚀 PartnerPulse API running on http://localhost:3001
[client] Local: http://localhost:5173/
```

Open **Chrome** and go to: **http://localhost:5173**

🎉 Your dashboard is live with data from MongoDB!

---

## STEP 6 — Upload Your Real CSV Data

Once the app is running, click **📤 Upload** in the top navigation.

Drag and drop your CSV files:
- `week_2025-03-10.csv` → imported as weekly data
- `prev_year.csv` → imported as previous year NAAR

The app automatically detects file type from the filename.

**Every week:** just upload a new `week_2025-03-17.csv` — the app stores all history in MongoDB so you can compare any two weeks.

---

## Daily Usage (after first setup)

Every time you want to use the dashboard:

1. Open **Terminal**
2. Run:
```bash
cd ~/Desktop/partnerpulse-app && npm run dev
```
3. Open Chrome → **http://localhost:5173**

> MongoDB starts automatically with your Mac, so you only need to start the app itself.

---

## Project Structure

```
partnerpulse-app/
├── package.json            ← root scripts (npm run dev, npm run seed)
├── server/
│   ├── index.js            ← Express API server
│   ├── models.js           ← MongoDB schemas (Team, Partner, NAAR, Opps)
│   ├── importService.js    ← CSV → MongoDB parser
│   ├── .env                ← MongoDB connection string
│   └── scripts/
│       └── seed.js         ← loads sample data
└── client/
    ├── vite.config.js      ← dev server + proxy config
    ├── index.html
    └── src/
        ├── App.jsx             ← main dashboard
        ├── api/index.js        ← all API calls to backend
        └── components/
            ├── UI.jsx          ← shared components
            ├── UploadPanel.jsx ← CSV upload UI
            └── HistoryCharts.jsx ← NAAR trend charts
```

---

## MongoDB Collections

Your data is stored in these MongoDB collections (database: `partnerpulse`):

| Collection | What it stores |
|---|---|
| `teammembers` | Iman, Deepak, Meena, Shivani |
| `partners` | Infosys, Accenture, TCS etc. + who owns them |
| `naarsnapshots` | NAAR per partner per week — full history |
| `opportunities` | All deals across all time |
| `uploadlogs` | Record of every CSV you've uploaded |

To browse your data visually, install **MongoDB Compass** (free):
👉 https://www.mongodb.com/try/download/compass

Connect with: `mongodb://localhost:27017`

---

## API Endpoints (for future features)

| Endpoint | What it does |
|---|---|
| `GET /api/dashboard?week=2025-03-10` | Full team data for a week |
| `GET /api/history/:partnerName` | NAAR trend over time for a partner |
| `GET /api/history/team/summary` | Team total NAAR by week |
| `GET /api/opportunities?partner=TCS` | All opportunities (filterable) |
| `POST /api/upload` | Upload a single CSV |
| `POST /api/upload/folder` | Upload multiple CSVs at once |
| `GET /api/uploads` | Upload history log |
| `GET /api/health` | Check if server + MongoDB are healthy |

---

## Troubleshooting

**"MongoDB connection failed"**
```bash
brew services start mongodb-community
```

**"npm: command not found"**
→ Re-run Step 2 to install Node.js

**"Cannot find module" errors**
```bash
cd ~/Desktop/partnerpulse-app && npm run install:all
```

**Port 3001 already in use**
```bash
lsof -ti:3001 | xargs kill
```

**Dashboard shows "Could not load dashboard"**
→ Make sure `npm run dev` is running in Terminal and you see the MongoDB connected message.

---

## Sharing with Stakeholders (Vercel)

When you're ready to share with your wider org, the app can be deployed to Vercel for free:

1. Install Vercel CLI: `npm install -g vercel`
2. Push your code to GitHub
3. Run `vercel` in the project folder
4. Switch MongoDB from local to **MongoDB Atlas** (free cloud tier)

Ask Claude to help with this step when you're ready!
