// Shared helpers & UI primitives

export const fmt = n => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1e3).toFixed(0)}K`;
export const pct = (c, p) => p === 0 ? "0.0" : (((c - p) / p) * 100).toFixed(1);
export const sumArr = (arr, key) => arr.reduce((s, x) => s + (x[key] || 0), 0);

export const STAGE_COLOR  = { Discovery:"#00ED64", Proposal:"#f9ebff", Negotiation:"#00ED64", Closed:"#00684A", Lost:"#ff6b6b" };
export const TYPE_COLOR   = { "Sell-through":"#00ED64", "Co-sell":"#00ED64" };
export const MEMBER_COLORS = [["#00ED64","#00684A"],["#00684A","#f9ebff"],["#C3D4CF","#00ED64"],["#f9ebff","#00684A"]];

export function Badge({ label, color }) {
  return (
    <span style={{ background:color+"22", color, border:`1px solid ${color}44`,
      borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:"rgba(0,237,100,0.05)", border:"1px solid rgba(0,237,100,0.12)",
      borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:3 }}>
      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", letterSpacing:"0.09em", textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontSize:20, fontWeight:700, color:"#ffffff", fontFamily:"'Syne',sans-serif" }}>{value}</span>
      {sub && <span style={{ fontSize:11, color:accent||"#C3D4CF" }}>{sub}</span>}
    </div>
  );
}

export function GroupHeader({ label, narr, prev, count, color }) {
  const g = pct(narr, prev);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px",
      background:`${color}0d`, borderTop:"1px solid rgba(255,255,255,0.07)", borderBottom:`1px solid ${color}25` }}>
      <div style={{ width:7, height:7, borderRadius:1, background:color, flexShrink:0 }}/>
      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color, fontSize:12,
        letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</span>
      <span style={{ color:"#C3D4CF" }}>·</span>
      <span style={{ color:"#C3D4CF", fontSize:11 }}>{count} partner{count!==1?"s":""}</span>
      <div style={{ flex:1 }}/>
      <span style={{ color:"#ffffff", fontWeight:700, fontSize:13 }}>{fmt(narr)}</span>
      <span style={{ color:+g>=0?"#00ED64":"#ff6b6b", fontSize:12, fontWeight:600 }}>
        {prev ? `${+g>=0?"▲":"▼"}${Math.abs(g)}%` : "—"}
      </span>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, color:"#C3D4CF" }}>
      <span style={{ fontSize:24, marginRight:12 }}>⏳</span> Loading…
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ margin:20, padding:"14px 18px", background:"rgba(255,107,107,0.08)",
      border:"1px solid rgba(255,107,107,0.2)", borderRadius:12, display:"flex", alignItems:"center", gap:12 }}>
      <span>❌</span>
      <span style={{ color:"#ff5555", flex:1 }}>{message}</span>
      {onRetry && <button onClick={onRetry} style={{ border:"none", background:"rgba(255,107,107,0.15)",
        color:"#ff5555", borderRadius:7, padding:"4px 12px", cursor:"pointer", fontSize:12 }}>Retry</button>}
    </div>
  );
}
