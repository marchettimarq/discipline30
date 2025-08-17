
const KEY="discipline30_v6";
const DEFAULTS={
  palette:"soft",
  programDaysTotal:180, phaseLength:30, startDate:null,
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
    {name:"10K Steps",key:"steps",optional:false},
    {name:"Drink 3L water",key:"water",optional:false},
    {name:"Log Food",key:"logfood",optional:false},
    {name:"Read 20+ minutes",key:"read",optional:false},
    {name:"Complete Writing Task",key:"write",optional:false},
    {name:"List one positive thing",key:"positive",optional:false},
    {name:"PCS/Admin Task (Mon–Fri, optional)",key:"pcs",optional:true,onlyWeekdays:true}
  ]
};

function load(){ let raw=localStorage.getItem(KEY);
  if(!raw){ const today=new Date(); const st={settings:{...DEFAULTS,startDate:today.toISOString().slice(0,10)}, logs:{}}; localStorage.setItem(KEY, JSON.stringify(st)); return st; }
  return JSON.parse(raw);
}
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
function dateKey(d){ return d.toISOString().slice(0,10); }
function dayNumber(startISO,today){ const start=new Date(startISO+"T00:00:00"); return Math.max(1, Math.floor((today-start)/(1000*60*60*24))+1); }
function phaseOfDay(n,len){ return Math.ceil(n/len); }
let STATE = load();

// ---------- THEME ----------
function applyPalette(name){
  const root=document.documentElement.style;
  if(name==="dark"){
    root.setProperty('--bg','var(--bg-dark)');
    root.setProperty('--card','var(--card-dark)');
    root.setProperty('--ink','var(--ink-dark)');
    root.setProperty('--muted','var(--muted-dark)');
    root.setProperty('--line','var(--line-dark)');
    root.setProperty('--accent','var(--accent-dark)');
  }else if(name==="mid"){
    root.setProperty('--bg','var(--bg-mid)');
    root.setProperty('--card','var(--card-mid)');
    root.setProperty('--ink','var(--ink-mid)');
    root.setProperty('--muted','var(--muted-mid)');
    root.setProperty('--line','var(--line-mid)');
    root.setProperty('--accent','var(--accent-mid)');
  }else{ // soft
    root.setProperty('--bg','#f9f9f7');
    root.setProperty('--card','#ffffff');
    root.setProperty('--ink','#222529');
    root.setProperty('--muted','#6f7782');
    root.setProperty('--line','#e6e6e6');
    root.setProperty('--accent','#58bfa0');
  }
}
applyPalette(STATE.settings.palette||'soft');

// ---------- HELPERS ----------
function todaysAnchors(date){
  const dow=date.getDay(); const list=[];
  for(const a of STATE.settings.anchors){
    if(a.onlySunday && dow!==0) continue;
    if(a.onlyWeekdays && (dow===0||dow===6)) continue;
    list.push(a);
  }
  return list;
}

// inline SVG checkbox factory
function makeCheckbox(checked){
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS,"svg");
  svg.setAttribute("viewBox","0 0 24 24");
  svg.setAttribute("width","22"); svg.setAttribute("height","22");
  const circle = document.createElementNS(svgNS,"circle");
  circle.setAttribute("cx","12"); circle.setAttribute("cy","12"); circle.setAttribute("r","10");
  circle.setAttribute("fill", checked ? "var(--accent)" : "none");
  circle.setAttribute("stroke", checked ? "var(--accent)" : "#cfd6cf");
  circle.setAttribute("stroke-width","2");
  const path = document.createElementNS(svgNS,"path");
  path.setAttribute("d","M7 12.5 L10 16 L17 8");
  path.setAttribute("stroke", checked ? "#fff" : "transparent");
  path.setAttribute("stroke-width","2");
  path.setAttribute("fill","none");
  path.setAttribute("stroke-linecap","round");
  path.setAttribute("stroke-linejoin","round");
  svg.appendChild(circle); svg.appendChild(path);
  return svg;
}

// ---------- RENDER ----------
function renderPhaseDashboard(dayNum){
  const pills=document.getElementById("phasePills"); pills.innerHTML="";
  const total=STATE.settings.programDaysTotal; const len=STATE.settings.phaseLength;
  const currentPhase=Math.ceil(dayNum/len);
  for(let i=1;i<=total/len;i++){
    const span=document.createElement("div"); span.className="phase-pill"+(i===currentPhase?" active":""); span.textContent=`P${i}`; pills.appendChild(span);
  }
}

function render(){
  const s=STATE.settings, logs=STATE.logs, today=new Date();
  const key=dateKey(today);
  const dowLong=today.toLocaleDateString(undefined,{weekday:'long'});
  const dowShort=today.toLocaleDateString(undefined,{weekday:'short'});
  const dayNum=dayNumber(s.startDate,today); const phaseNum=phaseOfDay(dayNum,s.phaseLength);
  document.getElementById("dayInfo").textContent=`Phase ${phaseNum} · Day ${((dayNum-1)%s.phaseLength)+1} / ${s.phaseLength}`;
  document.getElementById("dowBadge").textContent=dowLong;
  const pct=((dayNum-1)%s.phaseLength+1)/s.phaseLength*100; document.getElementById("progressBar").style.width=`${pct}%`;
  document.getElementById("phaseLabel").textContent=`Phase ${phaseNum}`;
  renderPhaseDashboard(dayNum);

  const rec = logs[key] || (logs[key]={anchors:{},plan:{},note:"",completed:false});

  // daily list
  const list = todaysAnchors(today);
  const box = document.getElementById("dailyList"); box.innerHTML="";
  list.forEach((a)=>{
    const id=`a_${a.key}`;
    const checked=!!rec.anchors[id];
    const li=document.createElement("div"); li.className="card"+(checked?" done":"")+(a.optional?" optional":"");
    const cb=document.createElement("div"); cb.className="checkbox"; cb.appendChild(makeCheckbox(checked));
    cb.addEventListener("click",(e)=>{ e.stopPropagation(); rec.anchors[id]=!rec.anchors[id]; save(STATE); render(); });
    const title=document.createElement("div"); title.className="title"; title.textContent=a.name;
    const hint=document.createElement("div"); hint.className="hint"; hint.textContent=a.optional?"Optional":"Required";
    li.appendChild(cb); li.appendChild(title); li.appendChild(hint);
    li.addEventListener("click",()=>{ rec.anchors[id]=!rec.anchors[id]; save(STATE); render(); });
    box.appendChild(li);
  });

  // plan list (no bullets/icons)
  const planBox=document.getElementById("planList"); planBox.innerHTML="";
  const plan = (s.weeklyPlan[dowShort] || s.weeklyPlan[dowLong]) || [];
  plan.forEach((name, idx)=>{
    const id=`p_${idx}`;
    const checked = rec.plan && rec.plan[id];
    const li=document.createElement("div"); li.className="card"+(checked?" done":"");
    const cb=document.createElement("div"); cb.className="checkbox"; cb.appendChild(makeCheckbox(checked));
    cb.addEventListener("click",(e)=>{ e.stopPropagation(); rec.plan = rec.plan||{}; rec.plan[id]=!rec.plan[id]; save(STATE); render(); });
    const title=document.createElement("div"); title.className="title"; title.textContent=name;
    const hint=document.createElement("div"); hint.className="hint"; hint.textContent="Tap to toggle";
    li.appendChild(cb); li.appendChild(title); li.appendChild(hint);
    li.addEventListener("click",()=>{ rec.plan = rec.plan||{}; rec.plan[id]=!rec.plan[id]; save(STATE); render(); });
    planBox.appendChild(li);
  });

  // notes
  const note=document.getElementById("noteBox"); note.value=rec.note||"";
  note.oninput=()=>{ rec.note = note.value; save(STATE); };

  buildCalendar();
}

// ---------- CALENDAR ----------
function buildCalendar(){
  const grid=document.getElementById("calendarGrid"); grid.innerHTML="";
  const s=STATE.settings, logs=STATE.logs, today=new Date();
  const dayNum=dayNumber(s.startDate,today); const phaseNum=phaseOfDay(dayNum,s.phaseLength);
  const startIndex=(phaseNum-1)*s.phaseLength+1;
  for(let i=0;i<s.phaseLength;i++){
    const absoluteDay=startIndex+i;
    const d=new Date(new Date(s.startDate+"T00:00:00").getTime() + (absoluteDay-1)*24*60*60*1000);
    const key=dateKey(d); const rec=logs[key];
    const cell=document.createElement("div"); cell.className="cal-cell";
    if(key===dateKey(today)) cell.classList.add("today");
    if(d > today) cell.classList.add("future");
    const status = rec ? (rec.completed ? "✓" : "×") : "";
    cell.textContent = `${i+1} ${status}`;
    if(d <= today){ cell.addEventListener("click",()=>openPastDay(key)); }
    grid.appendChild(cell);
  }
}

function openPastDay(key){
  const rec = STATE.logs[key] || (STATE.logs[key]={anchors:{},plan:{},note:"",completed:false});
  const container=document.getElementById("recapList"); container.innerHTML="";
  const d=new Date(key);
  const list = todaysAnchors(d);
  list.forEach(a=>{
    const ok = !!rec.anchors[`a_${a.key}`];
    const row=document.createElement("div");
    row.textContent = `${ok?"✓":"○"}  ${a.name}${a.optional?" (optional)":""}`;
    row.addEventListener("click",()=>{ rec.anchors[`a_${a.key}`]=!ok; save(STATE); openPastDay(key); });
    container.appendChild(row);
  });
  const pos=document.getElementById("recapPositive"); pos.value = rec.note||"";
  document.getElementById("btnRecapSave").onclick = ()=>{
    rec.note = pos.value||rec.note||""; rec.completed = true; save(STATE); closeRecap(); render();
  };
  openRecap();
}

// ---------- FINISH FLOW ----------
function requiredComplete(date){
  const list=todaysAnchors(date); const rec=STATE.logs[dateKey(date)] || {anchors:{}};
  for(const a of list){ if(a.optional) continue; if(!rec.anchors[`a_${a.key}`]) return false; } return true;
}
function highlightMissed(){
  const today=new Date(); const list=todaysAnchors(today);
  const rec=STATE.logs[dateKey(today)] || {anchors:{}};
  const cards=[...document.getElementById("dailyList").children];
  cards.forEach((card, idx)=>{
    const a=list[idx]; const id=`a_${a.key}`;
    card.classList.remove("warn");
    if(!a.optional && !rec.anchors[id]) card.classList.add("warn");
  });
}
function finishDay(){
  const today=new Date();
  if(!requiredComplete(today)){ highlightMissed(); openConfirm(); return; }
  buildTodayRecap(); openRecap();
}
function buildTodayRecap(){
  const today=new Date(); const list=todaysAnchors(today);
  const rec=STATE.logs[dateKey(today)] || (STATE.logs[dateKey(today)]={anchors:{},plan:{},note:"",completed:false});
  const container=document.getElementById("recapList"); container.innerHTML="";
  list.forEach(a=>{
    const ok=!!rec.anchors[`a_${a.key}`];
    const row=document.createElement("div"); row.textContent=`${ok?"✓":"○"}  ${a.name}${a.optional?" (optional)":""}`; container.appendChild(row);
  });
  document.getElementById("recapPositive").value = rec.note||"";
}
function saveRecapAndComplete(){
  const today=new Date(); const rec=STATE.logs[dateKey(today)] || (STATE.logs[dateKey(today)]={anchors:{},plan:{},note:"",completed:false});
  rec.note = document.getElementById("recapPositive").value || rec.note || "";
  rec.completed=true; save(STATE); closeRecap(); handlePhaseTransitions(today);
}
function handlePhaseTransitions(today){
  const s=STATE.settings; const dayNum=dayNumber(s.startDate,today);
  if(dayNum >= s.programDaysTotal){ alert("🏅 180 Day Discipline Medal Unlocked — outstanding work."); render(); return; }
  if(dayNum % s.phaseLength === 0){
    const phaseNum=Math.ceil(dayNum/s.phaseLength);
    if(confirm(`🎉 Phase ${phaseNum} complete!\n\nStart Phase ${phaseNum+1} now?`)){
      alert("Phase started. Keep the momentum.");
    } else {
      alert("Phase paused — start the next phase whenever you're ready (from the dashboard).");
    }
  } else {
    alert("Day completed. See you tomorrow.");
  }
  render();
}

// ---------- SETTINGS ----------
function openSettings(){
  document.body.classList.add("no-scroll");
  document.getElementById("settingsModal").style.display="flex";
  const s=STATE.settings;
  const host=document.getElementById("settingsAnchors"); host.innerHTML="";
  s.anchors.forEach((a,idx)=>{
    const row=document.createElement("div"); row.className="settings-row";
    const nameInput=document.createElement("input"); nameInput.type="text"; nameInput.value=a.name;
    const toggle=document.createElement("button"); toggle.textContent=a.optional?"Optional":"Required"; toggle.className="icon-btn";
    toggle.addEventListener("click",()=>{ a.optional=!a.optional; toggle.textContent=a.optional?"Optional":"Required"; });
    const del=document.createElement("button"); del.textContent="Delete"; del.className="delete-btn";
    del.addEventListener("click",()=>{ s.anchors.splice(idx,1); save(STATE); openSettings(); });
    row.appendChild(nameInput); row.appendChild(toggle); row.appendChild(del);
    nameInput.addEventListener("input",()=>{ a.name = nameInput.value; });
    host.appendChild(row);
  });
  const set=(id,day)=>document.getElementById(id).value = s.weeklyPlan[day].join(", ");
  set("planMon","Mon"); set("planTue","Tue"); set("planWed","Wed"); set("planThu","Thu"); set("planFri","Fri"); set("planSat","Sat"); set("planSun","Sun");
}
function saveSettings(){
  const s=STATE.settings;
  const read=(id)=>document.getElementById(id).value.split(",").map(x=>x.trim()).filter(Boolean);
  s.weeklyPlan["Mon"]=read("planMon"); s.weeklyPlan["Tue"]=read("planTue"); s.weeklyPlan["Wed"]=read("planWed");
  s.weeklyPlan["Thu"]=read("planThu"); s.weeklyPlan["Fri"]=read("planFri"); s.weeklyPlan["Sat"]=read("planSat"); s.weeklyPlan["Sun"]=read("planSun");
  save(STATE); closeSettings(); render();
}
function closeSettings(){ document.getElementById("settingsModal").style.display="none"; document.body.classList.remove("no-scroll"); }

function toggleNewTaskMode(){ const btn=document.getElementById("newTaskRequired"); btn.textContent = (btn.textContent==="Required") ? "Optional" : "Required"; }
function addTask(){
  const name=document.getElementById("newTaskName").value.trim(); if(!name) return;
  const req=document.getElementById("newTaskRequired").textContent==="Required";
  STATE.settings.anchors.push({name, key: name.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,20), optional:!req});
  document.getElementById("newTaskName").value=""; save(STATE); openSettings();
}
function setPalette(name){ STATE.settings.palette=name; save(STATE); applyPalette(name); }

// ---------- SWIPE / TABS ----------
let currentPanel=0;
function showPanel(idx){
  currentPanel=idx;
  document.getElementById("panels").style.transform=`translateX(-${idx*50}%)`;
  document.getElementById("tabTasks").classList.toggle("active", idx===0);
  document.getElementById("tabCalendar").classList.toggle("active", idx===1);
}
let touchStartX=null;
function handleTouchStart(e){ touchStartX = e.touches[0].clientX; }
function handleTouchEnd(e){
  if(touchStartX===null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if(Math.abs(dx)>40){
    if(dx<0 && currentPanel<1) showPanel(currentPanel+1);
    if(dx>0 && currentPanel>0) showPanel(currentPanel-1);
  }
  touchStartX=null;
}

// ---------- MODALS ----------
function openConfirm(){ document.getElementById("confirmModal").style.display="flex"; document.body.classList.add("no-scroll"); }
function closeConfirm(){ document.getElementById("confirmModal").style.display="none"; document.body.classList.remove("no-scroll"); }
function openRecap(){ document.getElementById("recapModal").style.display="flex"; document.body.classList.add("no-scroll"); }
function closeRecap(){ document.getElementById("recapModal").style.display="none"; document.body.classList.remove("no-scroll"); }

// ---------- INIT ----------
window.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("btnFinish").addEventListener("click", finishDay);
  document.getElementById("btnReset").addEventListener("click", ()=>{ const t=new Date(); STATE.logs[dateKey(t)]={anchors:{},plan:{},note:"",completed:false}; save(STATE); render(); });
  document.getElementById("btnClear").addEventListener("click", ()=>{ if(confirm("Erase ALL saved data?")){ localStorage.removeItem(KEY); STATE=load(); render(); }});
  document.getElementById("btnCompleteNow").addEventListener("click", closeConfirm);
  document.getElementById("btnContinueAnyway").addEventListener("click", ()=>{ closeConfirm(); alert("Marked as incomplete. You can retry or adjust from the calendar."); });
  document.getElementById("btnRecapEdit").addEventListener("click", closeRecap);
  document.getElementById("btnRecapSave").addEventListener("click", saveRecapAndComplete);
  document.getElementById("btnSettings").addEventListener("click", openSettings);
  document.getElementById("btnSettingsCancel").addEventListener("click", closeSettings);
  document.getElementById("btnSettingsSave").addEventListener("click", saveSettings);
  document.getElementById("newTaskRequired").addEventListener("click", toggleNewTaskMode);
  document.getElementById("btnAddTask").addEventListener("click", addTask);
  document.getElementById("tabTasks").addEventListener("click", ()=>showPanel(0));
  document.getElementById("tabCalendar").addEventListener("click", ()=>showPanel(1));
  const swipe=document.getElementById("swipe");
  swipe.addEventListener("touchstart", handleTouchStart, {passive:true});
  swipe.addEventListener("touchend", handleTouchEnd, {passive:true});
  // palette buttons
  document.getElementById("palSoft").addEventListener("click", ()=>setPalette("soft"));
  document.getElementById("palMid").addEventListener("click", ()=>setPalette("mid"));
  document.getElementById("palDark").addEventListener("click", ()=>setPalette("dark"));

  render(); showPanel(0);
});
