const mongoose = require("mongoose");

// ── Team Member ──────────────────────────────────────────────
const teamMemberSchema = new mongoose.Schema({
  name:   { type: String, required: true, unique: true },
  avatar: { type: String },
}, { timestamps: true });

// ── Partner ──────────────────────────────────────────────────
const partnerSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  type:        { type: String, enum: ["Primary", "Secondary"], required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "TeamMember", required: true },
}, { timestamps: true });

// ── NARR Snapshot (one per partner per week upload) ───────────
const narrSnapshotSchema = new mongoose.Schema({
  partner:      { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
  weekDate:     { type: Date, required: true },       // date from filename e.g. 2025-03-10

  // All figures below are APPROVED-only (Status = "Approved")
  narr:           { type: Number, default: 0 },
  partnerNarr:    { type: Number, default: 0 },
  closedNarr:     { type: Number, default: 0 },       // Approved + Closed Won
  pipelineNarr:   { type: Number, default: 0 },       // Approved + open stage
  strategic:      { type: Number, default: 0 },       // Approved + Strategic role
  nonStrategic:   { type: Number, default: 0 },       // Approved + Non-Strategic role

  // Quarterly breakdown — approved only, derived from Fiscal Period column
  quarterlyBreakdown: [{
    quarter:      { type: String },                   // e.g. "Q1-2027"
    narr:         { type: Number, default: 0 },
    strategic:    { type: Number, default: 0 },
    nonStrategic: { type: Number, default: 0 },
    closedNarr:   { type: Number, default: 0 },
    pipelineNarr: { type: Number, default: 0 },
  }],

  prevNarr:       { type: Number, default: 0 },       // from prev_year.csv (total)
  prevClosedNarr: { type: Number, default: 0 },       // from prev_year.csv (closed only, for YoY)

  uploadedAt:   { type: Date, default: Date.now },
  source:       { type: String },
}, { timestamps: true });

// Unique per partner + week — prevents duplicate uploads
narrSnapshotSchema.index({ partner: 1, weekDate: 1 }, { unique: true });

// ── Opportunity ───────────────────────────────────────────────
const opportunitySchema = new mongoose.Schema({
  oppId:                   { type: String, required: true },
  partner:                 { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
  rawPartnerName:          { type: String, default: "" },           // original name from CSV — used for blocked cleanup
  title:                   { type: String, required: true },
  value:                   { type: Number, default: 0 },
  stage:                   { type: String, enum: ["Discovery", "Proposal", "Negotiation", "Closed", "Lost"], default: "Discovery" },
  motionType:              { type: String, enum: ["Strategic", "Non-Strategic"], required: true },
  status:                  { type: String, default: "" },
  closeDate:               { type: Date },
  attributionCreatedDate:  { type: Date },
  oppCreatedDate:          { type: Date },
  createdDate:             { type: Date, default: Date.now },
  weekDate:                { type: Date },
  isActive:                { type: Boolean, default: true },
  source:                  { type: String },
  region:                  { type: String, default: "" },  // from zzDeprecate-Owner Area Group
  fiscalPeriod:            { type: String },
  championId:              { type: mongoose.Schema.Types.ObjectId, ref: "Champion", default: null },
  workstreamId:            { type: mongoose.Schema.Types.ObjectId, ref: "Workstream", default: null },
}, { timestamps: true });

opportunitySchema.index({ oppId: 1, partner: 1 }, { unique: true });

// ── Upload Log ────────────────────────────────────────────────
const uploadLogSchema = new mongoose.Schema({
  filename:        { type: String, required: true },
  fileType:        { type: String, enum: ["weekly", "prev_year"] },
  weekDate:        { type: Date },
  rowsProcessed:   { type: Number, default: 0 },
  partnersUpdated: { type: Number, default: 0 },
  oppsUpdated:     { type: Number, default: 0 },
  status:          { type: String, enum: ["success", "error"], default: "success" },
  error:           { type: String },
  uploadedAt:      { type: Date, default: Date.now },
});

// ── Champion ──────────────────────────────────────────────────
const championSchema = new mongoose.Schema({
  partner:        { type: String, required: true },
  contactName:    { type: String, required: true },
  title:          { type: String, default: "" },
  department:     { type: String, default: "" },
  managerName:    { type: String, default: "" },
  email:          { type: String, default: "" },
  phone:          { type: String, default: "" },
  contactOwner:   { type: String, default: "" },
  championStatus: { type: String, default: "none", enum: ["champion","building","not_yet","none"] },
  certifications: [{ type: String, enum: ["SI Associate","SI Architect","App Dev"] }],
  comments: [{
    text:      { type: String, required: true },
    addedBy:   { type: String, default: "" },
    createdAt: { type: Date,   default: Date.now },
  }],
}, { timestamps: true });

// ── Workstream ────────────────────────────────────────────────
const workstreamSchema = new mongoose.Schema({
  partnerName:          { type: String, required: true },
  workstream:           { type: String, required: true },
  relatedJointAssets:   { type: String, default: "" },
  jointValueProp:       { type: String, default: "" },
  executiveSponsor:     { type: String, default: "" },
  scalableReplicable:   { type: String, default: "No" },
  smartGoals:           { type: String, default: "" },
  idealCustomerProfile: { type: String, default: "" },
  narrGenerated:        { type: Number, default: 0 },
  opportunitiesClosed:  { type: Number, default: 0 },
  accounts:             { type: String, default: "" },
  pipelineNarr:         { type: Number, default: 0 },
  opportunitiesPipe:    { type: Number, default: 0 },
  pipelineAccounts:     { type: String, default: "" },
  dri:                  { type: String, default: "" },
  status:               { type: String, default: "Active", enum: ["Active","Inactive","On Hold"] },
}, { timestamps: true });

// ── Activity ──────────────────────────────────────────────────
const activitySchema = new mongoose.Schema({
  partner:               { type: String, required: true },      // from partner list or "Other"
  partnerCustom:         { type: String, default: "" },         // manual entry when partner = "Other"
  owner:                 { type: String, required: true },
  region:                { type: String, default: "", enum: ["APAC","AMER","LATAM","EU","ME","Africa",""] },
  priority:              { type: String, default: "P2", enum: ["P1","P2","P3"] },
  activityDate:          { type: Date, default: Date.now },
  category:              { type: String, default: "", enum: ["Workstream","Champion Building","Opportunity","PDM","Event Planning",""] },
  department:            { type: String, default: "" },
  regionalPartnerManager:{ type: String, default: "" },
  description:           { type: String, default: "" },
  updateDate:            { type: Date, default: Date.now },
  impact:                { type: String, default: "", enum: ["High","Medium","Low",""] },
  revenueImpact:         { type: Number, default: null },
  status:                { type: String, default: "Open", enum: ["Open","In Progress","Done","Blocked"] },
  docLinks:              [{ name: { type: String }, url: { type: String } }],
}, { timestamps: true });

// ── User (for login) ──────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true },
  password:  { type: String, required: true },           // bcrypt hash
  role:      { type: String, default: "Viewer", enum: ["Admin","Viewer"] },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

// ── Config (dropdown options) ─────────────────────────────────
const configSchema = new mongoose.Schema({
  key:    { type: String, required: true, unique: true }, // e.g. "partners", "activityOwners"
  label:  { type: String },                              // display name in Admin UI
  values: [{ type: String }],                            // the dropdown options
}, { timestamps: true });

// ── MarketingEvent ────────────────────────────────────────────
const marketingEventSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  partner:     { type: String, default: "" },
  partnerCustom: { type: String, default: "" },
  owner:       { type: String, default: "" },
  eventType:   { type: String, default: "", enum: ["Webinar","Conference","Workshop","Summit","Roundtable","Meetup","Trade Show","Partner Day","Other",""] },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  location:    { type: String, default: "" },
  description: { type: String, default: "" },
  status:      { type: String, default: "Planned", enum: ["Planned","Confirmed","Done","Cancelled"] },
}, { timestamps: true });

module.exports = {
  TeamMember:     mongoose.model("TeamMember",     teamMemberSchema),
  Partner:        mongoose.model("Partner",        partnerSchema),
  NarrSnapshot:   mongoose.model("NarrSnapshot",   narrSnapshotSchema),
  Opportunity:    mongoose.model("Opportunity",    opportunitySchema),
  UploadLog:      mongoose.model("UploadLog",      uploadLogSchema),
  Champion:       mongoose.model("Champion",       championSchema),
  Workstream:     mongoose.model("Workstream",     workstreamSchema),
  Activity:       mongoose.model("Activity",       activitySchema),
  User:           mongoose.model("User",           userSchema),
  Config:         mongoose.model("Config",         configSchema),
  MarketingEvent: mongoose.model("MarketingEvent", marketingEventSchema),
};
