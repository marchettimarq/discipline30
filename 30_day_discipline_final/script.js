
const KEY="discipline30_v2";
const SETTINGS={programDaysTotal:180,phaseLength:30,startDate:null,weeklyPlan:{
"Mon":["Run / Run-Walk","Yoga / Mobility (15–20m)"],
"Tue":["Strength (20–30m)"],
"Wed":["Run / Run-Walk"],
"Thu":["Yoga / Mobility (15–20m)"],
"Fri":["Speed/Tempo Run","Strength (20–30m)"],
"Sat":["Long Walk","Writing Session (optional)","Spring Clean Task (optional)"],
"Sun":["Long Run","Meal Prep","Writing Session (optional)","Spring Clean Task (optional)"]
},
anchorsBase:[
{name:"Workout #1 (≥30 min)",key:"w1",optional:false},
{name:"Workout #2 (≥30 min, preferably outdoors)",key:"w2",optional:false},
{name:"10,000 steps",key:"steps",optional:false},
{name:"Drink 3L water",key:"water",optional:false},
{name:"Log Food",key:"logfood",optional:false},
{name:"Read 20+ minutes",key:"read",optional:false},
{name:"Complete Writing Task",key:"write",optional:false},
{name:"List one positive thing (in Notes)",key:"positive",optional:false},
{name:'Compliment Angela / Say "I love you" (in person)',key:"angela",optional:false},
{name:"PCS/Admin Task (Mon–Fri, optional)",key:"pcs",optional:true,onlyWeekdays:true}
],
sundayOptional:{name:"Text something nice to Bella (optional)",key:"bella",optional:true,onlySunday:true}
};
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function load(){let r=localStorage.getItem(KEY);if(!r){const t=new Date();const st={settings:{...SETTINGS,startDate:t.toISOString().slice(0,10)},logs:{}};save(st);return st}return JSON.parse(r)}
function dateKey(d){return d.toISOString().slice(0,10)}
function fmtDate(d){return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}
function dayNumber(startISO,today){const s=new Date(startISO+"T00:00:00");const diff=Math.floor((today-s)/(1000*60*60*24))+1;return Math.max(1,diff)}
function phaseOfDay(n,len){return Math.ceil(n/len)}
let STATE=load();
function todaysAnchorsList(d){const dow=d.getDay();const list=[];for(const a of STATE.settings.anchorsBase){if(a.onlyWeekdays&&(dow===0||dow===6))continue;if(a.onlySunday&&dow!==0)continue;list.push(a)}if(dow===0)list.push(STATE.settings.sundayOptional);return list}
function render(){const s=STATE.settings;const logs=STATE.logs;const today=new Date();const key=dateKey(today);const dowLong=today.toLocaleDateString(undefined,{weekday:'long'});const dowShort=today.toLocaleDateString(undefined,{weekday:'short'});document.getElementById("dateLabel").textContent=fmtDate(today);const dayNum=dayNumber(s.startDate,today);const phaseNum=phaseOfDay(dayNum,s.phaseLength);document.getElementById("dayInfo").textContent=`Phase ${phaseNum} · Day ${((dayNum-1)%s.phaseLength)+1} / ${s.phaseLength}`;const rec=logs[key]||{anchors:{},plan:{},note:"",completed:false};logs[key]=rec;const anchors=todaysAnchorsList(today);const anchorBox=document.getElementById("dailyTasks");anchorBox.innerHTML="";anchors.forEach((a,idx)=>{const id=`a_${a.key}`;const wrap=document.createElement('label');wrap.className="task";const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!rec.anchors[id];cb.addEventListener('change',()=>{rec.anchors[id]=cb.checked;save(STATE)});const title=document.createElement('div');title.textContent=a.name;const badge=document.createElement('div');badge.className='badge';badge.textContent=a.optional?"Optional":"Required";wrap.appendChild(cb);wrap.appendChild(title);wrap.appendChild(badge);anchorBox.appendChild(wrap)});document.getElementById("dowBadge").textContent=dowLong;const planList=(s.weeklyPlan[dowShort]||s.weeklyPlan[dowLong])||[];const planBox=document.getElementById("todayPlan");planBox.innerHTML="";planList.forEach((name,idx)=>{const id=`p_${idx}`;const wrap=document.createElement('label');wrap.className="task";const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!rec.plan[id];cb.addEventListener('change',()=>{rec.plan[id]=cb.checked;save(STATE)});const title=document.createElement('div');title.textContent=name;const badge=document.createElement('div');badge.className='badge';badge.textContent='Tap to toggle';wrap.appendChild(cb);wrap.appendChild(title);wrap.appendChild(badge);planBox.appendChild(wrap)});const noteBox=document.getElementById("noteBox");noteBox.value=rec.note||"";noteBox.oninput=()=>{rec.note=noteBox.value;save(STATE)};document.getElementById("completedBadge").textContent=rec.completed?"Completed":"Not completed";document.getElementById("completedBadge").style.color=rec.completed?"#5ee1a6":"var(--muted)"}
function requiredAnchorsMetFor(date){const key=dateKey(date);const rec=STATE.logs[key]||{anchors:{}};const anchors=todaysAnchorsList(date);for(const a of anchors){if(a.optional)continue;const id=`a_${a.key}`;if(!rec.anchors[id])return false}return true}
function finishToday(){const today=new Date();const key=dateKey(today);const rec=STATE.logs[key]||(STATE.logs[key]={anchors:{},plan:{},note:"",completed:false});const met=requiredAnchorsMetFor(today);if(!met){if(confirm("You missed at least one required anchor today.\n\nDo you want to restart from Day 1?")){const nowISO=today.toISOString().slice(0,10);STATE={settings:{...STATE.settings,startDate:nowISO},logs:{}};save(STATE);alert("Restarted. You're back to Day 1. You've got this.");render();return}else{alert("Okay — keeping your progress. You can try to complete all anchors tomorrow.");rec.completed=false;save(STATE);render();return}}rec.completed=true;save(STATE);const s=STATE.settings;const dayNum=dayNumber(s.startDate,today);if(dayNum>=s.programDaysTotal){alert("🏅 180 Day Discipline Medal Unlocked — outstanding work!");render();return}if(dayNum % s.phaseLength===0){const phaseNum=phaseOfDay(dayNum,s.phaseLength);if(confirm(`Phase ${phaseNum} complete. Move on to Phase ${phaseNum+1}?`)){alert("Phase advanced. Keep the momentum.")}else{alert("Phase pause — resume when ready.")}}else{alert("Day completed. See you tomorrow.")}render()}
function resetToday(){const today=new Date();const key=dateKey(today);STATE.logs[key]={anchors:{},plan:{},note:"",completed:false};save(STATE);render()}
function eraseAll(){if(confirm("Erase ALL saved data? This cannot be undone.")){localStorage.removeItem(KEY);STATE=load();render()}}
window.addEventListener('DOMContentLoaded',()=>{document.getElementById("btnFinish").addEventListener('click',finishToday);document.getElementById("btnReset").addEventListener('click',resetToday);document.getElementById("btnClearAll").addEventListener('click',eraseAll);render()});
