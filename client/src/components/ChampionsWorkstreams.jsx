import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const C1="#00ED64",C2="#00684A",C3="#e9ff99",C4="#f9ebff",C5="#C3D4CF",RED="#ff6b6b";
const PARTNERS=["Infosys","EY","Wipro","Accenture","Tech Mahindra","TCS","Hexaware","Capgemini","Cognizant","LTIM"];
const MEMBERS=["Sneha D","Rashmi N","Vikas S","Ashutosh B","Prasad P","Haim R","Will Winn","Stefano S","Piyush A","Vinai","Harshada","Cameron"];
const P_COLORS=["#00ED64","#10b981","#8b5cf6","#f59e0b","#ec4899","#f97316","#14b8a6","#06b6d4","#6366f1","#e11d48"];
const pColor=p=>P_COLORS[PARTNERS.indexOf(p)%P_COLORS.length]||C1;
const STATUS_COLOR={"Active":C1,"Inactive":RED,"On Hold":C3};
function fmt(n){if(!n&&n!==0)return"$0";if(Math.abs(n)>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(Math.abs(n)>=1e3)return`$${(n/1e3).toFixed(0)}K`;return`$${n}`;}

function Field({label,children}){return<div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</label>{children}</div>;}
function Inp({value,onChange,placeholder,type="text"}){return<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"}}/>;}
function Sel({value,onChange,options}){return<select value={value||""} onChange={e=>onChange(e.target.value)} style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",cursor:"pointer"}}><option value="">— Select —</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;}
function Textarea({value,onChange,placeholder,rows=2}){return<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} rows={rows} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}}/>;}
function PBtn({onClick,children,disabled,small}){return<button onClick={onClick} disabled={disabled} style={{padding:small?"7px 14px":"9px 18px",background:"#00ED64",border:"none",borderRadius:7,color:"#001E2B",fontWeight:700,fontSize:small?12:13,cursor:"pointer",opacity:disabled?0.5:1,whiteSpace:"nowrap"}}>{children}</button>;}
function GBtn({onClick,children,color=C5,small}){return<button onClick={onClick} style={{padding:small?"5px 10px":"8px 14px",background:"transparent",border:`1px solid ${color}55`,borderRadius:7,color,fontWeight:600,fontSize:small?11:12,cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>;}
function Pill({label,color}){return<span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",background:`${color}18`,border:`1px solid ${color}44`,borderRadius:20,fontSize:11,color,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>;}
function Dvd(){return<div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"4px 0"}}/>;}

function PartnerSidebar({data,keyFn,activePartner,setActivePartner}){
  const partnerList=[...new Set(data.map(keyFn))].sort();
  return(
    <div style={{width:168,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,15,25,0.95)",padding:"14px 8px",overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
      <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 8px 8px"}}>Filter by Partner</div>
      <button onClick={()=>setActivePartner(null)} style={{width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:9,border:"none",cursor:"pointer",background:!activePartner?"rgba(0,210,255,0.1)":"transparent",color:!activePartner?"#fff":"rgba(255,255,255,0.4)",fontWeight:!activePartner?700:400,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>All Partners</span>
        <span style={{fontSize:11,color:C1,fontWeight:800,background:"rgba(0,210,255,0.15)",padding:"1px 7px",borderRadius:10}}>{data.length}</span>
      </button>
      <Dvd/>
      {partnerList.map(p=>{
        const count=data.filter(d=>keyFn(d)===p).length;
        const col=pColor(p);const sel=activePartner===p;
        return(
          <button key={p} onClick={()=>setActivePartner(sel?null:p)} style={{width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:9,border:sel?`1px solid ${col}40`:"1px solid transparent",cursor:"pointer",background:sel?`${col}14`:"transparent",color:sel?"#fff":"rgba(255,255,255,0.45)",fontWeight:sel?700:400,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
              <div style={{width:7,height:7,borderRadius:2,background:col,flexShrink:0,opacity:sel?1:0.5}}/>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p}</span>
            </div>
            <span style={{fontSize:11,color:sel?col:C5,fontWeight:700,flexShrink:0,background:sel?`${col}20`:"transparent",padding:"1px 6px",borderRadius:8}}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── CHAMPIONS ────────────────────────────────────────────────
const CHAMP_STATUS={
  "champion":  { color:"#22c55e", label:"Champion"                  },
  "building":  { color:"#f59e0b", label:"Champion Building in Progress" },
  "not_yet":   { color:"#ef4444", label:"Not a Champion Yet"         },
  "none":      { color:"transparent", label:"—"                     },
};
const CERTS=["SI Associate","SI Architect","App Dev"];

const CE={partner:"",contactName:"",title:"",department:"",managerName:"",email:"",phone:"",contactOwner:"",championStatus:"none",certifications:[]};

function ChampCard({c,col,onEdit,onDel,onUpdate}){
  const st=CHAMP_STATUS[c.championStatus||"none"];
  const certs=c.certifications||[];
  const comments=c.comments||[];
  const [showComments,setShowComments]=useState(false);
  const [newComment,setNewComment]=useState("");
  const [addedBy,setAddedBy]=useState("");
  const [saving,setSaving]=useState(false);

  async function addComment(){
    if(!newComment.trim())return;
    setSaving(true);
    try{
      const r=await fetch(`${API_BASE}/api/champions/${c._id}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:newComment.trim(),addedBy:addedBy.trim()})});
      const updated=await r.json();
      setNewComment("");
      onUpdate(updated);
    }finally{setSaving(false);}
  }

  async function delComment(commentId){
    const r=await fetch(`${API_BASE}/api/champions/${c._id}/comments/${commentId}`,{method:"DELETE"});
    const updated=await r.json();
    onUpdate(updated);
  }

  function fmtDate(d){
    const dt=new Date(d);
    return dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" · "+dt.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  }

  return(
    <div style={{background:"linear-gradient(135deg,rgba(0,30,43,0.95),rgba(1,30,28,0.98))",border:`1px solid ${col}30`,borderRadius:14,padding:"16px",display:"flex",flexDirection:"column",gap:12,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}44,transparent)`}}/>
      {/* Status dot */}
      {c.championStatus&&c.championStatus!=="none"&&(
        <div title={st.label} style={{position:"absolute",top:10,right:10,width:11,height:11,borderRadius:"50%",background:st.color,boxShadow:`0 0 6px ${st.color}88`,border:"1.5px solid rgba(255,255,255,0.3)"}}/>
      )}
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,paddingTop:4}}>
        <div style={{display:"flex",gap:11,alignItems:"flex-start",flex:1,minWidth:0}}>
          <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:`linear-gradient(135deg,${col}cc,${col})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>{c.contactName.slice(0,2).toUpperCase()}</div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.contactName}</div>
            {c.title&&<div style={{color:col,fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{c.title}</div>}
            {c.department&&<div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:1}}>{c.department}</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0,paddingRight:14}}>
          <GBtn onClick={()=>onEdit(c)} color={C1} small>✎</GBtn>
          <GBtn onClick={()=>onDel(c._id)} color={RED} small>✕</GBtn>
        </div>
      </div>
      {/* Contact details */}
      <div style={{display:"flex",flexDirection:"column",gap:6,borderTop:`1px solid ${col}18`,paddingTop:12}}>
        {c.email&&<a href={`mailto:${c.email}`} style={{display:"flex",alignItems:"center",gap:8,color:C5,fontSize:12,textDecoration:"none"}}><span style={{color:col,fontSize:13,width:16,textAlign:"center"}}>✉</span>{c.email}</a>}
        {c.phone&&<div style={{display:"flex",alignItems:"center",gap:8,color:C5,fontSize:12}}><span style={{color:col,fontSize:13,width:16,textAlign:"center"}}>☎</span>{c.phone}</div>}
        {c.managerName&&<div style={{display:"flex",alignItems:"center",gap:8,color:C5,fontSize:12}}><span style={{color:"rgba(255,255,255,0.3)",fontSize:11,width:16,textAlign:"center"}}>↑</span>Reports to: <span style={{color:"rgba(255,255,255,0.7)",marginLeft:2}}>{c.managerName}</span></div>}
      </div>
      {/* Certifications */}
      {certs.length>0&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {certs.map(cert=>(
            <span key={cert} style={{fontSize:10,padding:"3px 8px",background:"rgba(0,210,255,0.1)",border:"1px solid rgba(0,210,255,0.3)",borderRadius:6,color:C1,fontWeight:600}}>🎓 {cert}</span>
          ))}
        </div>
      )}
      {c.contactOwner&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 10px",background:`${C3}0d`,border:`1px solid ${C3}28`,borderRadius:8}}><div style={{width:5,height:5,borderRadius:"50%",background:C3}}/><span style={{fontSize:11,color:C3,fontWeight:600}}>Owner: {c.contactOwner}</span></div>}

      {/* Comments section */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:10}}>
        <button onClick={()=>setShowComments(p=>!p)}
          style={{display:"flex",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",color:comments.length>0?C1:C5,fontSize:12,padding:0,fontWeight:comments.length>0?600:400}}>
          <span style={{fontSize:14}}>💬</span>
          <span>{comments.length>0?`${comments.length} comment${comments.length!==1?"s":""}` : "Add comment"}</span>
          <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.3)"}}>{showComments?"▲":"▼"}</span>
        </button>

        {showComments&&(
          <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
            {/* Existing comments */}
            {comments.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:180,overflowY:"auto"}}>
                {[...comments].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(cm=>(
                  <div key={cm._id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"9px 11px",position:"relative"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:5}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        {cm.addedBy&&<span style={{fontSize:11,color:col,fontWeight:600}}>{cm.addedBy}</span>}
                        <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{fmtDate(cm.createdAt)}</span>
                      </div>
                      <button onClick={()=>delComment(cm._id)}
                        style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,107,107,0.5)",fontSize:12,padding:0,lineHeight:1,flexShrink:0}}
                        title="Delete comment">✕</button>
                    </div>
                    <div style={{color:"rgba(255,255,255,0.8)",fontSize:12,lineHeight:1.5}}>{cm.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new comment */}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <input value={addedBy} onChange={e=>setAddedBy(e.target.value)} placeholder="Your name (optional)"
                style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"6px 10px",color:"#fff",fontSize:11,outline:"none"}}/>
              <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Write a comment…" rows={2}
                onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))addComment();}}
                style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"7px 10px",color:"#fff",fontSize:12,outline:"none",resize:"none",fontFamily:"inherit"}}/>
              <button onClick={addComment} disabled={saving||!newComment.trim()}
                style={{alignSelf:"flex-end",padding:"6px 14px",background:newComment.trim()?"linear-gradient(135deg,#00ED64,#00684A)":"rgba(255,255,255,0.07)",border:"none",borderRadius:7,color:newComment.trim()?"#fff":"rgba(255,255,255,0.3)",fontWeight:600,fontSize:12,cursor:newComment.trim()?"pointer":"default"}}>
                {saving?"Saving…":"Add Comment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChampionsTab(){
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(CE);
  const [activePartner,setActivePartner]=useState(null);
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{setData(await(await fetch(`${API_BASE}/api/champions`)).json());}catch{setError("Could not load");}finally{setLoading(false);}}
  function openAdd(){setForm(activePartner?{...CE,partner:activePartner}:CE);setEditing(null);setShowForm(true);setError("");}
  function openEdit(c){setForm({...c});setEditing(c._id);setShowForm(true);setError("");}
  async function save(){
    if(!form.partner||!form.contactName){setError("Partner and Contact Name required");return;}
    try{const r=await fetch(editing?`${API_BASE}/api/champions/${editing}`:`${API_BASE}/api/champions`,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});if(!r.ok)throw new Error("Save failed");await load();setShowForm(false);}catch(e){setError(e.message);}
  }
  async function del(id){if(!window.confirm("Delete this champion?"))return;await fetch(`${API_BASE}/api/champions/${id}`,{method:"DELETE"});load();}
  function onUpdate(updated){setData(prev=>prev.map(c=>c._id===updated._id?updated:c));}
  const set=k=>v=>setForm(p=>({...p,[k]:v}));
  const displayed=data.filter(c=>!activePartner||c.partner===activePartner).filter(c=>!search||[c.contactName,c.title,c.email,c.department].join(" ").toLowerCase().includes(search.toLowerCase()));
  const grouped={};for(const c of displayed){if(!grouped[c.partner])grouped[c.partner]=[];grouped[c.partner].push(c);}

  return(
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <PartnerSidebar data={data} keyFn={c=>c.partner} activePartner={activePartner} setActivePartner={setActivePartner}/>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,padding:"18px 22px",overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <div style={{flex:1}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,fontFamily:"'Syne',sans-serif"}}>{activePartner?"Champions — "+activePartner:"All Champions"}</h2>
              <div style={{color:C5,fontSize:12,marginTop:2}}>{displayed.length} contact{displayed.length!==1?"s":""}</div>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts…" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"7px 12px",color:"#fff",fontSize:12,outline:"none",width:180}}/>
            <label style={{padding:"8px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:C5,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>📤 Upload CSV<input type="file" accept=".csv" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const fd=new FormData();fd.append("file",f);const r=await fetch(`${API_BASE}/api/champions/upload`,{method:"POST",body:fd});const d=await r.json();if(d.success){await load();setError("");}else setError(d.error||"Upload failed");e.target.value="";}}/>
            </label>
            <PBtn onClick={openAdd}>+ Add Champion</PBtn>
          </div>
          {error&&<div style={{padding:"8px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:12,marginBottom:14}}>{error}</div>}
          {loading&&<div style={{color:C5,padding:20}}>Loading...</div>}
          {!loading&&displayed.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C5}}><div style={{fontSize:40,marginBottom:12}}>★</div><div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:6}}>No champions yet</div><div style={{fontSize:13,marginBottom:20}}>Add contacts for {activePartner||"your partners"}</div><PBtn onClick={openAdd}>+ Add Champion</PBtn></div>}
          {!loading&&(activePartner
            ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>{displayed.map(c=><ChampCard key={c._id} c={c} col={pColor(c.partner)} onEdit={openEdit} onDel={del} onUpdate={onUpdate}/>)}</div>
            :Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([partner,contacts])=>{
              const col=pColor(partner);
              return(
                <div key={partner} style={{marginBottom:28}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${col}cc,${col})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{partner.slice(0,2).toUpperCase()}</div>
                    <span style={{color:"#fff",fontWeight:700,fontSize:15}}>{partner}</span>
                    <span style={{color:C5,fontSize:12}}>· {contacts.length} contact{contacts.length!==1?"s":""}</span>
                    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${col}40,transparent)`}}/>
                    <button onClick={()=>setActivePartner(partner)} style={{background:"transparent",border:`1px solid ${col}40`,borderRadius:7,padding:"4px 10px",color:col,fontSize:11,cursor:"pointer"}}>View all →</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:12}}>{contacts.map(c=><ChampCard key={c._id} c={c} col={col} onEdit={openEdit} onDel={del} onUpdate={onUpdate}/>)}</div>
                </div>
              );
            })
          )}
        </div>
        {showForm&&(
          <div style={{width:355,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,15,25,0.98)",padding:"18px 20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:13}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 style={{margin:0,fontFamily:"'Syne',sans-serif",fontSize:16}}>{editing?"Edit Champion":"Add Champion"}</h3>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",color:C5,fontSize:18,cursor:"pointer"}}>✕</button>
            </div>
            {error&&<div style={{padding:"7px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:7,color:RED,fontSize:12}}>{error}</div>}
            <Field label="Partner *"><Sel value={form.partner} onChange={set("partner")} options={PARTNERS}/></Field>
            <Field label="Contact Name *"><Inp value={form.contactName} onChange={set("contactName")} placeholder="Full name"/></Field>
            <Field label="Title"><Inp value={form.title} onChange={set("title")} placeholder="e.g. Alliance Director"/></Field>
            <Field label="Department"><Inp value={form.department} onChange={set("department")} placeholder="e.g. Partnerships"/></Field>
            <Field label="Manager Name"><Inp value={form.managerName} onChange={set("managerName")} placeholder="Direct manager"/></Field>
            <Field label="Email"><Inp value={form.email} onChange={set("email")} type="email" placeholder="email@co.com"/></Field>
            <Field label="Phone"><Inp value={form.phone} onChange={set("phone")} placeholder="+91 ..."/></Field>
            <Field label="Contact Owner"><Sel value={form.contactOwner} onChange={set("contactOwner")} options={MEMBERS}/></Field>
            {/* Champion Status */}
            <Field label="Champion Status">
              <div style={{display:"flex",gap:8}}>
                {Object.entries(CHAMP_STATUS).filter(([k])=>k!=="none").map(([k,v])=>(
                  <button key={k} onClick={()=>set("championStatus")(k)}
                    style={{flex:1,padding:"8px 6px",borderRadius:8,cursor:"pointer",border:`2px solid ${form.championStatus===k?v.color:"rgba(255,255,255,0.12)"}`,background:form.championStatus===k?`${v.color}18`:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all 0.15s"}}>
                    <div style={{width:12,height:12,borderRadius:"50%",background:v.color,boxShadow:form.championStatus===k?`0 0 8px ${v.color}`:"none"}}/>
                    <span style={{fontSize:9,color:form.championStatus===k?v.color:C5,textAlign:"center",lineHeight:1.3}}>{v.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            {/* Certifications */}
            <Field label="Certifications">
              <div style={{display:"flex",gap:8}}>
                {CERTS.map(cert=>{
                  const has=(form.certifications||[]).includes(cert);
                  return(
                    <button key={cert} onClick={()=>{
                      const cur=form.certifications||[];
                      set("certifications")(has?cur.filter(c=>c!==cert):[...cur,cert]);
                    }} style={{flex:1,padding:"8px 6px",borderRadius:8,cursor:"pointer",border:`1px solid ${has?"rgba(0,210,255,0.5)":"rgba(255,255,255,0.12)"}`,background:has?"rgba(0,210,255,0.1)":"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontSize:16}}>{has?"🎓":"○"}</span>
                      <span style={{fontSize:9,color:has?C1:C5,textAlign:"center",lineHeight:1.3}}>{cert}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
            <div style={{display:"flex",gap:8,paddingTop:4}}><PBtn onClick={save}>{editing?"Save Changes":"Add Champion"}</PBtn><GBtn onClick={()=>setShowForm(false)}>Cancel</GBtn></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WORKSTREAMS ──────────────────────────────────────────────
const WE={partnerName:"",workstream:"",relatedJointAssets:"",jointValueProp:"",executiveSponsor:"",scalableReplicable:"No",smartGoals:"",idealCustomerProfile:"",narrGenerated:0,opportunitiesClosed:0,accounts:"",pipelineNarr:0,opportunitiesPipe:0,pipelineAccounts:"",dri:"",status:"Active"};

function StrategyBlock({label,value,col}){
  if(!value)return null;
  return(
    <div>
      <div style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{label}</div>
      <div style={{color:"rgba(255,255,255,0.85)",fontSize:13,lineHeight:1.65,background:"rgba(255,255,255,0.03)",border:`1px solid ${col}18`,borderRadius:10,padding:"12px 14px"}}>{value}</div>
    </div>
  );
}

function WSDetailPanel({w,onEdit,onClose}){
  const col=pColor(w.partnerName);
  const sc=STATUS_COLOR[w.status]||C5;
  const total=(+w.narrGenerated||0)+(+w.pipelineNarr||0);
  const narrPct=total>0?Math.round((w.narrGenerated/total)*100):0;
  return(
    <div style={{width:400,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.09)",background:"rgba(0,12,22,0.98)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"18px 20px 16px",flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{height:4,borderRadius:2,background:`linear-gradient(90deg,${col},${col}44,transparent)`,marginBottom:16}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{flex:1,minWidth:0,paddingRight:12}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}>
              <Pill label={w.status} color={sc}/>
              {w.scalableReplicable==="Yes"&&<Pill label="✦ Scalable" color={C3}/>}
            </div>
            <div style={{color:"#fff",fontWeight:800,fontSize:17,lineHeight:1.3,marginBottom:6}}>{w.workstream}</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:7,height:7,borderRadius:2,background:col}}/>
              <span style={{color:col,fontWeight:600,fontSize:13}}>{w.partnerName}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <GBtn onClick={()=>onEdit(w)} color={C1} small>✎ Edit</GBtn>
            <button onClick={onClose} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,color:C5,fontSize:16,cursor:"pointer",padding:"4px 8px",lineHeight:1}}>✕</button>
          </div>
        </div>
        {(w.dri||w.executiveSponsor)&&(
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {w.dri&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C3}}/><span style={{color:"rgba(255,255,255,0.4)",fontSize:10}}>DRI</span><span style={{color:"#fff",fontSize:12,fontWeight:600}}>{w.dri}</span>
            </div>}
            {w.executiveSponsor&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C1}}/><span style={{color:"rgba(255,255,255,0.4)",fontSize:10}}>Sponsor</span><span style={{color:"#fff",fontSize:12,fontWeight:600}}>{w.executiveSponsor}</span>
            </div>}
          </div>
        )}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:6}}>
            <span>NARR Closed {narrPct}%</span><span>Total {fmt(total)}</span>
          </div>
          <div style={{height:7,borderRadius:4,background:"rgba(255,255,255,0.07)",overflow:"hidden",display:"flex",gap:1}}>
            <div style={{width:`${narrPct}%`,background:`linear-gradient(90deg,${col},${col}bb)`,borderRadius:4,minWidth:narrPct>0?4:0,transition:"width 0.4s"}}/>
            <div style={{flex:1,background:`${C3}33`,borderRadius:4}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{background:`${col}0d`,border:`1px solid ${col}28`,borderRadius:12,padding:"13px 14px"}}>
            <div style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>NARR Generated</div>
            <div style={{color:col,fontWeight:800,fontSize:20,lineHeight:1}}>{fmt(w.narrGenerated)}</div>
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:10,marginTop:4}}>{w.opportunitiesClosed||0} closed opps</div>
          </div>
          <div style={{background:`${C3}0d`,border:`1px solid ${C3}28`,borderRadius:12,padding:"13px 14px"}}>
            <div style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:5}}>Pipeline NARR</div>
            <div style={{color:C3,fontWeight:800,fontSize:20,lineHeight:1}}>{fmt(w.pipelineNarr)}</div>
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:10,marginTop:4}}>{w.opportunitiesPipe||0} in pipeline</div>
          </div>
        </div>
        {(w.accounts||w.pipelineAccounts)&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {w.accounts&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"10px 12px"}}><div style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Accounts</div><div style={{color:"#fff",fontSize:12}}>{w.accounts}</div></div>}
            {w.pipelineAccounts&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"10px 12px"}}><div style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Pipeline Accts</div><div style={{color:"#fff",fontSize:12}}>{w.pipelineAccounts}</div></div>}
          </div>
        )}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
        <StrategyBlock label="Joint Value Proposition" value={w.jointValueProp} col={col}/>
        <StrategyBlock label="SMART Goals" value={w.smartGoals} col={col}/>
        <StrategyBlock label="Ideal Customer Profile" value={w.idealCustomerProfile} col={col}/>
        <StrategyBlock label="Related Joint Assets" value={w.relatedJointAssets} col={col}/>
      </div>
    </div>
  );
}

export function WorkstreamsTab(){
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(WE);
  const [activePartner,setActivePartner]=useState(null);
  const [filterStatus,setFilterStatus]=useState("");
  const [selected,setSelected]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{const d=await(await fetch(`${API_BASE}/api/workstreams`)).json();setData(d);}catch{setError("Could not load");}finally{setLoading(false);}}
  useEffect(()=>{if(selected)setSelected(data.find(w=>w._id===selected._id)||null);},[data]);
  function openAdd(){setForm(activePartner?{...WE,partnerName:activePartner}:WE);setEditing(null);setShowForm(true);setSelected(null);setError("");}
  function openEdit(w){setForm({...w});setEditing(w._id);setShowForm(true);setSelected(null);setError("");}
  async function save(){
    if(!form.partnerName||!form.workstream){setError("Partner and Workstream name required");return;}
    try{const r=await fetch(editing?`${API_BASE}/api/workstreams/${editing}`:`${API_BASE}/api/workstreams`,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});if(!r.ok)throw new Error("Save failed");await load();setShowForm(false);}catch(e){setError(e.message);}
  }
  async function del(id){if(!window.confirm("Delete this workstream?"))return;await fetch(`${API_BASE}/api/workstreams/${id}`,{method:"DELETE"});if(selected?._id===id)setSelected(null);load();}
  const set=k=>v=>setForm(p=>({...p,[k]:v}));
  const filtered=data.filter(w=>!activePartner||w.partnerName===activePartner).filter(w=>!filterStatus||w.status===filterStatus);
  const totalNarr=filtered.reduce((s,w)=>s+(+w.narrGenerated||0),0);
  const totalPipe=filtered.reduce((s,w)=>s+(+w.pipelineNarr||0),0);
  const WS_COLS="28px 1fr 90px 90px 80px 80px 80px 60px";

  return(
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <PartnerSidebar data={data} keyFn={w=>w.partnerName} activePartner={activePartner} setActivePartner={p=>{setActivePartner(p);setSelected(null);}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Top bar */}
        <div style={{padding:"13px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff"}}>{activePartner?"Workstreams — "+activePartner:"All Workstreams"}</div>
            <div style={{color:C5,fontSize:12,marginTop:1}}>{filtered.length} program{filtered.length!==1?"s":""}</div>
          </div>
          {data.length>0&&<>
            {[{l:"Active",v:filtered.filter(w=>w.status==="Active").length,c:C1},{l:"On Hold",v:filtered.filter(w=>w.status==="On Hold").length,c:C3},{l:"Inactive",v:filtered.filter(w=>w.status==="Inactive").length,c:RED}].map(s=>(
              <div key={s.l} style={{padding:"5px 11px",background:`${s.c}12`,border:`1px solid ${s.c}30`,borderRadius:8,fontSize:12,display:"flex",gap:5,alignItems:"center"}}>
                <span style={{color:s.c,fontWeight:800}}>{s.v}</span><span style={{color:C5}}>{s.l}</span>
              </div>
            ))}
            <div style={{width:1,height:20,background:"rgba(255,255,255,0.1)"}}/>
            <div style={{padding:"5px 11px",background:"rgba(0,210,255,0.08)",border:"1px solid rgba(0,210,255,0.25)",borderRadius:8,fontSize:12}}>
              <span style={{color:C1,fontWeight:700}}>{fmt(totalNarr)}</span><span style={{color:C5,marginLeft:5}}>NARR</span>
            </div>
            <div style={{padding:"5px 11px",background:"rgba(233,255,153,0.08)",border:"1px solid rgba(233,255,153,0.25)",borderRadius:8,fontSize:12}}>
              <span style={{color:C3,fontWeight:700}}>{fmt(totalPipe)}</span><span style={{color:C5,marginLeft:5}}>Pipeline</span>
            </div>
          </>}
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"7px 11px",color:"#fff",fontSize:12,cursor:"pointer"}}>
            <option value="">All Statuses</option>
            {["Active","Inactive","On Hold"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{padding:"7px 13px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:C5,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>📤 Upload CSV<input type="file" accept=".csv" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const fd=new FormData();fd.append("file",f);const r=await fetch(`${API_BASE}/api/workstreams/upload`,{method:"POST",body:fd});const d=await r.json();if(d.success){await load();setError("");}else setError(d.error||"Upload failed");e.target.value="";}}/>
          </label>
          <PBtn onClick={openAdd} small>+ Add</PBtn>
        </div>

        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto"}}>
            {error&&<div style={{margin:"12px 20px",padding:"8px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:12}}>{error}</div>}
            {loading&&<div style={{color:C5,padding:30,textAlign:"center"}}>Loading...</div>}
            {!loading&&filtered.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C5}}><div style={{fontSize:40,marginBottom:12}}>⬡</div><div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:6}}>No workstreams yet</div><div style={{fontSize:13,marginBottom:20}}>Add your first partner program</div><PBtn onClick={openAdd}>+ Add Workstream</PBtn></div>}
            {!loading&&filtered.length>0&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:WS_COLS,gap:8,padding:"8px 20px",background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)",position:"sticky",top:0,zIndex:2}}>
                  <span/><span style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.08em"}}>Workstream</span><span style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.08em"}}>NARR Gen.</span><span style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.08em"}}>Pipeline</span><span style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span><span style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.08em"}}>DRI</span><span style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.08em"}}>Partner</span><span/>
                </div>
                {(activePartner?[[activePartner,filtered]]:Object.entries(filtered.reduce((m,w)=>{if(!m[w.partnerName])m[w.partnerName]=[];m[w.partnerName].push(w);return m;},{})).sort(([a],[b])=>a.localeCompare(b))).map(([partner,ws])=>{
                  const col=pColor(partner);
                  return(
                    <div key={partner}>
                      {!activePartner&&(
                        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 20px 5px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{width:6,height:6,borderRadius:2,background:col}}/><span style={{color:col,fontWeight:700,fontSize:12}}>{partner}</span><span style={{color:C5,fontSize:11}}>· {ws.length}</span>
                          <div style={{flex:1,height:1,background:`linear-gradient(90deg,${col}30,transparent)`}}/>
                          <span style={{color:col,fontSize:11,fontWeight:600}}>{fmt(ws.reduce((s,w)=>s+(+w.narrGenerated||0),0))}</span><span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>NARR</span>
                          <span style={{color:C3,fontSize:11,fontWeight:600}}>{fmt(ws.reduce((s,w)=>s+(+w.pipelineNarr||0),0))}</span><span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>Pipeline</span>
                        </div>
                      )}
                      {ws.map(w=>{
                        const isSel=selected?._id===w._id;
                        const sc=STATUS_COLOR[w.status]||C5;
                        return(
                          <div key={w._id} onClick={()=>setSelected(isSel?null:w)}
                            style={{display:"grid",gridTemplateColumns:WS_COLS,gap:8,alignItems:"center",padding:"11px 20px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",background:isSel?`${col}0d`:"transparent",transition:"background 0.15s",borderLeft:isSel?`3px solid ${col}`:"3px solid transparent"}}>
                            <div style={{width:9,height:9,borderRadius:3,background:isSel?col:`${col}44`,transition:"background 0.15s",flexShrink:0}}/>
                            <div style={{minWidth:0}}>
                              <div style={{color:"#fff",fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.workstream}</div>
                              {w.scalableReplicable==="Yes"&&<span style={{fontSize:10,color:C3}}>✦ Scalable</span>}
                            </div>
                            <div>
                              <div style={{color:col,fontWeight:700,fontSize:13}}>{fmt(w.narrGenerated)}</div>
                              <div style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>{w.opportunitiesClosed||0} opps</div>
                            </div>
                            <div>
                              <div style={{color:C3,fontWeight:700,fontSize:13}}>{fmt(w.pipelineNarr)}</div>
                              <div style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>{w.opportunitiesPipe||0} opps</div>
                            </div>
                            <Pill label={w.status} color={sc}/>
                            <div style={{color:C5,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.dri||"—"}</div>
                            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:1,background:col,flexShrink:0}}/><span style={{color:C5,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.partnerName}</span></div>
                            <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                              <GBtn onClick={()=>openEdit(w)} color={C1} small>✎</GBtn>
                              <GBtn onClick={()=>del(w._id)} color={RED} small>✕</GBtn>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <div style={{padding:"9px 20px",color:C5,fontSize:11,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:16}}>
                  <span>{filtered.length} workstreams</span>
                  <span style={{color:C1}}>NARR: {fmt(totalNarr)}</span>
                  <span style={{color:C3}}>Pipeline: {fmt(totalPipe)}</span>
                </div>
              </>
            )}
          </div>

          {selected&&!showForm&&<WSDetailPanel w={selected} onEdit={openEdit} onClose={()=>setSelected(null)}/>}

          {showForm&&(
            <div style={{width:400,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,15,25,0.98)",padding:"18px 20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:13}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h3 style={{margin:0,fontFamily:"'Syne',sans-serif",fontSize:16}}>{editing?"Edit Workstream":"Add Workstream"}</h3>
                <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",color:C5,fontSize:18,cursor:"pointer"}}>✕</button>
              </div>
              {error&&<div style={{padding:"7px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:7,color:RED,fontSize:12}}>{error}</div>}
              <div style={{fontSize:9,color:C1,textTransform:"uppercase",letterSpacing:"0.1em"}}>Core Info</div>
              <Field label="Partner *"><Sel value={form.partnerName} onChange={set("partnerName")} options={PARTNERS}/></Field>
              <Field label="Workstream Name *"><Inp value={form.workstream} onChange={set("workstream")} placeholder="e.g. Joint GTM for Banking"/></Field>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="Status"><Sel value={form.status} onChange={set("status")} options={["Active","Inactive","On Hold"]}/></Field>
                <Field label="Scalable?"><Sel value={form.scalableReplicable} onChange={set("scalableReplicable")} options={["Yes","No"]}/></Field>
              </div>
              <Field label="DRI / Owner"><Sel value={form.dri} onChange={set("dri")} options={MEMBERS}/></Field>
              <Field label="Executive Sponsor"><Inp value={form.executiveSponsor} onChange={set("executiveSponsor")} placeholder="Name"/></Field>
              <div style={{fontSize:9,color:C1,textTransform:"uppercase",letterSpacing:"0.1em"}}>Strategy</div>
              <Field label="Joint Value Proposition"><Textarea value={form.jointValueProp} onChange={set("jointValueProp")} placeholder="What value do we jointly deliver?"/></Field>
              <Field label="SMART Goals"><Textarea value={form.smartGoals} onChange={set("smartGoals")} placeholder="Specific, measurable goals..."/></Field>
              <Field label="Ideal Customer Profile"><Textarea value={form.idealCustomerProfile} onChange={set("idealCustomerProfile")} placeholder="Target customer..."/></Field>
              <Field label="Related Joint Assets"><Textarea value={form.relatedJointAssets} onChange={set("relatedJointAssets")} placeholder="Assets, collateral..."/></Field>
              <div style={{fontSize:9,color:C1,textTransform:"uppercase",letterSpacing:"0.1em"}}>Metrics</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="NARR Generated ($)"><Inp value={form.narrGenerated} onChange={v=>set("narrGenerated")(+v||0)} type="number"/></Field>
                <Field label="Closed Opps"><Inp value={form.opportunitiesClosed} onChange={v=>set("opportunitiesClosed")(+v||0)} type="number"/></Field>
                <Field label="Accounts"><Inp value={form.accounts} onChange={set("accounts")} placeholder="Account names"/></Field>
                <Field label="Pipeline NARR ($)"><Inp value={form.pipelineNarr} onChange={v=>set("pipelineNarr")(+v||0)} type="number"/></Field>
                <Field label="Pipeline Opps"><Inp value={form.opportunitiesPipe} onChange={v=>set("opportunitiesPipe")(+v||0)} type="number"/></Field>
                <Field label="Pipeline Accounts"><Inp value={form.pipelineAccounts} onChange={set("pipelineAccounts")} placeholder="Account names"/></Field>
              </div>
              <div style={{display:"flex",gap:8,paddingTop:4}}><PBtn onClick={save}>{editing?"Save Changes":"Add Workstream"}</PBtn><GBtn onClick={()=>setShowForm(false)}>Cancel</GBtn></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// ACTIVITIES
// ════════════════════════════════════════════════════════════════
const ACT_PARTNERS=[...["Infosys","EY","Wipro","Accenture","Tech Mahindra","TCS","Hexaware","Capgemini","Cognizant","LTIM"],"Other"];
const ACT_OWNERS=["Deepak M","Sampat B","Iman R","Meena M","Shivani T","Sneha D","Rashmi N","Vikas S","Ashutosh B","Prasad P","Haim R"];
const ACT_REGIONS=["APAC","AMER","LATAM","EU","ME","Africa"];
const ACT_PRIORITIES=["P1","P2","P3"];
const ACT_CATEGORIES=["Workstream","Champion Building","Opportunity","PDM","Event Planning"];
const ACT_STATUSES=["Open","In Progress","Done","Blocked"];
const ACT_IMPACTS=["High","Medium","Low"];
const PRIORITY_COLOR={"P1":"#ef4444","P2":"#f59e0b","P3":"#22c55e"};
const IMPACT_COLOR={"High":"#ef4444","Medium":"#f59e0b","Low":"#22c55e"};
const ACT_STATUS_COL={"Open":C1,"In Progress":C3,"Done":"#22c55e","Blocked":"#ef4444"};

function toDateInput(d){if(!d)return"";return new Date(d).toISOString().split("T")[0];}
function fmtDate(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});}
function fmtRev(n){if(!n&&n!==0)return"";if(Math.abs(n)>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(Math.abs(n)>=1e3)return`$${(n/1e3).toFixed(0)}K`;return`$${n}`;}

// Count working days (Mon–Fri) between two dates
function workingDaysSince(dateStr){
  if(!dateStr)return999;
  const from=new Date(dateStr);from.setHours(0,0,0,0);
  const to=new Date();to.setHours(0,0,0,0);
  if(isNaN(from))return999;
  let days=0,cur=new Date(from);
  while(cur<to){cur.setDate(cur.getDate()+1);const d=cur.getDay();if(d!==0&&d!==6)days++;}
  return days;
}

// Returns true if the activity is stale and should be highlighted
function isStale(a){
  if(a.status==="Done")return false; // archived — don't flag
  const days=workingDaysSince(a.updateDate||a.activityDate);
  return a.impact==="High" ? days>=3 : days>=5;
}

const AE={partner:"",partnerCustom:"",owner:"",region:"",priority:"P2",activityDate:toDateInput(new Date()),category:"",department:"",regionalPartnerManager:"",description:"",impact:"",revenueImpact:"",status:"Open",docLinks:[]};

export function ActivitiesTab(){
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(AE);
  const [filters,setFilters]=useState({partner:"",owner:"",priority:"",category:""});
  const [sort,setSort]=useState({key:"activityDate",dir:"desc"});
  const [viewTab,setViewTab]=useState("active"); // "active" | "archived"
  const [error,setError]=useState("");
  const [uploading,setUploading]=useState(false);

  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{setData(await(await fetch(`${API_BASE}/api/activities`)).json());}catch{setError("Could not load");}finally{setLoading(false);}}
  useEffect(()=>{if(selected)setSelected(data.find(a=>a._id===selected._id)||null);},[data]);

  function openAdd(){setForm({...AE,activityDate:toDateInput(new Date())});setEditing(null);setShowForm(true);setSelected(null);setError("");}
  function openEdit(a){setForm({...a,activityDate:toDateInput(a.activityDate),revenueImpact:a.revenueImpact??"",docLinks:a.docLinks||[]});setEditing(a._id);setShowForm(true);setSelected(null);setError("");}

  async function save(){
    if(!form.partner||!form.owner){setError("Partner and Owner are required");return;}
    if(form.partner==="Other"&&!form.partnerCustom){setError("Please enter the partner name");return;}
    const body={...form,revenueImpact:form.revenueImpact?+form.revenueImpact:null};
    try{
      const url=editing?`${API_BASE}/api/activities/${editing}`:`${API_BASE}/api/activities`;
      const r=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok)throw new Error("Save failed");
      await load();setShowForm(false);setError("");
    }catch(e){setError(e.message);}
  }

  async function del(id){
    if(!window.confirm("Delete this activity?"))return;
    await fetch(`${API_BASE}/api/activities/${id}`,{method:"DELETE"});
    if(selected?._id===id)setSelected(null);
    load();
  }

  async function uploadCSV(file){
    setUploading(true);
    try{
      const text=await file.text();

      // Proper CSV parser that handles quoted fields containing commas and newlines
      const parseCSVRows=str=>{
        const rows=[];let cur=[],field="",inQ=false;
        for(let i=0;i<str.length;i++){
          const c=str[i],n=str[i+1];
          if(inQ){if(c==='"'&&n==='"'){field+='"';i++;}else if(c==='"'){inQ=false;}else{field+=c;}}
          else if(c==='"'){inQ=true;}
          else if(c===','){cur.push(field.trim());field="";}
          else if(c==='\r'&&n==='\n'){cur.push(field.trim());if(cur.some(v=>v))rows.push(cur);cur=[];field="";i++;}
          else if(c==='\n'){cur.push(field.trim());if(cur.some(v=>v))rows.push(cur);cur=[];field="";}
          else{field+=c;}
        }
        if(field||cur.length){cur.push(field.trim());if(cur.some(v=>v))rows.push(cur);}
        return rows;
      };

      const rows=parseCSVRows(text);
      if(rows.length<2){setError("CSV must have a header row and data rows");setUploading(false);return;}

      // Build col index map — normalise header by collapsing whitespace (handles "\nImpact", "Primary Owner" etc)
      const colIdx={};
      rows[0].forEach((h,i)=>{
        const norm=h.replace(/\s+/g," ").trim().toLowerCase();
        colIdx[norm]=i;
      });

      // Get a cell value by trying multiple possible header names
      const get=(row,...keys)=>{
        for(const k of keys){
          const i=colIdx[k.toLowerCase()];
          if(i!=null)return(row[i]||"").trim();
        }
        return"";
      };

      // Normalise region — map free-text to enum
      const regionMap={"north america":"AMER","amer":"AMER","americas":"AMER","us":"AMER","usa":"AMER","canada":"AMER","apac":"APAC","asia pacific":"APAC","asia":"APAC","india":"APAC","australia":"APAC","singapore":"APAC","japan":"APAC","latam":"LATAM","latin america":"LATAM","brazil":"LATAM","mexico":"LATAM","europe":"EU","eu":"EU","emea":"EU","uk":"EU","germany":"EU","france":"EU","middle east":"ME","me":"ME","uae":"ME","saudi":"ME","africa":"Africa"};
      const mapRegion=r=>{const k=(r||"").trim().toLowerCase();return regionMap[k]||ACT_REGIONS.find(x=>k.includes(x.toLowerCase()))||"";};

      // Fuzzy match owner names — "Deepak" → "Deepak M"
      const ownerMap={"deepak":"Deepak M","deepak m":"Deepak M","deepak mirchandani":"Deepak M","sampat":"Sampat B","sampat b":"Sampat B","iman":"Iman R","iman r":"Iman R","iman roy":"Iman R","meena":"Meena M","meena m":"Meena M","shivani":"Shivani T","shivani t":"Shivani T","sneha":"Sneha D","sneha d":"Sneha D","rashmi":"Rashmi N","rashmi n":"Rashmi N","vikas":"Vikas S","vikas s":"Vikas S","ashutosh":"Ashutosh B","ashutosh b":"Ashutosh B","prasad":"Prasad P","prasad p":"Prasad P","haim":"Haim R","haim r":"Haim R"};
      const mapOwner=o=>{const k=(o||"").trim().toLowerCase();return ownerMap[k]||ACT_OWNERS.find(x=>x.toLowerCase().startsWith(k))||o||"Sampat B";};

      // Normalise status — handles typo "Satus", empty → Open
      const mapStatus=s=>{const k=(s||"").trim().toLowerCase();if(!k||k==="open")return"Open";if(k.includes("progress"))return"In Progress";if(k==="done"||k==="closed"||k==="complete"||k==="completed")return"Done";if(k==="blocked"||k.includes("hold"))return"Blocked";return"Open";};

      // Map Vertical/category free text to our enum
      const catMap={"workstream":"Workstream","champion building":"Champion Building","champion":"Champion Building","opportunity":"Opportunity","opp":"Opportunity","pdm":"PDM","event planning":"Event Planning","event":"Event Planning","financial services":"Opportunity","banking":"Opportunity","retail":"Opportunity","healthcare":"Opportunity","manufacturing":"Opportunity","technology":"Opportunity","insurance":"Opportunity"};
      const mapCategory=v=>{const k=(v||"").trim().toLowerCase();return catMap[k]||ACT_CATEGORIES.find(x=>x.toLowerCase()===k)||"";};

      // Doc links — plain text (newline-separated names, no URL yet)
      const parseDocLinks=raw=>{
        if(!raw)return[];
        return raw.split(/\n/).map(s=>s.replace(/^\d+\.\s*/,"").trim()).filter(Boolean).slice(0,1).map(name=>({name,url:""}));
      };

      let created=0,failed=0;
      for(let i=1;i<rows.length;i++){
        const row=rows[i];
        const partner=get(row,"partner")||"";
        if(!partner){failed++;continue;}

        const ownerRaw=get(row,"primary owner","owner","assignee");
        const owner=mapOwner(ownerRaw);
        const revenueRaw=get(row,"revenue","revenue impact","revenueimpact");
        const dateRaw=get(row,"date","activity date","activitydate");
        const impactRaw=get(row,"\nimpact","impact","impact level");

        const body={
          partner:ACT_PARTNERS.includes(partner)?partner:"Other",
          partnerCustom:ACT_PARTNERS.includes(partner)?"":partner,
          owner,
          region:mapRegion(get(row,"region")),
          priority:ACT_PRIORITIES.includes(get(row,"priority"))?get(row,"priority"):"P2",
          status:mapStatus(get(row,"satus","status")),
          category:mapCategory(get(row,"vertical","category")),
          department:get(row,"account name","department","account"),
          regionalPartnerManager:get(row,"regional partner manager","rpm","regionalpartnermanager"),
          description:get(row,"description next steps","description","next steps"),
          impact:ACT_IMPACTS.includes(impactRaw)?impactRaw:"",
          revenueImpact:revenueRaw&&!isNaN(+revenueRaw)?+revenueRaw:null,
          activityDate:dateRaw?new Date(dateRaw).toISOString():new Date().toISOString(),
          docLinks:parseDocLinks(get(row,"doc links","doclinks")),
        };
        try{
          const r=await fetch(`${API_BASE}/api/activities`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
          if(r.ok)created++;else failed++;
        }catch{failed++;}
      }
      await load();
      setError(created===0?`No rows imported (${failed} skipped — Partner column may be empty)`:"");
    }finally{setUploading(false);}
  }

  const set=k=>v=>setForm(p=>({...p,[k]:v}));
  const setF=k=>v=>setFilters(p=>({...p,[k]:v}));

  // Split active vs archived
  const active=data.filter(a=>a.status!=="Done");
  const archived=data.filter(a=>a.status==="Done");
  const viewData=viewTab==="active"?active:archived;

  const filtered=viewData.filter(a=>{
    if(filters.partner&&a.partner!==filters.partner)return false;
    if(filters.owner&&a.owner!==filters.owner)return false;
    if(filters.priority&&a.priority!==filters.priority)return false;
    if(filters.category&&a.category!==filters.category)return false;
    return true;
  });

  const sorted=[...filtered].sort((a,b)=>{
    const d=sort.dir==="asc"?1:-1;
    if(sort.key==="activityDate"||sort.key==="updateDate")return d*(new Date(a[sort.key])-new Date(b[sort.key]));
    if(sort.key==="revenueImpact")return d*((a.revenueImpact||0)-(b.revenueImpact||0));
    return d*String(a[sort.key]||"").localeCompare(String(b[sort.key]||""));
  });

  function toggleSort(key){setSort(s=>s.key===key?{key,dir:s.dir==="asc"?"desc":"asc"}:{key,dir:"desc"});}
  function sarr(key){return sort.key===key?(sort.dir==="asc"?"▲":"▼"):"⇅";}

  const open=active.filter(a=>a.status==="Open").length;
  const inProg=active.filter(a=>a.status==="In Progress").length;
  const blocked=active.filter(a=>a.status==="Blocked").length;

  const COLS="22px 1fr 80px 60px 60px 80px 80px 60px 75px 75px 80px 110px 130px 56px";
  const HDR=[
    {k:"",noSort:true},{k:"partner",l:"Partner"},{k:"owner",l:"Owner"},{k:"region",l:"Region"},
    {k:"priority",l:"Pri."},{k:"status",l:"Status"},{k:"category",l:"Category"},{k:"impact",l:"Impact"},
    {k:"revenueImpact",l:"Revenue"},{k:"activityDate",l:"Date"},{k:"updateDate",l:"Updated"},
    {k:"description",l:"Description",noSort:true},{k:"docLinks",l:"Doc Links",noSort:true},{k:"",noSort:true},
  ];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* ── Top bar ── */}
      <div style={{padding:"11px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:140}}>
          <div style={{fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff"}}>Activities</div>
          <div style={{color:C5,fontSize:12,marginTop:1}}>{filtered.length} of {viewData.length}</div>
        </div>

        {/* Active / Archived toggle */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:3,gap:2}}>
          <button onClick={()=>{setViewTab("active");setSelected(null);setFilters(f=>({...f,status:""}));}}
            style={{padding:"5px 13px",borderRadius:7,border:"none",cursor:"pointer",background:viewTab==="active"?"linear-gradient(135deg,#00ED64,#00684A)":"transparent",color:viewTab==="active"?"#fff":C5,fontWeight:viewTab==="active"?700:400,fontSize:12}}>
            ◉ Active ({active.length})
          </button>
          <button onClick={()=>{setViewTab("archived");setSelected(null);setFilters(f=>({...f,status:""}));}}
            style={{padding:"5px 13px",borderRadius:7,border:"none",cursor:"pointer",background:viewTab==="archived"?"linear-gradient(135deg,#22c55e,#16a34a)":"transparent",color:viewTab==="archived"?"#fff":C5,fontWeight:viewTab==="archived"?700:400,fontSize:12}}>
            ✓ Archived ({archived.length})
          </button>
        </div>

        {/* Status pills — active tab only */}
        {viewTab==="active"&&[{l:"Open",v:open,c:C1},{l:"In Progress",v:inProg,c:C3},{l:"Blocked",v:blocked,c:"#ef4444"}].map(s=>(
          <div key={s.l} style={{padding:"4px 10px",background:`${s.c}12`,border:`1px solid ${s.c}30`,borderRadius:8,fontSize:11,display:"flex",gap:4,alignItems:"center"}}>
            <span style={{color:s.c,fontWeight:800}}>{s.v}</span><span style={{color:C5}}>{s.l}</span>
          </div>
        ))}

        <div style={{width:1,height:18,background:"rgba(255,255,255,0.1)",flexShrink:0}}/>

        {/* Filters */}
        {[
          {k:"partner",opts:["All Partners",...ACT_PARTNERS.filter(p=>p!=="Other")]},
          {k:"owner",opts:["All Owners",...ACT_OWNERS]},
          {k:"priority",opts:["All Priorities",...ACT_PRIORITIES]},
          {k:"category",opts:["All Categories",...ACT_CATEGORIES]},
        ].map(f=>(
          <select key={f.k} value={filters[f.k]} onChange={e=>setF(f.k)(f.opts.indexOf(e.target.value)===0?"":e.target.value)}
            style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"5px 9px",color:filters[f.k]?"#fff":C5,fontSize:11,cursor:"pointer"}}>
            {f.opts.map(o=><option key={o} value={o===f.opts[0]?"":o}>{o}</option>)}
          </select>
        ))}

        {/* CSV Upload */}
        <label style={{padding:"6px 12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:uploading?C3:C5,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>
          {uploading?"⏳ Uploading…":"📤 Upload CSV"}
          <input type="file" accept=".csv" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;await uploadCSV(f);e.target.value="";}}/>
        </label>

        {viewTab==="active"&&<PBtn onClick={openAdd} small>+ Add Activity</PBtn>}
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* ── Table ── */}
        <div style={{flex:1,overflowY:"auto"}}>
          {error&&<div style={{margin:"10px 20px",padding:"8px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:12}}>{error}</div>}
          {loading&&<div style={{color:C5,padding:30,textAlign:"center"}}>Loading...</div>}

          {/* Archived banner */}
          {!loading&&viewTab==="archived"&&(
            <div style={{margin:"10px 20px",padding:"10px 16px",background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>✓</span>
              <div>
                <div style={{color:"#22c55e",fontWeight:700,fontSize:13}}>Archived Activities</div>
                <div style={{color:C5,fontSize:11}}>Activities marked as Done are shown here. Edit to re-open.</div>
              </div>
            </div>
          )}

          {!loading&&sorted.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:C5}}>
              <div style={{fontSize:40,marginBottom:12}}>{viewTab==="archived"?"✓":"◉"}</div>
              <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:6}}>{viewTab==="archived"?"No archived activities":"No activities yet"}</div>
              <div style={{fontSize:13,marginBottom:20}}>{viewTab==="archived"?"Activities marked as Done will appear here":"Track partner activities, events and next steps"}</div>
              {viewTab==="active"&&<PBtn onClick={openAdd}>+ Add Activity</PBtn>}
            </div>
          )}

          {!loading&&sorted.length>0&&(
            <>
              {/* Sticky header */}
              <div style={{display:"grid",gridTemplateColumns:COLS,gap:6,padding:"8px 20px",background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)",position:"sticky",top:0,zIndex:2}}>
                {HDR.map((h,i)=>(
                  <div key={i} onClick={()=>!h.noSort&&toggleSort(h.k)}
                    style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",cursor:h.noSort?"default":"pointer",userSelect:"none",display:"flex",alignItems:"center",gap:3}}>
                    {h.l}{!h.noSort&&<span style={{color:sort.key===h.k?C1:"rgba(255,255,255,0.2)",fontSize:9}}>{sarr(h.k)}</span>}
                  </div>
                ))}
              </div>

              {sorted.map(a=>{
                const isSel=selected?._id===a._id;
                const partnerDisplay=a.partner==="Other"?a.partnerCustom||"Other":a.partner;
                const col=pColor(partnerDisplay);
                const pc=PRIORITY_COLOR[a.priority]||C5;
                const sc=ACT_STATUS_COL[a.status]||C5;
                const ic=IMPACT_COLOR[a.impact]||"transparent";
                const stale=isStale(a);
                const staleDays=workingDaysSince(a.updateDate||a.activityDate);
                const staleColor=a.impact==="High"?"#ef4444":"#f59e0b"; // red for High, amber for others
                return(
                  <div key={a._id} onClick={()=>setSelected(isSel?null:a)}
                    style={{display:"grid",gridTemplateColumns:COLS,gap:6,alignItems:"center",padding:"10px 20px",
                      borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",
                      background:isSel?`${col}0e`:stale?`${staleColor}10`:"transparent",
                      transition:"background 0.15s",
                      borderLeft:isSel?`3px solid ${col}`:stale?`3px solid ${staleColor}`:"3px solid transparent",
                      outline:stale&&!isSel?`1px solid ${staleColor}22`:"none"}}>
                  {/* Stale indicator dot */}
                  <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:8,height:8,borderRadius:3,background:isSel?col:stale?staleColor:`${col}44`,flexShrink:0,
                      boxShadow:stale?`0 0 6px ${staleColor}88`:"none"}}/>
                  </div>
                    <div style={{minWidth:0}}>
                      <div style={{color:"#fff",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{partnerDisplay}</div>
                      {a.department&&<div style={{fontSize:10,color:"rgba(255,255,255,0.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.department}</div>}
                    </div>
                    <div style={{color:C5,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.owner}</div>
                    <div style={{color:C5,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.region||"—"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:pc,boxShadow:`0 0 4px ${pc}`}}/>
                      <span style={{color:pc,fontWeight:700,fontSize:12}}>{a.priority}</span>
                    </div>
                    <span style={{display:"inline-flex",padding:"2px 7px",background:`${sc}18`,border:`1px solid ${sc}44`,borderRadius:20,fontSize:10,color:sc,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden"}}>{a.status}</span>
                    <div style={{color:C5,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.category||"—"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {a.impact&&<div style={{width:7,height:7,borderRadius:"50%",background:ic}}/>}
                      <span style={{color:a.impact?ic:C5,fontSize:11}}>{a.impact||"—"}</span>
                    </div>
                    <div style={{color:a.revenueImpact?C1:C5,fontSize:11,fontWeight:a.revenueImpact?600:400}}>{a.revenueImpact?fmtRev(a.revenueImpact):"—"}</div>
                    <div style={{color:C5,fontSize:11}}>{fmtDate(a.activityDate)}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      <div style={{color:stale?staleColor:"rgba(255,255,255,0.3)",fontSize:11}}>{fmtDate(a.updateDate)}</div>
                      {stale&&<div style={{fontSize:9,color:staleColor,fontWeight:700,letterSpacing:"0.04em"}}>⚠ {staleDays}d stale</div>}
                    </div>
                    {/* Description preview */}
                    <div style={{color:"rgba(255,255,255,0.45)",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={a.description}>
                      {a.description||"—"}
                    </div>
                    {/* Doc Links in table */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
                      {(a.docLinks||[]).length===0
                        ? <span style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>—</span>
                        : (a.docLinks).map((d,i)=>(
                          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                            title={d.url}
                            style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",
                              background:"rgba(0,210,255,0.08)",border:"1px solid rgba(0,210,255,0.25)",
                              borderRadius:5,color:C1,fontSize:10,fontWeight:500,textDecoration:"none",
                              whiteSpace:"nowrap",overflow:"hidden",maxWidth:120,textOverflow:"ellipsis",
                              cursor:"pointer"}}
                            onClick={e=>e.stopPropagation()}>
                            🔗 {d.name}
                          </a>
                        ))
                      }
                    </div>
                    <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                      <GBtn onClick={()=>openEdit(a)} color={C1} small>✎</GBtn>
                      <GBtn onClick={()=>del(a._id)} color={RED} small>✕</GBtn>
                    </div>
                  </div>
                );
              })}

              <div style={{padding:"8px 20px",color:C5,fontSize:11,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:16}}>
                <span>{sorted.length} activities</span>
                {sorted.filter(a=>a.revenueImpact).length>0&&<span style={{color:C1}}>Revenue: {fmtRev(sorted.reduce((s,a)=>s+(a.revenueImpact||0),0))}</span>}
              </div>
            </>
          )}
        </div>

        {/* ── Detail panel ── */}
        {selected&&!showForm&&(()=>{
          const a=selected;
          const partnerDisplay=a.partner==="Other"?a.partnerCustom||"Other":a.partner;
          const col=pColor(partnerDisplay);
          const sc=ACT_STATUS_COL[a.status]||C5;
          const pc=PRIORITY_COLOR[a.priority]||C5;
          const ic=IMPACT_COLOR[a.impact]||C5;
          const detailStale=isStale(a);
          const detailStaleDays=workingDaysSince(a.updateDate||a.activityDate);
          const detailStaleColor=a.impact==="High"?"#ef4444":"#f59e0b";
          return(
            <div style={{width:380,flexShrink:0,borderLeft:`1px solid ${detailStale?detailStaleColor+"44":"rgba(255,255,255,0.09)"}`,background:"rgba(0,12,22,0.98)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              {/* Stale warning banner */}
              {detailStale&&(
                <div style={{padding:"7px 16px",background:`${detailStaleColor}18`,borderBottom:`1px solid ${detailStaleColor}44`,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14}}>⚠</span>
                  <span style={{fontSize:12,color:detailStaleColor,fontWeight:600}}>
                    Not updated for {detailStaleDays} working day{detailStaleDays!==1?"s":""} — {a.impact==="High"?"High Impact needs update every 3 days":"needs update every 5 days"}
                  </span>
                </div>
              )}
              <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
                <div style={{height:4,borderRadius:2,background:`linear-gradient(90deg,${col},${col}44,transparent)`,marginBottom:14}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{flex:1,minWidth:0,paddingRight:10}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                      <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",background:`${sc}18`,border:`1px solid ${sc}44`,borderRadius:20,fontSize:11,color:sc,fontWeight:600}}>{a.status}</span>
                      <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 8px",background:`${pc}18`,border:`1px solid ${pc}44`,borderRadius:20,fontSize:11,color:pc,fontWeight:600}}><div style={{width:6,height:6,borderRadius:"50%",background:pc}}/>{a.priority}</span>
                      {a.impact&&<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 8px",background:`${ic}18`,border:`1px solid ${ic}44`,borderRadius:20,fontSize:11,color:ic,fontWeight:600}}>{a.impact} Impact</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                      <div style={{width:7,height:7,borderRadius:2,background:col,flexShrink:0}}/>
                      <span style={{color:col,fontWeight:700,fontSize:15}}>{partnerDisplay}</span>
                    </div>
                    {a.category&&<div style={{color:C5,fontSize:12}}>{a.category}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <GBtn onClick={()=>openEdit(a)} color={C1} small>✎ Edit</GBtn>
                    <button onClick={()=>setSelected(null)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,color:C5,fontSize:16,cursor:"pointer",padding:"4px 8px",lineHeight:1}}>✕</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"Owner",v:a.owner},{l:"Region",v:a.region||"—"},
                    {l:"Activity Date",v:fmtDate(a.activityDate)},{l:"Last Updated",v:fmtDate(a.updateDate)},
                    {l:"Department",v:a.department||"—"},{l:"RPM",v:a.regionalPartnerManager||"—"},
                    ...(a.revenueImpact?[{l:"Revenue Impact",v:fmtRev(a.revenueImpact),span:true}]:[]),
                  ].map(m=>(
                    <div key={m.l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"8px 11px",gridColumn:m.span?"1/-1":"auto"}}>
                      <div style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{m.l}</div>
                      <div style={{color:"#fff",fontSize:12,fontWeight:500}}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:16}}>
                {/* Doc Links */}
                {(a.docLinks||[]).length>0&&(
                  <div>
                    <div style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Document Links</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {a.docLinks.map((d,i)=>(
                        <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                          style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",
                            background:"rgba(0,210,255,0.07)",border:"1px solid rgba(0,210,255,0.2)",
                            borderRadius:9,color:"#fff",textDecoration:"none",transition:"background 0.15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(0,210,255,0.14)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(0,210,255,0.07)"}>
                          <span style={{fontSize:16,flexShrink:0}}>🔗</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{color:C1,fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                            <div style={{color:"rgba(255,255,255,0.3)",fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.url}</div>
                          </div>
                          <span style={{color:"rgba(0,210,255,0.5)",fontSize:12,flexShrink:0}}>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {/* Description */}
                <div>
                  <div style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Description / Next Steps</div>
                  {a.description
                    ?<div style={{color:"rgba(255,255,255,0.85)",fontSize:13,lineHeight:1.7,background:"rgba(255,255,255,0.03)",border:`1px solid ${col}18`,borderRadius:10,padding:"12px 14px",whiteSpace:"pre-wrap"}}>{a.description}</div>
                    :<div style={{color:"rgba(255,255,255,0.25)",fontSize:13}}>No description added yet.</div>}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Add / Edit form ── */}
        {showForm&&(
          <div style={{width:400,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,15,25,0.98)",padding:"18px 20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 style={{margin:0,fontFamily:"'Syne',sans-serif",fontSize:16}}>{editing?"Edit Activity":"Add Activity"}</h3>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",color:C5,fontSize:18,cursor:"pointer"}}>✕</button>
            </div>
            {error&&<div style={{padding:"7px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:7,color:RED,fontSize:12}}>{error}</div>}

            <div style={{fontSize:9,color:C1,textTransform:"uppercase",letterSpacing:"0.1em"}}>Core Details</div>
            <Field label="Partner *"><Sel value={form.partner} onChange={set("partner")} options={ACT_PARTNERS}/></Field>
            {form.partner==="Other"&&<Field label="Partner Name *"><Inp value={form.partnerCustom} onChange={set("partnerCustom")} placeholder="Type partner name…"/></Field>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Owner *"><Sel value={form.owner} onChange={set("owner")} options={ACT_OWNERS}/></Field>
              <Field label="Region"><Sel value={form.region} onChange={set("region")} options={ACT_REGIONS}/></Field>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Priority">
                <div style={{display:"flex",gap:6}}>
                  {ACT_PRIORITIES.map(p=>{const pc=PRIORITY_COLOR[p];const sel=form.priority===p;return(
                    <button key={p} onClick={()=>set("priority")(p)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`2px solid ${sel?pc:"rgba(255,255,255,0.1)"}`,background:sel?`${pc}18`:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:pc,boxShadow:sel?`0 0 6px ${pc}`:"none"}}/>
                      <span style={{fontSize:11,color:sel?pc:C5,fontWeight:sel?700:400}}>{p}</span>
                    </button>
                  );})}
                </div>
              </Field>
              <Field label="Status"><Sel value={form.status} onChange={set("status")} options={ACT_STATUSES}/></Field>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Category"><Sel value={form.category} onChange={set("category")} options={ACT_CATEGORIES}/></Field>
              <Field label="Impact"><Sel value={form.impact} onChange={set("impact")} options={ACT_IMPACTS}/></Field>
            </div>
            <Field label="Activity Date">
              <input type="date" value={form.activityDate} onChange={e=>set("activityDate")(e.target.value)}
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",colorScheme:"dark"}}/>
            </Field>

            <div style={{fontSize:9,color:C1,textTransform:"uppercase",letterSpacing:"0.1em"}}>Additional Info</div>
            <Field label="Department / Account"><Inp value={form.department} onChange={set("department")} placeholder="e.g. Banking, Retail, BFSI…"/></Field>
            <Field label="Regional Partner Manager"><Inp value={form.regionalPartnerManager} onChange={set("regionalPartnerManager")} placeholder="Name"/></Field>
            <Field label="Revenue Impact (optional)"><Inp value={form.revenueImpact} onChange={set("revenueImpact")} placeholder="e.g. 500000" type="number"/></Field>
            <Field label="Description / Next Steps"><Textarea value={form.description} onChange={set("description")} placeholder="Describe the activity and next steps…" rows={4}/></Field>

            {/* Doc Links editor */}
            <div>
              <div style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Document Links</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
                {(form.docLinks||[]).map((d,i)=>(
                  <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input value={d.name} onChange={e=>{const l=[...(form.docLinks||[])];l[i]={...l[i],name:e.target.value};set("docLinks")(l);}}
                      placeholder="Doc name" style={{flex:"0 0 38%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,padding:"7px 10px",color:"#fff",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                    <input value={d.url} onChange={e=>{const l=[...(form.docLinks||[])];l[i]={...l[i],url:e.target.value};set("docLinks")(l);}}
                      placeholder="https://…" style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,padding:"7px 10px",color:"#fff",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                    <button onClick={()=>{const l=[...(form.docLinks||[])];l.splice(i,1);set("docLinks")(l);}}
                      style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:6,padding:"6px 8px",cursor:"pointer",color:RED,fontSize:12,flexShrink:0}}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={()=>set("docLinks")([...(form.docLinks||[]),{name:"",url:""}])}
                style={{width:"100%",padding:"7px",background:"rgba(0,210,255,0.06)",border:"1px dashed rgba(0,210,255,0.3)",borderRadius:8,color:C1,fontSize:12,cursor:"pointer"}}>
                + Add Document Link
              </button>
            </div>

            <div style={{display:"flex",gap:8,paddingTop:4}}><PBtn onClick={save}>{editing?"Save Changes":"Add Activity"}</PBtn><GBtn onClick={()=>setShowForm(false)}>Cancel</GBtn></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MARKETING EVENTS
// ════════════════════════════════════════════════════════════════
const EVT_TYPES=["Webinar","Conference","Workshop","Summit","Roundtable","Meetup","Trade Show","Partner Day","Other"];
const EVT_STATUSES=["Planned","Confirmed","Done","Cancelled"];
const EVT_STATUS_COLOR={"Planned":C1,"Confirmed":"#22c55e","Done":"rgba(255,255,255,0.3)","Cancelled":"#ef4444"};
const EVT_TYPE_COLOR={"Webinar":"#8b5cf6","Conference":"#f59e0b","Workshop":"#10b981","Summit":"#ec4899","Roundtable":"#06b6d4","Meetup":"#f97316","Trade Show":"#6366f1","Partner Day":"#00ED64","Other":"#C3D4CF"};
const EVT_OWNERS=["Deepak M","Sampat B","Iman R","Meena M","Shivani T","Sneha D","Rashmi N","Vikas S","Ashutosh B","Prasad P","Haim R"];
const MONTH_NAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function toDateInput2(d){if(!d)return"";return new Date(d).toISOString().split("T")[0];}
function fmtEvtDate(d){if(!d)return"—";return new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});}

const EE={name:"",partner:"",partnerCustom:"",owner:"",eventType:"",startDate:toDateInput2(new Date()),endDate:"",location:"",description:"",status:"Planned"};

export function MarketingEventsTab(){
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("calendar"); // "calendar" | "list"
  const [calDate,setCalDate]=useState(new Date());
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(EE);
  const [selected,setSelected]=useState(null);
  const [filterPartner,setFilterPartner]=useState("");
  const [filterStatus,setFilterStatus]=useState("");
  const [filterOwner,setFilterOwner]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{setData(await(await fetch(`${API_BASE}/api/events`)).json());}catch{setError("Could not load events");}finally{setLoading(false);}}
  useEffect(()=>{if(selected)setSelected(data.find(e=>e._id===selected._id)||null);},[data]);

  function openAdd(date){
    const d=date?toDateInput2(date):toDateInput2(new Date());
    setForm({...EE,startDate:d,endDate:d});setEditing(null);setShowForm(true);setSelected(null);setError("");
  }
  function openEdit(e){setForm({...e,startDate:toDateInput2(e.startDate),endDate:toDateInput2(e.endDate)});setEditing(e._id);setShowForm(true);setSelected(null);setError("");}
  async function save(){
    if(!form.name){setError("Event name required");return;}
    if(!form.startDate){setError("Start date required");return;}
    if(form.partner==="Other"&&!form.partnerCustom){setError("Please enter partner name");return;}
    try{
      const url=editing?`${API_BASE}/api/events/${editing}`:`${API_BASE}/api/events`;
      const r=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if(!r.ok)throw new Error("Save failed");
      await load();setShowForm(false);setError("");
    }catch(e){setError(e.message);}
  }
  async function del(id){if(!window.confirm("Delete this event?"))return;await fetch(`${API_BASE}/api/events/${id}`,{method:"DELETE"});if(selected?._id===id)setSelected(null);load();}
  const set=k=>v=>setForm(p=>({...p,[k]:v}));

  const filtered=data.filter(e=>{
    if(filterPartner&&e.partner!==filterPartner&&!(e.partner==="Other"&&e.partnerCustom===filterPartner))return false;
    if(filterStatus&&e.status!==filterStatus)return false;
    if(filterOwner&&e.owner!==filterOwner)return false;
    return true;
  });

  // ── Calendar helpers ──
  function calDays(){
    const year=calDate.getFullYear(),month=calDate.getMonth();
    const first=new Date(year,month,1).getDay();
    const total=new Date(year,month+1,0).getDate();
    const cells=[];
    for(let i=0;i<first;i++)cells.push(null);
    for(let d=1;d<=total;d++)cells.push(new Date(year,month,d));
    while(cells.length%7!==0)cells.push(null);
    return cells;
  }
  function eventsOnDay(date){
    if(!date)return[];
    return filtered.filter(e=>{
      const start=new Date(e.startDate);start.setHours(0,0,0,0);
      const end=e.endDate?new Date(e.endDate):start;end.setHours(23,59,59,999);
      const d=new Date(date);d.setHours(12,0,0,0);
      return d>=start&&d<=end;
    });
  }
  function prevMonth(){setCalDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1));}
  function nextMonth(){setCalDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1));}

  const today=new Date();today.setHours(0,0,0,0);
  const cells=calDays();
  const partnerList=[...new Set(data.map(e=>e.partner==="Other"?e.partnerCustom:e.partner).filter(Boolean))].sort();

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── Top bar ── */}
      <div style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:160}}>
          <div style={{fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff"}}>Marketing Events</div>
          <div style={{color:C5,fontSize:12,marginTop:1}}>{filtered.length} event{filtered.length!==1?"s":""}</div>
        </div>

        {/* Calendar / List toggle */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:3,gap:2,flexShrink:0}}>
          <button onClick={()=>setView("calendar")} style={{padding:"5px 14px",borderRadius:7,border:"none",cursor:"pointer",background:view==="calendar"?"linear-gradient(135deg,#00ED64,#00684A)":"transparent",color:view==="calendar"?"#fff":C5,fontWeight:view==="calendar"?700:400,fontSize:12}}>📅 Calendar</button>
          <button onClick={()=>setView("list")}     style={{padding:"5px 14px",borderRadius:7,border:"none",cursor:"pointer",background:view==="list"?"linear-gradient(135deg,#00ED64,#00684A)":"transparent",color:view==="list"?"#fff":C5,fontWeight:view==="list"?700:400,fontSize:12}}>☰ List</button>
        </div>

        {/* Filters */}
        <select value={filterPartner} onChange={e=>setFilterPartner(e.target.value)} style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"5px 9px",color:filterPartner?"#fff":C5,fontSize:11,cursor:"pointer"}}>
          <option value="">All Partners</option>
          {partnerList.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"5px 9px",color:filterStatus?"#fff":C5,fontSize:11,cursor:"pointer"}}>
          <option value="">All Statuses</option>
          {EVT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterOwner} onChange={e=>setFilterOwner(e.target.value)} style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"5px 9px",color:filterOwner?"#fff":C5,fontSize:11,cursor:"pointer"}}>
          <option value="">All Owners</option>
          {EVT_OWNERS.map(o=><option key={o} value={o}>{o}</option>)}
        </select>

        <PBtn onClick={()=>openAdd(null)} small>+ Add Event</PBtn>
      </div>

      {/* ── Main content ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* Calendar or List */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {loading&&<div style={{color:C5,padding:20,textAlign:"center"}}>Loading...</div>}
          {error&&<div style={{padding:"8px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:12,marginBottom:14}}>{error}</div>}

          {/* ── CALENDAR VIEW ── */}
          {!loading&&view==="calendar"&&(
            <>
              {/* Month nav */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <button onClick={prevMonth} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:14}}>‹</button>
                <div style={{flex:1,textAlign:"center",fontWeight:800,fontSize:18,fontFamily:"'Syne',sans-serif",color:"#fff"}}>
                  {MONTH_NAMES[calDate.getMonth()]} {calDate.getFullYear()}
                </div>
                <button onClick={()=>setCalDate(new Date())} style={{background:"rgba(0,210,255,0.1)",border:"1px solid rgba(0,210,255,0.3)",borderRadius:8,padding:"6px 12px",color:C1,cursor:"pointer",fontSize:12,fontWeight:600}}>Today</button>
                <button onClick={nextMonth} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:14}}>›</button>
              </div>

              {/* Day header */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
                {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",padding:"4px 0"}}>{d}</div>)}
              </div>

              {/* Calendar grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {cells.map((date,i)=>{
                  if(!date)return<div key={i}/>;
                  const dayEvents=eventsOnDay(date);
                  const isToday=date.getTime()===today.getTime();
                  const isOtherMonth=date.getMonth()!==calDate.getMonth();
                  return(
                    <div key={i} onClick={()=>{if(dayEvents.length>0)setSelected(dayEvents[0]);else openAdd(date);}}
                      style={{minHeight:90,background:isToday?"rgba(0,210,255,0.08)":"rgba(255,255,255,0.02)",
                        border:`1px solid ${isToday?"rgba(0,210,255,0.35)":"rgba(255,255,255,0.06)"}`,
                        borderRadius:10,padding:"6px 8px",cursor:"pointer",transition:"background 0.15s",
                        opacity:isOtherMonth?0.4:1}}
                      onMouseEnter={e=>e.currentTarget.style.background=isToday?"rgba(0,210,255,0.12)":"rgba(255,255,255,0.05)"}
                      onMouseLeave={e=>e.currentTarget.style.background=isToday?"rgba(0,210,255,0.08)":"rgba(255,255,255,0.02)"}>
                      <div style={{fontSize:12,fontWeight:isToday?800:400,color:isToday?C1:"rgba(255,255,255,0.6)",marginBottom:5}}>{date.getDate()}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}>
                        {dayEvents.slice(0,3).map(e=>{
                          const tc=EVT_TYPE_COLOR[e.eventType]||C1;
                          const sc=EVT_STATUS_COLOR[e.status]||C5;
                          return(
                            <div key={e._id} onClick={ev=>{ev.stopPropagation();setSelected(e);setShowForm(false);}}
                              style={{padding:"2px 5px",background:`${tc}20`,border:`1px solid ${tc}44`,
                                borderRadius:4,fontSize:9,color:tc,fontWeight:600,
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                                cursor:"pointer",lineHeight:1.4}}>
                              {e.name}
                            </div>
                          );
                        })}
                        {dayEvents.length>3&&<div style={{fontSize:9,color:"rgba(255,255,255,0.4)",paddingLeft:5}}>+{dayEvents.length-3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:16,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
                {EVT_TYPES.slice(0,6).map(t=>(
                  <div key={t} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:8,height:8,borderRadius:2,background:EVT_TYPE_COLOR[t]}}/>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{t}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── LIST VIEW ── */}
          {!loading&&view==="list"&&(
            <>
              {filtered.length===0&&(
                <div style={{textAlign:"center",padding:"60px 20px",color:C5}}>
                  <div style={{fontSize:36,marginBottom:12}}>📅</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:6}}>No events yet</div>
                  <div style={{fontSize:13,marginBottom:20}}>Add your first marketing event</div>
                  <PBtn onClick={()=>openAdd(null)}>+ Add Event</PBtn>
                </div>
              )}
              {filtered.length>0&&(()=>{
                // Group by month
                const groups={};
                [...filtered].sort((a,b)=>new Date(a.startDate)-new Date(b.startDate)).forEach(e=>{
                  const d=new Date(e.startDate);
                  const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                  const label=`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
                  if(!groups[key])groups[key]={label,events:[]};
                  groups[key].events.push(e);
                });
                return Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([key,{label,events}])=>(
                  <div key={key} style={{marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{color:C1,fontWeight:700,fontSize:13}}>{label}</span>
                      <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(0,210,255,0.3),transparent)"}}/>
                      <span style={{color:C5,fontSize:11}}>{events.length} event{events.length!==1?"s":""}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {events.map(e=>{
                        const tc=EVT_TYPE_COLOR[e.eventType]||C1;
                        const sc=EVT_STATUS_COLOR[e.status]||C5;
                        const partnerDisplay=e.partner==="Other"?e.partnerCustom:e.partner;
                        const isSel=selected?._id===e._id;
                        const isMultiDay=e.endDate&&toDateInput2(e.startDate)!==toDateInput2(e.endDate);
                        return(
                          <div key={e._id} onClick={()=>{setSelected(isSel?null:e);setShowForm(false);}}
                            style={{display:"grid",gridTemplateColumns:"60px 1fr 100px 90px 90px 80px 70px",gap:10,alignItems:"center",
                              padding:"12px 16px",background:isSel?`${tc}0e`:"rgba(0,30,43,0.6)",
                              border:`1px solid ${isSel?tc+"55":"rgba(255,255,255,0.07)"}`,
                              borderRadius:12,cursor:"pointer",transition:"all 0.15s",
                              borderLeft:`4px solid ${tc}`}}>
                            {/* Date block */}
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:20,fontWeight:800,color:"#fff",lineHeight:1}}>{new Date(e.startDate).getDate()}</div>
                              <div style={{fontSize:9,color:C5,textTransform:"uppercase"}}>{MONTH_NAMES[new Date(e.startDate).getMonth()].slice(0,3)}</div>
                            </div>
                            {/* Event name + details */}
                            <div style={{minWidth:0}}>
                              <div style={{color:"#fff",fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                              <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                                {e.eventType&&<span style={{fontSize:10,color:tc,fontWeight:600}}>{e.eventType}</span>}
                                {partnerDisplay&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>· {partnerDisplay}</span>}
                                {e.location&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>📍 {e.location}</span>}
                              </div>
                            </div>
                            <div style={{color:C5,fontSize:11}}>
                              {isMultiDay?`${fmtEvtDate(e.startDate)} – ${fmtEvtDate(e.endDate)}`:fmtEvtDate(e.startDate)}
                            </div>
                            <div style={{color:C5,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.owner||"—"}</div>
                            <span style={{display:"inline-flex",padding:"2px 9px",background:`${sc}18`,border:`1px solid ${sc}44`,borderRadius:20,fontSize:10,color:sc,fontWeight:600,whiteSpace:"nowrap"}}>{e.status}</span>
                            <span style={{display:"inline-flex",padding:"2px 8px",background:`${tc}15`,border:`1px solid ${tc}40`,borderRadius:6,fontSize:10,color:tc,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.eventType||"—"}</span>
                            <div style={{display:"flex",gap:4}} onClick={ev=>ev.stopPropagation()}>
                              <GBtn onClick={()=>openEdit(e)} color={C1} small>✎</GBtn>
                              <GBtn onClick={()=>del(e._id)} color={RED} small>✕</GBtn>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </div>

        {/* ── Detail panel ── */}
        {selected&&!showForm&&(()=>{
          const e=selected;
          const tc=EVT_TYPE_COLOR[e.eventType]||C1;
          const sc=EVT_STATUS_COLOR[e.status]||C5;
          const partnerDisplay=e.partner==="Other"?e.partnerCustom:e.partner;
          const isMultiDay=e.endDate&&toDateInput2(e.startDate)!==toDateInput2(e.endDate);
          return(
            <div style={{width:360,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.09)",background:"rgba(0,12,22,0.98)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",flexShrink:0}}>
                <div style={{height:4,borderRadius:2,background:`linear-gradient(90deg,${tc},${tc}44,transparent)`,marginBottom:14}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{flex:1,minWidth:0,paddingRight:10}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                      <span style={{display:"inline-flex",padding:"2px 9px",background:`${sc}18`,border:`1px solid ${sc}44`,borderRadius:20,fontSize:11,color:sc,fontWeight:600}}>{e.status}</span>
                      {e.eventType&&<span style={{display:"inline-flex",padding:"2px 9px",background:`${tc}18`,border:`1px solid ${tc}44`,borderRadius:20,fontSize:11,color:tc,fontWeight:600}}>{e.eventType}</span>}
                    </div>
                    <div style={{color:"#fff",fontWeight:800,fontSize:17,lineHeight:1.3,marginBottom:6}}>{e.name}</div>
                    {partnerDisplay&&<div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:6,height:6,borderRadius:1,background:pColor(partnerDisplay)}}/>
                      <span style={{color:pColor(partnerDisplay),fontWeight:600,fontSize:13}}>{partnerDisplay}</span>
                    </div>}
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    <GBtn onClick={()=>openEdit(e)} color={C1} small>✎</GBtn>
                    <button onClick={()=>setSelected(null)} style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,color:C5,fontSize:15,cursor:"pointer",padding:"3px 7px"}}>✕</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"Date",v:isMultiDay?`${fmtEvtDate(e.startDate)} → ${fmtEvtDate(e.endDate)}`:fmtEvtDate(e.startDate)},
                    {l:"Owner",v:e.owner||"—"},
                    {l:"Location",v:e.location||"—"},
                    {l:"Event Type",v:e.eventType||"—"},
                  ].map(m=>(
                    <div key={m.l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"9px 12px",gridColumn:m.l==="Date"?"1/-1":"auto"}}>
                      <div style={{fontSize:9,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{m.l}</div>
                      <div style={{color:"#fff",fontSize:12,fontWeight:500}}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px"}}>
                {e.description&&(
                  <>
                    <div style={{height:1,background:"rgba(255,255,255,0.07)",marginBottom:14}}/>
                    <div style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Description</div>
                    <div style={{color:"rgba(255,255,255,0.8)",fontSize:13,lineHeight:1.7,background:"rgba(255,255,255,0.03)",border:`1px solid ${tc}18`,borderRadius:10,padding:"12px 14px",whiteSpace:"pre-wrap"}}>{e.description}</div>
                  </>
                )}
              </div>
              {/* Quick actions */}
              <div style={{padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:8}}>
                <button onClick={()=>openEdit(e)} style={{flex:1,padding:"8px",background:"rgba(0,210,255,0.08)",border:"1px solid rgba(0,210,255,0.25)",borderRadius:8,color:C1,fontWeight:600,fontSize:12,cursor:"pointer"}}>✎ Edit Event</button>
                <button onClick={()=>del(e._id)} style={{padding:"8px 14px",background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:8,color:RED,fontWeight:600,fontSize:12,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          );
        })()}

        {/* ── Add / Edit form ── */}
        {showForm&&(
          <div style={{width:380,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,15,25,0.98)",padding:"18px 20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 style={{margin:0,fontFamily:"'Syne',sans-serif",fontSize:16}}>{editing?"Edit Event":"Add Event"}</h3>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",color:C5,fontSize:18,cursor:"pointer"}}>✕</button>
            </div>
            {error&&<div style={{padding:"7px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:7,color:RED,fontSize:12}}>{error}</div>}

            <Field label="Event Name *"><Inp value={form.name} onChange={set("name")} placeholder="e.g. AWS Partner Summit 2026"/></Field>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Event Type"><Sel value={form.eventType} onChange={set("eventType")} options={EVT_TYPES}/></Field>
              <Field label="Status"><Sel value={form.status} onChange={set("status")} options={EVT_STATUSES}/></Field>
            </div>

            <Field label="Partner">
              <Sel value={form.partner} onChange={set("partner")} options={[...PARTNERS,"Other"]}/>
            </Field>
            {form.partner==="Other"&&<Field label="Partner Name *"><Inp value={form.partnerCustom} onChange={set("partnerCustom")} placeholder="Type partner name…"/></Field>}

            <Field label="Owner"><Sel value={form.owner} onChange={set("owner")} options={EVT_OWNERS}/></Field>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Start Date *">
                <input type="date" value={form.startDate} onChange={e=>set("startDate")(e.target.value)}
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",colorScheme:"dark"}}/>
              </Field>
              <Field label="End Date (optional)">
                <input type="date" value={form.endDate} onChange={e=>set("endDate")(e.target.value)}
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",colorScheme:"dark"}}/>
              </Field>
            </div>

            <Field label="Location"><Inp value={form.location} onChange={set("location")} placeholder="e.g. Singapore / Online / Las Vegas"/></Field>

            <Field label="Description">
              <Textarea value={form.description} onChange={set("description")} placeholder="Event details, agenda, goals…" rows={4}/>
            </Field>

            <div style={{display:"flex",gap:8,paddingTop:4}}>
              <PBtn onClick={save}>{editing?"Save Changes":"Add Event"}</PBtn>
              <GBtn onClick={()=>setShowForm(false)}>Cancel</GBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
