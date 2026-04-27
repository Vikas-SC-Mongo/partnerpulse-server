import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const C1="#00ED64",C2="#00684A",C3="#e9ff99",C4="#f9ebff",C5="#C3D4CF",RED="#ff6b6b";

function getToken(){return sessionStorage.getItem("pp_token")||"";}
function authHeaders(){return{"Content-Type":"application/json","Authorization":`Bearer ${getToken()}`};}

function Field({label,children}){return<div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:10,color:C5,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</label>{children}</div>;}
function Inp({value,onChange,placeholder,type="text"}){return<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"}}/>;}
function Sel({value,onChange,options,placeholder="All"}){return<select value={value||""} onChange={e=>onChange(e.target.value)} style={{background:"#001220",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"8px 12px",color:"#fff",fontSize:13,outline:"none",width:"100%",cursor:"pointer"}}><option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;}
function PBtn({onClick,children,disabled,color="#00ED64",small}){return<button onClick={onClick} disabled={disabled} style={{padding:small?"6px 14px":"9px 18px",background:color,border:"none",borderRadius:7,color:"#001E2B",fontWeight:700,fontSize:small?12:13,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,whiteSpace:"nowrap"}}>{children}</button>;}
function GBtn({onClick,children,color=C5,small}){return<button onClick={onClick} style={{padding:small?"5px 10px":"8px 14px",background:"transparent",border:`1px solid ${color}55`,borderRadius:7,color,fontWeight:600,fontSize:small?11:12,cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>;}

// ════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════════════
export function LoginPage({onLogin}){
  const [u,setU]=useState("");const [p,setP]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  async function submit(e){
    e.preventDefault();setErr("");setLoading(true);
    try{
      const r=await fetch(`${API_BASE}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});
      const d=await r.json();
      if(!r.ok){setErr(d.error||"Login failed");return;}
      sessionStorage.setItem("pp_token",d.token);
      sessionStorage.setItem("pp_user",JSON.stringify({username:d.username,role:d.role}));
      onLogin(d);
    }catch{setErr("Could not connect to server");}
    finally{setLoading(false);}
  }
  return(
    <div style={{height:"100vh",background:"#001E2B",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:380,padding:"40px",background:"#001220",border:"1px solid rgba(0,237,100,0.15)",borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <svg width="28" height="38" viewBox="0 0 24 34" fill="none" style={{margin:"0 auto 14px",display:"block"}}>
            <path d="M12 0C12 0 2 10 2 20C2 26.6 6.5 32 12 32C17.5 32 22 26.6 22 20C22 10 12 0 12 0Z" fill="#00ED64"/>
            <path d="M12 32L12 34" stroke="#00684A" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif"}}>PartnerPulse</div>
          <div style={{color:"rgba(255,255,255,0.35)",fontSize:13,marginTop:4}}>Sign in to continue</div>
        </div>
        {err&&<div style={{padding:"9px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:13,marginBottom:16}}>{err}</div>}
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Username"><Inp value={u} onChange={setU} placeholder="Enter username"/></Field>
          <Field label="Password"><Inp value={p} onChange={setP} placeholder="Enter password" type="password"/></Field>
          <button type="submit" disabled={loading||!u||!p}
            style={{padding:"11px",background:"#00ED64",border:"none",borderRadius:8,color:"#001E2B",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:4,opacity:loading||!u||!p?0.5:1}}>
            {loading?"Signing in…":"Sign In →"}
          </button>
        </form>
        <div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:11,marginTop:20}}>Default: admin / admin123</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ADMIN PAGE
// ════════════════════════════════════════════════════════════════
export function AdminPage(){
  const [tab,setTab]=useState("users");
  const user=JSON.parse(sessionStorage.getItem("pp_user")||"{}");
  if(user.role!=="Admin") return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:C5}}>
      <div style={{fontSize:36}}>🔒</div>
      <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>Admin Access Only</div>
      <div style={{fontSize:13}}>You need Admin role to view this page.</div>
    </div>
  );
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
      <div style={{padding:"13px 22px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{flex:1}}><div style={{fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff"}}>Admin</div><div style={{color:C5,fontSize:12,marginTop:1}}>Manage users and application settings</div></div>
        <div style={{display:"flex",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:3,gap:2}}>
          {[["users","👥 Users"],["config","⚙ Dropdown Options"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"6px 16px",borderRadius:7,border:"none",cursor:"pointer",background:tab===k?"linear-gradient(135deg,#00ED64,#00684A)":"transparent",color:tab===k?"#fff":C5,fontWeight:tab===k?700:400,fontSize:12}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0}}>
        {tab==="users"&&<UsersPanel/>}
        {tab==="config"&&<ConfigPanel/>}
      </div>
    </div>
  );
}

function UsersPanel(){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({username:"",password:"",role:"Viewer",isActive:true});
  const [error,setError]=useState("");
  const set=k=>v=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{const r=await fetch(`${API_BASE}/api/users`,{headers:authHeaders()});setUsers(await r.json());}catch{setError("Could not load users");}finally{setLoading(false);}}
  function openAdd(){setForm({username:"",password:"",role:"Viewer",isActive:true});setEditing(null);setShowForm(true);setError("");}
  function openEdit(u){setForm({...u,password:""});setEditing(u._id);setShowForm(true);setError("");}
  async function save(){
    if(!form.username){setError("Username required");return;}
    if(!editing&&!form.password){setError("Password required for new user");return;}
    try{
      const r=await fetch(editing?`${API_BASE}/api/users/${editing}`:`${API_BASE}/api/users`,{method:editing?"PUT":"POST",headers:authHeaders(),body:JSON.stringify(form)});
      if(!r.ok)throw new Error((await r.json()).error||"Save failed");
      await load();setShowForm(false);setError("");
    }catch(e){setError(e.message);}
  }
  async function del(id){if(!window.confirm("Delete this user?"))return;await fetch(`${API_BASE}/api/users/${id}`,{method:"DELETE",headers:authHeaders()});load();}

  return(
    <div style={{display:"flex",flex:1,height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,padding:"20px 24px",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#fff"}}>Users</div><div style={{color:C5,fontSize:12}}>Control who can sign in to PartnerPulse</div></div>
          <PBtn onClick={openAdd} small>+ Add User</PBtn>
        </div>
        {error&&<div style={{padding:"8px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:12,marginBottom:14}}>{error}</div>}
        {loading&&<div style={{color:C5,padding:20}}>Loading...</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {users.map(u=>(
            <div key={u._id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 100px",gap:12,alignItems:"center",padding:"13px 18px",background:"rgba(0,30,43,0.7)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C1},${C2})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#fff",flexShrink:0}}>{u.username.slice(0,2).toUpperCase()}</div>
                <div><div style={{color:"#fff",fontWeight:600,fontSize:13}}>{u.username}</div><div style={{color:C5,fontSize:11,marginTop:1}}>{u.role}</div></div>
              </div>
              <span style={{display:"inline-flex",padding:"2px 9px",background:u.role==="Admin"?`${C1}18`:"rgba(255,255,255,0.07)",border:`1px solid ${u.role==="Admin"?C1:"rgba(255,255,255,0.15)"}`,borderRadius:20,fontSize:11,color:u.role==="Admin"?C1:C5,fontWeight:600}}>{u.role}</span>
              <span style={{display:"inline-flex",padding:"2px 9px",background:u.isActive?"rgba(34,197,94,0.1)":"rgba(255,107,107,0.1)",border:`1px solid ${u.isActive?"rgba(34,197,94,0.3)":"rgba(255,107,107,0.3)"}`,borderRadius:20,fontSize:11,color:u.isActive?"#22c55e":RED,fontWeight:600}}>{u.isActive?"Active":"Inactive"}</span>
              <div style={{display:"flex",gap:6}}>
                <GBtn onClick={()=>openEdit(u)} color={C1} small>✎ Edit</GBtn>
                <GBtn onClick={()=>del(u._id)} color={RED} small>✕</GBtn>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showForm&&(
        <div style={{width:360,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,15,25,0.98)",padding:"20px 22px",overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{margin:0,fontFamily:"'Syne',sans-serif",fontSize:16}}>{editing?"Edit User":"Add User"}</h3>
            <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",color:C5,fontSize:18,cursor:"pointer"}}>✕</button>
          </div>
          {error&&<div style={{padding:"7px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:7,color:RED,fontSize:12}}>{error}</div>}
          <Field label="Username *"><Inp value={form.username} onChange={set("username")} placeholder="e.g. john.doe"/></Field>
          <Field label={editing?"New Password (leave blank to keep)":"Password *"}><Inp value={form.password} onChange={set("password")} placeholder="Password" type="password"/></Field>
          <Field label="Role">
            <div style={{display:"flex",gap:8}}>
              {["Admin","Viewer"].map(r=>(
                <button key={r} onClick={()=>set("role")(r)} style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${form.role===r?C1:"rgba(255,255,255,0.12)"}`,background:form.role===r?"rgba(0,210,255,0.12)":"transparent",color:form.role===r?C1:C5,fontWeight:form.role===r?700:400,cursor:"pointer",fontSize:13}}>{r}</button>
              ))}
            </div>
          </Field>
          <Field label="Status">
            <div style={{display:"flex",gap:8}}>
              {[["Active",true],["Inactive",false]].map(([l,v])=>(
                <button key={l} onClick={()=>set("isActive")(v)} style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${form.isActive===v?(v?"#22c55e":RED):"rgba(255,255,255,0.12)"}`,background:form.isActive===v?(v?"rgba(34,197,94,0.1)":"rgba(255,107,107,0.1)"):"transparent",color:form.isActive===v?(v?"#22c55e":RED):C5,fontWeight:form.isActive===v?700:400,cursor:"pointer",fontSize:13}}>{l}</button>
              ))}
            </div>
          </Field>
          <div style={{display:"flex",gap:8,paddingTop:4}}><PBtn onClick={save}>{editing?"Save Changes":"Add User"}</PBtn><GBtn onClick={()=>setShowForm(false)}>Cancel</GBtn></div>
        </div>
      )}
    </div>
  );
}

function ConfigPanel(){
  const [config,setConfig]=useState({});
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);  // key being edited
  const [editValues,setEditValues]=useState([]);
  const [newVal,setNewVal]=useState("");
  const [error,setError]=useState("");
  const [saved,setSaved]=useState("");

  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{const r=await fetch(`${API_BASE}/api/config`,{headers:authHeaders()});setConfig(await r.json());}catch{setError("Could not load config");}finally{setLoading(false);}}

  function startEdit(key){setEditing(key);setEditValues([...(config[key]?.values||[])]);setNewVal("");}
  async function saveEdit(){
    try{
      await fetch(`${API_BASE}/api/config/${editing}`,{method:"PUT",headers:authHeaders(),body:JSON.stringify({values:editValues,label:config[editing]?.label||editing})});
      await load();setEditing(null);setSaved("Saved!");setTimeout(()=>setSaved(""),2000);
    }catch{setError("Save failed");}
  }
  function addVal(){const v=newVal.trim();if(v&&!editValues.includes(v)){setEditValues(p=>[...p,v]);setNewVal("");}};
  function removeVal(i){setEditValues(p=>p.filter((_,j)=>j!==i));}
  function moveVal(i,dir){const a=[...editValues];const j=i+dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];setEditValues(a);}

  return(
    <div style={{flex:1,minHeight:0,padding:"20px 24px",overflowY:"auto"}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>Dropdown Options</div>
        <div style={{color:C5,fontSize:12}}>Edit the options available in every dropdown across the app. Changes take effect immediately on next page load.</div>
      </div>
      {saved&&<div style={{padding:"8px 14px",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:8,color:"#22c55e",fontSize:12,marginBottom:14}}>{saved}</div>}
      {error&&<div style={{padding:"8px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,color:RED,fontSize:12,marginBottom:14}}>{error}</div>}
      {loading&&<div style={{color:C5,padding:20}}>Loading...</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:16}}>
        {Object.entries(config).map(([key,cfg])=>{
          const isEdit=editing===key;
          return(
            <div key={key} style={{background:"rgba(0,30,43,0.7)",border:`1px solid ${isEdit?"rgba(0,210,255,0.35)":"rgba(255,255,255,0.08)"}`,borderRadius:13,overflow:"hidden",transition:"border 0.15s"}}>
              <div style={{padding:"12px 16px",background:isEdit?"rgba(0,210,255,0.08)":"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{color:"#fff",fontWeight:700,fontSize:13}}>{cfg.label||key}</div><div style={{color:C5,fontSize:11,marginTop:1}}>{cfg.values?.length||0} options · key: {key}</div></div>
                {!isEdit&&<GBtn onClick={()=>startEdit(key)} color={C1} small>✎ Edit</GBtn>}
                {isEdit&&<div style={{display:"flex",gap:6}}><PBtn onClick={saveEdit} small>Save</PBtn><GBtn onClick={()=>setEditing(null)} small>Cancel</GBtn></div>}
              </div>
              <div style={{padding:"12px 16px"}}>
                {!isEdit&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(cfg.values||[]).map(v=>(
                      <span key={v} style={{padding:"3px 10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,fontSize:12,color:C5}}>{v}</span>
                    ))}
                  </div>
                )}
                {isEdit&&(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {editValues.map((v,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8}}>
                        <span style={{flex:1,color:"#fff",fontSize:13}}>{v}</span>
                        <button onClick={()=>moveVal(i,-1)} disabled={i===0} style={{background:"none",border:"none",color:i===0?"rgba(255,255,255,0.2)":C5,cursor:"pointer",fontSize:12,padding:"2px 4px"}}>▲</button>
                        <button onClick={()=>moveVal(i,1)} disabled={i===editValues.length-1} style={{background:"none",border:"none",color:i===editValues.length-1?"rgba(255,255,255,0.2)":C5,cursor:"pointer",fontSize:12,padding:"2px 4px"}}>▼</button>
                        <button onClick={()=>removeVal(i)} style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:5,color:RED,cursor:"pointer",fontSize:11,padding:"2px 6px"}}>✕</button>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      <input value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addVal()} placeholder="Add new option…"
                        style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"7px 11px",color:"#fff",fontSize:13,outline:"none"}}/>
                      <button onClick={addVal} style={{padding:"7px 14px",background:"rgba(0,210,255,0.1)",border:"1px solid rgba(0,210,255,0.3)",borderRadius:8,color:C1,fontWeight:600,fontSize:12,cursor:"pointer"}}>+ Add</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPORT PAGE
// ════════════════════════════════════════════════════════════════
const EXPORT_SECTIONS=[
  {key:"activities",  icon:"◉", label:"Activities",    desc:"All activity tracker records",
   filters:[{k:"partner",l:"Partner"},{k:"owner",l:"Owner"},{k:"status",l:"Status",opts:["Open","In Progress","Done","Blocked"]},{k:"priority",l:"Priority",opts:["P1","P2","P3"]},{k:"category",l:"Category",opts:["Workstream","Champion Building","Opportunity","PDM","Event Planning"]},{k:"region",l:"Region",opts:["APAC","AMER","LATAM","EU","ME","Africa"]}]},
  {key:"champions",   icon:"★", label:"Champions",     desc:"Partner champion contacts",
   filters:[{k:"partner",l:"Partner"}]},
  {key:"workstreams", icon:"⬡", label:"Workstreams",   desc:"Partner workstream programs",
   filters:[{k:"partner",l:"Partner"},{k:"status",l:"Status",opts:["Active","Inactive","On Hold"]}]},
  {key:"opportunities",icon:"◈",label:"Opportunities", desc:"All approved opportunities",
   filters:[{k:"partner",l:"Partner"},{k:"stage",l:"Stage",opts:["Discovery","Proposal","Negotiation","Closed","Lost"]},{k:"status",l:"Approval Status",opts:["Approved","Pending Approval","New","Rejected"]}]},
  {key:"narr",        icon:"▣", label:"NARR Snapshots",desc:"Weekly NARR snapshot history",
   filters:[]},
];

export function ExportPage(){
  const [filterValues,setFilterValues]=useState({});
  const [downloading,setDownloading]=useState(null);
  const [partners,setPartners]=useState([]);
  const [owners,setOwners]=useState([]);
  const [message,setMessage]=useState({});

  useEffect(()=>{
    fetch(`${API_BASE}/api/config`,{headers:authHeaders()}).then(r=>r.json()).then(cfg=>{
      setPartners(cfg.partners?.values||[]);
      setOwners(cfg.activityOwners?.values||[]);
    }).catch(()=>{});
  },[]);

  function setFilter(section,key,val){setFilterValues(p=>({...p,[`${section}_${key}`]:val}));}
  function getFilter(section,key){return filterValues[`${section}_${key}`]||"";}

  async function download(section){
    setDownloading(section.key);setMessage(p=>({...p,[section.key]:""}));
    try{
      const params=new URLSearchParams();
      section.filters.forEach(f=>{const v=getFilter(section.key,f.k);if(v)params.append(f.k,v);});
      const res=await fetch(`${API_BASE}/api/export/${section.key}?${params}`,{headers:{"Authorization":`Bearer ${getToken()}`}});
      if(!res.ok)throw new Error("Export failed");
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`${section.key}_${new Date().toISOString().split("T")[0]}.csv`;a.click();
      URL.revokeObjectURL(url);
      setMessage(p=>({...p,[section.key]:"✓ Downloaded"}));
      setTimeout(()=>setMessage(p=>({...p,[section.key]:""})),3000);
    }catch(e){setMessage(p=>({...p,[section.key]:`Error: ${e.message}`}));}
    finally{setDownloading(null);}
  }

  const getOpts=(section,filter)=>{
    if(filter.opts)return filter.opts;
    if(filter.k==="partner")return partners;
    if(filter.k==="owner")return owners;
    return[];
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"13px 22px",borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
        <div style={{fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff"}}>Export Data</div>
        <div style={{color:C5,fontSize:12,marginTop:1}}>Download any dataset as CSV with optional filters</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {EXPORT_SECTIONS.map(section=>{
            const msg=message[section.key]||"";
            const isOk=msg.startsWith("✓");
            const isErr=msg.startsWith("Error");
            return(
              <div key={section.key} style={{background:"rgba(0,30,43,0.7)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:14,borderBottom:section.filters.length?"1px solid rgba(255,255,255,0.07)":"none"}}>
                  <div style={{width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,rgba(0,210,255,0.2),rgba(0,110,255,0.15))",border:"1px solid rgba(0,210,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C1,flexShrink:0}}>{section.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{section.label}</div>
                    <div style={{color:C5,fontSize:12,marginTop:1}}>{section.desc}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {msg&&<span style={{fontSize:12,color:isOk?"#22c55e":isErr?RED:C5,fontWeight:500}}>{msg}</span>}
                    <PBtn onClick={()=>download(section)} disabled={downloading===section.key} color={C1} small>
                      {downloading===section.key?"Exporting…":"⬇ Download CSV"}
                    </PBtn>
                  </div>
                </div>
                {section.filters.length>0&&(
                  <div style={{padding:"12px 20px",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.07em",marginRight:4}}>Filters:</span>
                    {section.filters.map(f=>{
                      const opts=getOpts(section,f);
                      return(
                        <div key={f.k} style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:11,color:C5}}>{f.l}:</span>
                          <select value={getFilter(section.key,f.k)} onChange={e=>setFilter(section.key,f.k,e.target.value)}
                            style={{background:"#001220",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,padding:"5px 10px",color:getFilter(section.key,f.k)?"#fff":C5,fontSize:12,cursor:"pointer"}}>
                            <option value="">All</option>
                            {opts.map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      );
                    })}
                    {section.filters.some(f=>getFilter(section.key,f.k))&&(
                      <button onClick={()=>section.filters.forEach(f=>setFilter(section.key,f.k,""))}
                        style={{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,padding:"4px 10px",color:C5,fontSize:11,cursor:"pointer"}}>Clear</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
