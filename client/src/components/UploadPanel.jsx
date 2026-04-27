import { useState, useRef } from "react";
import { uploadFolder, getUploadLog } from "../api/index.js";

export default function UploadPanel({ onUploaded }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const [logs, setLogs]           = useState(null);
  const [showLogs, setShowLogs]   = useState(false);
  const inputRef = useRef();

  async function handleFiles(files) {
    if (!files.length) return;
    setUploading(true); setResult(null);
    try {
      const res = await uploadFolder(Array.from(files));
      setResult(res);
      onUploaded?.();
    } catch(e) {
      setResult({ error: e.message });
    } finally {
      setUploading(false);
    }
  }

  async function loadLogs() {
    const data = await getUploadLog();
    setLogs(data); setShowLogs(true);
  }

  const baseStyle = {
    border: `2px dashed ${dragging ? "#00D2ff" : "rgba(255,255,255,0.09)"}`,
    borderRadius: 14, padding: "28px 20px", textAlign:"center", cursor:"pointer",
    background: dragging ? "rgba(0,210,255,0.07)" : "rgba(3,61,56,0.7)",
    transition: "all 0.2s",
  };

  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#ffffff" }}>
          📤 Upload CSV Data
        </h3>
        <button onClick={loadLogs} style={{ border:"none", background:"rgba(255,255,255,0.08)",
          color:"#E3fcf7", borderRadius:7, padding:"4px 12px", cursor:"pointer", fontSize:11 }}>
          📋 Upload History
        </button>
      </div>

      {/* Drop zone */}
      <div style={baseStyle}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}>
        <input ref={inputRef} type="file" accept=".csv" multiple style={{ display:"none" }}
          onChange={e => handleFiles(e.target.files)}/>
        {uploading
          ? <><div style={{ fontSize:24, marginBottom:8 }}>⏳</div><div style={{ color:"#00D2ff" }}>Uploading to MongoDB…</div></>
          : <>
              <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
              <div style={{ color:"#E3fcf7", fontSize:13 }}>
                Drop your CSV files here, or <span style={{ color:"#00D2ff", fontWeight:600 }}>click to browse</span>
              </div>
              <div style={{ color:"#E3fcf7", fontSize:11, marginTop:6 }}>
                Accepts: <code style={{ color:"#00D2ff" }}>week_YYYY-MM-DD.csv</code> and <code style={{ color:"#00D2ff" }}>prev_year.csv</code>
              </div>
            </>
        }
      </div>

      {/* Result */}
      {result && !result.error && (
        <div style={{ marginTop:12, padding:"12px 16px", background:"rgba(0,210,255,0.07)",
          border:"1px solid rgba(0,210,255,0.18)", borderRadius:10, fontSize:12 }}>
          <div style={{ color:"#00D2ff", fontWeight:700, marginBottom:6 }}>✅ Upload complete</div>
          {result.results?.map((r, i) => (
            <div key={i} style={{ color: r.success ? "#E3fcf7" : "#ff5555", marginBottom:2 }}>
              {r.success ? "✓" : "✗"} <strong>{r.filename}</strong>
              {r.success && ` — ${r.rowsProcessed} rows, ${r.partnersUpdated} partners, ${r.oppsUpdated ?? 0} opps`}
              {!r.success && `: ${r.error}`}
            </div>
          ))}
        </div>
      )}
      {result?.error && (
        <div style={{ marginTop:12, padding:"12px 16px", background:"rgba(255,107,107,0.07)",
          border:"1px solid rgba(255,107,107,0.18)", borderRadius:10, fontSize:12, color:"#ff5555" }}>
          ❌ {result.error}
        </div>
      )}

      {/* Upload log */}
      {showLogs && logs && (
        <div style={{ marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ color:"#E3fcf7", fontSize:12, fontWeight:600 }}>Upload History (last 50)</span>
            <button onClick={() => setShowLogs(false)} style={{ border:"none", background:"transparent",
              color:"#E3fcf7", cursor:"pointer", fontSize:11 }}>Hide</button>
          </div>
          <div style={{ background:"rgba(3,61,56,0.7)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:10, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px 80px 80px",
              padding:"7px 14px", background:"rgba(255,255,255,0.07)", fontSize:10,
              color:"#E3fcf7", letterSpacing:"0.07em", textTransform:"uppercase" }}>
              <span>File</span><span>Type</span><span>Uploaded</span><span>Rows</span><span>Status</span>
            </div>
            {logs.map((l, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px 80px 80px",
                padding:"8px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)",
                fontSize:11, alignItems:"center" }}>
                <span style={{ color:"#E3fcf7", fontFamily:"monospace", fontSize:10 }}>{l.filename}</span>
                <span style={{ color: l.fileType==="weekly" ? "#00D2ff" : "#f9ebff", fontSize:10 }}>{l.fileType}</span>
                <span style={{ color:"#E3fcf7", fontSize:10 }}>{new Date(l.uploadedAt).toLocaleDateString()}</span>
                <span style={{ color:"#E3fcf7" }}>{l.rowsProcessed}</span>
                <span style={{ color: l.status==="success" ? "#00D2ff" : "#ff5555" }}>
                  {l.status === "success" ? "✓ OK" : "✗ Err"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
