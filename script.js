
const KEY="discipline30_v3";
const SETTINGS={
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
    {name:"10,000 steps",key:"steps",optional:false},
    {name:"Drink 3L water",key:"water",optional:false},
    {name:"Log Food",key:"logfood",optional:false},
    {name:"Read 20+ minutes",key:"read",optional:false},
    {name:"Complete Writing Task",key:"write",optional:false},
    {name:"List one positive thing",key:"positive",optional:false},
    {name:'Compliment Angela / Say "I love you"',key:"angela",optional:false},
    {name:"PCS/Admin Task (Mon–Fri, optional)",key:"pcs",optional:true,onlyWeekdays:true},
    {name:"Text something nice to Bella (optional)",key:"bella",optional:true,onlySunday:true}
  ]
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

function render(){
  const s=STATE.settings;
  const logs=STATE.logs;
  const today=new Date();
  const key=dateKey(today);
  const dowLong=today.toLocaleDateString(undefined,{weekday:'long'});
  const dowShort=today.toLocaleDateString(undefined,{weekday:'short'});
  const dayNum=dayNumber(s.startDate,today);
  const phaseNum=phaseOfDay(dayNum,s.phaseLength);
  document.getElementById("dayInfo").textContent=`Phase ${phaseNum} · Day ${((dayNum-1)%s.phaseLength)+1} / ${s.phaseLength}`;
  document.getElementById("dowBadge").textContent=dowLong;
  // progress bar width
  const pct=((dayNum-1)%s.phaseLength+1)/s.phaseLength*100;
  document.getElementById("progressBar").style.width=`${pct}%`;

  const rec = logs[key] || (logs[key]={anchors:{},plan:{},note:"",completed:false});

  // Build daily anchors list
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

  // Build today's plan
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

function finishDay(){
  const today=new Date();
  const key=dateKey(today);
  const rec=STATE.logs[key] || (STATE.logs[key]={anchors:{},plan:{},note:"",completed:false});
  if(!requiredComplete(today)){
    // show modal
    document.getElementById("confirmModal").style.display="flex";
    return;
  }
  // success
  rec.completed=true; save(STATE);
  handlePhaseTransitions(today);
}

function handlePhaseTransitions(today){
  const s=STATE.settings;
  const dayNum=dayNumber(s.startDate,today);
  if(dayNum >= s.programDaysTotal){
    alert("🏅 180 Day Discipline Medal Unlocked — beast mode.");
    render(); return;
  }
  if(dayNum % s.phaseLength === 0){
    const phaseNum = Math.ceil(dayNum / s.phaseLength);
    if(confirm(`Phase ${phaseNum} complete. Move to Phase ${phaseNum+1}?`)){
      alert("Phase advanced. Keep going.");
    } else {
      alert("Phase paused.");
    }
  } else {
    alert("Day completed. See you tomorrow.");
  }
  render();
}

function resetToday(){
  const today=new Date();
  STATE.logs[dateKey(today)]={anchors:{},plan:{},note:"",completed:false};
  save(STATE); render();
}
function clearAll(){
  if(confirm("Erase ALL saved data?")){ localStorage.removeItem(KEY); STATE=load(); render(); }
}

window.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("btnFinish").addEventListener("click", finishDay);
  document.getElementById("btnReset").addEventListener("click", resetToday);
  document.getElementById("btnClear").addEventListener("click", clearAll);
  document.getElementById("btnCompleteNow").addEventListener("click", ()=>{
    document.getElementById("confirmModal").style.display="none";
  });
  document.getElementById("btnContinueAnyway").addEventListener("click", ()=>{
    document.getElementById("confirmModal").style.display="none";
    const today=new Date();
    const key=dateKey(today);
    const rec=STATE.logs[key] || (STATE.logs[key]={anchors:{},plan:{},note:"",completed:false});
    rec.completed=false; save(STATE);
    // optional restart prompt
    if(confirm("You missed a required anchor. Do you want to restart from Day 1?")){
      const nowISO = new Date().toISOString().slice(0,10);
      STATE={settings:{...STATE.settings, startDate: nowISO}, logs:{}};
      save(STATE); alert("Restarted — back to Day 1. Let's roll.");
    } else {
      alert("Marked as incomplete. Try to win tomorrow.");
    }
    render();
  });
  render();
});
