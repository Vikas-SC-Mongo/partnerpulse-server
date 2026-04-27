import { useState, useEffect, useCallback } from "react";
import { getDashboard } from "./api/index.js";
import {
  fmt, pct, sumArr,
  STAGE_COLOR, TYPE_COLOR, MEMBER_COLORS,
  Badge, StatCard, GroupHeader, Spinner, ErrorBanner
} from "./components/UI.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import { ChampionsTab, WorkstreamsTab, ActivitiesTab, MarketingEventsTab } from "./components/ChampionsWorkstreams.jsx";
import { LoginPage, AdminPage, ExportPage } from "./components/AdminExport.jsx";
import { PartnerHistoryChart, TeamHistoryChart } from "./components/HistoryCharts.jsx";

const C5 = "#C3D4CF";
const API_BASE = import.meta.env.VITE_API_URL || "";

const NAV_TABS = [
  { id:"narr",        icon:"◈", label:"NARR",           sub:"Revenue" },
  { id:"workstreams", icon:"⬡", label:"Workstreams",    sub:"Programs" },
  { id:"m4s",         icon:"◎", label:"M4S",            sub:"Milestones" },
  { id:"cert",        icon:"✦", label:"Certification",  sub:"Badges" },
  { id:"champions",   icon:"★", label:"Champions",      sub:"Advocates" },
  { id:"activities",  icon:"◉", label:"Activities",    sub:"Tracker" },
  { id:"events",      icon:"◈", label:"Mktg Events",   sub:"Calendar" },
  { id:"export",      icon:"⬇", label:"Export",         sub:"Download" },
  { id:"admin",       icon:"◆", label:"Admin",          sub:"Settings" },
];

function ComingSoon({ title, icon, sub }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:18, padding:40 }}>
      <div style={{ width:72, height:72, borderRadius:20,
        background:"rgba(0,210,255,0.07)", border:"1px solid rgba(0,210,255,0.18)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, color:"#00ED64" }}>
        {icon}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:7,
          fontFamily:"'Syne',sans-serif" }}>{title}</div>
        <div style={{ fontSize:13, color:"#C3D4CF", marginBottom:20 }}>{sub}</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px",
          background:"rgba(0,210,255,0.08)", border:"1px solid rgba(0,210,255,0.2)",
          borderRadius:20, fontSize:12, color:"#00ED64" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#00ED64", display:"inline-block" }}/>
          Coming soon
        </div>
      </div>
    </div>
  );
}

const PCOLS = "1.2fr 100px 100px 100px 80px 70px 70px 50px";
function PartnerTableHeader() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:PCOLS, gap:8, padding:"9px 16px",
      background:"rgba(255,255,255,0.08)", fontSize:10, color:"#C3D4CF", letterSpacing:"0.07em", textTransform:"uppercase" }}>
      <span>Partner</span>
      <span style={{ color:"#00ED64" }}>Partner NARR</span>
      <span style={{ color:"#00ED64" }}>Closed NARR</span>
      <span style={{ color:"#00ED64" }}>Pipeline</span>
      <span>Prev Closed</span><span>YoY</span>
      <span style={{ color:"#f9ebff" }}>Strategic</span>
      <span style={{ color:"#f9ebff" }}>Opps</span>
    </div>
  );
}
function PartnerTableRow({ partner }) {
  const g = pct(partner.closedNarr, partner.prevClosedNarr);
  const recentOpps = (partner.opps||[]).filter(o => o.daysAgo <= 14);
  return (
    <div style={{ display:"grid", gridTemplateColumns:PCOLS, gap:8, alignItems:"center",
      padding:"11px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ color:"#ffffff", fontWeight:600, fontSize:13 }}>{partner.name}</div>
      <div style={{ color:"#00ED64", fontWeight:700 }}>{fmt(partner.partnerNarr)}</div>
      <div style={{ color:"#00ED64", fontWeight:700 }}>{fmt(partner.closedNarr)}</div>
      <div style={{ color:"#00ED64" }}>{fmt(partner.pipelineNarr)}</div>
      <div style={{ color:"#C3D4CF", fontSize:12 }}>{partner.prevClosedNarr ? fmt(partner.prevClosedNarr) : "—"}</div>
      <div style={{ color:+g>=0?"#00ED64":"#ff6b6b", fontWeight:700 }}>
        {partner.prevClosedNarr ? `${+g>=0?"▲":"▼"}${Math.abs(g)}%` : "—"}
      </div>
      <div style={{ color:"#f9ebff" }}>{fmt(partner.strategic)}</div>
      <div style={{ color:recentOpps.length>0?"#f9ebff":"#C3D4CF", fontWeight:recentOpps.length>0?700:400 }}>
        {recentOpps.length}
      </div>
    </div>
  );
}
const STATUS_COLOR = {
  "Approved":"#00ED64","Rejected":"#ff6b6b","Pending Approval":"#e9ff99","New":"#f9ebff",
};

// ── Sortable deletable opp table ──────────────────────────────
const OPP_COLS = [
  { key:"id",       label:"ID",         w:"52px"  },
  { key:"title",    label:"Opportunity",w:"1fr"   },
  { key:"value",    label:"Value",      w:"84px"  },
  { key:"stage",    label:"Stage",      w:"84px"  },
  { key:"status",   label:"Status",     w:"80px"  },
  { key:"type",     label:"Type",       w:"80px"  },
  { key:"champion", label:"Champion",   w:"96px", noSort:true },
  { key:"ws",       label:"Workstream", w:"96px", noSort:true },
  { key:"_act",     label:"",           w:"52px",  noSort:true },
];
const OPP_GRID = OPP_COLS.map(c=>c.w).join(" ");

function SortableOppTable({ opps, onEdit, onDeleted, emptyMsg="No opportunities" }) {
  const [sort, setSort] = useState({ key:"value", dir:"desc" });
  const [deleting, setDeleting] = useState(null);
  const [localOpps, setLocalOpps] = useState(opps);
  useEffect(()=>setLocalOpps(opps),[opps]);

  function toggle(key) {
    setSort(s => s.key===key ? {key,dir:s.dir==="asc"?"desc":"asc"} : {key,dir:"desc"});
  }

  const sorted = [...localOpps].sort((a,b) => {
    const d = sort.dir==="asc" ? 1 : -1;
    if (sort.key==="value") return d*(( a.value||0)-(b.value||0));
    const av = String(a[sort.key]||""), bv = String(b[sort.key]||"");
    return d*av.localeCompare(bv);
  });

  async function del(opp) {
    if (!window.confirm(`Delete "${opp.title}"?\nThis cannot be undone.`)) return;
    setDeleting(opp._id);
    try {
      await fetch(`${API_BASE}/api/opportunities/${opp._id}`, {method:"DELETE"});
      setLocalOpps(p=>p.filter(o=>o._id!==opp._id));
      onDeleted && onDeleted(opp._id);
    } finally { setDeleting(null); }
  }

  return (
    <div style={{background:"rgba(0,30,43,0.7)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:13,overflow:"hidden"}}>
      {/* column headers */}
      <div style={{display:"grid",gridTemplateColumns:OPP_GRID,gap:5,padding:"7px 13px",
        background:"rgba(255,255,255,0.07)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        {OPP_COLS.map(c=>(
          <div key={c.key} onClick={()=>!c.noSort&&toggle(c.key)}
            style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:"#C3D4CF",
              letterSpacing:"0.07em",textTransform:"uppercase",
              cursor:c.noSort?"default":"pointer",userSelect:"none"}}>
            {c.label}
            {!c.noSort&&<span style={{color:sort.key===c.key?"#00ED64":"rgba(255,255,255,0.2)",fontSize:9}}>
              {sort.key===c.key?(sort.dir==="asc"?"▲":"▼"):"⇅"}
            </span>}
          </div>
        ))}
      </div>

      {sorted.length===0
        ? <div style={{padding:"22px 14px",color:"rgba(255,255,255,0.35)",fontSize:13}}>{emptyMsg}</div>
        : sorted.map(o=>(
          <div key={o._id||o.id} style={{display:"grid",gridTemplateColumns:OPP_GRID,gap:5,
            alignItems:"center",padding:"9px 13px",borderBottom:"1px solid rgba(255,255,255,0.05)",
            opacity:deleting===o._id?0.4:1,transition:"opacity 0.15s"}}>
            <span style={{color:"#C3D4CF",fontSize:10}}>{o.id}</span>
            <div style={{minWidth:0}}>
              <div style={{color:"#fff",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.title}</div>
              <div style={{color:"#C3D4CF",fontSize:10}}>{o.partner}</div>
            </div>
            <span style={{color:"#00ED64",fontWeight:700,fontSize:12}}>{fmt(o.value)}</span>
            <Badge label={o.stage} color={STAGE_COLOR[o.stage]||"#C3D4CF"}/>
            {o.status?<Badge label={o.status} color={STATUS_COLOR[o.status]||"#C3D4CF"}/>:<span style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>—</span>}
            <Badge label={o.type} color={TYPE_COLOR[o.type]||"#C3D4CF"}/>
            <span title={o.championName||""} style={{color:o.championName?"#e9ff99":"rgba(255,255,255,0.2)",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.championName||"—"}</span>
            <span title={o.workstreamName||""} style={{color:o.workstreamName?"#00ED64":"rgba(255,255,255,0.2)",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.workstreamName||"—"}</span>
            <div style={{display:"flex",gap:4}}>
              {onEdit&&<button onClick={()=>onEdit(o)}
                style={{background:"rgba(0,210,255,0.1)",border:"1px solid rgba(0,210,255,0.3)",borderRadius:5,padding:"3px 5px",cursor:"pointer",color:"#00ED64",fontSize:10}}>✎</button>}
              <button onClick={()=>del(o)} disabled={!!deleting}
                style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:5,padding:"3px 5px",cursor:"pointer",color:"#ff6b6b",fontSize:10}}>✕</button>
            </div>
          </div>
        ))
      }
      {sorted.length>0&&(
        <div style={{padding:"7px 13px",background:"rgba(255,255,255,0.03)",display:"flex",gap:16,fontSize:11,color:"#C3D4CF"}}>
          <span>{sorted.length} opps</span>
          <span style={{color:"#00ED64"}}>Total {fmt(sorted.reduce((s,o)=>s+(o.value||0),0))}</span>
        </div>
      )}
    </div>
  );
}

// Thin wrappers kept for non-approved table
const OCOLS = "55px 1fr 84px 80px 70px 80px 96px 96px 32px";
function OppTableHeader() {
  return (
    <div style={{display:"grid",gridTemplateColumns:OCOLS,gap:5,padding:"7px 13px",
      background:"rgba(0,30,43,0.9)",fontSize:9,color:"#C3D4CF",letterSpacing:"0.07em",textTransform:"uppercase"}}>
      <span>ID</span><span>Opportunity</span><span>Value</span><span>Stage</span><span>Status</span><span>Type</span><span>Champion</span><span>Workstream</span><span/>
    </div>
  );
}
function OppRow({ opp, onEdit }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:OCOLS,gap:5,alignItems:"center",padding:"9px 13px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <span style={{color:"#C3D4CF",fontSize:10}}>{opp.id}</span>
      <div style={{minWidth:0}}><div style={{color:"#fff",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{opp.title}</div><div style={{color:"#C3D4CF",fontSize:10}}>{opp.partner}</div></div>
      <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{fmt(opp.value)}</span>
      <Badge label={opp.stage} color={STAGE_COLOR[opp.stage]||"#C3D4CF"}/>
      {opp.status?<Badge label={opp.status} color={STATUS_COLOR[opp.status]||"#C3D4CF"}/>:<span style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>—</span>}
      <Badge label={opp.type} color={TYPE_COLOR[opp.type]||"#C3D4CF"}/>
      <span style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>—</span>
      <span style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>—</span>
      {onEdit?<button onClick={()=>onEdit(opp)} style={{background:"rgba(0,210,255,0.1)",border:"1px solid rgba(0,210,255,0.3)",borderRadius:5,padding:"3px 5px",cursor:"pointer",color:"#00ED64",fontSize:10}}>✎</button>:<span/>}
    </div>
  );
}

function WeekSelector({ current, weeks, onChange }) {
  if (!weeks?.length) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ color:"#C3D4CF", fontSize:11 }}>Week:</span>
      <select value={current} onChange={e => onChange(e.target.value)}
        style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.09)",
          color:"#ffffff", borderRadius:7, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>
        {weeks.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    </div>
  );
}

// ── Opp Edit Modal ────────────────────────────────────────────
function OppEditModal({ opp, onClose, onSaved }) {
  const [champions, setChampions] = useState([]);
  const [workstreams, setWorkstreams] = useState([]);
  const [champId, setChampId] = useState(opp.championId || "");
  const [wsId, setWsId] = useState(opp.workstreamId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Filter champions to only those belonging to this opp's partner
    fetch(`${API_BASE}/api/champions`).then(r=>r.json()).then(all=>{
      const filtered = all.filter(c => c.partner === opp.partner);
      setChampions(filtered);
    }).catch(()=>{});
    fetch(`${API_BASE}/api/workstreams`).then(r=>r.json()).then(setWorkstreams).catch(()=>{});
  }, [opp.partner]);

  // Only show champions belonging to this opp's partner
  const filteredChampions = champions.filter(c => c.partner === opp.partner);
  // Only show workstreams for this opp's partner
  const filteredWorkstreams = workstreams.filter(w => w.partnerName === opp.partner);

  async function save() {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/opportunities/${opp._id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ championId: champId||null, workstreamId: wsId||null }),
      });
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:16,padding:"24px 28px",width:460,maxWidth:"90vw" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{opp.title}</div>
            <div style={{ fontSize:11,color:"#C3D4CF",marginTop:2 }}>{opp.partner} · {fmt(opp.value)}</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#C3D4CF",fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ fontSize:10,color:"#C3D4CF",textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:6 }}>
              Champion <span style={{color:"rgba(255,255,255,0.3)"}}>· {opp.partner} contacts only</span>
            </label>
            <select value={champId} onChange={e=>setChampId(e.target.value)}
              style={{ width:"100%",background:"#001E2B",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,cursor:"pointer" }}>
              <option value="">— No Champion —</option>
              {filteredChampions.length === 0
                ? <option disabled>No champions found for {opp.partner}</option>
                : filteredChampions.map(c=><option key={c._id} value={c._id}>{c.contactName}{c.title?` — ${c.title}`:""}</option>)}
            </select>
            {filteredChampions.length === 0 && (
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:5}}>
                Add champions for {opp.partner} in the Champions tab first.
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize:10,color:"#C3D4CF",textTransform:"uppercase",letterSpacing:"0.07em",display:"block",marginBottom:6 }}>
              Workstream <span style={{color:"rgba(255,255,255,0.3)"}}>· {opp.partner} workstreams only</span>
            </label>
            <select value={wsId} onChange={e=>setWsId(e.target.value)}
              style={{ width:"100%",background:"#001E2B",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,cursor:"pointer" }}>
              <option value="">— No Workstream —</option>
              {filteredWorkstreams.length === 0
                ? <option disabled>No workstreams found for {opp.partner}</option>
                : filteredWorkstreams.map(w=><option key={w._id} value={w._id}>{w.workstream}</option>)}
            </select>
          </div>
          <div style={{ display:"flex",gap:8,paddingTop:4 }}>
            <button onClick={save} disabled={saving}
              style={{ flex:1,padding:"10px",background:"linear-gradient(135deg,#00ED64,#00684A)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer" }}>
              {saving?"Saving…":"Save"}
            </button>
            <button onClick={onClose}
              style={{ padding:"10px 18px",background:"transparent",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,color:"#C3D4CF",fontSize:13,cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quarterly NARR Table ──────────────────────────────────────
function QuarterlyNarrTable({ partners, opportunities }) {
  const qMap = {};
  for (const p of partners) {
    for (const q of (p.quarterlyBreakdown || [])) {
      if (!qMap[q.quarter]) qMap[q.quarter] = { narr:0, strategic:0, nonStrategic:0, closedNarr:0, pipelineNarr:0 };
      qMap[q.quarter].narr         += q.narr;
      qMap[q.quarter].strategic    += q.strategic;
      qMap[q.quarter].nonStrategic += q.nonStrategic;
      qMap[q.quarter].closedNarr   += q.closedNarr;
      qMap[q.quarter].pipelineNarr += q.pipelineNarr;
    }
  }
  const quarters = Object.keys(qMap).sort((a, b) => {
    const am = a.match(/FY(\d+)Q(\d)/i), bm = b.match(/FY(\d+)Q(\d)/i);
    if (am && bm) return (+am[1] - +bm[1]) || (+am[2] - +bm[2]);
    return a.localeCompare(b);
  });

  const [selQ, setSelQ] = useState(quarters[0] || null);
  // keep selQ valid if quarters change
  const activeQ = quarters.includes(selQ) ? selQ : (quarters[0] || null);
  const qData = activeQ ? qMap[activeQ] : null;
  const qOpps = (opportunities || []).filter(o => o.fiscalPeriod === activeQ);

  const QOCOLS = "60px 1fr 100px 90px 90px 80px";
  const tot = quarters.reduce((s, k) => ({
    narr: s.narr + qMap[k].narr, strategic: s.strategic + qMap[k].strategic,
    nonStrategic: s.nonStrategic + qMap[k].nonStrategic,
    closedNarr: s.closedNarr + qMap[k].closedNarr, pipelineNarr: s.pipelineNarr + qMap[k].pipelineNarr,
  }), { narr:0, strategic:0, nonStrategic:0, closedNarr:0, pipelineNarr:0 });

  if (quarters.length === 0) return (
    <div style={{ padding:"30px 20px",color:"#C3D4CF",fontSize:13,textAlign:"center" }}>
      No quarterly data yet — upload a CSV with Fiscal Period populated (e.g. Q1-2027).
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* ── FY summary bar ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
        <StatCard label="FY Total NARR" value={fmt(tot.narr)} sub="All quarters · approved"/>
        <StatCard label="Strategic" value={fmt(tot.strategic)} sub={tot.narr?`${((tot.strategic/tot.narr)*100).toFixed(0)}%`:"—"} accent="#00ED64"/>
        <StatCard label="Non-Strategic" value={fmt(tot.nonStrategic)} sub={tot.narr?`${((tot.nonStrategic/tot.narr)*100).toFixed(0)}%`:"—"} accent="#f9ebff"/>
        <StatCard label="Closed" value={fmt(tot.closedNarr)} sub="Closed Won" accent="#00ED64"/>
        <StatCard label="Pipeline" value={fmt(tot.pipelineNarr)} sub="Open opps" accent="#e9ff99"/>
      </div>

      {/* ── Quarter sub-tabs ── */}
      <div style={{ background:"rgba(0,30,43,0.7)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:15, overflow:"hidden" }}>
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }}>
          {quarters.map(q => {
            const sel = q === activeQ;
            const qd = qMap[q];
            return (
              <button key={q} onClick={() => setSelQ(q)}
                style={{ flex:1, padding:"12px 8px", border:"none", cursor:"pointer", background:"transparent",
                  borderBottom: sel ? "2px solid #00ED64" : "2px solid transparent",
                  marginBottom:-1, textAlign:"center" }}>
                <div style={{ color: sel ? "#00ED64" : "#C3D4CF", fontWeight: sel ? 700 : 400, fontSize:13 }}>{q}</div>
                <div style={{ color: sel ? "#fff" : "rgba(255,255,255,0.4)", fontWeight:700, fontSize:12, marginTop:3 }}>{fmt(qd.narr)}</div>
                <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:4, fontSize:9, color:"rgba(255,255,255,0.4)" }}>
                  <span style={{ color:"#00ED64" }}>S {fmt(qd.strategic)}</span>
                  <span>·</span>
                  <span style={{ color:"#f9ebff" }}>NS {fmt(qd.nonStrategic)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Quarter detail ── */}
        {qData && (
          <>
            {/* NARR split row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              {[
                { label:"Total NARR",    value:fmt(qData.narr),         color:"#fff" },
                { label:"Strategic",     value:fmt(qData.strategic),    color:"#00ED64" },
                { label:"Non-Strategic", value:fmt(qData.nonStrategic), color:"#f9ebff" },
                { label:"Closed / Pipeline", value:`${fmt(qData.closedNarr)} / ${fmt(qData.pipelineNarr)}`, color:"#e9ff99" },
              ].map(c => (
                <div key={c.label} style={{ padding:"12px 16px", borderRight:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize:9, color:"#C3D4CF", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:c.color }}>{c.value}</div>
                  {(c.label==="Strategic"||c.label==="Non-Strategic") && qData.narr > 0 && (
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:2 }}>
                      {((+c.value.replace(/[$KMB,]/g,"")||0) / qData.narr * 100).toFixed(0)}% of quarter
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Opportunities for this quarter */}
            <div style={{ padding:"8px 16px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.07)",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#C3D4CF", fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>
                {activeQ} Opportunities
              </span>
              <span style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>· Approved · {qOpps.length} total · {fmt(qOpps.reduce((s,o)=>s+o.value,0))}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:QOCOLS, gap:8, padding:"7px 16px",
              background:"rgba(255,255,255,0.06)", fontSize:10, color:"#C3D4CF", letterSpacing:"0.06em", textTransform:"uppercase" }}>
              <span>ID</span><span>Opportunity</span><span>Value</span><span>Stage</span><span>Type</span><span>Close</span>
            </div>
            {qOpps.length === 0
              ? <div style={{ padding:"18px 16px", color:"rgba(255,255,255,0.35)", fontSize:13 }}>No opportunities found for {activeQ}.</div>
              : qOpps.map(o => (
                <div key={o.id||o._id} style={{ display:"grid", gridTemplateColumns:QOCOLS, gap:8, alignItems:"center",
                  padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color:"#C3D4CF", fontSize:11 }}>{o.id}</span>
                  <div>
                    <div style={{ color:"#fff", fontSize:13, fontWeight:500 }}>{o.title}</div>
                    <div style={{ color:"#C3D4CF", fontSize:10 }}>{o.partner}</div>
                  </div>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:13 }}>{fmt(o.value)}</span>
                  <Badge label={o.stage} color={STAGE_COLOR[o.stage]||"#C3D4CF"}/>
                  <Badge label={o.type}  color={TYPE_COLOR[o.type]||"#C3D4CF"}/>
                  <span style={{ color:"#C3D4CF", fontSize:11 }}>{o.close}</span>
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  );
}

// ── Non-Approved Opportunities Table ─────────────────────────
const NA_STATUS_COLOR = { "Pending Approval":"#e9ff99", "New":"#f9ebff", "Rejected":"#ff6b6b" };
const NACOLS = "60px 1fr 100px 90px 90px 80px 80px";
function NonApprovedTable({ opps }) {
  return (
    <div style={{ background:"rgba(0,30,43,0.7)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:15,overflow:"hidden" }}>
      <div style={{ padding:"10px 16px",background:"rgba(255,107,107,0.07)",borderBottom:"1px solid rgba(255,107,107,0.15)",display:"flex",alignItems:"center",gap:8 }}>
        <span style={{ color:"#ff6b6b",fontWeight:700,fontSize:12,letterSpacing:"0.05em",textTransform:"uppercase" }}>Non-Approved Opportunities</span>
        <span style={{ color:"#C3D4CF",fontSize:11 }}>· not counted in NARR</span>
        <span style={{ marginLeft:"auto",color:"#ff6b6b",fontWeight:700,fontSize:12 }}>{opps.length} total</span>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:NACOLS,gap:8,padding:"8px 16px",background:"rgba(255,255,255,0.06)",fontSize:10,color:"#C3D4CF",letterSpacing:"0.07em",textTransform:"uppercase" }}>
        <span>ID</span><span>Opportunity</span><span>Value</span><span>Status</span><span>Stage</span><span>Quarter</span><span>Close</span>
      </div>
      {opps.length === 0
        ? <div style={{ padding:"22px 16px",color:"#C3D4CF",fontSize:13 }}>No non-approved opportunities.</div>
        : opps.map(o => (
          <div key={o.id||o._id} style={{ display:"grid",gridTemplateColumns:NACOLS,gap:8,alignItems:"center",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color:"#C3D4CF",fontSize:11 }}>{o.id}</span>
            <div><div style={{ color:"#fff",fontSize:13,fontWeight:500 }}>{o.title}</div><div style={{ color:"#C3D4CF",fontSize:10 }}>{o.partner}</div></div>
            <span style={{ color:"rgba(255,255,255,0.5)",fontSize:12 }}>{fmt(o.value)}</span>
            <Badge label={o.status||"—"} color={NA_STATUS_COLOR[o.status]||"#C3D4CF"}/>
            <Badge label={o.stage||"—"} color={STAGE_COLOR[o.stage]||"#C3D4CF"}/>
            <span style={{ color:"#C3D4CF",fontSize:11 }}>{o.fiscalPeriod||"—"}</span>
            <span style={{ color:"#C3D4CF",fontSize:11 }}>{o.close||"—"}</span>
          </div>
        ))
      }
    </div>
  );
}

// ── Per-person FY targets (in dollars, matching screenshot) ──
const MEMBER_TARGETS = {
  "Deepak Mirchandani": { narr: 15_000_000, strategic: 6_600_000, usa: 9_000_000, emea: 5_500_000, apac:   500_000 },
  "Iman Roy":           { narr:  4_000_000, strategic: 1_760_000, usa: 2_400_000, emea: 1_400_000, apac:   200_000 },
  "Shivani Tripathy":   { narr:  6_500_000, strategic: 2_860_000, usa: 3_900_000, emea: 2_280_000, apac:   330_000 },
  "Meena M":            { narr:  4_500_000, strategic: 1_980_000, usa: 2_700_000, emea: 1_580_000, apac:   230_000 },
};

function TargetBar({ label, actual, target, color = "#00ED64" }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const over = target > 0 && actual > target;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
        <span style={{ fontSize:11, color: over ? "#22c55e" : color, fontWeight:700 }}>
          {fmt(actual)} <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:400 }}>/ {fmt(target)}</span>
          <span style={{ marginLeft:6, fontSize:10, color: over?"#22c55e": pct>=75?"#e9ff99": pct>=50?color:"#ff6b6b", fontWeight:700 }}>
            {pct.toFixed(0)}%
          </span>
        </span>
      </div>
      <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, transition:"width 0.5s",
          background: over
            ? "linear-gradient(90deg,#22c55e,#16a34a)"
            : pct >= 75
              ? `linear-gradient(90deg,${color},${color}bb)`
              : pct >= 50
                ? `linear-gradient(90deg,#e9ff99,#e9ff9988)`
                : "linear-gradient(90deg,#ff6b6b,#ff6b6b88)" }} />
      </div>
    </div>
  );
}

function PersonView({ TEAM }) {
  const [selectedId, setSelectedId] = useState(TEAM[0]?.id?.toString());
  const [tab, setTab] = useState("partners");
  useEffect(() => {
    if (!TEAM.find(m => m.id?.toString() === selectedId)) setSelectedId(TEAM[0]?.id?.toString());
  }, [TEAM]);
  const member = TEAM.find(m => m.id?.toString() === selectedId) || TEAM[0];
  if (!member) return null;
  const mi = TEAM.findIndex(m => m.id?.toString() === member.id?.toString());
  const primary    = member.partners.filter(p => p.type === "Primary");
  const secondary  = member.partners.filter(p => p.type === "Secondary");
  const totalNarr         = sumArr(member.partners, "narr");
  const totalClosedNarr   = sumArr(member.partners, "closedNarr");
  const totalPipeline     = sumArr(member.partners, "pipelineNarr");
  const totalStrategic    = sumArr(member.partners, "strategic");
  const totalNonStrategic = sumArr(member.partners, "nonStrategic");
  const priNarr = sumArr(primary,"narr");
  const secNarr = sumArr(secondary,"narr");
  const recentOpps = member.recentOpps || member.opportunities || [];
  const fyOpps     = member.fyOpps || [];
  const priRecentOpps = recentOpps.filter(o => primary.some(p => p.name === o.partner));
  const secRecentOpps = recentOpps.filter(o => secondary.some(p => p.name === o.partner));
  const priFyOpps     = fyOpps.filter(o => primary.some(p => p.name === o.partner));
  const secFyOpps     = fyOpps.filter(o => secondary.some(p => p.name === o.partner));
  const [editingOpp, setEditingOpp] = useState(null);
  const [oppSubTab, setOppSubTab] = useState("recent");

  const target = MEMBER_TARGETS[member.name] || {};

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      <aside style={{ width:265, flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.08)",
        padding:"14px 10px", display:"flex", flexDirection:"column", gap:5, overflowY:"auto" }}>
        <div style={{ color:"#C3D4CF", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", padding:"0 6px 8px" }}>Team Members</div>
        {TEAM.map((m, i) => {
          const n=sumArr(m.partners,"narr");
          const t=MEMBER_TARGETS[m.name]?.narr||0;
          const tPct=t>0?Math.min((n/t)*100,100):0;
          const sel = selectedId === m.id?.toString();
          const [c1,c2] = MEMBER_COLORS[i%4];
          return (
            <button key={m.id} onClick={() => setSelectedId(m.id?.toString())}
              style={{ width:"100%", background:sel?`linear-gradient(135deg,${c1}28,${c2}18)`:"rgba(0,30,43,0.7)",
                border:sel?`1px solid ${c1}55`:"1px solid rgba(255,255,255,0.08)",
                borderRadius:13, padding:"12px 13px", cursor:"pointer", textAlign:"left",
                display:"flex", alignItems:"center", gap:11, transition:"all 0.18s" }}>
              <div style={{ width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${c1},${c2})`,
                display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,
                color:"#fff",flexShrink:0,fontFamily:"'Syne',sans-serif" }}>{m.avatar}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#ffffff",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.name}</div>
                <div style={{ color:"#C3D4CF",fontSize:11,marginTop:1 }}>
                  {m.partners.filter(p=>p.type==="Primary").length}P · {m.partners.filter(p=>p.type==="Secondary").length}S
                </div>
                {/* Mini target bar in sidebar */}
                {t>0&&(
                  <div style={{ marginTop:5 }}>
                    <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${tPct}%`, borderRadius:2,
                        background:tPct>=100?"#22c55e":tPct>=75?c1:tPct>=50?"#e9ff99":"#ff6b6b", transition:"width 0.4s" }}/>
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:9, marginTop:2 }}>{tPct.toFixed(0)}% of target</div>
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ color:"#ffffff",fontWeight:700,fontSize:12 }}>{fmt(n)}</div>
              </div>
            </button>
          );
        })}
      </aside>
      <main style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ width:46,height:46,borderRadius:12,
            background:`linear-gradient(135deg,${MEMBER_COLORS[mi%4][0]},${MEMBER_COLORS[mi%4][1]})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff",fontFamily:"'Syne',sans-serif" }}>
            {member.avatar}
          </div>
          <div>
            <h2 style={{ margin:0,fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,letterSpacing:"-0.02em" }}>{member.name}</h2>
            <div style={{ color:"#C3D4CF",fontSize:12,marginTop:2 }}>{member.partners.map(p=>p.name).join(" · ")}</div>
          </div>
        </div>

        {/* ── FY NARR stat cards ── */}
        <div style={{ fontSize:9,color:"rgba(0,210,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6 }}>FY NARR — Approved Only</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:10 }}>
          <StatCard label="FY NARR" value={fmt(totalNarr)} sub="Approved only"/>
          <StatCard label="Strategic" value={fmt(totalStrategic)} sub={totalNarr?`${((totalStrategic/totalNarr)*100).toFixed(0)}% of FY`:"—"} accent="#00ED64"/>
          <StatCard label="Non-Strategic" value={fmt(totalNonStrategic)} sub={totalNarr?`${((totalNonStrategic/totalNarr)*100).toFixed(0)}% of FY`:"—"} accent="#f9ebff"/>
          <StatCard label="Closed NARR" value={fmt(totalClosedNarr)} sub="Closed Won" accent="#00ED64"/>
          <StatCard label="Pipeline NARR" value={fmt(totalPipeline)} sub="Open opps" accent="#e9ff99"/>
        </div>

        {/* ── Target progress ── */}
        {target.narr && (
          <div style={{ background:"rgba(0,237,100,0.04)", border:"1px solid rgba(0,237,100,0.12)", borderRadius:14, padding:"16px 20px", marginBottom:14 }}>
            <div style={{ fontSize:9,color:"rgba(0,237,100,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12 }}>FY Target Achievement</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 28px" }}>
              <TargetBar label="Total NARR"     actual={totalNarr}      target={target.narr}      color="#00ED64"/>
              <TargetBar label="Strategic NARR" actual={totalStrategic}  target={target.strategic}  color="#C3D4CF"/>
            </div>
            <div style={{ height:1, background:"rgba(255,255,255,0.07)", margin:"12px 0" }}/>
            <div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10 }}>By Region — Actual vs Target</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"4px 28px" }}>
              <TargetBar label="USA / AMER" actual={member.regionalNarr?.AMER||0} target={target.usa}  color="#00ED64"/>
              <TargetBar label="EMEA"       actual={member.regionalNarr?.EMEA||0} target={target.emea} color="#8b5cf6"/>
              <TargetBar label="APAC"       actual={member.regionalNarr?.APAC||0} target={target.apac} color="#f59e0b"/>
            </div>
            {(!member.regionalNarr || Object.values(member.regionalNarr).every(v=>v===0)) && (
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:8 }}>
                ℹ Re-upload your CSV to populate region data — the "zzDeprecate-Owner Area Group" field is now mapped.
              </div>
            )}
          </div>
        )}

        {/* ── Primary / Secondary split ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[{label:"Primary NARR",narr:priNarr,color:"#00ED64"},{label:"Secondary NARR",narr:secNarr,color:"#00ED64"}].map(s => (
            <div key={s.label} style={{ background:`${s.color}0d`,border:`1px solid ${s.color}28`,borderRadius:12,padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10,color:s.color,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase" }}>{s.label}</div>
                <div style={{ fontSize:19,fontWeight:700,color:"#ffffff",fontFamily:"'Syne',sans-serif",marginTop:3 }}>{fmt(s.narr)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:2, marginBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          {[
            ["partners","Partner Performance"],
            ["quarterly","Quarterly NARR"],
            ["opps",`Opps (${recentOpps.length} recent · ${fyOpps.length} FY)`],
            ["nonapproved",`Non-Approved (${member.nonApprovedOpportunities?.length||0})`],
          ].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 16px",border:"none",cursor:"pointer",
              background:"transparent",
              color:t==="nonapproved"?(tab===t?"#ff6b6b":"rgba(255,107,107,0.6)"):(tab===t?"#00ED64":"#C3D4CF"),
              fontWeight:tab===t?600:400,fontSize:13,
              borderBottom:tab===t?`2px solid ${t==="nonapproved"?"#ff6b6b":"#00ED64"}`:"2px solid transparent",
              marginBottom:-1 }}>{label}</button>
          ))}
        </div>

        {tab==="partners" && (
          <div style={{ background:"rgba(0,30,43,0.7)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:15,overflow:"hidden" }}>
            <PartnerTableHeader/>
            {primary.length>0&&<><GroupHeader label="Primary Partners" narr={priNarr} prev={0} count={primary.length} color="#00ED64"/>
              {primary.map(p=><PartnerTableRow key={p.name} partner={{...p,opps:recentOpps.filter(o=>o.partner===p.name)}}/>)}</>}
            {secondary.length>0&&<><GroupHeader label="Secondary Partners" narr={secNarr} prev={0} count={secondary.length} color="#00ED64"/>
              {secondary.map(p=><PartnerTableRow key={p.name} partner={{...p,opps:recentOpps.filter(o=>o.partner===p.name)}}/>)}</>}
          </div>
        )}

        {tab==="quarterly" && <QuarterlyNarrTable partners={member.partners} opportunities={member.quarterlyOpportunities||[]}/>}

        {tab==="opps" && (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {/* Sub-tabs: Last 2 Weeks / This FY */}
            <div style={{ display:"flex",gap:2,borderBottom:"1px solid rgba(255,255,255,0.07)",marginBottom:4 }}>
              {[["recent",`Last 2 Weeks (${recentOpps.length})`],["fy",`This FY FY27 (${fyOpps.length})`]].map(([t,l])=>(
                <button key={t} onClick={()=>setOppSubTab(t)} style={{ padding:"6px 14px",border:"none",cursor:"pointer",
                  background:"transparent",color:oppSubTab===t?"#00ED64":"#C3D4CF",
                  fontWeight:oppSubTab===t?600:400,fontSize:12,
                  borderBottom:oppSubTab===t?"2px solid #00ED64":"2px solid transparent",marginBottom:-1 }}>{l}</button>
              ))}
            </div>
            {[
              {label:"Primary Partners",opps:(oppSubTab==="recent"?priRecentOpps:priFyOpps),color:"#00ED64"},
              {label:"Secondary Partners",opps:(oppSubTab==="recent"?secRecentOpps:secFyOpps),color:"#00ED64"},
            ].map(group=>(
              <div key={group.label}>
                <div style={{fontSize:10,color:group.color,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6,paddingLeft:2}}>
                  {group.label} · {group.opps.length} approved opps
                </div>
                <SortableOppTable opps={group.opps} onEdit={setEditingOpp} emptyMsg="No opportunities"/>
              </div>
            ))}
          </div>
        )}

        {tab==="nonapproved" && <NonApprovedTable opps={member.nonApprovedOpportunities||[]}/>}

        {editingOpp && <OppEditModal opp={editingOpp} onClose={()=>setEditingOpp(null)} onSaved={()=>{ setEditingOpp(null); window.location.reload(); }}/>}
      </main>
    </div>
  );
}

function PartnerView({ TEAM }) {
  const ALL = TEAM.flatMap(m=>m.partners.map(p=>({...p,owner:m.name,ownerAvatar:m.avatar,ownerId:m.id,opps:m.opportunities.filter(o=>o.partner===p.name)})));
  const primary=ALL.filter(p=>p.type==="Primary"), secondary=ALL.filter(p=>p.type==="Secondary");
  const [selected, setSelected] = useState(primary[0]?.name||secondary[0]?.name);
  useEffect(()=>{ if(!ALL.find(p=>p.name===selected)) setSelected(primary[0]?.name||secondary[0]?.name); },[TEAM]);
  const pd=ALL.find(p=>p.name===selected);
  const recentOpps=(pd?.opps||[]).filter(o=>o.daysAgo<=14);

  function SidebarGroup({ label, partners, color }) {
    return (
      <div style={{ marginBottom:4 }}>
        <div style={{ display:"flex",alignItems:"center",gap:7,padding:"5px 8px 8px" }}>
          <div style={{ width:5,height:5,borderRadius:1,background:color }}/>
          <span style={{ color,fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</span>
          <span style={{ color:"#C3D4CF",fontSize:10 }}>({partners.length})</span>
        </div>
        {partners.map(p=>{
          const sel=selected===p.name;
          return (
            <button key={p.name} onClick={()=>setSelected(p.name)}
              style={{ width:"100%",background:sel?`${color}1a`:"rgba(255,255,255,0.01)",
                border:sel?`1px solid ${color}40`:"1px solid transparent",
                borderRadius:10,padding:"9px 11px",cursor:"pointer",textAlign:"left",
                display:"flex",alignItems:"center",gap:9,marginBottom:2 }}>
              <div style={{ width:30,height:30,borderRadius:7,background:`linear-gradient(135deg,${color}bb,${color})`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0 }}>
                {p.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ color:"#ffffff",fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                <div style={{ color:"#C3D4CF",fontSize:10 }}>{p.owner}</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ color:"#ffffff",fontSize:12,fontWeight:700 }}>{fmt(p.narr)}</div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Opps for this partner from both buckets
  const allMembers = TEAM;
  const pdRecentOpps = allMembers.flatMap(m=>(m.recentOpps||m.opportunities||[])).filter(o=>o.partner===pd?.name);
  const pdFyOpps     = allMembers.flatMap(m=>(m.fyOpps||[])).filter(o=>o.partner===pd?.name);
  const [pOppTab, setPOppTab] = useState("recent");
  const [pEditingOpp, setPEditingOpp] = useState(null);

  return (
    <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
      <aside style={{ width:265,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.08)",padding:"14px 10px",overflowY:"auto" }}>
        <div style={{ color:"#C3D4CF",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0 6px 10px" }}>All Partners</div>
        <SidebarGroup label="Primary" partners={primary} color="#00ED64"/>
        <div style={{ height:1,background:"rgba(255,255,255,0.07)",margin:"8px 6px" }}/>
        <SidebarGroup label="Secondary" partners={secondary} color="#00ED64"/>
      </aside>
      {pd && (
        <main style={{ flex:1,padding:"20px 24px",overflowY:"auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:13,marginBottom:14 }}>
            <div style={{ width:50,height:50,borderRadius:13,background:"linear-gradient(135deg,#00ED64,#00684A)",
              display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,color:"#fff",fontFamily:"'Syne',sans-serif" }}>
              {pd.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                <h2 style={{ margin:0,fontFamily:"'Syne',sans-serif",fontSize:21,fontWeight:800,letterSpacing:"-0.02em" }}>{pd.name}</h2>
                <Badge label={pd.type} color="#00ED64"/>
              </div>
              <div style={{ color:"#C3D4CF",fontSize:12,marginTop:3 }}>Managed by {pd.owner}</div>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14 }}>
            <StatCard label="NARR (FY)" value={fmt(pd.narr)} sub="Approved only"/>
            <StatCard label="Closed NARR" value={fmt(pd.closedNarr)} sub="Closed Won" accent="#00ED64"/>
            <StatCard label="Pipeline NARR" value={fmt(pd.pipelineNarr)} sub="Open opps" accent="#e9ff99"/>
            <StatCard label="Strategic" value={fmt(pd.strategic)} sub={pd.narr?`${((pd.strategic/pd.narr)*100).toFixed(0)}% of NARR`:"—"} accent="#f9ebff"/>
          </div>
          <div style={{ background:"rgba(0,30,43,0.9)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:"14px 18px", marginBottom:14 }}>
            <div style={{ fontSize:10, color:"#C3D4CF", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Strategic vs Non-Strategic</div>
            <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden" }}>
              <div style={{ flex:pd.strategic||1, background:"linear-gradient(90deg,#00ED64,#00684A)" }}/>
              <div style={{ width:2, background:"#001E2B" }}/>
              <div style={{ flex:pd.nonStrategic||1, background:"linear-gradient(90deg,#f9ebff,#C3D4CF)" }}/>
            </div>
            <div style={{ display:"flex", gap:20, marginTop:8, fontSize:12 }}>
              <span style={{ color:"#00ED64" }}>■ Strategic — {fmt(pd.strategic)} ({pd.narr?((pd.strategic/pd.narr)*100).toFixed(0):0}%)</span>
              <span style={{ color:"#f9ebff" }}>■ Non-Strategic — {fmt(pd.nonStrategic)} ({pd.narr?((pd.nonStrategic/pd.narr)*100).toFixed(0):0}%)</span>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <PartnerHistoryChart partnerName={pd.name}/>
          </div>
          {/* Opp sub-tabs */}
          <div style={{ display:"flex",gap:2,borderBottom:"1px solid rgba(255,255,255,0.07)",marginBottom:10 }}>
            {[["recent",`Last 2 Weeks (${pdRecentOpps.length})`],["fy",`This FY FY27 (${pdFyOpps.length})`]].map(([t,l])=>(
              <button key={t} onClick={()=>setPOppTab(t)} style={{ padding:"6px 14px",border:"none",cursor:"pointer",
                background:"transparent",color:pOppTab===t?"#00ED64":"#C3D4CF",
                fontWeight:pOppTab===t?600:400,fontSize:12,
                borderBottom:pOppTab===t?"2px solid #00ED64":"2px solid transparent",marginBottom:-1 }}>{l}</button>
            ))}
          </div>
          <SortableOppTable
            opps={pOppTab==="recent"?pdRecentOpps:pdFyOpps}
            onEdit={setPEditingOpp}
            emptyMsg="No opportunities"
          />
          {pEditingOpp && <OppEditModal opp={pEditingOpp} onClose={()=>setPEditingOpp(null)} onSaved={()=>{ setPEditingOpp(null); window.location.reload(); }}/>}
        </main>
      )}
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!sessionStorage.getItem("pp_token"));

  if (!loggedIn) return <LoginPage onLogin={()=>setLoggedIn(true)}/>;

  const [navTab, setNavTab]       = useState("narr");
  const [narrView, setNarrView]   = useState("person");
  const [TEAM, setTEAM]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [weeks, setWeeks]         = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [teamTarget, setTeamTarget]   = useState(65776000);
  const [dbStatus, setDbStatus]   = useState(null);

  const loadDashboard = useCallback(async (week) => {
    setLoading(true); setError(null);
    try {
      const data = await getDashboard(week);
      setTEAM(data.team || []);
      setWeeks(data.availableWeeks || []);
      setCurrentWeek(data.currentWeek || null);
      if (data.teamTarget) setTeamTarget(data.teamTarget);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => {
    fetch(`${API_BASE}/api/health`).then(r=>r.json()).then(d=>setDbStatus(d.mongodb)).catch(()=>setDbStatus("disconnected"));
  }, []);

  const teamNarr     = TEAM.reduce((s,m)=>s+sumArr(m.partners,"narr"),0);
  const teamPipeline = TEAM.reduce((s,m)=>s+sumArr(m.partners,"pipelineNarr"),0);
  const teamOpps     = TEAM.reduce((s,m)=>s+(m.recentOpps||m.opportunities||[]).length,0);

  return (
    <div style={{ height:"100vh", background:"#001E2B", fontFamily:"'DM Sans',sans-serif",
      color:"#ffffff", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 22px", height:54, borderBottom:"1px solid rgba(0,237,100,0.12)",
        background:"#001220", flexShrink:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <svg width="18" height="24" viewBox="0 0 18 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 0C9 0 1 8 1 16.5C1 21.2 4.8 25 9 25C13.2 25 17 21.2 17 16.5C17 8 9 0 9 0Z" fill="#00ED64"/>
            <path d="M9 25L9 28" stroke="#00684A" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:"-0.02em" }}>PartnerPulse</span>
          <span style={{ color:"rgba(255,255,255,0.3)",fontSize:12 }}>/ FY 2024–25</span>
          <div style={{ display:"flex",alignItems:"center",gap:5,marginLeft:8,padding:"2px 8px",
            background:"rgba(0,237,100,0.07)",border:"1px solid rgba(0,237,100,0.15)",borderRadius:20 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:dbStatus==="connected"?"#00ED64":"#ff6b6b",
              boxShadow:dbStatus==="connected"?"0 0 5px #00ED64":"none" }}/>
            <span style={{ fontSize:10,color:"#C3D4CF" }}>MongoDB</span>
          </div>
          <button onClick={()=>{sessionStorage.removeItem("pp_token");sessionStorage.removeItem("pp_user");setLoggedIn(false);}}
            style={{marginLeft:8,padding:"2px 9px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,color:"rgba(255,255,255,0.4)",fontSize:10,cursor:"pointer"}}>
            Sign out
          </button>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <WeekSelector current={currentWeek} weeks={weeks} onChange={w=>loadDashboard(w)}/>
          {navTab === "narr" && (
            <div style={{ display:"flex",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:3,gap:2 }}>
              {[["person","👤 By Person"],["partner","🏢 By Partner"],["upload","📤 Upload"]].map(([v,label])=>(
                <button key={v} onClick={()=>setNarrView(v)}
                  style={{ padding:"5px 13px",borderRadius:7,border:"none",cursor:"pointer",
                    background:narrView===v?"linear-gradient(135deg,#00ED64,#00684A)":"transparent",
                    color:narrView===v?"#fff":"#C3D4CF",fontWeight:narrView===v?600:400,fontSize:12,transition:"all 0.18s" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:4,padding:"0 14px",minWidth:280,
          background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,justifyContent:"center",height:44 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11 }}>
            <span style={{ color:"#C3D4CF" }}>Team NARR <span style={{ color:"#00ED64",fontWeight:700 }}>{fmt(teamNarr)}</span></span>
            <span style={{ color:"#C3D4CF" }}>Pipeline <span style={{ color:"#e9ff99",fontWeight:700 }}>{fmt(teamPipeline)}</span></span>
            <span style={{ color:"rgba(255,255,255,0.4)",fontSize:10 }}>Target {fmt(teamTarget)}</span>
          </div>
          <div style={{ display:"flex",height:5,borderRadius:3,overflow:"hidden",background:"rgba(255,255,255,0.08)",gap:1 }}>
            <div style={{ width:`${Math.min((teamNarr/teamTarget)*100,100).toFixed(1)}%`,background:"linear-gradient(90deg,#00ED64,#00684A)",borderRadius:3,transition:"width 0.5s" }}/>
            <div style={{ width:`${Math.min((teamPipeline/teamTarget)*100,100-(teamNarr/teamTarget)*100).toFixed(1)}%`,background:"#e9ff99",borderRadius:3,opacity:0.7 }}/>
          </div>
        </div>
      </header>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── Left Nav — MongoDB Atlas style ── */}
        <nav style={{ width:165, flexShrink:0, borderRight:"1px solid rgba(0,237,100,0.1)",
          background:"#001220", padding:"10px 8px", display:"flex",
          flexDirection:"column", gap:1, overflowY:"auto" }}>
          {NAV_TABS.map(t => {
            const sel = navTab === t.id;
            return (
              <button key={t.id} onClick={() => setNavTab(t.id)}
                style={{ width:"100%",
                  background:sel?"rgba(0,237,100,0.1)":"transparent",
                  border:"none",
                  borderLeft:sel?"3px solid #00ED64":"3px solid transparent",
                  borderRadius:"0 8px 8px 0", padding:"9px 11px", cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:9, transition:"all 0.12s" }}
                onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}
                onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background="transparent"; }}>
                <span style={{ fontSize:14, color:sel?"#00ED64":"rgba(255,255,255,0.4)", flexShrink:0 }}>{t.icon}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ color:sel?"#00ED64":"rgba(255,255,255,0.6)", fontWeight:sel?600:400,
                    fontSize:11, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.label}</div>
                  <div style={{ color:"rgba(255,255,255,0.2)", fontSize:9, marginTop:1 }}>{t.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* ── Content ── */}
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {loading && <Spinner/>}
          {error && !loading && (
            <div style={{ flex:1, padding:20 }}>
              <ErrorBanner message={`Could not load dashboard: ${error}. Is the server running?`} onRetry={()=>loadDashboard(currentWeek)}/>
              <div style={{ marginTop:12,padding:"14px 18px",background:"rgba(0,210,255,0.07)",border:"1px solid rgba(0,210,255,0.15)",borderRadius:12,fontSize:12,color:"#C3D4CF" }}>
                💡 Make sure you've run <code style={{ color:"#00ED64" }}>npm run dev</code> and MongoDB is running.
              </div>
            </div>
          )}
          {!loading && !error && navTab==="narr" && narrView==="person"  && <PersonView  TEAM={TEAM}/>}
          {!loading && !error && navTab==="narr" && narrView==="partner" && <PartnerView TEAM={TEAM}/>}
          {!loading && !error && navTab==="narr" && narrView==="upload"  && (
            <div style={{ flex:1, overflowY:"auto" }}>
              <UploadPanel onUploaded={()=>loadDashboard(currentWeek)}/>
            </div>
          )}
          {navTab==="workstreams" && <WorkstreamsTab/>}
          {navTab==="m4s"         && <ComingSoon title="M4S"                icon="◎" sub="Milestones for success tracking"/>}
          {navTab==="cert"        && <ComingSoon title="Certification"       icon="✦" sub="Partner certification and badge tracking"/>}
          {navTab==="champions"   && <ChampionsTab/>}
          {navTab==="activities"   && <ActivitiesTab/>}
          {navTab==="events"       && <MarketingEventsTab/>}
          {navTab==="export"       && <ExportPage/>}
          {navTab==="admin"        && <AdminPage/>}
        </div>
      </div>
    </div>
  );
}
