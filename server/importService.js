const { parse } = require("csv-parse/sync");
const { TeamMember, Partner, NarrSnapshot, Opportunity, UploadLog } = require("./models");

const DATE_RE = /\d{4}-\d{2}-\d{2}/;

// ── Hardcoded partner → team member + type mapping ────────────
const PARTNER_OWNER_MAP = {
  "Infosys":        { owner: "Iman Roy",           type: "Primary"   },
  "EY":             { owner: "Iman Roy",           type: "Secondary" },
  "Wipro":          { owner: "Iman Roy",           type: "Secondary" },
  "Accenture":      { owner: "Deepak Mirchandani", type: "Primary"   },
  "Tech Mahindra":  { owner: "Deepak Mirchandani", type: "Secondary" },
  "TCS":            { owner: "Meena M",            type: "Primary"   },
  "Hexaware":       { owner: "Meena M",            type: "Secondary" },
  "Capgemini":      { owner: "Shivani Tripathy",   type: "Primary"   },
  "Cognizant":      { owner: "Shivani Tripathy",   type: "Primary"   },
  "LTIM":           { owner: "Shivani Tripathy",   type: "Secondary" },
};

// ── Partner name normalisation ────────────────────────────────
// Maps any variation found in CSV to the canonical name
const PARTNER_NAME_MAP = {
  // Accenture
  "accenture":             "Accenture",
  "accenture inc":         "Accenture",
  "accenture llp":         "Accenture",
  "accenture plc":         "Accenture",
  "accenture solutions":   "Accenture",

  // Infosys
  "infosys":               "Infosys",
  "infosys ltd":           "Infosys",
  "infosys limited":       "Infosys",
  "infosys bpo":           "Infosys",
  "infosys technologies":  "Infosys",

  // TCS
  "tcs":                   "TCS",
  "tata consultancy":      "TCS",
  "tata consultancy services": "TCS",
  "tata consultancy services limited": "TCS",

  // Wipro
  "wipro":                 "Wipro",
  "wipro ltd":             "Wipro",
  "wipro limited":         "Wipro",
  "wipro technologies":    "Wipro",

  // EY
  "ey":                    "EY",
  "ernst & young":         "EY",
  "ernst and young":       "EY",
  "ernst & young llp":     "EY",
  "ey llp":                "EY",

  // Capgemini
  "capgemini":             "Capgemini",
  "cap gemini":            "Capgemini",
  "capgemini se":          "Capgemini",
  "capgemini india":       "Capgemini",

  // Cognizant
  "cognizant":             "Cognizant",
  "cognizant technology":  "Cognizant",
  "cognizant technology solutions": "Cognizant",
  "cts":                   "Cognizant",

  // Tech Mahindra
  "tech mahindra":         "Tech Mahindra",
  "tech mahindra ltd":     "Tech Mahindra",
  "tech mahindra limited": "Tech Mahindra",
  "techmahindra":          "Tech Mahindra",

  // Hexaware
  "hexaware":              "Hexaware",
  "hexaware technologies": "Hexaware",
  "hexaware technologies ltd": "Hexaware",

  // LTIM
  "ltim":                  "LTIM",
  "ltimindtree":           "LTIM",
  "l&t infotech":          "LTIM",
  "larsen & toubro infotech": "LTIM",
  "lti mindtree":          "LTIM",
  "lti":                   "LTIM",
};

// Partners to completely ignore during import
const BLOCKED_PARTNERS = [
  "ecloudvalley",
  "it-valley",
  "leyun",
  "v-valley",
  "mckinsey",
  "nanjing webeye",
  "webeye",
];

function isBlockedPartner(raw) {
  const key = raw.trim().toLowerCase();
  return BLOCKED_PARTNERS.some(b => key.includes(b));
}
const FUZZY_PARTNER_MAP = [
  { keywords: ["accenture"],                                        canonical: "Accenture"     },
  { keywords: ["infosys"],                                          canonical: "Infosys"       },
  { keywords: ["tata consultancy", "tcs", "tata sons"],            canonical: "TCS"           },
  { keywords: ["wipro"],                                            canonical: "Wipro"         },
  { keywords: ["ernst & young", "ernst and young"],                canonical: "EY"            },
  { keywords: ["capgemini"],                                        canonical: "Capgemini"     },
  { keywords: ["cognizant", "trizetto"],                           canonical: "Cognizant"     },
  { keywords: ["tech mahindra"],                                    canonical: "Tech Mahindra" },
  { keywords: ["hexaware"],                                         canonical: "Hexaware"      },
  { keywords: ["ltimindtree", "lti mindtree", "ltim", "l&t infotech", "larsen"], canonical: "LTIM" },
];

// Standalone EY — must be exact "ey" to avoid matching "they", "key" etc.
function normalisePartnerName(raw) {
  if (!raw) return "";
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase();

  // Exact "EY" match (case-insensitive)
  if (key === "ey") return "EY";

  // Exact match from old map
  if (PARTNER_NAME_MAP[key]) return PARTNER_NAME_MAP[key];

  // Fuzzy keyword match
  for (const { keywords, canonical } of FUZZY_PARTNER_MAP) {
    if (keywords.some(kw => key.includes(kw))) return canonical;
  }

  return trimmed; // unknown — keep as-is
}

// Normalise fiscal period: "Q1-2027" → "FY27Q1", "Q3-2027" → "FY27Q3"
function normaliseFiscalPeriod(raw) {
  if (!raw) return "";
  const m = raw.trim().match(/^Q(\d)-(\d{4})$/i);
  if (m) return `FY${m[2].slice(2)}Q${m[1]}`;
  return raw.trim(); // keep as-is if unrecognised format
}

function parseCSV(text) {
  return parse(text, { columns: true, skip_empty_lines: true, trim: true, cast: false });
}

// Match column names — strips "Opportunity: " and "Attribution: " prefixes
function getCol(row, ...keys) {
  for (const k of keys) {
    const found = Object.keys(row).find(col => {
      const stripped = col
        .replace(/^attribution:\s*/i, "")
        .replace(/^opportunity:\s*/i, "")
        .toLowerCase().replace(/\s+/g, " ").trim();
      return stripped === k.toLowerCase();
    });
    if (found) return row[found]?.trim() || "";
  }
  return "";
}

// Exact column name match (case-insensitive, trimmed)
function getColExact(row, key) {
  const found = Object.keys(row).find(col => col.trim().toLowerCase() === key.trim().toLowerCase());
  return found ? row[found]?.trim() || "" : "";
}

// Parse a date string safely — returns Date or null
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isStrategic(row) {
  return getCol(row, "role").toLowerCase().includes("strategic");
}

// Returns true if the stage counts as Closed (Closed Won)
function isClosed(stage) {
  const s = stage?.toLowerCase() || "";
  return s.includes("closed won") || s === "closed";
}

// Pipeline = everything that is NOT Closed Won
function isPipeline(stage) {
  return !isClosed(stage);
}

function normaliseStage(stage) {
  const s = stage?.toLowerCase() || "";
  if (s.includes("discover"))                            return "Discovery";
  if (s.includes("proposal"))                            return "Proposal";
  if (s.includes("negotiat"))                            return "Negotiation";
  if (s.includes("closed won") || s === "closed")        return "Closed";
  if (s.includes("closed lost") || s.includes("lost"))   return "Lost";
  return "Discovery";
}

// ── Region normalisation — maps "zzDeprecate-Owner Area Group" values ──
function normaliseRegion(raw) {
  if (!raw) return "";
  const r = raw.trim().toLowerCase();
  if (r.includes("north america") || r.includes("amer") || r === "us" || r === "usa") return "AMER";
  if (r.includes("emea") || r.includes("europe") || r.includes("middle east") || r.includes("africa")) return "EMEA";
  if (r.includes("apac") || r.includes("asia") || r.includes("pacific") || r.includes("japan") || r.includes("india") || r.includes("australia") || r.includes("singapore")) return "APAC";
  if (r.includes("latam") || r.includes("latin")) return "LATAM";
  return raw.trim(); // keep as-is if unrecognised
}

// ── Weekly CSV import ─────────────────────────────────────────
async function importWeeklyCSV(text, filename) {
  const weekDateStr = filename.match(DATE_RE)?.[0];
  if (!weekDateStr) throw new Error("Filename must contain a date like 2025-03-10");
  const weekDate = new Date(weekDateStr);

  const rows = parseCSV(text);
  let partnersUpdated = 0, oppsUpdated = 0;
  const log = { filename, fileType: "weekly", weekDate, rowsProcessed: rows.length };

  // Accumulate NARR per partner — APPROVED rows only for NARR figures
  const partnerMap = {};
  for (const row of rows) {
    const rawPartner = getCol(row, "partner");
    if (!rawPartner) continue;
    if (isBlockedPartner(rawPartner)) continue;
    const partnerName = normalisePartnerName(rawPartner);
    if (!partnerName) continue;
    if (!partnerMap[partnerName]) {
      partnerMap[partnerName] = {
        narr: 0, closedNarr: 0, pipelineNarr: 0,
        strategic: 0, nonStrategic: 0,
        quarterlyMap: {},  // { "Q1-2027": { narr, strategic, nonStrategic, closedNarr, pipelineNarr } }
        rows: []
      };
    }

    const narr    = parseFloat(getCol(row, "partner net arr (converted)")) || 0;
    const stage   = getCol(row, "stage");
    const status  = getColExact(row, "Status") || getCol(row, "status") || "";
    const isApproved = status.trim().toLowerCase() === "approved";
    const quarter = normaliseFiscalPeriod(getCol(row, "fiscal period"));

    // Only approved rows count towards NARR
    if (isApproved) {
      partnerMap[partnerName].narr += narr;
      if (isClosed(stage))   partnerMap[partnerName].closedNarr   += narr;
      if (isPipeline(stage)) partnerMap[partnerName].pipelineNarr += narr;
      if (isStrategic(row))  partnerMap[partnerName].strategic    += narr;
      else                   partnerMap[partnerName].nonStrategic  += narr;

      // Quarterly breakdown
      if (quarter) {
        if (!partnerMap[partnerName].quarterlyMap[quarter]) {
          partnerMap[partnerName].quarterlyMap[quarter] = { narr:0, strategic:0, nonStrategic:0, closedNarr:0, pipelineNarr:0 };
        }
        const q = partnerMap[partnerName].quarterlyMap[quarter];
        q.narr += narr;
        if (isStrategic(row))  q.strategic    += narr;
        else                   q.nonStrategic  += narr;
        if (isClosed(stage))   q.closedNarr   += narr;
        if (isPipeline(stage)) q.pipelineNarr += narr;
      }
    }

    partnerMap[partnerName].rows.push(row);
  }

  try {
    for (const [partnerName, data] of Object.entries(partnerMap)) {
      const mapping     = PARTNER_OWNER_MAP[partnerName];
      const memberName  = mapping?.owner || "Unknown";
      const partnerType = mapping?.type  || "Primary";

      // Upsert TeamMember
      const initials = memberName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      const member = await TeamMember.findOneAndUpdate(
        { name: memberName },
        { name: memberName, avatar: initials },
        { upsert: true, new: true }
      );

      // Upsert Partner
      const partner = await Partner.findOneAndUpdate(
        { name: partnerName },
        { name: partnerName, type: partnerType, owner: member._id },
        { upsert: true, new: true }
      );
      partnersUpdated++;

      // Build quarterlyBreakdown array from map
      const quarterlyBreakdown = Object.entries(data.quarterlyMap).map(([quarter, q]) => ({
        quarter, narr: q.narr, strategic: q.strategic, nonStrategic: q.nonStrategic,
        closedNarr: q.closedNarr, pipelineNarr: q.pipelineNarr,
      }));
      // Sort quarters: FY27Q1, FY27Q2, FY28Q1 ...
      quarterlyBreakdown.sort((a, b) => {
        const am = a.quarter.match(/FY(\d+)Q(\d)/i);
        const bm = b.quarter.match(/FY(\d+)Q(\d)/i);
        if (am && bm) return (+am[1] - +bm[1]) || (+am[2] - +bm[2]);
        return a.quarter.localeCompare(b.quarter);
      });

      // Upsert NARR snapshot
      await NarrSnapshot.findOneAndUpdate(
        { partner: partner._id, weekDate },
        {
          partner:      partner._id,
          weekDate,
          narr:         data.narr,
          partnerNarr:  data.narr,
          closedNarr:   data.closedNarr,
          pipelineNarr: data.pipelineNarr,
          strategic:    data.strategic,
          nonStrategic: data.nonStrategic,
          quarterlyBreakdown,
          source:       filename,
        },
        { upsert: true, new: true }
      );

      // Upsert each opportunity
      for (const row of data.rows) {
        const oppId = getCol(row, "attribution number");
        if (!oppId) continue;
        const stage = getCol(row, "stage");

        const attrCreatedDate   = parseDate(getColExact(row, "Attribution: Created Date"));
        const oppCreatedDateVal = parseDate(getColExact(row, "Opportunity: Created Date"));
        const dates = [attrCreatedDate, oppCreatedDateVal].filter(Boolean);
        const earliestCreated = dates.length ? new Date(Math.min(...dates)) : weekDate;
        const status = getCol(row, "status") || "";
        const rawName = getCol(row, "partner") || "";

        const rawRegion = getColExact(row, "Opportunity: zzDeprecate-Owner Area Group")
          || getCol(row, "zzdeprecate-owner area group")
          || getCol(row, "owner area group")
          || getCol(row, "region")
          || "";

        await Opportunity.findOneAndUpdate(
          { oppId, partner: partner._id },
          {
            oppId,
            partner:                partner._id,
            rawPartnerName:         rawName,
            title:                  getCol(row, "opportunity name") || oppId,
            value:                  parseFloat(getCol(row, "partner net arr (converted)")) || 0,
            stage:                  normaliseStage(stage),
            motionType:             isStrategic(row) ? "Strategic" : "Non-Strategic",
            status,
            closeDate:              getCol(row, "close date") ? new Date(getCol(row, "close date")) : null,
            attributionCreatedDate: attrCreatedDate || null,
            oppCreatedDate:         oppCreatedDateVal || null,
            createdDate:            earliestCreated,
            weekDate,
            source:                 filename,
            region:                 normaliseRegion(rawRegion),
            fiscalPeriod:           normaliseFiscalPeriod(getCol(row, "fiscal period")),
          },
          { upsert: true, new: true }
        );
        oppsUpdated++;
      }
    }

    await UploadLog.create({ ...log, partnersUpdated, oppsUpdated, status: "success" });
    return { success: true, rowsProcessed: rows.length, partnersUpdated, oppsUpdated, weekDate };
  } catch (err) {
    await UploadLog.create({ ...log, status: "error", error: err.message });
    throw err;
  }
}

// ── Prev year CSV import ──────────────────────────────────────
// prev_year.csv should have same format as weekly
// Stores both total prevNarr AND prevClosedNarr (closed only) for YoY
async function importPrevYearCSV(text, filename) {
  const rows = parseCSV(text);

  // Accumulate per partner: total and closed-only
  const prevMap = {};
  for (const row of rows) {
    const rawPartner2 = getCol(row, "partner");
    if (!rawPartner2) continue;
    if (isBlockedPartner(rawPartner2)) continue;
    const partnerName = normalisePartnerName(rawPartner2);
    if (!partnerName) continue;
    if (!prevMap[partnerName]) prevMap[partnerName] = { total: 0, closed: 0 };

    const narr  = parseFloat(getCol(row, "partner net arr (converted)")) || 0;
    const stage = getCol(row, "stage");

    prevMap[partnerName].total  += narr;
    if (isClosed(stage)) prevMap[partnerName].closed += narr;
  }

  let updated = 0;
  const log = { filename, fileType: "prev_year", rowsProcessed: rows.length };
  try {
    for (const [partnerName, data] of Object.entries(prevMap)) {
      const partner = await Partner.findOne({ name: partnerName });
      if (partner) {
        await NarrSnapshot.updateMany(
          { partner: partner._id },
          { $set: { prevNarr: data.total, prevClosedNarr: data.closed } }
        );
        updated++;
      }
    }
    await UploadLog.create({ ...log, partnersUpdated: updated, status: "success" });
    return { success: true, rowsProcessed: rows.length, partnersUpdated: updated };
  } catch (err) {
    await UploadLog.create({ ...log, status: "error", error: err.message });
    throw err;
  }
}

module.exports = { importWeeklyCSV, importPrevYearCSV, normalisePartnerName, isBlockedPartner };
