require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  TeamMember,
  Partner,
  NarrSnapshot,
  Opportunity,
  UploadLog,
  Champion,
  Workstream,
  Activity,
  User,
  Config,
  MarketingEvent,
} = require("./models");
const JWT_SECRET = process.env.JWT_SECRET || "partnerpulse_secret_2025";
const { importWeeklyCSV, importPrevYearCSV } = require("./importService");

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : true,
    credentials: true,
  }),
);
app.use(express.json());

// ── DB Connect ────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    // Seed default admin user if no users exist
    const count = await User.countDocuments();
    if (count === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await User.create({ username: "admin", password: hash, role: "Admin" });
      console.log("👤 Default admin created: admin / admin123");
    }
    // Seed default config values if not set
    const DEFAULTS = [
      {
        key: "partners",
        label: "Partners",
        values: [
          "Infosys",
          "EY",
          "Wipro",
          "Accenture",
          "Tech Mahindra",
          "TCS",
          "Hexaware",
          "Capgemini",
          "Cognizant",
          "LTIM",
        ],
      },
      {
        key: "activityOwners",
        label: "Activity Owners",
        values: [
          "Deepak M",
          "Sampat B",
          "Iman R",
          "Meena M",
          "Shivani T",
          "Sneha D",
          "Rashmi N",
          "Vikas S",
          "Ashutosh B",
          "Prasad P",
          "Haim R",
        ],
      },
      {
        key: "championOwners",
        label: "Champion Contact Owners",
        values: [
          "Sneha D",
          "Rashmi N",
          "Vikas S",
          "Ashutosh B",
          "Prasad P",
          "Haim R",
          "Will Winn",
          "Stefano S",
          "Piyush A",
          "Vinai",
          "Harshada",
          "Cameron",
        ],
      },
      {
        key: "regions",
        label: "Regions",
        values: ["APAC", "AMER", "LATAM", "EU", "ME", "Africa"],
      },
      { key: "priorities", label: "Priorities", values: ["P1", "P2", "P3"] },
      {
        key: "activityCategories",
        label: "Activity Categories",
        values: [
          "Workstream",
          "Champion Building",
          "Opportunity",
          "PDM",
          "Event Planning",
        ],
      },
      {
        key: "activityStatuses",
        label: "Activity Statuses",
        values: ["Open", "In Progress", "Done", "Blocked"],
      },
      {
        key: "impacts",
        label: "Impact Levels",
        values: ["High", "Medium", "Low"],
      },
      {
        key: "workstreamStatuses",
        label: "Workstream Statuses",
        values: ["Active", "Inactive", "On Hold"],
      },
      {
        key: "certifications",
        label: "Certification Types",
        values: ["SI Associate", "SI Architect", "App Dev"],
      },
      {
        key: "championStatuses",
        label: "Champion Statuses",
        values: ["champion", "building", "not_yet"],
      },
      {
        key: "teamMembers",
        label: "Team Members",
        values: [
          "Iman Roy",
          "Deepak Mirchandani",
          "Meena M",
          "Shivani Tripathy",
        ],
      },
    ];
    for (const d of DEFAULTS) {
      await Config.findOneAndUpdate(
        { key: d.key },
        { $setOnInsert: d },
        { upsert: true },
      );
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
  });
// Start immediately so App Runner TCP health check passes while MongoDB connects
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`),
);

// ════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: connected ? "ready" : "starting",
    mongodb: connected ? "connected" : "connecting",
  });
});

// ── Constants ──────────────────────────────────────────────────────────────
const TEAM_TARGET = 65776000; // $65.776M annual team target
const FY27_START = new Date("2026-02-01");
const FY27_END = new Date("2027-01-31T23:59:59");

// ════════════════════════════════════════════════════════════════
// DASHBOARD API
// ════════════════════════════════════════════════════════════════
app.get("/api/dashboard", async (req, res) => {
  try {
    let weekDate;
    if (req.query.week) {
      weekDate = new Date(req.query.week);
    } else {
      const latest = await NarrSnapshot.findOne().sort({ weekDate: -1 });
      if (!latest)
        return res.json({
          team: [],
          availableWeeks: [],
          teamTarget: TEAM_TARGET,
        });
      weekDate = latest.weekDate;
    }

    const weeks = await NarrSnapshot.distinct("weekDate");
    weeks.sort((a, b) => new Date(b) - new Date(a));

    const partners = await Partner.find().populate("owner");
    const snapshots = await NarrSnapshot.find({ weekDate });
    const snapshotMap = {};
    snapshots.forEach((s) => {
      snapshotMap[s.partner.toString()] = s;
    });

    // ── Last-2-weeks approved opps ──────────────────────────────
    const twoWeeksAgo = new Date(weekDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentOpps = await Opportunity.find({
      status: { $regex: /^approved$/i },
      $or: [
        { attributionCreatedDate: { $gte: twoWeeksAgo, $lte: weekDate } },
        { oppCreatedDate: { $gte: twoWeeksAgo, $lte: weekDate } },
        { createdDate: { $gte: twoWeeksAgo, $lte: weekDate } },
      ],
    })
      .populate("partner")
      .populate("championId")
      .populate("workstreamId");

    // ── This FY (FY27: Feb 2026 – Jan 2027) approved opps ──────
    const fyOpps = await Opportunity.find({
      status: { $regex: /^approved$/i },
      $or: [
        { attributionCreatedDate: { $gte: FY27_START, $lte: FY27_END } },
        { oppCreatedDate: { $gte: FY27_START, $lte: FY27_END } },
        { createdDate: { $gte: FY27_START, $lte: FY27_END } },
      ],
    })
      .populate("partner")
      .populate("championId")
      .populate("workstreamId");

    // ── All approved opps for quarterly drill-down ──────────────
    const allApprovedOpps = await Opportunity.find({
      status: { $regex: /^approved$/i },
    }).populate("partner");

    // ── Non-approved opps ───────────────────────────────────────
    const nonApprovedOpps = await Opportunity.find({
      status: { $not: /^approved$/i, $exists: true, $ne: "" },
    }).populate("partner");

    // ── Build team structure ────────────────────────────────────
    const memberMap = {};
    for (const partner of partners) {
      const ownerName = partner.owner?.name;
      if (!ownerName) continue;
      if (!memberMap[ownerName]) {
        memberMap[ownerName] = {
          id: partner.owner._id,
          name: ownerName,
          avatar: partner.owner.avatar,
          partners: [],
          recentOpps: [], // last 2 weeks
          fyOpps: [], // this FY
          quarterlyOpportunities: [],
          nonApprovedOpportunities: [],
        };
      }
      const snap = snapshotMap[partner._id.toString()];
      memberMap[ownerName].partners.push({
        _id: partner._id,
        name: partner.name,
        type: partner.type,
        narr: snap?.narr || 0,
        partnerNarr: snap?.partnerNarr || 0,
        closedNarr: snap?.closedNarr || 0,
        pipelineNarr: snap?.pipelineNarr || 0,
        strategic: snap?.strategic || 0,
        nonStrategic: snap?.nonStrategic || 0,
        quarterlyBreakdown: snap?.quarterlyBreakdown || [],
      });
    }

    // ── Regional NARR — all approved opps grouped by owner + region ──
    const allApprovedForRegion = await Opportunity.find({
      status: { $regex: /^approved$/i },
    }).populate("partner");

    // Build regionalNarr map: { ownerName: { AMER: 0, EMEA: 0, APAC: 0, other: 0 } }
    const regionalNarrMap = {};
    for (const opp of allApprovedForRegion) {
      if (!opp.partner?._id) continue;
      const partnerDoc = partners.find((p) => p._id.equals(opp.partner._id));
      const ownerName = partnerDoc?.owner?.name;
      if (!ownerName || !memberMap[ownerName]) continue;
      if (!regionalNarrMap[ownerName])
        regionalNarrMap[ownerName] = {
          AMER: 0,
          EMEA: 0,
          APAC: 0,
          LATAM: 0,
          other: 0,
        };
      const region = opp.region || "";
      const key = ["AMER", "EMEA", "APAC", "LATAM"].includes(region)
        ? region
        : "other";
      regionalNarrMap[ownerName][key] += opp.value || 0;
    }

    // Attach to each member
    for (const [ownerName, regData] of Object.entries(regionalNarrMap)) {
      if (memberMap[ownerName]) memberMap[ownerName].regionalNarr = regData;
    }

    function serializeOpp(opp, extra = {}) {
      return {
        _id: opp._id,
        id: opp.oppId,
        partner: opp.partner?.name || "",
        title: opp.title,
        value: opp.value,
        stage: opp.stage,
        type: opp.motionType,
        status: opp.status || "",
        region: opp.region || "",
        fiscalPeriod: opp.fiscalPeriod || "",
        close: opp.closeDate ? opp.closeDate.toISOString().split("T")[0] : "",
        attributionCreatedDate: opp.attributionCreatedDate
          ? opp.attributionCreatedDate.toISOString().split("T")[0]
          : "",
        oppCreatedDate: opp.oppCreatedDate
          ? opp.oppCreatedDate.toISOString().split("T")[0]
          : "",
        championId: opp.championId?._id || null,
        championName: opp.championId?.contactName || "",
        workstreamId: opp.workstreamId?._id || null,
        workstreamName: opp.workstreamId?.workstream || "",
        ...extra,
      };
    }

    for (const opp of recentOpps) {
      if (!opp.partner?._id) continue;
      const partnerDoc = partners.find((p) => p._id.equals(opp.partner._id));
      const ownerName = partnerDoc?.owner?.name;
      if (!ownerName || !memberMap[ownerName]) continue;
      const daysAgo = Math.round((weekDate - opp.createdDate) / 86400000);
      memberMap[ownerName].recentOpps.push(serializeOpp(opp, { daysAgo }));
    }

    for (const opp of fyOpps) {
      if (!opp.partner?._id) continue;
      const partnerDoc = partners.find((p) => p._id.equals(opp.partner._id));
      const ownerName = partnerDoc?.owner?.name;
      if (!ownerName || !memberMap[ownerName]) continue;
      memberMap[ownerName].fyOpps.push(serializeOpp(opp));
    }

    for (const opp of allApprovedOpps) {
      if (!opp.partner?._id) continue;
      const partnerDoc = partners.find((p) => p._id.equals(opp.partner._id));
      const ownerName = partnerDoc?.owner?.name;
      if (!ownerName || !memberMap[ownerName]) continue;
      memberMap[ownerName].quarterlyOpportunities.push({
        _id: opp._id,
        id: opp.oppId,
        partner: opp.partner?.name || "",
        title: opp.title,
        value: opp.value,
        stage: opp.stage,
        type: opp.motionType,
        status: opp.status || "",
        fiscalPeriod: opp.fiscalPeriod || "",
        close: opp.closeDate ? opp.closeDate.toISOString().split("T")[0] : "",
      });
    }

    for (const opp of nonApprovedOpps) {
      if (!opp.partner?._id) continue;
      const partnerDoc = partners.find((p) => p._id.equals(opp.partner._id));
      const ownerName = partnerDoc?.owner?.name;
      if (!ownerName || !memberMap[ownerName]) continue;
      memberMap[ownerName].nonApprovedOpportunities.push({
        _id: opp._id,
        id: opp.oppId,
        partner: opp.partner?.name || "",
        title: opp.title,
        value: opp.value,
        stage: opp.stage,
        type: opp.motionType,
        status: opp.status || "",
        fiscalPeriod: opp.fiscalPeriod || "",
        close: opp.closeDate ? opp.closeDate.toISOString().split("T")[0] : "",
        attributionCreatedDate: opp.attributionCreatedDate
          ? opp.attributionCreatedDate.toISOString().split("T")[0]
          : "",
        oppCreatedDate: opp.oppCreatedDate
          ? opp.oppCreatedDate.toISOString().split("T")[0]
          : "",
      });
    }

    // backward compat — keep "opportunities" pointing to recentOpps
    for (const m of Object.values(memberMap)) m.opportunities = m.recentOpps;

    const ORDER = [
      "Iman Roy",
      "Deepak Mirchandani",
      "Meena M",
      "Shivani Tripathy",
    ];
    const team = Object.values(memberMap).sort((a, b) => {
      const ai = ORDER.indexOf(a.name),
        bi = ORDER.indexOf(b.name);
      return ai === -1 && bi === -1
        ? a.name.localeCompare(b.name)
        : ai === -1
          ? 1
          : bi === -1
            ? -1
            : ai - bi;
    });

    res.json({
      team,
      teamTarget: TEAM_TARGET,
      currentWeek: weekDate.toISOString().split("T")[0],
      availableWeeks: weeks.map((w) => w.toISOString().split("T")[0]),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// HISTORY API
// ════════════════════════════════════════════════════════════════

// GET /api/history/:partnerName — NARR trend for a partner over time
app.get("/api/history/:partnerName", async (req, res) => {
  try {
    const partner = await Partner.findOne({ name: req.params.partnerName });
    if (!partner) return res.status(404).json({ error: "Partner not found" });

    const snapshots = await NarrSnapshot.find({ partner: partner._id }).sort({
      weekDate: 1,
    });

    res.json(
      snapshots.map((s) => ({
        week: s.weekDate.toISOString().split("T")[0],
        narr: s.narr,
        prevNarr: s.prevNarr,
        strategic: s.strategic,
        nonStrategic: s.nonStrategic,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/team/summary — weekly NARR totals for whole team
app.get("/api/history/team/summary", async (req, res) => {
  try {
    const result = await NarrSnapshot.aggregate([
      {
        $group: {
          _id: "$weekDate",
          totalNarr: { $sum: "$narr" },
          totalStrategic: { $sum: "$strategic" },
          totalNonStrategic: { $sum: "$nonStrategic" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(
      result.map((r) => ({
        week: new Date(r._id).toISOString().split("T")[0],
        totalNarr: r.totalNarr,
        totalStrategic: r.totalStrategic,
        totalNonStrategic: r.totalNonStrategic,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// CSV UPLOAD API
// ════════════════════════════════════════════════════════════════

// POST /api/upload — upload a single CSV file
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const filename = req.file.originalname;
    const text = req.file.buffer.toString("utf8");
    const isPrevYear = filename.toLowerCase().includes("prev_year");

    let result;
    if (isPrevYear) {
      result = await importPrevYearCSV(text, filename);
    } else {
      result = await importWeeklyCSV(text, filename);
    }
    res.json({ success: true, filename, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/folder — upload multiple CSVs at once
app.post("/api/upload/folder", upload.array("files"), async (req, res) => {
  const results = [];
  for (const file of req.files || []) {
    try {
      const text = file.buffer.toString("utf8");
      const isPrevYear = file.originalname.toLowerCase().includes("prev_year");
      const result = isPrevYear
        ? await importPrevYearCSV(text, file.originalname)
        : await importWeeklyCSV(text, file.originalname);
      results.push({ filename: file.originalname, success: true, ...result });
    } catch (err) {
      results.push({
        filename: file.originalname,
        success: false,
        error: err.message,
      });
    }
  }
  res.json({ results });
});

// ════════════════════════════════════════════════════════════════
// UPLOAD HISTORY LOG
// ════════════════════════════════════════════════════════════════
app.get("/api/uploads", async (req, res) => {
  const logs = await UploadLog.find().sort({ uploadedAt: -1 }).limit(50);
  res.json(logs);
});

// ════════════════════════════════════════════════════════════════
// OPPORTUNITIES API
// ════════════════════════════════════════════════════════════════
app.get("/api/opportunities", async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) {
      const p = await Partner.findOne({ name: req.query.partner });
      if (p) filter.partner = p._id;
    }
    if (req.query.stage) filter.stage = req.query.stage;
    const opps = await Opportunity.find(filter)
      .populate({ path: "partner", populate: { path: "owner" } })
      .sort({ createdDate: -1 })
      .limit(200);
    res.json(opps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/opportunities/:id
app.delete("/api/opportunities/:id", async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/opportunities/:id — update champion/workstream link and recompute workstream NARR
app.patch("/api/opportunities/:id", async (req, res) => {
  try {
    const opp = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    // Recompute workstream NARR from all linked opps
    if (opp?.workstreamId) {
      const linked = await Opportunity.find({
        workstreamId: opp.workstreamId,
        status: { $regex: /^approved$/i },
      });
      const narrGen = linked
        .filter((o) => o.stage === "Closed")
        .reduce((s, o) => s + o.value, 0);
      const pipeLine = linked
        .filter((o) => o.stage !== "Closed")
        .reduce((s, o) => s + o.value, 0);
      const closedCount = linked.filter((o) => o.stage === "Closed").length;
      const pipeCount = linked.filter((o) => o.stage !== "Closed").length;
      await Workstream.findByIdAndUpdate(opp.workstreamId, {
        narrGenerated: narrGen,
        pipelineNarr: pipeLine,
        opportunitiesClosed: closedCount,
        opportunitiesPipe: pipeCount,
      });
    }
    res.json(opp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/opportunities/list — all opps for the link modal
app.get("/api/opportunities/list", async (req, res) => {
  try {
    const opps = await Opportunity.find({ status: { $regex: /^approved$/i } })
      .populate("partner")
      .populate("championId")
      .populate("workstreamId")
      .sort({ createdDate: -1 })
      .limit(500);
    res.json(
      opps.map((o) => ({
        _id: o._id,
        id: o.oppId,
        title: o.title,
        partner: o.partner?.name || "",
        value: o.value,
        stage: o.stage,
        championId: o.championId?._id || null,
        championName: o.championId?.contactName || "",
        workstreamId: o.workstreamId?._id || null,
        workstreamName: o.workstreamId?.workstream || "",
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// CSV UPLOAD — Champions & Workstreams
// ════════════════════════════════════════════════════════════════
const { parse } = require("csv-parse/sync");

app.post("/api/champions/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const text = req.file.buffer.toString("utf8");
    let rows;
    if (req.file.originalname.match(/\.xlsx?$/i)) {
      return res
        .status(400)
        .json({ error: "Please export your sheet as CSV before uploading" });
    }
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    let created = 0;
    for (const row of rows) {
      const contactName =
        row["Contact Name"] || row["contact name"] || row["contactName"] || "";
      const partner = row["Partner "] || row["Partner"] || row["partner"] || "";
      if (!contactName || !partner) continue;
      await Champion.findOneAndUpdate(
        { contactName, partner },
        {
          partner,
          contactName,
          title: row["Title"] || "",
          department: row["Department"] || "",
          managerName: row["Manager Name"] || "",
          email: row["Email"] || "",
          phone: row["Phone"] || "",
          contactOwner: row["Contact Owner"] || "",
        },
        { upsert: true, new: true },
      );
      created++;
    }
    res.json({ success: true, created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/workstreams/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const text = req.file.buffer.toString("utf8");
    if (req.file.originalname.match(/\.xlsx?$/i)) {
      return res
        .status(400)
        .json({ error: "Please export your sheet as CSV before uploading" });
    }
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    let created = 0;
    for (const row of rows) {
      const partnerName = row["Partner Name"] || row["partner"] || "";
      const workstream = row["Workstream"] || row["workstream"] || "";
      if (!partnerName || !workstream) continue;
      await Workstream.findOneAndUpdate(
        { partnerName, workstream },
        {
          partnerName,
          workstream,
          relatedJointAssets: row["Related Joint Assets"] || "",
          jointValueProp: row["Joint Value Proposition"] || "",
          executiveSponsor: row["Executive Sponsor"] || "",
          scalableReplicable: row["Scalable & Replicable"] || "No",
          smartGoals: row["Success Criteria - SMART Goals"] || "",
          idealCustomerProfile: row["Ideal Customer Profile"] || "",
          narrGenerated: parseFloat(row["NARR generated"] || "0") || 0,
          opportunitiesClosed:
            parseInt(row["Opporunities ( Closed )"] || "0") || 0,
          accounts: row["Accounts"] || "",
          pipelineNarr:
            parseFloat(row["Pipeline NARR "] || row["Pipeline NARR"] || "0") ||
            0,
          opportunitiesPipe:
            parseInt(row["Opportunities in teh pipe"] || "0") || 0,
          pipelineAccounts: row["Accounts"] || "",
          dri: row["DRI (Owner)"] || "",
          status: row["Status"] || "Active",
        },
        { upsert: true, new: true },
      );
      created++;
    }
    res.json({ success: true, created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// CLEANUP — merge duplicate partners into canonical names
// POST /api/cleanup/partners
// ════════════════════════════════════════════════════════════════
app.post("/api/cleanup/partners", async (req, res) => {
  const { Partner, NarrSnapshot, Opportunity } = require("./models");
  const { normalisePartnerName } = require("./importService");

  try {
    const partners = await Partner.find().populate("owner");
    let merged = 0;

    for (const partner of partners) {
      const canonical = normalisePartnerName(partner.name);
      if (canonical === partner.name) continue; // already correct

      // Find or create the canonical partner
      let canonicalDoc = await Partner.findOne({ name: canonical });
      if (!canonicalDoc) {
        canonicalDoc = await Partner.findOneAndUpdate(
          { name: canonical },
          { name: canonical, type: partner.type, owner: partner.owner },
          { upsert: true, new: true },
        );
      }

      // Repoint all snapshots and opps to canonical partner
      await NarrSnapshot.updateMany(
        { partner: partner._id },
        { $set: { partner: canonicalDoc._id } },
      );
      await Opportunity.updateMany(
        { partner: partner._id },
        { $set: { partner: canonicalDoc._id } },
      );

      // Delete the duplicate
      await Partner.deleteOne({ _id: partner._id });
      merged++;
    }

    res.json({ success: true, merged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// CHAMPIONS API
// ════════════════════════════════════════════════════════════════
app.get("/api/champions", async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partner = req.query.partner;
    const data = await Champion.find(filter).sort({
      partner: 1,
      contactName: 1,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/champions", async (req, res) => {
  try {
    const doc = await Champion.create(req.body);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/champions/:id", async (req, res) => {
  try {
    const doc = await Champion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/champions/:id", async (req, res) => {
  try {
    await Champion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/champions/:id/comments — add a comment (date auto-captured)
app.post("/api/champions/:id/comments", async (req, res) => {
  try {
    const { text, addedBy } = req.body;
    if (!text?.trim())
      return res.status(400).json({ error: "Comment text required" });
    const doc = await Champion.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: text.trim(),
            addedBy: addedBy || "",
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/champions/:id/comments/:commentId
app.delete("/api/champions/:id/comments/:commentId", async (req, res) => {
  try {
    const doc = await Champion.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true },
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// WORKSTREAMS API
// ════════════════════════════════════════════════════════════════
app.get("/api/workstreams", async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partnerName = req.query.partner;
    if (req.query.status) filter.status = req.query.status;
    const data = await Workstream.find(filter).sort({
      partnerName: 1,
      workstream: 1,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/workstreams", async (req, res) => {
  try {
    const doc = await Workstream.create(req.body);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/workstreams/:id", async (req, res) => {
  try {
    const doc = await Workstream.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/workstreams/:id", async (req, res) => {
  try {
    await Workstream.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// CLEANUP — delete all blocked/unwanted partner records
// POST /api/cleanup/blocked-partners
// ════════════════════════════════════════════════════════════════
app.post("/api/cleanup/blocked-partners", async (req, res) => {
  const BLOCKED_PATTERNS = [
    /ecloudvalley/i,
    /it-valley/i,
    /leyun/i,
    /v-valley/i,
    /mckinsey/i,
    /nanjing\s*webeye/i,
    /webeye/i,
  ];

  try {
    let deletedPartners = 0,
      deletedSnaps = 0,
      deletedOpps = 0;

    // 1. Delete partner docs + their linked data
    const allPartners = await Partner.find();
    for (const p of allPartners) {
      if (!BLOCKED_PATTERNS.some((re) => re.test(p.name))) continue;
      const snaps = await NarrSnapshot.deleteMany({ partner: p._id });
      const opps = await Opportunity.deleteMany({ partner: p._id });
      await Partner.deleteOne({ _id: p._id });
      deletedPartners++;
      deletedSnaps += snaps.deletedCount;
      deletedOpps += opps.deletedCount;
      console.log(`🗑 Deleted blocked partner: "${p.name}"`);
    }

    // 2. Delete any opps that carry a blocked rawPartnerName
    //    (catches opps that were misrouted to EY before the fix)
    const allOpps = await Opportunity.find({
      rawPartnerName: { $exists: true, $ne: "" },
    });
    for (const opp of allOpps) {
      if (!BLOCKED_PATTERNS.some((re) => re.test(opp.rawPartnerName || "")))
        continue;
      await Opportunity.deleteOne({ _id: opp._id });
      deletedOpps++;
      console.log(
        `🗑 Deleted blocked opp by rawPartnerName: "${opp.rawPartnerName}" (${opp.title})`,
      );
    }

    res.json({
      success: true,
      deletedPartners,
      deletedSnaps,
      deletedOpps,
      message: `Removed ${deletedPartners} partner(s), ${deletedSnaps} snapshots, ${deletedOpps} opportunities`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cleanup/ecloudvalley", (_req, res) =>
  res.redirect(307, "/api/cleanup/blocked-partners"),
);

// ════════════════════════════════════════════════════════════════
// ACTIVITIES API
// ════════════════════════════════════════════════════════════════
app.get("/api/activities", async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partner = req.query.partner;
    if (req.query.owner) filter.owner = req.query.owner;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    const data = await Activity.find(filter).sort({ activityDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/activities", async (req, res) => {
  try {
    const doc = await Activity.create(req.body);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/activities/:id", async (req, res) => {
  try {
    // Auto-set updateDate on every edit
    const body = { ...req.body, updateDate: new Date() };
    const doc = await Activity.findByIdAndUpdate(req.params.id, body, {
      new: true,
    });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/activities/:id", async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Auth middleware ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
function adminOnly(req, res, next) {
  if (req.user?.role !== "Admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

// ════════════════════════════════════════════════════════════════
// AUTH API
// ════════════════════════════════════════════════════════════════
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, isActive: true });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => res.json(req.user));

// ════════════════════════════════════════════════════════════════
// USER MANAGEMENT API (Admin only)
// ════════════════════════════════════════════════════════════════
app.get("/api/users", authMiddleware, adminOnly, async (req, res) => {
  const users = await User.find().select("-password").sort({ username: 1 });
  res.json(users);
});

app.post("/api/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      role: role || "Viewer",
    });
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    } else {
      delete update.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// CONFIG API (dropdown options)
// ════════════════════════════════════════════════════════════════
app.get("/api/config", async (req, res) => {
  try {
    const configs = await Config.find().sort({ key: 1 });
    const map = {};
    configs.forEach((c) => {
      map[c.key] = { label: c.label, values: c.values };
    });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/config/:key", authMiddleware, adminOnly, async (req, res) => {
  try {
    const doc = await Config.findOneAndUpdate(
      { key: req.params.key },
      { values: req.body.values, label: req.body.label },
      { upsert: true, new: true },
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// EXPORT API — returns CSV data
// ════════════════════════════════════════════════════════════════
function toCSV(headers, rows) {
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
}

app.get("/api/export/activities", authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partner = req.query.partner;
    if (req.query.owner) filter.owner = req.query.owner;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.region) filter.region = req.query.region;
    const data = await Activity.find(filter).sort({ activityDate: -1 });
    const headers = [
      "Partner",
      "Custom Partner",
      "Owner",
      "Region",
      "Priority",
      "Status",
      "Category",
      "Impact",
      "Revenue Impact",
      "Activity Date",
      "Updated Date",
      "Department",
      "Regional Partner Manager",
      "Description",
      "Doc Links",
    ];
    const rows = data.map((a) => [
      a.partner,
      a.partnerCustom || "",
      a.owner,
      a.region,
      a.priority,
      a.status,
      a.category,
      a.impact,
      a.revenueImpact || "",
      a.activityDate
        ? new Date(a.activityDate).toLocaleDateString("en-GB")
        : "",
      a.updateDate ? new Date(a.updateDate).toLocaleDateString("en-GB") : "",
      a.department,
      a.regionalPartnerManager,
      a.description,
      (a.docLinks || []).map((d) => `${d.name}: ${d.url}`).join(" | "),
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=activities.csv");
    res.send(toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/export/champions", authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partner = req.query.partner;
    const data = await Champion.find(filter).sort({
      partner: 1,
      contactName: 1,
    });
    const headers = [
      "Partner",
      "Contact Name",
      "Title",
      "Department",
      "Manager Name",
      "Email",
      "Phone",
      "Contact Owner",
      "Champion Status",
      "Certifications",
    ];
    const rows = data.map((c) => [
      c.partner,
      c.contactName,
      c.title,
      c.department,
      c.managerName,
      c.email,
      c.phone,
      c.contactOwner,
      c.championStatus || "",
      (c.certifications || []).join(", "),
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=champions.csv");
    res.send(toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/export/workstreams", authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partnerName = req.query.partner;
    if (req.query.status) filter.status = req.query.status;
    const data = await Workstream.find(filter).sort({ partnerName: 1 });
    const headers = [
      "Partner",
      "Workstream",
      "Status",
      "DRI",
      "Executive Sponsor",
      "Scalable",
      "SMART Goals",
      "Joint Value Proposition",
      "Ideal Customer Profile",
      "Related Joint Assets",
      "NARR Generated",
      "Closed Opps",
      "Accounts",
      "Pipeline NARR",
      "Pipeline Opps",
      "Pipeline Accounts",
    ];
    const rows = data.map((w) => [
      w.partnerName,
      w.workstream,
      w.status,
      w.dri,
      w.executiveSponsor,
      w.scalableReplicable,
      w.smartGoals,
      w.jointValueProp,
      w.idealCustomerProfile,
      w.relatedJointAssets,
      w.narrGenerated,
      w.opportunitiesClosed,
      w.accounts,
      w.pipelineNarr,
      w.opportunitiesPipe,
      w.pipelineAccounts,
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=workstreams.csv",
    );
    res.send(toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/export/opportunities", authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)
      filter.status = { $regex: new RegExp(req.query.status, "i") };
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.partner) {
      const p = await Partner.findOne({ name: req.query.partner });
      if (p) filter.partner = p._id;
    }
    const data = await Opportunity.find(filter)
      .populate("partner")
      .sort({ createdDate: -1 });
    const headers = [
      "Opp ID",
      "Title",
      "Partner",
      "Stage",
      "Status",
      "Motion Type",
      "Value",
      "Fiscal Period",
      "Close Date",
      "Attribution Created",
      "Opp Created",
      "Champion",
      "Workstream",
      "Source",
    ];
    const rows = data.map((o) => [
      o.oppId,
      o.title,
      o.partner?.name || "",
      o.stage,
      o.status,
      o.motionType,
      o.value,
      o.fiscalPeriod || "",
      o.closeDate ? new Date(o.closeDate).toLocaleDateString("en-GB") : "",
      o.attributionCreatedDate
        ? new Date(o.attributionCreatedDate).toLocaleDateString("en-GB")
        : "",
      o.oppCreatedDate
        ? new Date(o.oppCreatedDate).toLocaleDateString("en-GB")
        : "",
      "",
      "",
      o.source || "",
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=opportunities.csv",
    );
    res.send(toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/export/narr", authMiddleware, async (req, res) => {
  try {
    const snapshots = await NarrSnapshot.find()
      .populate("partner")
      .sort({ weekDate: -1 });
    const headers = [
      "Partner",
      "Week Date",
      "NARR",
      "Closed NARR",
      "Pipeline NARR",
      "Strategic",
      "Non-Strategic",
      "Prev NARR",
      "Prev Closed NARR",
    ];
    const rows = snapshots.map((s) => [
      s.partner?.name || "",
      s.weekDate ? new Date(s.weekDate).toLocaleDateString("en-GB") : "",
      s.narr,
      s.closedNarr,
      s.pipelineNarr,
      s.strategic,
      s.nonStrategic,
      s.prevNarr,
      s.prevClosedNarr,
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=narr_snapshots.csv",
    );
    res.send(toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// MARKETING EVENTS API
// ════════════════════════════════════════════════════════════════
app.get("/api/events", async (req, res) => {
  try {
    const filter = {};
    if (req.query.partner) filter.partner = req.query.partner;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.owner) filter.owner = req.query.owner;
    const events = await MarketingEvent.find(filter).sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const doc = await MarketingEvent.create(req.body);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const doc = await MarketingEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    await MarketingEvent.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
