import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const PALETTE = ["#7C6EFA","#FA6E79","#3ECFAC","#F7A325","#5BC8F5","#A8E06B","#F953C6","#4FACFE","#FF6B6B","#C39BD3"];
const CATEGORIES = ["Sog'liq","O'qish","Sport","Ish","Shaxsiy","Ijodiyot","Ovqat","Uyqu"];
const CAT_ICONS  = {"Sog'liq":"❤️","O'qish":"📚","Sport":"🏃","Ish":"💼","Shaxsiy":"🌟","Ijodiyot":"🎨","Ovqat":"🥗","Uyqu":"😴"};
const EMOJIS = ["⭐","💪","📚","🏃","🧘","💧","🥗","😴","✍️","🎯","🎨","🎵","🏋️","🚴","🧠","💊","🌿","☕","🎮","📝"];
const DAYS_UZ   = ["Ya","Du","Se","Ch","Pa","Ju","Sh"];
const MONTHS_UZ = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const FREQ_OPTS = [
  { val:"daily",    label:"Har kuni" },
  { val:"weekdays", label:"Ish kunlari" },
  { val:"weekends", label:"Dam olish" },
  { val:"custom",   label:"O'zim" },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const dateStr  = d => d.toISOString().split("T")[0];
const addDays  = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };

function last365(){ const a=[],t=new Date(); for(let i=364;i>=0;i--) a.push(dateStr(addDays(t,-i))); return a; }
function last7()  { const a=[],t=new Date(); for(let i=6;i>=0;i--)   a.push(dateStr(addDays(t,-i))); return a; }
function last30() { const a=[],t=new Date(); for(let i=29;i>=0;i--)  a.push(dateStr(addDays(t,-i))); return a; }

function calcStreak(id,logs){
  const days=last365(),t=todayStr(); let cur=0,best=0,tmp=0;
  for(let i=days.length-1;i>=0;i--){
    if(days[i]>t) continue;
    if(logs[id]?.[days[i]]){ tmp++; if(i===days.length-1||days[i+1]===t) cur=tmp; }
    else tmp=0;
    if(tmp>best) best=tmp;
  }
  return {current:cur,best};
}
function calcTotal(id,logs){ return last365().filter(d=>logs[id]?.[d]).length; }

function isDueToday(h){
  const d=new Date().getDay();
  if(h.frequency==="daily") return true;
  if(h.frequency==="weekdays") return d>=1&&d<=5;
  if(h.frequency==="weekends") return d===0||d===6;
  if(h.frequency==="custom") return h.customDays?.includes(d);
  return true;
}

function load(k,def){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch{ return def; } }
function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }

function useIsMobile(){
  const [w,setW]=useState(window.innerWidth);
  useEffect(()=>{ const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return w<700;
}

const s = {
  lbl:  {display:"block",fontSize:11,color:"#666",marginBottom:6,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase"},
  input:{background:"#0f0f1a",border:"1.5px solid #2a2a3e",borderRadius:12,padding:"11px 14px",
         color:"#e0e0f0",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"},
  card: {background:"#16162a",borderRadius:18,border:"1px solid #2a2a3e"},
};

function MiniHeatmap({habit,logs,onToggle}){
  const today=todayStr();
  const shown=last365().slice(-70);
  const firstWd=new Date(shown[0]).getDay();
  const padded=[...Array(firstWd).fill(null),...shown];
  const cols=Math.ceil(padded.length/7);
  return(
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <div style={{display:"inline-flex",gap:3}}>
        {Array.from({length:cols}).map((_,ci)=>(
          <div key={ci} style={{display:"flex",flexDirection:"column",gap:3}}>
            {Array.from({length:7}).map((_,ri)=>{
              const ds=padded[ci*7+ri];
              if(!ds) return <div key={ri} style={{width:18,height:18}}/>;
              const done=logs[habit.id]?.[ds];
              const isToday=ds===today;
              const future=ds>today;
              return(
                <div key={ri} title={ds} onClick={()=>!future&&onToggle(habit.id,ds)}
                  style={{width:18,height:18,borderRadius:5,background:done?habit.color:"#1a1a2e",
                    border:isToday?`2px solid ${habit.color}`:"1.5px solid #252538",opacity:future?0.2:1}}/>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyChart({habits,logs}){
  const days=last7();
  const data=days.map(d=>({day:DAYS_UZ[new Date(d).getDay()],total:habits.filter(h=>logs[h.id]?.[d]).length}));
  return(
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={22}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" vertical={false}/>
        <XAxis dataKey="day" tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false}/>
        <YAxis hide domain={[0,Math.max(habits.length,1)]}/>
        <Tooltip contentStyle={{background:"#16162a",border:"1px solid #2a2a3e",borderRadius:10,fontSize:12}}
          formatter={v=>[v+" ta odat","Bajarildi"]}/>
        <Bar dataKey="total" fill="#7C6EFA" radius={[6,6,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MonthLine({habits,logs}){
  const days=last30();
  const data=days.map((d,i)=>({day:i+1,foiz:habits.length?Math.round(habits.filter(h=>logs[h.id]?.[d]).length/habits.length*100):0}));
  return(
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" vertical={false}/>
        <XAxis dataKey="day" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v%10===0?v:""}/>
        <YAxis domain={[0,100]} tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
        <Tooltip contentStyle={{background:"#16162a",border:"1px solid #2a2a3e",borderRadius:10,fontSize:12}} formatter={v=>[v+"%","Bajarilish"]}/>
        <Line type="monotone" dataKey="foiz" stroke="#7C6EFA" strokeWidth={2.5} dot={false} activeDot={{r:5,fill:"#7C6EFA"}}/>
      </LineChart>
    </ResponsiveContainer>
  );
}

function HabitModal({initial,onSave,onClose,colorIndex,isMobile}){
  const [name,setName]=useState(initial?.name||"");
  const [icon,setIcon]=useState(initial?.icon||"⭐");
  const [color,setColor]=useState(initial?.color||PALETTE[colorIndex%PALETTE.length]);
  const [cat,setCat]=useState(initial?.category||CATEGORIES[0]);
  const [freq,setFreq]=useState(initial?.frequency||"daily");
  const [cDays,setCDays]=useState(initial?.customDays||[1,2,3,4,5]);
  const [goal,setGoal]=useState(initial?.goal||30);
  const [note,setNote]=useState(initial?.note||"");
  const [reminderOn,setReminderOn]=useState(initial?.reminderOn||false);
  const [reminderTime,setReminderTime]=useState(initial?.reminderTime||"08:00");
  const toggleCD=d=>setCDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d].sort());

  const sheetStyle=isMobile?{
    position:"fixed",bottom:0,left:0,right:0,background:"#13132a",
    borderRadius:"22px 22px 0 0",padding:"16px 16px 32px",
    maxHeight:"92vh",overflowY:"auto",border:"1px solid #2a2a3e",
    boxShadow:"0 -16px 60px rgba(0,0,0,0.7)",zIndex:200
  }:{
    background:"#13132a",borderRadius:22,padding:28,width:520,
    maxHeight:"88vh",overflowY:"auto",border:"1px solid #2a2a3e",
    boxShadow:"0 24px 80px rgba(0,0,0,0.6)"
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:150,
      display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={sheetStyle}>
        {isMobile&&<div style={{width:40,height:4,background:"#333",borderRadius:99,margin:"0 auto 16px"}}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#fff"}}>{initial?"Tahrirlash":"Yangi odat"}</h2>
          <button onClick={onClose} style={{background:"#1a1a2e",border:"none",color:"#888",fontSize:18,
            width:36,height:36,borderRadius:10,cursor:"pointer"}}>✕</button>
        </div>

        <div style={s.lbl}>Belgi</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>setIcon(e)} style={{
              background:icon===e?"#2a2a4e":"#1a1a2e",border:icon===e?`2px solid ${color}`:"2px solid transparent",
              borderRadius:10,width:42,height:42,fontSize:20,cursor:"pointer"}}>{e}</button>
          ))}
        </div>

        <div style={s.lbl}>Nomi</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Masalan: Kitob o'qish"
          style={{...s.input,marginBottom:14}} onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor="#2a2a3e"}/>

        <div style={s.lbl}>Kategoriya</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{
              background:cat===c?color+"33":"#1a1a2e",border:cat===c?`1.5px solid ${color}`:"1.5px solid transparent",
              borderRadius:10,padding:"7px 12px",fontSize:12,color:cat===c?color:"#777",cursor:"pointer"}}>{CAT_ICONS[c]} {c}</button>
          ))}
        </div>

        <div style={s.lbl}>Rang</div>
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          {PALETTE.map(c=>(
            <button key={c} onClick={()=>setColor(c)} style={{width:32,height:32,borderRadius:"50%",background:c,
              border:color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer",padding:0,
              transform:color===c?"scale(1.15)":"scale(1)"}}/>
          ))}
        </div>

        <div style={s.lbl}>Chastota</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:freq==="custom"?8:14}}>
          {FREQ_OPTS.map(f=>(
            <button key={f.val} onClick={()=>setFreq(f.val)} style={{
              background:freq===f.val?color+"22":"#1a1a2e",border:freq===f.val?`1.5px solid ${color}`:"1.5px solid transparent",
              borderRadius:10,padding:10,fontSize:13,color:freq===f.val?color:"#777",cursor:"pointer",fontWeight:freq===f.val?600:400}}>{f.label}</button>
          ))}
        </div>
        {freq==="custom"&&(
          <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"space-between"}}>
            {DAYS_UZ.map((d,i)=>(
              <button key={i} onClick={()=>toggleCD(i)} style={{flex:1,height:40,borderRadius:10,fontSize:11,fontWeight:600,cursor:"pointer",
                background:cDays.includes(i)?color+"33":"#1a1a2e",border:cDays.includes(i)?`1.5px solid ${color}`:"1.5px solid transparent",
                color:cDays.includes(i)?color:"#666"}}>{d}</button>
            ))}
          </div>
        )}

        <div style={s.lbl}>Maqsad (kun)</div>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[7,14,21,30,60,90,365].map(g=>(
            <button key={g} onClick={()=>setGoal(g)} style={{
              background:goal===g?color+"22":"#1a1a2e",border:goal===g?`1.5px solid ${color}`:"1.5px solid transparent",
              borderRadius:9,padding:"7px 12px",fontSize:13,color:goal===g?color:"#777",cursor:"pointer",fontWeight:goal===g?700:400}}>{g}</button>
          ))}
        </div>

        <div style={s.lbl}>Eslatma / Bildirishnoma</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          background:"#1a1a2e",borderRadius:12,padding:"12px 14px",marginBottom:reminderOn?10:14}}>
          <div>
            <div style={{fontSize:13,color:"#ddd",fontWeight:600}}>Bildirishnoma yuborish</div>
            <div style={{fontSize:11,color:"#666",marginTop:2}}>Sahifa ochiq bo'lganda eslatadi</div>
          </div>
          <button onClick={()=>setReminderOn(p=>!p)} style={{
            width:48,height:28,borderRadius:99,border:"none",cursor:"pointer",
            background:reminderOn?color:"#333",position:"relative",transition:"background 0.2s",flexShrink:0
          }}>
            <div style={{
              width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
              left:reminderOn?23:3,transition:"left 0.2s",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"
            }}/>
          </button>
        </div>
        {reminderOn&&(
          <div style={{marginBottom:14}}>
            <input type="time" value={reminderTime} onChange={e=>setReminderTime(e.target.value)}
              style={{...s.input,colorScheme:"dark",fontSize:18,fontWeight:700,textAlign:"center",padding:"12px"}}/>
            <div style={{fontSize:11,color:"#555",marginTop:6,textAlign:"center"}}>
              Har kuni soat {reminderTime} da eslatma chiqadi (24-soatlik format)
            </div>
          </div>
        )}

        <div style={s.lbl}>Izoh</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Nima uchun bu muhim?" rows={2}
          style={{...s.input,resize:"none",fontFamily:"inherit",marginBottom:18}}/>

        <button onClick={()=>{if(name.trim())onSave({name:name.trim(),icon,color,category:cat,frequency:freq,customDays:cDays,goal,note,reminderOn,reminderTime});}}
          style={{width:"100%",padding:16,background:color,color:"#fff",border:"none",
            borderRadius:14,fontSize:16,fontWeight:700,cursor:"pointer"}}>
          {initial?"Saqlash ✓":"Qo'shish +"}
        </button>
      </div>
    </div>
  );
}

function Dashboard({habits,logs,onToggleLog,notifPermission,onRequestNotif}){
  const today=todayStr();
  const due=habits.filter(isDueToday).slice().sort((a,b)=>{
    if(a.reminderOn&&b.reminderOn) return a.reminderTime.localeCompare(b.reminderTime);
    if(a.reminderOn) return -1;
    if(b.reminderOn) return 1;
    return 0;
  });
  const done=due.filter(h=>logs[h.id]?.[today]);
  const pct=due.length?Math.round(done.length/due.length*100):0;
  const allStreaks=habits.map(h=>calcStreak(h.id,logs).current);
  const topStreak=allStreaks.length?Math.max(...allStreaks):0;
  const totalDone=habits.reduce((s,h)=>s+calcTotal(h.id,logs),0);

  return(
    <div>
      {notifPermission==="default"&&habits.some(h=>h.reminderOn)&&(
        <div style={{...s.card,padding:"14px 16px",marginBottom:10,
          border:"1.5px solid #F7A32555",background:"#F7A32511",
          display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>🔔</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#F7A325"}}>Bildirishnomaga ruxsat bering</div>
            <div style={{fontSize:11,color:"#999",marginTop:2}}>Eslatmalar ishlashi uchun kerak</div>
          </div>
          <button onClick={onRequestNotif} style={{background:"#F7A325",color:"#000",border:"none",
            borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
            Ruxsat berish
          </button>
        </div>
      )}
      {notifPermission==="denied"&&habits.some(h=>h.reminderOn)&&(
        <div style={{...s.card,padding:"12px 16px",marginBottom:10,
          border:"1.5px solid #FF6B6B44",background:"#FF6B6B11",fontSize:12,color:"#FF8B8B"}}>
          🔕 Bildirishnoma rad etilgan. Brauzer sozlamalaridan yoqing.
        </div>
      )}
      <div style={{...s.card,padding:"18px 16px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{position:"relative",width:76,height:76,flexShrink:0}}>
            <svg width="76" height="76">
              <circle cx="38" cy="38" r="32" fill="none" stroke="#1a1a2e" strokeWidth="7"/>
              <circle cx="38" cy="38" r="32" fill="none" stroke="#7C6EFA" strokeWidth="7"
                strokeDasharray={`${2*Math.PI*32*pct/100} ${2*Math.PI*32}`}
                strokeLinecap="round" transform="rotate(-90 38 38)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,fontWeight:800,color:"#fff"}}>{pct}%</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:"#888",marginBottom:3}}>Bugungi progress</div>
            <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{done.length}/{due.length} bajarildi</div>
            <div style={{background:"#1a1a2e",borderRadius:99,height:5,marginTop:8,overflow:"hidden"}}>
              <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,#7C6EFA,#FA6E79)",borderRadius:99,transition:"width 0.4s"}}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[["🔥","Eng uzun",topStreak+" k","#F7A325"],["✅","Jami",totalDone,"#3ECFAC"],["📋","Odatlar",habits.length,"#FA6E79"]].map(([ic,lb,vl,cl])=>(
          <div key={lb} style={{...s.card,padding:"13px 8px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:3}}>{ic}</div>
            <div style={{fontSize:17,fontWeight:800,color:cl}}>{vl}</div>
            <div style={{fontSize:9,color:"#666",marginTop:1}}>{lb}</div>
          </div>
        ))}
      </div>

      <div style={{...s.card,padding:14,marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:"#aaa",marginBottom:10}}>Bugungi odatlar</div>
        {due.length===0&&<div style={{color:"#555",fontSize:13}}>Bugun hech narsa yo'q</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {due.map(h=>{
            const d=logs[h.id]?.[today];
            return(
              <button key={h.id} onClick={()=>onToggleLog(h.id,today)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 12px",
                  background:d?h.color+"18":"#1a1a2e",border:`1.5px solid ${d?h.color+"55":"#252538"}`,
                  borderRadius:14,cursor:"pointer",textAlign:"left",width:"100%"}}>
                <div style={{width:38,height:38,borderRadius:11,background:h.color+"22",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{h.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:d?h.color:"#ccc"}}>{h.name}</div>
                  <div style={{fontSize:11,color:"#666",marginTop:1}}>
                    🔥 {calcStreak(h.id,logs).current} kun
                    {h.reminderOn&&h.reminderTime&&<span> · ⏰ {h.reminderTime}</span>}
                  </div>
                </div>
                <div style={{width:28,height:28,borderRadius:8,background:d?h.color:"transparent",
                  border:`2px solid ${d?h.color:"#333"}`,display:"flex",alignItems:"center",
                  justifyContent:"center",color:d?"#fff":"#444",fontSize:16,flexShrink:0}}>
                  {d?"✓":""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{...s.card,padding:14,marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:"#aaa",marginBottom:10}}>📊 Haftalik</div>
        {habits.length?<WeeklyChart habits={habits} logs={logs}/>:<div style={{color:"#444",fontSize:13,padding:"12px 0",textAlign:"center"}}>Odat qo'shing</div>}
      </div>
      <div style={{...s.card,padding:14}}>
        <div style={{fontSize:13,fontWeight:700,color:"#aaa",marginBottom:10}}>📈 30 kunlik trend</div>
        {habits.length?<MonthLine habits={habits} logs={logs}/>:<div style={{color:"#444",fontSize:13,padding:"12px 0",textAlign:"center"}}>Odat qo'shing</div>}
      </div>
    </div>
  );
}

function HabitsPage({habits,logs,onToggleLog,onEdit,onDelete,onAdd}){
  const [expanded,setExpanded]=useState(null);
  const [filter,setFilter]=useState("Barchasi");
  const today=todayStr();
  const cats=["Barchasi",...CATEGORIES.filter(c=>habits.some(h=>h.category===c))];
  const filtered=filter==="Barchasi"?habits:habits.filter(h=>h.category===filter);

  return(
    <div>
      <div style={{display:"flex",gap:8,overflowX:"auto",WebkitOverflowScrolling:"touch",
        paddingBottom:6,marginBottom:14,scrollbarWidth:"none"}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{
            flexShrink:0,background:filter===c?"#7C6EFA22":"#16162a",
            border:filter===c?"1.5px solid #7C6EFA":"1.5px solid #2a2a3e",
            borderRadius:99,padding:"7px 14px",fontSize:12,
            color:filter===c?"#9C8EFA":"#666",cursor:"pointer",whiteSpace:"nowrap"
          }}>{c==="Barchasi"?"Barchasi":CAT_ICONS[c]+" "+c}</button>
        ))}
      </div>

      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:"60px 0",color:"#444"}}>
          <div style={{fontSize:48,marginBottom:12}}>🌱</div>
          <div style={{fontSize:15,marginBottom:6}}>Hali odat yo'q</div>
          <button onClick={onAdd} style={{marginTop:12,padding:"12px 24px",background:"#7C6EFA",
            color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer"}}>
            + Yangi odat qo'shish</button>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(h=>{
          const done=logs[h.id]?.[today];
          const due=isDueToday(h);
          const {current:streak,best}=calcStreak(h.id,logs);
          const total=calcTotal(h.id,logs);
          const pct=Math.min(100,Math.round(total/h.goal*100));
          const open=expanded===h.id;

          return(
            <div key={h.id} style={{...s.card,border:`1.5px solid ${open?h.color+"44":"#2a2a3e"}`,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px"}}>
                <div style={{width:46,height:46,borderRadius:13,background:h.color+"22",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{h.icon}</div>
                <div style={{flex:1,minWidth:0}} onClick={()=>setExpanded(open?null:h.id)}>
                  <div style={{fontSize:15,fontWeight:700,color:"#e0e0f0",marginBottom:2}}>{h.name}</div>
                  <div style={{display:"flex",gap:10,fontSize:11,color:"#666",flexWrap:"wrap"}}>
                    <span>🔥 {streak}</span><span>🏆 {best}</span><span>✅ {total}/{h.goal}</span>
                    {h.reminderOn&&h.reminderTime&&<span style={{color:h.color}}>⏰ {h.reminderTime}</span>}
                  </div>
                  <div style={{marginTop:6,background:"#1a1a2e",borderRadius:99,height:3,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:h.color,borderRadius:99}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>onEdit(h)} style={{background:"none",border:"none",fontSize:17,cursor:"pointer",padding:4}}>✏️</button>
                  {due&&(
                    <button onClick={()=>onToggleLog(h.id,today)} style={{
                      width:42,height:42,borderRadius:12,background:done?h.color:"#1a1a2e",
                      border:`2px solid ${done?h.color:"#333"}`,color:done?"#fff":"#555",fontSize:20,cursor:"pointer"}}>
                      {done?"✓":"○"}
                    </button>
                  )}
                </div>
              </div>

              {open&&(
                <div style={{padding:"0 14px 14px",borderTop:"1px solid #1e1e2e"}}>
                  {h.note&&(
                    <div style={{margin:"12px 0",padding:"10px 12px",background:"#1a1a2e",borderRadius:10,
                      fontSize:12,color:"#888",fontStyle:"italic",borderLeft:`3px solid ${h.color}`}}>
                      💬 {h.note}
                    </div>
                  )}
                  <div style={{display:"flex",gap:12,margin:"12px 0"}}>
                    {[["🔥",streak,"Seriya"],["🏆",best,"Rekord"],["✅",total,"Jami"],["📊",pct+"%","Maqsad"]].map(([ic,vl,lb])=>(
                      <div key={lb} style={{textAlign:"center",flex:1}}>
                        <div style={{fontSize:17,fontWeight:800,color:h.color}}>{vl}</div>
                        <div style={{fontSize:10,color:"#666",marginTop:1}}>{lb}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"#666",marginBottom:8}}>Son 10 hafta:</div>
                  <MiniHeatmap habit={h} logs={logs} onToggle={onToggleLog}/>
                  <button onClick={()=>onDelete(h.id)} style={{marginTop:14,width:"100%",padding:"10px",
                    background:"#FF6B6B11",border:"1px solid #FF6B6B33",borderRadius:10,
                    color:"#FF6B6B",fontSize:13,cursor:"pointer",fontWeight:600}}>
                    🗑 Odatni o'chirish
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPage({habits,logs}){
  const [vd,setVd]=useState(new Date());
  const year=vd.getFullYear(), month=vd.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate();
  const today=todayStr();
  const cells=[...Array(firstDay).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  function ds(d){ return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={()=>setVd(new Date(year,month-1,1))} style={{background:"#16162a",border:"1px solid #2a2a3e",
          color:"#888",width:40,height:40,borderRadius:12,cursor:"pointer",fontSize:18}}>‹</button>
        <h2 style={{margin:0,fontSize:18,color:"#ddd",flex:1,textAlign:"center"}}>{MONTHS_UZ[month]} {year}</h2>
        <button onClick={()=>setVd(new Date(year,month+1,1))} style={{background:"#16162a",border:"1px solid #2a2a3e",
          color:"#888",width:40,height:40,borderRadius:12,cursor:"pointer",fontSize:18}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {DAYS_UZ.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"#555",padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const dayStr=ds(d);
          const isToday=dayStr===today;
          const future=dayStr>today;
          const doneH=habits.filter(h=>logs[h.id]?.[dayStr]);
          return(
            <div key={i} style={{background:isToday?"#7C6EFA22":"#16162a",
              border:`1.5px solid ${isToday?"#7C6EFA":"#2a2a3e"}`,
              borderRadius:10,padding:"6px 4px",minHeight:52,opacity:future?0.45:1}}>
              <div style={{fontSize:11,fontWeight:isToday?800:400,color:isToday?"#9C8EFA":"#999",marginBottom:3}}>{d}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                {doneH.slice(0,4).map(h=><div key={h.id} style={{width:7,height:7,borderRadius:2,background:h.color}}/>)}
              </div>
            </div>
          );
        })}
      </div>
      {habits.length>0&&(
        <div style={{...s.card,padding:14,marginTop:14}}>
          <div style={{fontSize:12,color:"#666",marginBottom:10,fontWeight:600}}>Odatlar ranglari</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {habits.map(h=>(
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:9,height:9,borderRadius:2,background:h.color}}/>
                <span style={{fontSize:11,color:"#777"}}>{h.icon} {h.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsPage({habits,logs}){
  if(!habits.length) return(
    <div style={{textAlign:"center",padding:"60px 0",color:"#444"}}>
      <div style={{fontSize:48,marginBottom:12}}>📊</div>
      <div>Statistika uchun odat qo'shing</div>
    </div>
  );
  const ranked=[...habits].map(h=>({
    ...h,streak:calcStreak(h.id,logs).current,best:calcStreak(h.id,logs).best,total:calcTotal(h.id,logs)
  })).sort((a,b)=>b.streak-a.streak);

  return(
    <div>
      <div style={{fontSize:11,color:"#666",fontWeight:700,letterSpacing:0.6,marginBottom:10}}>SERIYA REYTINGI</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
        {ranked.map((h,i)=>(
          <div key={h.id} style={{...s.card,padding:"13px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:20,width:28,textAlign:"center"}}>
              {i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{fontSize:13,color:"#555"}}>#{i+1}</span>}
            </div>
            <div style={{width:38,height:38,borderRadius:11,background:h.color+"22",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{h.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,color:"#ddd",fontSize:14}}>{h.name}</div>
              <div style={{fontSize:11,color:"#666"}}>{h.category}</div>
            </div>
            <div style={{display:"flex",gap:12,fontSize:11}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#F7A325"}}>{h.streak}</div>
                <div style={{color:"#555"}}>Seriya</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#3ECFAC"}}>{h.total}</div>
                <div style={{color:"#555"}}>Jami</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{fontSize:11,color:"#666",fontWeight:700,letterSpacing:0.6,marginBottom:10}}>30 KUNLIK TREND</div>
      <div style={{...s.card,padding:14,marginBottom:16}}>
        <MonthLine habits={habits} logs={logs}/>
      </div>
      <div style={{fontSize:11,color:"#666",fontWeight:700,letterSpacing:0.6,marginBottom:10}}>HAFTALIK</div>
      <div style={{...s.card,padding:14}}>
        <WeeklyChart habits={habits} logs={logs}/>
      </div>
    </div>
  );
}

const NAV=[
  {id:"dashboard",icon:"🏠",label:"Asosiy"},
  {id:"habits",   icon:"✅",label:"Odatlar"},
  {id:"calendar", icon:"📅",label:"Taqvim"},
  {id:"stats",    icon:"📊",label:"Statistika"},
];

export default function App(){
  const [habits,setHabits]=useState(()=>load("hb_habits",[]));
  const [logs,setLogs]    =useState(()=>load("hb_logs",{}));
  const [page,setPage]    =useState("dashboard");
  const [modal,setModal]  =useState(null);
  const [toast,setToast]  =useState(null);
  const [notifPermission,setNotifPermission]=useState(
    typeof Notification!=="undefined"?Notification.permission:"unsupported"
  );
  const isMobile=useIsMobile();

  useEffect(()=>{ save("hb_habits",habits); },[habits]);
  useEffect(()=>{ save("hb_logs",logs); },[logs]);

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(null),2200); }

  async function requestNotifPermission(){
    if(typeof Notification==="undefined"){ showToast("⚠️ Brauzeringiz qo'llab-quvvatlamaydi"); return false; }
    if(Notification.permission==="granted"){ setNotifPermission("granted"); return true; }
    const perm=await Notification.requestPermission();
    setNotifPermission(perm);
    if(perm!=="granted") showToast("🔕 Bildirishnomaga ruxsat berilmadi");
    return perm==="granted";
  }

  // Check every 30s whether any habit's reminder time matches now, fire once per day per habit
  useEffect(()=>{
    if(notifPermission!=="granted") return;
    const fired = load("hb_fired_today",{});
    const interval=setInterval(()=>{
      const now=new Date();
      const hhmm=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const today=todayStr();
      habits.forEach(h=>{
        if(!h.reminderOn||!h.reminderTime) return;
        if(!isDueToday(h)) return;
        if(logs[h.id]?.[today]) return; // already done
        const key=`${h.id}_${today}`;
        if(h.reminderTime===hhmm && fired[key]!==true){
          new Notification(`${h.icon} ${h.name}`, {
            body:"Bu odatni bajarish vaqti keldi!",
            tag:key,
          });
          fired[key]=true;
          save("hb_fired_today",fired);
        }
      });
    },30000);
    return ()=>clearInterval(interval);
  },[habits,logs,notifPermission]);

  const toggleLog=useCallback((id,day)=>{
    setLogs(p=>({...p,[id]:{...(p[id]||{}),[day]:!p[id]?.[day]}}));
  },[]);

  function saveHabit(data){
    if(data.reminderOn && notifPermission!=="granted"){
      requestNotifPermission();
    }
    if(modal&&modal!=="add"){
      setHabits(p=>p.map(h=>h.id===modal.id?{...h,...data}:h));
      showToast("✅ Yangilandi");
    } else {
      setHabits(p=>[...p,{id:Date.now().toString(),...data}]);
      showToast("🎉 Qo'shildi!");
    }
    setModal(null);
  }
  function deleteHabit(id){
    setHabits(p=>p.filter(h=>h.id!==id));
    setLogs(p=>{ const n={...p}; delete n[id]; return n; });
    showToast("🗑 O'chirildi");
  }

  const today=todayStr();
  const due=habits.filter(isDueToday);
  const done=due.filter(h=>logs[h.id]?.[today]);

  return(
    <div style={{minHeight:"100vh",background:"#0c0c1a",color:"#e0e0f0",
      fontFamily:"'Inter','SF Pro Display',-apple-system,sans-serif",
      display:"flex",flexDirection:isMobile?"column":"row"}}>

      {!isMobile&&(
        <div style={{width:220,background:"#111125",borderRight:"1px solid #1e1e35",
          display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
          <div style={{padding:"0 20px 20px",borderBottom:"1px solid #1e1e35"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#fff"}}><span style={{color:"#7C6EFA"}}>◆</span> HabitFlow</div>
            <div style={{fontSize:11,color:"#555",marginTop:3}}>Kunlik odat kuzatuvi</div>
          </div>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #1e1e35"}}>
            <div style={{fontSize:11,color:"#555",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>Bugun</div>
            <div style={{fontSize:13,color:"#aaa",marginBottom:6}}>{done.length}/{due.length} bajarildi</div>
            <div style={{background:"#1a1a2e",borderRadius:99,height:5,overflow:"hidden"}}>
              <div style={{width:(due.length?done.length/due.length*100:0)+"%",height:"100%",
                background:"linear-gradient(90deg,#7C6EFA,#FA6E79)",borderRadius:99,transition:"width 0.4s"}}/>
            </div>
          </div>
          <nav style={{padding:"10px 10px",flex:1}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{
                display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"11px 12px",borderRadius:12,border:"none",
                background:page===n.id?"#7C6EFA22":"transparent",
                color:page===n.id?"#9C8EFA":"#666",fontSize:14,
                fontWeight:page===n.id?700:400,cursor:"pointer",textAlign:"left",marginBottom:2}}>
                <span style={{fontSize:17}}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <div style={{padding:"0 10px 20px"}}>
            <button onClick={()=>setModal("add")} style={{width:"100%",padding:11,borderRadius:12,
              border:"1.5px dashed #2a2a4a",background:"transparent",color:"#7C6EFA",
              fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Yangi odat</button>
          </div>
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?88:0}}>
        {isMobile&&(
          <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(12,12,26,0.96)",
            backdropFilter:"blur(12px)",padding:"12px 14px",borderBottom:"1px solid #1e1e35",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:"#fff"}}><span style={{color:"#7C6EFA"}}>◆</span> HabitFlow</div>
              <div style={{fontSize:10,color:"#666",marginTop:1}}>
                {new Date().toLocaleDateString("uz-UZ",{weekday:"long",day:"numeric",month:"short"})}
              </div>
            </div>
            <button onClick={()=>setModal("add")} style={{background:"#7C6EFA",color:"#fff",border:"none",
              borderRadius:12,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Odat</button>
          </div>
        )}

        <div style={{maxWidth:isMobile?undefined:860,margin:"0 auto",padding:isMobile?"12px 12px":"28px 28px"}}>
          {!isMobile&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
              <div>
                <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#fff"}}>
                  {NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}
                </h1>
                <p style={{margin:"3px 0 0",fontSize:12,color:"#555"}}>
                  {new Date().toLocaleDateString("uz-UZ",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
                </p>
              </div>
              {page==="habits"&&<button onClick={()=>setModal("add")} style={{background:"#7C6EFA",color:"#fff",
                border:"none",borderRadius:12,padding:"10px 20px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                + Yangi odat</button>}
            </div>
          )}

          {page==="dashboard"&&<Dashboard habits={habits} logs={logs} onToggleLog={toggleLog}
            notifPermission={notifPermission} onRequestNotif={requestNotifPermission}/>}
          {page==="habits"&&<HabitsPage habits={habits} logs={logs} onToggleLog={toggleLog}
            onEdit={h=>setModal(h)} onDelete={deleteHabit} onAdd={()=>setModal("add")}/>}
          {page==="calendar"&&<CalendarPage habits={habits} logs={logs}/>}
          {page==="stats"&&<StatsPage habits={habits} logs={logs}/>}
        </div>
      </div>

      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,
          background:"rgba(17,17,37,0.97)",backdropFilter:"blur(16px)",
          borderTop:"1px solid #1e1e35",display:"flex",
          paddingBottom:"max(8px, env(safe-area-inset-bottom))"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{
              flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",cursor:"pointer",padding:"8px 0"}}>
              <span style={{fontSize:22}}>{n.icon}</span>
              <span style={{fontSize:10,fontWeight:page===n.id?700:400,
                color:page===n.id?"#9C8EFA":"#555"}}>{n.label}</span>
              {page===n.id&&<div style={{width:4,height:4,borderRadius:99,background:"#7C6EFA"}}/>}
            </button>
          ))}
        </div>
      )}

      {modal&&<HabitModal initial={modal==="add"?null:modal} colorIndex={habits.length}
        onSave={saveHabit} onClose={()=>setModal(null)} isMobile={isMobile}/>}

      {toast&&(
        <div style={{position:"fixed",bottom:isMobile?96:28,left:"50%",transform:"translateX(-50%)",
          background:"#1e1e35",border:"1px solid #2a2a4a",borderRadius:12,
          padding:"12px 22px",fontSize:14,color:"#ddd",
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:300,whiteSpace:"nowrap"}}>{toast}</div>
      )}
    </div>
  );
}
