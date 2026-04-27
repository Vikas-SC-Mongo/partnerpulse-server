import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getPartnerHistory, getTeamHistory } from "../api/index.js";
import { fmt } from "./UI.jsx";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#012a27", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px 14px" }}>
      <div style={{ color:"#C3D4CF", fontSize:11, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, fontSize:12, fontWeight:600 }}>{p.name}: {fmt(p.value)}</div>
      ))}
    </div>
  );
};

// Partner NARR history chart
export function PartnerHistoryChart({ partnerName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerName) return;
    setLoading(true);
    getPartnerHistory(partnerName)
      .then(d => setData(d.map(r => ({ ...r, week: r.week.slice(0,10) }))))
      .finally(() => setLoading(false));
  }, [partnerName]);

  if (loading) return <div style={{ color:"#C3D4CF", padding:20, fontSize:12 }}>Loading history…</div>;
  if (!data.length) return <div style={{ color:"#C3D4CF", padding:20, fontSize:12 }}>No historical data yet. Upload more weekly CSVs to see trends.</div>;

  return (
    <div style={{ background:"rgba(0,30,43,0.7)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:"16px 18px" }}>
      <div style={{ fontSize:11, color:"#C3D4CF", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:14 }}>
        NARR History — {partnerName}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top:5, right:10, left:10, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/>
          <XAxis dataKey="week" tick={{ fill:"#C3D4CF", fontSize:10 }} tickLine={false}/>
          <YAxis tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} tick={{ fill:"#C3D4CF", fontSize:10 }} tickLine={false} axisLine={false}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{ fontSize:11, color:"#C3D4CF" }}/>
          <Line type="monotone" dataKey="narr"         name="NARR"           stroke="#00ED64" strokeWidth={2} dot={{ r:3, fill:"#00ED64" }}/>
          <Line type="monotone" dataKey="strategic"    name="Strategic"      stroke="#C3D4CF" strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
          <Line type="monotone" dataKey="nonStrategic" name="Non-Strategic" stroke="#e9ff99" strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Team total NARR trend
export function TeamHistoryChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    getTeamHistory().then(d => setData(d.map(r => ({ ...r, week: r.week.slice(0,10) }))));
  }, []);

  if (!data.length) return null;

  return (
    <div style={{ background:"rgba(0,30,43,0.7)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:"16px 18px", marginBottom:16 }}>
      <div style={{ fontSize:11, color:"#C3D4CF", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:14 }}>
        Team NARR Trend
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top:5, right:10, left:10, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)"/>
          <XAxis dataKey="week" tick={{ fill:"#C3D4CF", fontSize:10 }} tickLine={false}/>
          <YAxis tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} tick={{ fill:"#C3D4CF", fontSize:10 }} tickLine={false} axisLine={false}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Line type="monotone" dataKey="totalNarr" name="Total NARR" stroke="#00ED64" strokeWidth={2.5} dot={{ r:3 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
