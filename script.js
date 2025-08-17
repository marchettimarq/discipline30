
const KEY="discipline30_v5";
const SETTINGS={
  programDaysTotal:180, phaseLength:30, startDate:null,
  phasesStarted:[true,false,false,false,false,false], // v3: manual starts
  weeklyPlan:{
    "Mon":["Run / Run-Walk","Yoga / Mobility (15–20m)"],
    "Tue":["Strength (20–30m)"],
    "Wed":["Run / Run-Walk"],
    "Thu":["Yoga / Mobility (15–20m)"],
    "Fri":["Speed/Tempo Run","Strength (20–30m)"],
    "Sat":["Long Walk","Writing Session (optional)","Spring Clean Task (optional)"],
    "Sun":["Long Run","Meal Prep","Writing Session (optional)","Spring Clean Task (optional)"]
  },
  anchors:[
    {name:"Workout #1 (≥30 min)",key:"w1",optional:false},
    {name:"Workout #2 (≥30 min, preferably outdoors)",key:"w2",optional:false},
    {name:"10,000 steps",key:"steps",optional:false},
    {name:"Drink 3L water",key:"water",optional:false},
    {name:"Log Food",key:"logfood",optional:false},
    {name:"Read 20+ minutes",key:"read",optional:false},
    {name:"Complete Writing Task",key:"write",optional:false},
    {name:"List one positive thing",key:"positive",optional:false},
    {name:"PCS/Admin Task (Mon–Fri, optional)",key:"pcs",optional:true,onlyWeekdays:true},
    {name:"Text something nice to Bella (optional)",key:"bella",optional:true,onlySunday:true}
  ],
  theme:"zen" // zen | mid | dark
};

function load(){
  let raw=localStorage.getItem(KEY);
  if(!raw){
    const today=new Date();
    const st={settings:{...SETTINGS,startDate:today.toISOString().slice(0,10)}, logs:{}};
    localStorage.setItem(KEY, JSON.stringify(st));
    return st;
  }
  return JSON.parse(raw);
}
function save(s){ localStorage.setItem(KEY,JSON.stringify(s)); }
function dateKey(d){ return d.toISOString().slice(0,10); }
function dayNumber(startISO, today){
  const start=new Date(startISO+"T00:00:00");
  return Math.max(1, Math.floor((today-start)/(1000*60*60*24))+1);
}
function phaseOfDay(n,len){ return Math.ceil(n/len); }
let STATE = load();
applyTheme();

function applyTheme(){
  document.body.classList.remove("theme-dark","theme-mid");
  if(STATE.settings.theme==="dark") document.body.classList.add("theme-dark");
  if(STATE.settings.theme==="mid") document.body.classList.add("theme-mid");
}

function todayAnchors(date){
  const dow=date.getDay();
  const list=[];
  for(const a of STATE.settings.anchors){
    if(a.onlySunday && dow!==0) continue;
    if(a.onlyWeekdays && (dow===0||dow===6)) continue;
    list.push(a);
  }
  return list;
}

function startedPhaseCount(){ return STATE.settings.phasesStarted.filter(Boolean).length; }
function effectiveDayNum(rawDay){
  const cap = startedPhaseCount() * STATE.settings.phaseLength;
  return Math.min(rawDay, cap===0?1:cap);
}

function renderPhaseDashboard(dayNum){
  const pills=document.getElementById("phasePills"); pills.innerHTML="";
  const total=STATE.settings.programDaysTotal;
  const len=STATE.settings.phaseLength;
  const currentPhase=Math.ceil(dayNum/len);
  for(let i=1;i<=total/len;i++){
    const span=document.createElement("div");
    span.className="phase-pill"+(i===currentPhase?" active":"");
    span.textContent=`P${i}`;
    span.addEventListener("click",()=>{ previewPhase=i; renderCalendar(); });
    pills.appendChild(span);
  }
}

function render(){
  applyTheme();
  const s=STATE.settings;
  const logs=STATE.logs;
  const today=new Date();
  const rawDay=dayNumber(s.startDate,today);
  const dayNum=effectiveDayNum(rawDay);
  const phaseNum=phaseOfDay(dayNum,s.phaseLength);
  document.getElementById("dayInfo").textContent=`Phase ${phaseNum} · Day ${((dayNum-1)%s.phaseLength)+1} / ${s.phaseLength}`;
  const dowLong=today.toLocaleDateString(undefined,{weekday:'long'});
  const dowShort=today.toLocaleDateString(undefined,{weekday:'short'});
  document.getElementById("dowBadge").textContent=dowLong;
  // progress bar
  const pct=((dayNum-1)%s.phaseLength+1)/s.phaseLength*100;
  document.getElementById("progressBar").style.width=`${pct}%`;
  renderPhaseDashboard(dayNum);

  const key=dateKey(today);
  const rec = logs[key] || (logs[key]={anchors:{},plan:{},note:"",completed:false});

  // Build anchors list
  const list = todayAnchors(today);
  const box = document.getElementById("dailyList"); box.innerHTML="";
  list.forEach((a,i)=>{
    const id=`a_${a.key}`;
    const li=document.createElement("div"); li.className="card"+(rec.anchors[id]?" done":"")+(a.optional?" optional":"");
    const cb=document.createElement("div"); cb.className="checkbox"; cb.textContent=rec.anchors[id]?"✓":" ";
    cb.addEventListener("click",()=>{ rec.anchors[id]=!rec.anchors[id]; save(STATE); render(); });
    const title=document.createElement("div"); title.className="title"; title.textContent=a.name;
    const hint=document.createElement("div"); hint.className="hint"; hint.textContent=a.optional?"Optional":"Required";
    li.appendChild(cb); li.appendChild(title); li.appendChild(hint);
    li.addEventListener("click",(e)=>{ if(e.target!==cb){ rec.anchors[id]=!rec.anchors[id]; save(STATE); render(); } });
    box.appendChild(li);
  });

  // Today's plan
  const planBox=document.getElementById("planList"); planBox.innerHTML="";
  const plan = (s.weeklyPlan[dowShort] || s.weeklyPlan[dowLong]) || [];
  plan.forEach((name, idx)=>{
    const id=`p_${idx}`;
    const li=document.createElement("div"); li.className="card"+(rec.plan[id]?" done":"");
    const cb=document.createElement("div"); cb.className="checkbox"; cb.textContent=rec.plan[id]?"✓":" ";
    cb.addEventListener("click",()=>{ rec.plan[id]=!rec.plan[id]; save(STATE); render(); });
    const title=document.createElement("div"); title.className="title"; title.textContent=name;
    const hint=document.createElement("div"); hint.className="hint"; hint.textContent="Tap to toggle";
    li.appendChild(cb); li.appendChild(title); li.appendChild(hint);
    li.addEventListener("click",(e)=>{ if(e.target!==cb){ rec.plan[id]=!rec.plan[id]; save(STATE); render(); } });
    planBox.appendChild(li);
  });

  // Notes
  const note=document.getElementById("noteBox");
  note.value=rec.note||"";
  note.oninput=()=>{ rec.note = note.value; save(STATE); };

  // Calendar for current/preview phase
  renderCalendar();
}

let previewPhase=null;
function renderCalendar(){
  const s=STATE.settings;
  const today=new Date();
  const rawDay=dayNumber(s.startDate,today);
  const effDay=effectiveDayNum(rawDay);
  const currentPhase=Math.ceil(effDay/s.phaseLength);
  const phase = previewPhase || currentPhase;
  const cal = document.getElementById("calendar"); cal.innerHTML="";
  for(let d=1; d<=s.phaseLength; d++){
    const globalDay = (phase-1)*s.phaseLength + d;
    const thisDate = new Date(new Date(s.startDate+"T00:00:00").getTime() + (globalDay-1)*24*3600*1000);
    const key=dateKey(thisDate);
    const rec = STATE.logs[key];
    const cell=document.createElement("div"); cell.className="daycell";
    cell.textContent = d;
    if(rec && rec.completed) cell.classList.add("done");
    else if(rec) cell.classList.add("missed");
    cell.addEventListener("click",()=> openDayRecap(thisDate));
    cal.appendChild(cell);
  }
}

function openDayRecap(date){
  // allow editing past day anchors & note
  const key=dateKey(date);
  const rec = STATE.logs[key] || (STATE.logs[key]={anchors:{},plan:{},note:"",completed:false});
  // Build recap view
  const list = todayAnchors(date);
  const cont=document.getElementById("recapList"); cont.innerHTML="";
  list.forEach(a=>{
    const id=`a_${a.key}`;
    const row=document.createElement("div");
    const ok = !!rec.anchors[id];
    row.textContent = `${ok?"✓":"○"}  ${a.name}${a.optional?" (opt)":""}`;
    row.style.cursor="pointer";
    row.addEventListener("click",()=>{ rec.anchors[id]=!rec.anchors[id]; save(STATE); openDayRecap(date); });
    cont.appendChild(row);
  });
  const pos=document.getElementById("recapPositive");
  pos.value = rec.note || "";
  document.getElementById("btnRecapSave").onclick = ()=>{
    rec.note = pos.value;
    rec.completed = list.every(a=> a.optional || rec.anchors[`a_${a.key}`]);
    save(STATE);
    closeRecap();
    render();
  };
  document.getElementById("btnRecapEdit").onclick = closeRecap;
  openRecap();
}

function requiredComplete(date){
  const list = todayAnchors(date);
  const rec = STATE.logs[dateKey(date)] || {anchors:{}};
  for(const a of list){
    if(a.optional) continue;
    if(!rec.anchors[`a_${a.key}`]) return false;
  }
  return true;
}

function highlightMissed(){
  const today=new Date();
  const list=todayAnchors(today);
  const rec=STATE.logs[dateKey(today)] || {anchors:{}};
  const box=document.getElementById("dailyList");
  const cards=[...box.children];
  cards.forEach((card, idx)=>{
    const a=list[idx];
    const id=`a_${a.key}`;
    card.classList.remove("warn");
    if(!a.optional && !rec.anchors[id]) card.classList.add("warn");
  });
}

function openConfirm(){ document.getElementById("confirmModal").style.display="flex"; }
function closeConfirm(){ document.getElementById("confirmModal").style.display="none"; }
function openRecap(){ document.getElementById("recapModal").style.display="flex"; }
function closeRecap(){ document.getElementById("recapModal").style.display="none"; }

function finishDay(){
  const today=new Date();
  if(!requiredComplete(today)){
    highlightMissed();
    openConfirm();
    return;
  }
  // success recap
  openDayRecap(today);
}

function handlePhaseGatingAfter(today){
  const s=STATE.settings;
  const raw=dayNumber(s.startDate,today);
  const eff=effectiveDayNum(raw);
  if(eff % s.phaseLength === 0){
    const curPhase = Math.ceil(eff / s.phaseLength);
    const nextIdx = curPhase; // 0-based array index
    if(nextIdx < s.phasesStarted.length && !s.phasesStarted[nextIdx]){
      // ask to start next phase
      const go = confirm(`🎉 Phase ${curPhase} complete!\n\nStart Phase ${curPhase+1} now?`);
      if(go){ s.phasesStarted[nextIdx] = true; save(STATE); alert(`Phase ${curPhase+1} started.`); }
      else { alert("You can start the next phase any time from here."); }
    }
  }
}

function resetToday(){
  const today=new Date();
  STATE.logs[dateKey(today)]={anchors:{},plan:{},note:"",completed:false};
  save(STATE); render();
}
function clearAll(){
  if(confirm("Erase ALL saved data?")){ localStorage.removeItem(KEY); STATE=load(); applyTheme(); render(); }
}

// Settings panel
function openSettings(){
  // Theme buttons
  document.getElementById("themeZen").onclick=()=>{ STATE.settings.theme="zen"; save(STATE); applyTheme(); };
  document.getElementById("themeMid").onclick=()=>{ STATE.settings.theme="mid"; save(STATE); applyTheme(); };
  document.getElementById("themeDark").onclick=()=>{ STATE.settings.theme="dark"; save(STATE); applyTheme(); };

  // Anchors list editor
  const host=document.getElementById("settingsAnchors"); host.innerHTML="";
  STATE.settings.anchors.forEach((a,idx)=>{
    const row=document.createElement("div"); row.className="settings-row";
    const name=document.createElement("input"); name.type="text"; name.value=a.name;
    const tog=document.createElement("button"); tog.textContent=a.optional?"Optional":"Required"; tog.className="icon-btn";
    const del=document.createElement("button"); del.textContent="Delete"; del.className="icon-btn";
    tog.onclick=()=>{ a.optional=!a.optional; tog.textContent=a.optional?"Optional":"Required"; save(STATE); };
    del.onclick=()=>{ STATE.settings.anchors.splice(idx,1); save(STATE); openSettings(); };
    name.oninput=()=>{ a.name=name.value; save(STATE); };
    row.appendChild(name); row.appendChild(tog); row.appendChild(del); host.appendChild(row);
  });

  // Add task controls
  const newToggle=document.getElementById("newTaskToggle");
  let newOptional=false;
  newToggle.onclick=()=>{ newOptional=!newOptional; newToggle.textContent=newOptional?"Optional":"Required"; };

  document.getElementById("btnAddTask").onclick=()=>{
    const nm=document.getElementById("newTaskName").value.trim();
    if(!nm) return;
    const key = nm.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,16) + Math.floor(Math.random()*1000);
    STATE.settings.anchors.push({name:nm,key,optional:newOptional});
    document.getElementById("newTaskName").value=""; newOptional=false; newToggle.textContent="Required";
    save(STATE); openSettings();
  };

  // Plans
  const setVal=(id,arr)=>{ document.getElementById(id).value = (arr||[]).join(", "); };
  const s=STATE.settings;
  setVal("planMon", s.weeklyPlan["Mon"]);
  setVal("planTue", s.weeklyPlan["Tue"]);
  setVal("planWed", s.weeklyPlan["Wed"]);
  setVal("planThu", s.weeklyPlan["Thu"]);
  setVal("planFri", s.weeklyPlan["Fri"]);
  setVal("planSat", s.weeklyPlan["Sat"]);
  setVal("planSun", s.weeklyPlan["Sun"]);

  document.getElementById("settingsModal").style.display="flex";
}
function saveSettings(){
  const read=(id)=>document.getElementById(id).value.split(",").map(s=>s.trim()).filter(Boolean);
  const s=STATE.settings;
  s.weeklyPlan["Mon"]=read("planMon");
  s.weeklyPlan["Tue"]=read("planTue");
  s.weeklyPlan["Wed"]=read("planWed");
  s.weeklyPlan["Thu"]=read("planThu");
  s.weeklyPlan["Fri"]=read("planFri");
  s.weeklyPlan["Sat"]=read("planSat");
  s.weeklyPlan["Sun"]=read("planSun");
  save(STATE);
  document.getElementById("settingsModal").style.display="none";
  render();
}
function closeSettings(){ document.getElementById("settingsModal").style.display="none"; }

// Confirm modal actions
window.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("btnFinish").addEventListener("click", finishDay);
  document.getElementById("btnReset").addEventListener("click", resetToday);
  document.getElementById("btnClear").addEventListener("click", clearAll);
  document.getElementById("btnSettings").addEventListener("click", openSettings);
  document.getElementById("btnSettingsCancel").addEventListener("click", closeSettings);
  document.getElementById("btnSettingsSave").addEventListener("click", saveSettings);
  document.getElementById("btnCompleteNow").addEventListener("click", closeConfirm);
  document.getElementById("btnContinueAnyway").addEventListener("click", ()=>{
    closeConfirm();
    const choice = confirm("Mark today as partial and continue? (OK = Partial / Cancel = Keep editing)");
    if(choice){
      const today=new Date(); const key=dateKey(today);
      const rec = STATE.logs[key] || (STATE.logs[key]={anchors:{},plan:{},note:"",completed:false});
      rec.completed=false; save(STATE); render();
    }
  });

  // Tabs + swipe
  const inner=document.getElementById("swipeInner");
  const tTasks=document.getElementById("tabTasks");
  const tCal=document.getElementById("tabCalendar");
  const setTab = (idx)=>{
    inner.style.transform = `translateX(${idx===0?0:-50}%)`;
    tTasks.classList.toggle("active", idx===0);
    tCal.classList.toggle("active", idx===1);
  };
  tTasks.onclick=()=>setTab(0);
  tCal.onclick=()=>setTab(1);

  // Touch swipe
  let startX=0, cur=0;
  inner.addEventListener("touchstart",(e)=>{ startX = e.touches[0].clientX; cur = inner.style.transform.includes("-50")?1:0; },{passive:true});
  inner.addEventListener("touchmove",(e)=>{}, {passive:true});
  inner.addEventListener("touchend",(e)=>{
    const dx = e.changedTouches[0].clientX - startX;
    if(dx < -40 && cur===0) setTab(1);
    if(dx > 40 && cur===1) setTab(0);
  });

  render();

  // After recap save, gate next phase if applicable
  document.getElementById("btnRecapSave").addEventListener("click", ()=>{
    const today=new Date();
    // small delay to allow render then gate
    setTimeout(()=> handlePhaseGatingAfter(today), 50);
  });
});
