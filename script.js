/* CampusOS — local-first college organizer. No libraries or backend required. */
(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE_KEY = "campusos.data.v1";
  const COLORS = ["#5ce1e6","#6da8ff","#68ddb0","#f4c96b","#c5a0ff","#ff9baf"];
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const todayISO = () => iso(new Date());
  const plusDays = (date, n) => { const d=new Date(date+"T12:00:00"); d.setDate(d.getDate()+n); return iso(d); };
  const dateObj = s => new Date((s||todayISO())+"T12:00:00");
  const fmtDate = (s, opts={day:"numeric",month:"short"}) => s ? dateObj(s).toLocaleDateString("en-IN",opts) : "No date";
  const escapeHTML = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const sampleData = () => {
    const subjects = [
      {id:"pps",name:"Programming for Problem Solving",code:"PPS",target:75,color:COLORS[0]},
      {id:"maths",name:"Mathematics",code:"MATHS",target:75,color:COLORS[1]},
      {id:"physics",name:"Applied Physics",code:"PHY",target:75,color:COLORS[2]},
      {id:"bee",name:"Basic Electrical Engineering",code:"BEE",target:75,color:COLORS[3]},
      {id:"english",name:"English",code:"ENG",target:75,color:COLORS[4]},
      {id:"pps-lab",name:"PPS Lab",code:"PPS LAB",target:75,color:COLORS[5]},
      {id:"aep-lab",name:"AEP Lab",code:"AEP LAB",target:75,color:"#91a9ff"}
    ];
    const timetable = [
      {id:"c1",subjectId:"pps",day:1,start:"09:00",end:"10:00",room:"P-202",type:"class"},
      {id:"c2",subjectId:"maths",day:1,start:"10:00",end:"11:00",room:"Classroom",type:"class"},
      {id:"c3",subjectId:"bee",day:1,start:"11:15",end:"12:15",room:"Classroom",type:"class"},
      {id:"c4",subjectId:"physics",day:1,start:"13:20",end:"14:20",room:"Classroom",type:"class"},
      {id:"c5",subjectId:"english",day:2,start:"09:00",end:"10:00",room:"Classroom",type:"class"},
      {id:"c6",subjectId:"pps",day:2,start:"10:00",end:"11:00",room:"Classroom",type:"class"},
      {id:"c7",subjectId:"physics",day:2,start:"11:15",end:"12:15",room:"Classroom",type:"class"},
      {id:"c8",subjectId:"bee",day:3,start:"09:00",end:"10:00",room:"Classroom",type:"class"},
      {id:"c9",subjectId:"maths",day:3,start:"10:00",end:"11:00",room:"Classroom",type:"class"},
      {id:"c10",subjectId:"english",day:3,start:"11:15",end:"12:15",room:"Classroom",type:"class"},
      {id:"c11",subjectId:"pps-lab",day:1,start:"09:00",end:"11:00",room:"P-202",type:"class"},
      {id:"c12",subjectId:"aep-lab",day:5,start:"12:40",end:"14:40",room:"C-308",type:"class"},
      {id:"c13",subjectId:"physics",day:4,start:"09:00",end:"10:00",room:"Classroom",type:"class"},
      {id:"c14",subjectId:"pps",day:4,start:"10:00",end:"11:00",room:"Classroom",type:"class"},
      {id:"c15",subjectId:"maths",day:5,start:"09:00",end:"10:00",room:"Classroom",type:"class"},
      {id:"c16",subjectId:"bee",day:5,start:"10:00",end:"11:00",room:"Classroom",type:"class"}
    ];
    const tasks = [
      {id:uid(),title:"PPS arrays assignment",subjectId:"pps",type:"assignment",priority:"high",dueDate:plusDays(todayISO(),2),notes:"Complete the examples and dry runs.",done:false,createdAt:new Date().toISOString()},
      {id:uid(),title:"Update PPS lab record",subjectId:"pps-lab",type:"lab",priority:"medium",dueDate:plusDays(todayISO(),4),notes:"Write the experiment and output.",done:false,createdAt:new Date().toISOString()},
      {id:uid(),title:"Physics experiment write-up",subjectId:"physics",type:"practical",priority:"medium",dueDate:plusDays(todayISO(),6),notes:"Add observation table and conclusion.",done:false,createdAt:new Date().toISOString()}
    ];
    const exams = [
      {id:uid(),title:"Mathematics unit test",subjectId:"maths",date:plusDays(todayISO(),14),notes:"Revise current unit"},
      {id:uid(),title:"Applied Physics test",subjectId:"physics",date:plusDays(todayISO(),21),notes:"Review lecture notes"}
    ];
    const topics = [
      {id:uid(),title:"C programming — arrays",subjectId:"pps",status:"in-progress",progress:45,examId:exams[0].id},
      {id:uid(),title:"Eigenvalues and eigenvectors",subjectId:"maths",status:"not-started",progress:0,examId:exams[0].id},
      {id:uid(),title:"Optical fibres",subjectId:"physics",status:"not-started",progress:0,examId:exams[1].id}
    ];
    return {version:1,profile:{name:"ECE Student",target:75,pomodoro:25},subjects,timetable,attendance:[],tasks,exams,topics,sessions:[],extraEvents:[]};
  };
  const HISTORICAL_ATTENDANCE_BASELINE = {
    PPS: { present: 17, total: 22 },
    AEP: { present: 20, total: 21 },
    NA: { present: 28, total: 29 },
    MAC: { present: 26, total: 31 },
    ESE: { present: 25, total: 26 },
    EW: { present: 18, total: 20 },
    "ELCSLAB": { present: 12, total: 14 },
    "PPSLAB": { present: 12, total: 12 },
    "AEPLAB": { present: 10, total: 10 }
  };
  function normalize(data) {
    const base=sampleData();
    const out={...base,...data};
    out.profile={...base.profile,...(data.profile||{})};
    for (const k of ["subjects","timetable","attendance","tasks","exams","topics","sessions","extraEvents"]) if (!Array.isArray(out[k])) out[k]=base[k];
    // Historical counts are stored separately from daily attendance logs, so they
    // are seeded only for older backups that do not yet have this field.
    if (!out.attendanceBaseline || typeof out.attendanceBaseline !== "object" || Array.isArray(out.attendanceBaseline)) {
      out.attendanceBaseline = JSON.parse(JSON.stringify(HISTORICAL_ATTENDANCE_BASELINE));
    }
    return out;
  }
  function loadData() {
    try { const raw=localStorage.getItem(STORAGE_KEY); return raw ? normalize(JSON.parse(raw)) : sampleData(); }
    catch(e) { console.warn("Could not load CampusOS data",e); return sampleData(); }
  }
  let data=loadData(), currentPage="dashboard", taskFilter="open", calendarOffset=0, calendarView="week", showAllMarking=false, calendarFocusDate=todayISO();
  // Persist the one-time historical baseline migration immediately. Daily attendance
  // remains in data.attendance; historical counts stay in their separate field.
  if (!data.attendanceBaseline || typeof data.attendanceBaseline !== "object" || Array.isArray(data.attendanceBaseline)) {
    data.attendanceBaseline = JSON.parse(JSON.stringify(HISTORICAL_ATTENDANCE_BASELINE));
  }
  ensureAttendanceSubjects();
  saveData();
  let modalType=null, editingId=null, toastTimer=null;
  let timerDuration=(Number(data.profile.pomodoro)||25)*60, timerRemaining=timerDuration, timerInterval=null, timerRunning=false, timerMode="focus", timerEndAt=null;
  function saveData(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); const el=$("#lastSaved"); if(el)el.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }catch(e){notify("Could not save data. Export a backup and check browser storage settings.");} }
  function notify(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3000);}
  const subject = id => data.subjects.find(s=>s.id===id);
  const subjectName = id => subject(id)?.name || "General";
  const subjectCode = id => subject(id)?.code || "General";
  const openTasks = () => data.tasks.filter(t=>!t.done);
  // Keep only the nine confirmed attendance subjects. ECA and CCA remain in the
  // imported calendar, but are removed from attendance subjects and attendance totals.
  function ensureAttendanceSubjects() {
    let changed = false;
    const isEcaOrCca = s => {
      const id = String(s?.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const code = String(s?.code || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const name = String(s?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return id === "eca" || id === "cca" || code === "eca" || code === "cca" || name === "eca" || name === "cca";
    };
    const removedSubjectIds = new Set(data.subjects.filter(isEcaOrCca).map(s => s.id));
    if (removedSubjectIds.size) {
      data.subjects = data.subjects.filter(s => !isEcaOrCca(s));
      changed = true;
    }
    const oldAttendanceCount = data.attendance.length;
    data.attendance = data.attendance.filter(a => !removedSubjectIds.has(a.subjectId) && a.subjectId !== "eca" && a.subjectId !== "cca");
    if (data.attendance.length !== oldAttendanceCount) changed = true;

    const tracked = [
      ["pps", "PPS", "PPS"], ["aep", "AEP", "AEP"],
      ["na", "NA (Network Analysis)", "NA"], ["mac", "MAC", "MAC"],
      ["ese", "ESE", "ESE"], ["ew", "EW", "EW"],
      ["elcs-lab", "ELCS Lab", "ELCS Lab"],
      ["pps-lab", "PPS Lab", "PPS Lab"], ["aep-lab", "AEP Lab", "AEP Lab"]
    ];
    tracked.forEach(([id, name, code], index) => {
      const exists = data.subjects.some(s =>
        String(s.id || "").toLowerCase() === id ||
        String(s.code || "").toLowerCase() === code.toLowerCase() ||
        String(s.name || "").toLowerCase() === name.toLowerCase()
      );
      if (!exists) {
        data.subjects.push({ id, name, code, target: 75, color: COLORS[index % COLORS.length] });
        changed = true;
      }
    });
    if (changed) saveData();
  }
  const normalizedEventTitle = value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  function attendanceSubjectForEvent(event) {
    const title = normalizedEventTitle(event?.title);
    if (!title) return null;
    // Longest matches first so “AEP Lab” never gets mistaken for “AEP”.
    const codes = ["ELCS Lab", "PPS Lab", "AEP Lab", "PPS", "AEP", "NA", "MAC", "ESE", "EW"];
    const code = codes.find(value => {
      const normalized = normalizedEventTitle(value);
      return title === normalized || title.startsWith(normalized);
    });
    if (!code) return null;
    return data.subjects.find(s =>
      normalizedEventTitle(s.code) === normalizedEventTitle(code) ||
      normalizedEventTitle(s.name) === normalizedEventTitle(code) ||
      (code === "NA" && normalizedEventTitle(s.name).startsWith("na"))
    ) || null;
  }
  function importedEventsForDate(date) {
    return data.extraEvents.filter(event => event.date === date).map(event => ({
      ...event, source: "ics", type: "event", start: event.start || "12:00", end: event.end || "12:30"
    })).sort((a, b) => a.start.localeCompare(b.start));
  }
  function attendanceClassesForDate(date) {
    const imported = importedEventsForDate(date).map(event => {
      const matched = attendanceSubjectForEvent(event);
      return matched ? {
        id: event.id, subjectId: matched.id, date: event.date,
        start: event.start, end: event.end, room: event.room || "",
        title: event.title, source: "ics"
      } : null;
    }).filter(Boolean);
    const weekly = data.timetable
      .filter(t => Number(t.day) === dateObj(date).getDay())
      .map(t => ({ ...t, date, title: subjectName(t.subjectId), source: "weekly" }));
    const combined = [...imported];
    weekly.forEach(item => {
      const duplicate = imported.some(event => event.subjectId === item.subjectId && event.start === item.start && event.end === item.end);
      if (!duplicate) combined.push(item);
    });
    return combined.sort((a, b) => a.start.localeCompare(b.start));
  }
  const normalizedSubjectKey = value => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  function baselineForSubject(s) {
    if (!s) return { present: 0, total: 0 };
    const keys = [normalizedSubjectKey(s.code), normalizedSubjectKey(s.name), normalizedSubjectKey(s.id)];
    // Prefer exact codes/names; aliases cover common subject labels and IDs.
    const aliases = { "NA(NETWORKANALYSIS)": "NA", "NETWORKANALYSIS": "NA", "ELCS-LAB": "ELCSLAB", "PPS-LAB": "PPSLAB", "AEP-LAB": "AEPLAB" };
    for (const raw of keys) {
      const key = aliases[raw] || raw;
      if (data.attendanceBaseline[key]) return data.attendanceBaseline[key];
    }
    if (normalizedSubjectKey(s.name).startsWith("NA") || normalizedSubjectKey(s.id) === "NA") return data.attendanceBaseline.NA || { present: 0, total: 0 };
    return { present: 0, total: 0 };
  }
  const attendanceFor = id => {
    const logs = data.attendance.filter(a => a.subjectId === id && (a.status === "present" || a.status === "absent"));
    const historical = baselineForSubject(subject(id));
    const loggedTotal = logs.length;
    const loggedPresent = logs.filter(a => a.status === "present").length;
    const present = Number(historical.present || 0) + loggedPresent;
    const total = Number(historical.total || 0) + loggedTotal;
    return { total, present, absent: total - present, percent: total ? Math.round(present / total * 100) : null,
      historicalPresent: Number(historical.present || 0), historicalTotal: Number(historical.total || 0), loggedPresent, loggedTotal };
  };
  const overallAttendance = () => {
    const rows = data.subjects.map(s => attendanceFor(s.id));
    const total = rows.reduce((sum, a) => sum + a.total, 0);
    const present = rows.reduce((sum, a) => sum + a.present, 0);
    return { total, present, absent: total - present, percent: total ? Math.round(present / total * 100) : null };
  };
  const targetFor = s => Number(s?.target || data.profile.target || 75);
  function requiredToTarget(att, target) {
    if (!att.total) return { text: "No historical classes found", kind: "neutral" };
    const rate = Math.min(100, Math.max(1, Number(target) || 75)) / 100;
    const exactRate = att.present / att.total;
    if (exactRate >= rate) {
      const miss = Math.max(0, Math.floor((att.present / rate) - att.total + 1e-9));
      return { text: miss > 0 ? `Can miss up to ${miss} more class${miss === 1 ? "" : "es"} and stay at ${Math.round(rate * 100)}%` : `At target — attend the next class to build a buffer`, kind: "good" };
    }
    if (rate >= 1) return { text: "Attend every upcoming class to improve attendance", kind: "low" };
    const need = Math.max(0, Math.ceil(((rate * att.total) - att.present) / (1 - rate) - 1e-9));
    return { text: `Attend the next ${need} class${need === 1 ? "" : "es"} in a row to reach ${Math.round(rate * 100)}%`, kind: "low" };
  }
  function startOfWeek(date){const d=new Date(date);d.setHours(12,0,0,0);d.setDate(d.getDate()-d.getDay());return d;}
  function timeText(t){if(!t)return "";const [h,m]=t.split(":").map(Number);const d=new Date();d.setHours(h,m,0,0);return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});}
  function shortTimeRange(a,b){return `${timeText(a)} – ${timeText(b)}`;}
  function getCalendarEvents(start,end){
    const events=[]; const startIso=iso(start),endIso=iso(end);
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      const ds=iso(d), dow=d.getDay();
      data.timetable.filter(t=>Number(t.day)===dow).forEach(t=>events.push({id:`${t.id}-${ds}`,baseId:t.id,date:ds,title:subjectName(t.subjectId),subjectId:t.subjectId,start:t.start,end:t.end,room:t.room,type:"class"}));
    }
    data.tasks.filter(t=>t.dueDate&&t.dueDate>=startIso&&t.dueDate<=endIso).forEach(t=>events.push({id:`task-${t.id}`,baseId:t.id,date:t.dueDate,title:t.title,subjectId:t.subjectId,type:"task",start:"23:00",end:"23:30",room:"Deadline"}));
    data.exams.filter(e=>e.date&&e.date>=startIso&&e.date<=endIso).forEach(e=>events.push({id:`exam-${e.id}`,baseId:e.id,date:e.date,title:e.title,subjectId:e.subjectId,type:"exam",start:"08:00",end:"08:30",room:"Exam"}));
    data.sessions.filter(s=>s.date&&s.date>=startIso&&s.date<=endIso).forEach(s=>events.push({id:`study-${s.id}`,baseId:s.id,date:s.date,title:s.title||"Study session",subjectId:s.subjectId,type:"study",start:s.time||"17:00",end:"17:30",room:`${s.minutes} min`}));
    data.extraEvents.filter(e=>e.date&&e.date>=startIso&&e.date<=endIso).forEach(e=>events.push({...e,type:"event",start:e.start||"12:00",end:e.end||"12:30"}));
    return events;
  }
  function allUpcomingEvents(limit=8){const today=todayISO();const arr=[];data.tasks.filter(t=>!t.done&&t.dueDate>=today).forEach(t=>arr.push({date:t.dueDate,title:t.title,type:"task",subjectId:t.subjectId,start:"23:00"}));data.exams.filter(e=>e.date>=today).forEach(e=>arr.push({date:e.date,title:e.title,type:"exam",subjectId:e.subjectId,start:"08:00"}));data.extraEvents.filter(e=>e.date>=today).forEach(e=>arr.push(e));data.sessions.filter(s=>s.date>=today).forEach(s=>arr.push({...s,title:s.title||"Study session",type:"study"}));return arr.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,limit);}
  function eventTag(type){return `<span class="tag ${({class:"cyan",task:"yellow",exam:"red",study:"green",event:""}[type]||"")}">${({class:"CLASS",task:"DEADLINE",exam:"EXAM",study:"STUDY",event:"EVENT"}[type]||type)}</span>`;}
  function renderDashboard(){
    const now=new Date();$("#todayPill").textContent=now.toLocaleDateString("en-IN",{day:"numeric",month:"short"});$("#longDate").textContent=now.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
    const hr=now.getHours();$("#welcomeTitle").textContent=hr<12?"Let's make today count.":hr<17?"Keep your momentum going.":"A little progress still counts.";
    $("#dashAttendance").textContent=overallAttendance().percent===null?"—":`${overallAttendance().percent}%`;
    $("#dashAttendanceFoot").textContent=overallAttendance().total?`${overallAttendance().present} present out of ${overallAttendance().total} marked classes`:"Mark your classes to start tracking";
    $("#dashAttendanceBar").style.width=`${overallAttendance().percent||0}%`;
    $("#dashTasks").textContent=openTasks().length;$("#dashTasksFoot").textContent=`${data.tasks.filter(t=>t.done).length} completed so far`;
    const nextExam=data.exams.filter(e=>e.date>=todayISO()).sort((a,b)=>a.date.localeCompare(b.date))[0];
    $("#dashExam").textContent=nextExam?nextExam.title:"No exam set";$("#dashExamFoot").textContent=nextExam?`${Math.max(0,Math.ceil((dateObj(nextExam.date)-dateObj(todayISO()))/86400000))} days · ${fmtDate(nextExam.date,{day:"numeric",month:"short"})}`:"Add your exam dates";
    const todayMinutes=data.sessions.filter(s=>s.date===todayISO()&&s.completed).reduce((sum,s)=>sum+Number(s.minutes||0),0);$("#dashStudy").textContent=`${todayMinutes} min`;
    const todayClasses=[...importedEventsForDate(todayISO()).map(e=>({...e,subjectId:attendanceSubjectForEvent(e)?.id||"",displayTitle:e.title})),...data.timetable.filter(t=>Number(t.day)===now.getDay()).map(t=>({...t,displayTitle:subjectName(t.subjectId)})).filter(t=>!importedEventsForDate(todayISO()).some(e=>attendanceSubjectForEvent(e)?.id===t.subjectId&&e.start===t.start&&e.end===t.end))].sort((a,b)=>a.start.localeCompare(b.start));
    $("#todayClasses").innerHTML=todayClasses.length?todayClasses.map(t=>`<div class="schedule-item"><div class="schedule-time">${escapeHTML(shortTimeRange(t.start,t.end))}</div><div class="schedule-color" style="background:${escapeHTML(subject(t.subjectId)?.color||COLORS[0])}"></div><div class="schedule-details"><strong>${escapeHTML(t.displayTitle||subjectName(t.subjectId))}</strong><small>${escapeHTML(t.room||"Room not set")}</small></div></div>`).join(""):`<div class="empty-state">No classes scheduled for today.<br>Enjoy the breathing room or plan a study session.</div>`;
    const tasks=openTasks().filter(t=>t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,4);
    $("#upcomingTasks").innerHTML=tasks.length?tasks.map(t=>`<div class="compact-item"><div class="tiny-date"><strong>${dateObj(t.dueDate).getDate()}</strong>${dateObj(t.dueDate).toLocaleDateString("en-IN",{month:"short"})}</div><div class="compact-copy"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(subjectCode(t.subjectId))} · ${escapeHTML(t.type)}</small></div>${t.priority==="high"?'<span class="tag red">HIGH</span>':""}</div>`).join(""):`<div class="empty-state">No open deadlines. Add a task when something comes up.</div>`;
    const target=Number(data.profile.target||75);const alerts=data.subjects.map(s=>({s,a:attendanceFor(s.id)})).filter(x=>x.a.percent!==null&&x.a.percent<target).sort((a,b)=>a.a.percent-b.a.percent).slice(0,4);
    $("#attendanceAlerts").innerHTML=alerts.length?alerts.map(({s,a})=>`<div class="compact-item"><div class="subject-swatch" style="height:27px;background:${escapeHTML(s.color)}"></div><div class="compact-copy"><strong>${escapeHTML(s.name)}</strong><small>${a.percent}% attendance · target ${target}%</small></div><span class="tag red">LOW</span></div>`).join(""):`<div class="empty-state">No low-attendance alerts yet.<br>Mark classes to get accurate warnings.</div>`;
  }
  function dateLabel(date, options={weekday:"short",day:"numeric",month:"short"}) {
    return date.toLocaleDateString("en-IN", options);
  }
  function calendarRange() {
    const focus = dateObj(calendarFocusDate);
    if (calendarView === "day") return { start: focus, end: focus };
    if (calendarView === "month") {
      const start = new Date(focus.getFullYear(), focus.getMonth(), 1, 12);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(focus.getFullYear(), focus.getMonth() + 1, 0, 12);
      end.setDate(end.getDate() + (6 - end.getDay()));
      return { start, end };
    }
    const start = startOfWeek(focus);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    return { start, end };
  }
  function moveCalendar(amount) {
    const d = dateObj(calendarFocusDate);
    if (calendarView === "day") d.setDate(d.getDate() + amount);
    else if (calendarView === "month") d.setMonth(d.getMonth() + amount, 1);
    else d.setDate(d.getDate() + amount * 7);
    calendarFocusDate = iso(d);
    renderCalendar();
  }
  function renderCalendar(){
    const {start, end} = calendarRange();
    const filter = $("#calendarFilter").value;
    const events = getCalendarEvents(start, end).filter(e => filter === "all" || e.type === filter);
    if (calendarView === "day") {
      $("#weekLabel").textContent = dateLabel(start, {weekday:"long",day:"numeric",month:"long",year:"numeric"});
      const ds = iso(start);
      const ev = events.filter(e => e.date === ds).sort((a,b)=>(a.start||"").localeCompare(b.start||""));
      $("#weekGrid").className = "day-view-grid";
      $("#weekGrid").innerHTML = `<div class="day-view-heading"><span>${dateLabel(start,{weekday:"long",day:"numeric",month:"long"})}</span>${ds===todayISO()?'<span class="tag green">TODAY</span>':''}</div>` + (ev.length ? ev.map(e=>`<article class="day-view-event ${escapeHTML(e.type)}"><div class="day-view-time">${escapeHTML(e.start?shortTimeRange(e.start,e.end||e.start):"All day")}</div><div class="day-view-copy"><strong>${escapeHTML(e.title)}</strong><small>${escapeHTML(subjectCode(e.subjectId))}${e.room?` · ${escapeHTML(e.room)}`:""}</small></div>${eventTag(e.type)}</article>`).join("") : '<div class="empty-state">Nothing scheduled for this day.</div>');
    } else if (calendarView === "month") {
      $("#weekLabel").textContent = dateLabel(dateObj(calendarFocusDate), {month:"long",year:"numeric"});
      $("#weekGrid").className = "month-grid";
      const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      let html = names.map(n=>`<div class="month-weekday">${n}</div>`).join("");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const ds = iso(d), inMonth = d.getMonth() === dateObj(calendarFocusDate).getMonth();
        const dayEvents = events.filter(e=>e.date===ds).sort((a,b)=>(a.start||"").localeCompare(b.start||""));
        html += `<button type="button" class="month-day ${inMonth?"":"outside-month"} ${ds===todayISO()?"today":""} ${ds===calendarFocusDate?"focus-day":""}" data-calendar-date="${ds}" aria-label="Open ${dateLabel(d,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}"><span class="month-day-number">${d.getDate()}</span><span class="month-day-events">${dayEvents.slice(0,3).map(e=>`<span class="month-event ${escapeHTML(e.type)}">${escapeHTML(e.start?timeText(e.start)+" ":"")}${escapeHTML(e.title)}</span>`).join("")}${dayEvents.length>3?`<small>+${dayEvents.length-3} more</small>`:""}</span></button>`;
      }
      $("#weekGrid").innerHTML = html;
    } else {
      $("#weekLabel").textContent = `${dateLabel(start,{day:"numeric",month:"short"})} – ${dateLabel(end,{day:"numeric",month:"short",year:"numeric"})}`;
      const cols=[];
      for(let i=0;i<7;i++){
        const d=new Date(start);d.setDate(d.getDate()+i);const ds=iso(d);
        const ev=events.filter(e=>e.date===ds).sort((a,b)=>(a.start||"").localeCompare(b.start||""));
        cols.push(`<div class="day-column ${ds===todayISO()?"today":""}"><div class="day-heading"><small>${shortDays[d.getDay()]}</small><strong>${d.getDate()}</strong></div><div class="day-events">${ev.map(e=>`<div class="day-event ${escapeHTML(e.type)}" title="${escapeHTML(e.title)}"><strong>${escapeHTML(e.title)}</strong><small>${e.type==="task"?"Due":e.type==="exam"?"Exam":escapeHTML(timeText(e.start)||"")}</small></div>`).join("")||'<span class="empty-inline">—</span>'}</div></div>`);
      }
      $("#weekGrid").className="week-grid";
      $("#weekGrid").innerHTML=cols.join("");
    }
    $$("[data-calendar-view]").forEach(btn=>{const active=btn.dataset.calendarView===calendarView;btn.classList.toggle("selected",active);btn.setAttribute("aria-pressed",String(active));});
    const up=getCalendarEvents(new Date(todayISO()+"T12:00:00"),new Date(plusDays(todayISO(),30)+"T12:00:00")).filter(e=>e.date>=todayISO()).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,8);
    $("#upcomingEvents").innerHTML=up.length?up.map(e=>`<div class="event-row"><div class="tiny-date"><strong>${dateObj(e.date).getDate()}</strong>${dateObj(e.date).toLocaleDateString("en-IN",{month:"short"})}</div><div class="compact-copy"><strong>${escapeHTML(e.title)}</strong><small>${escapeHTML(subjectCode(e.subjectId))} · ${e.type==="class"?escapeHTML(shortTimeRange(e.start,e.end)):e.type==="task"?"Deadline":e.type==="exam"?"Exam date":e.type==="study"?"Study session":"Event"}</small></div>${eventTag(e.type)}</div>`).join(""):`<div class="empty-state">No upcoming events in the next 30 days.</div>`;
  }
  function parseIcsDate(raw) {
    if (!raw) return null;
    const value = raw.trim();
    const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
    if (!match) return null;
    return { date:`${match[1]}-${match[2]}-${match[3]}`, time:match[4]?`${match[4]}:${match[5]}`:"12:00" };
  }
  function parseIcs(text) {
    const unfolded = text.replace(/\r?\n[ \t]/g, "");
    const blocks = unfolded.split(/BEGIN:VEVENT/i).slice(1).map(x=>x.split(/END:VEVENT/i)[0]);
    const parsed=[];
    for (const block of blocks) {
      const lines=block.split(/\r?\n/); const fields={};
      for (const line of lines) {
        const ix=line.indexOf(":"); if(ix<0)continue;
        const key=line.slice(0,ix).split(";")[0].toUpperCase();
        const value=line.slice(ix+1).replace(/\\n/gi," ").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\");
        if (["UID","SUMMARY","DTSTART","DTEND","LOCATION","DESCRIPTION"].includes(key)) fields[key]=value;
      }
      const start=parseIcsDate(fields.DTSTART); if(!start)continue;
      const end=parseIcsDate(fields.DTEND);
      parsed.push({id:`ics-${fields.UID||uid()}`,uid:fields.UID||"",title:fields.SUMMARY||"Imported calendar event",date:start.date,start:start.time,end:end?.time||start.time,room:fields.LOCATION||"",notes:fields.DESCRIPTION||"",source:"ics"});
    }
    return parsed;
  }
  async function importCalendarFile(file) {
    if(!file)return;
    const status=$("#calendarImportStatus");
    try {
      const text=await file.text();
      if(!/BEGIN:VCALENDAR/i.test(text))throw new Error("This file does not look like an iCalendar (.ics) file.");
      const incoming=parseIcs(text);
      if(!incoming.length)throw new Error("No dated events were found in this file.");
      const existingUIDs=new Set(data.extraEvents.map(e=>e.uid).filter(Boolean));
      const existingEventKeys=new Set(data.extraEvents.map(e=>`${e.date}|${e.start||"12:00"}|${normalizedEventTitle(e.title)}`));
      let added=0;
      incoming.forEach(e=>{
        const key=`${e.date}|${e.start||"12:00"}|${normalizedEventTitle(e.title)}`;
        if((e.uid&&existingUIDs.has(e.uid))||existingEventKeys.has(key))return;
        if(e.uid)existingUIDs.add(e.uid);existingEventKeys.add(key);data.extraEvents.push(e);added++;
      });
      saveData();renderAll();status.textContent=`Imported ${added} new event${added===1?"":"s"}; skipped ${incoming.length-added} duplicate${incoming.length-added===1?"":"s"}.`;
      notify(`Calendar import complete: ${added} new event${added===1?"":"s"}.`);
    } catch(err) { status.textContent=err.message||"Could not import this calendar.";notify(status.textContent); }
    finally { $("#importCalendar").value=""; }
  }
  function renderAttendance(){
    const a=overallAttendance();const target=Number($("#attendanceTarget").value||data.profile.target||75);
    $("#attendanceSummary").innerHTML=`<div class="summary-tile"><span>Overall attendance</span><strong>${a.percent===null?"—":a.percent+"%"}</strong><small>${a.present} present · ${a.absent} absent · ${a.total} total classes</small></div><div class="summary-tile"><span>Subjects tracked</span><strong>${data.subjects.filter(s=>attendanceFor(s.id).total).length}/${data.subjects.length}</strong><small>Includes your previous college records</small></div><div class="summary-tile"><span>Below target</span><strong>${data.subjects.filter(s=>attendanceFor(s.id).percent!==null&&attendanceFor(s.id).percent<target).length}</strong><small>Using the selected ${target}% target</small></div>`;
    $("#attendanceSubjects").innerHTML=data.subjects.length?data.subjects.map(s=>{const at=attendanceFor(s.id),tg=Number(s.target||target),projection=requiredToTarget(at,tg);const percent=at.percent??0;return `<div class="attendance-row"><div class="subject-name"><strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(s.code)} · ${at.present}/${at.total} present</small><small class="muted small">Previous: ${at.historicalPresent}/${at.historicalTotal} · CampusOS logs: ${at.loggedPresent}/${at.loggedTotal} present</small></div><div class="percent-value ${at.percent===null?"":at.percent<tg?"low":"ok"}">${at.percent===null?"—":at.percent+"%"}</div><div class="bar-wrap"><div class="bar-track"><span style="width:${percent}%;background:${escapeHTML(s.color)}"></span></div><small class="muted small">Target ${tg}%</small></div><div class="projection"><strong>${projection.kind==="good"?"On track":projection.kind==="low"?"Needs attention":"Not started"}</strong>${escapeHTML(projection.text)}</div></div>`;}).join(""):`<div class="empty-state">Add your first subject to start attendance tracking.</div>`;
    const todayClasses=attendanceClassesForDate(todayISO());
    const selected=showAllMarking?data.subjects:todayClasses.map(t=>subject(t.subjectId)).filter((s,i,arr)=>s&&arr.findIndex(x=>x.id===s.id)===i);
    const classes=selected.length?selected.map(s=>{const log=data.attendance.find(a=>a.subjectId===s.id&&a.date===todayISO());const tt=todayClasses.find(t=>t.subjectId===s.id);return {s,log,tt};}):data.subjects.map(s=>({s,log:data.attendance.find(a=>a.subjectId===s.id&&a.date===todayISO()),tt:null}));
    $("#classMarking").innerHTML=classes.length?classes.map(({s,log,tt})=>`<div class="marking-item"><div class="subject-swatch" style="background:${escapeHTML(s.color)}"></div><div class="compact-copy"><strong>${escapeHTML(s.name)}</strong><small>${tt?`${escapeHTML(shortTimeRange(tt.start,tt.end))} · ${escapeHTML(tt.room||"Room not set")}`:"No class in today's imported timetable"}${log?` · Marked ${log.status}`:""}</small></div>${log?`<span class="status-mark tag ${log.status==="present"?"green":"red"}">${log.status.toUpperCase()}</span><button class="secondary-button" data-undo-attendance="${escapeHTML(s.id)}">Undo</button>`:`<div class="marking-actions"><button class="present-button" data-mark="${escapeHTML(s.id)}" data-status="present">Present</button><button class="absent-button" data-mark="${escapeHTML(s.id)}" data-status="absent">Absent</button></div>`}</div>`).join(""):`<div class="empty-state">No subjects to mark yet.</div>`;
  }
  function renderTasks(){
    let tasks=[...data.tasks];if(taskFilter==="open")tasks=tasks.filter(t=>!t.done);if(taskFilter==="done")tasks=tasks.filter(t=>t.done);const type=$("#taskTypeFilter").value;if(type!=="all")tasks=tasks.filter(t=>t.type===type);
    tasks.sort((a,b)=>(a.done?1:0)-(b.done?1:0)||(a.dueDate||"9999").localeCompare(b.dueDate||"9999"));
    $("#taskList").innerHTML=tasks.length?tasks.map(t=>`<div class="task-row ${t.done?"completed":""}"><input type="checkbox" class="task-check" data-toggle-task="${escapeHTML(t.id)}" ${t.done?"checked":""} aria-label="Mark ${escapeHTML(t.title)} complete"><div class="task-copy"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(subjectName(t.subjectId))} · ${t.dueDate?`Due ${fmtDate(t.dueDate,{weekday:"short",day:"numeric",month:"short"})}`:"No due date"}${t.notes?` · ${escapeHTML(t.notes)}`:""}</small></div><span class="tag ${t.priority==="high"?"red":t.priority==="medium"?"yellow":""}">${escapeHTML(t.priority.toUpperCase())}</span><span class="tag">${escapeHTML(t.type.toUpperCase())}</span><div class="task-actions"><button data-edit="task" data-id="${escapeHTML(t.id)}">Edit</button><button data-delete="task" data-id="${escapeHTML(t.id)}" aria-label="Delete task">✕</button></div></div>`).join(""):`<div class="empty-state">Nothing in this view. Add a task or change the filters.</div>`;
    $$("#taskFilters button").forEach(b=>b.classList.toggle("selected",b.dataset.taskFilter===taskFilter));
  }
  function renderTopics(targetSelector="#topicList"){
    const topics=[...data.topics].sort((a,b)=>(a.status==="done")-(b.status==="done"));
    $(targetSelector).innerHTML=topics.length?topics.map(t=>`<div class="topic-row"><div class="topic-top"><div class="compact-copy"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(subjectName(t.subjectId))}${t.examId?` · ${escapeHTML(data.exams.find(e=>e.id===t.examId)?.title||"Exam revision")}`:""}</small></div><select data-topic-status="${escapeHTML(t.id)}" aria-label="Topic status"><option value="not-started" ${t.status==="not-started"?"selected":""}>Not started</option><option value="in-progress" ${t.status==="in-progress"?"selected":""}>In progress</option><option value="done" ${t.status==="done"?"selected":""}>Completed</option></select><button class="icon-button" data-delete="topic" data-id="${escapeHTML(t.id)}" aria-label="Delete topic">✕</button></div><div class="bar-track"><span style="width:${Number(t.progress)||0}%;background:${t.status==="done"?"var(--green)":"var(--cyan)"}"></span></div><div class="topic-bottom"><span>${t.status==="done"?"Completed":t.status==="in-progress"?"In progress":"Not started"}</span><span>${Number(t.progress)||0}%</span><input type="range" min="0" max="100" step="5" value="${Number(t.progress)||0}" data-topic-progress="${escapeHTML(t.id)}" aria-label="Topic progress" style="width:90px;accent-color:var(--cyan)"></div></div>`).join(""):`<div class="empty-state">No revision topics yet. Add topics to track what you've learned.</div>`;
  }
  function renderStudy(){
    renderTopics();const minutes=data.sessions.filter(s=>s.completed).reduce((sum,s)=>sum+Number(s.minutes||0),0);$("#studyTotal").textContent=`${minutes} minutes logged`;
    const hist=[...data.sessions].filter(s=>s.completed).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,8);
    $("#studyHistory").innerHTML=hist.length?hist.map(s=>`<div class="study-history-row"><div class="history-icon">✓</div><div class="compact-copy"><strong>${escapeHTML(s.title||"Focus session")}</strong><small>${escapeHTML(subjectName(s.subjectId))} · ${fmtDate(s.date,{weekday:"short",day:"numeric",month:"short"})}</small></div><span class="history-minutes">${Number(s.minutes)||0} min</span></div>`).join(""):`<div class="empty-state">Your completed focus sessions will appear here.</div>`;
    const select=$("#timerSubject");const previous=select.value;select.innerHTML=`<option value="">General study</option>`+data.subjects.map(s=>`<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)}</option>`).join("");if(data.subjects.some(s=>s.id===previous))select.value=previous;
  }
  function renderExams(){
    const exams=[...data.exams].sort((a,b)=>a.date.localeCompare(b.date));
    $("#examCards").innerHTML=exams.length?exams.map(e=>{const days=Math.ceil((dateObj(e.date)-dateObj(todayISO()))/86400000);return `<article class="exam-card"><div class="exam-date">${escapeHTML(fmtDate(e.date,{weekday:"short",day:"numeric",month:"short",year:"numeric"}))}</div><h3>${escapeHTML(e.title)}</h3><p>${escapeHTML(subjectName(e.subjectId))}${e.notes?` · ${escapeHTML(e.notes)}`:""}</p><div class="countdown">${days<0?"Passed":days===0?"Today":days} <small>${days<0?"days ago":days===0?"—":days===1?"day left":"days left"}</small></div><div class="exam-actions"><button class="secondary-button" data-edit="exam" data-id="${escapeHTML(e.id)}">Edit</button><button class="secondary-button" data-delete="exam" data-id="${escapeHTML(e.id)}">Delete</button></div></article>`;}).join(""):`<div class="empty-state">No exams added yet. Add exam dates to start a revision plan.</div>`;
    renderTopics("#examTopics");
  }
  function renderSettings(){
    $("#subjectSettings").innerHTML=data.subjects.length?data.subjects.map(s=>`<div class="settings-subject"><span class="subject-swatch" style="background:${escapeHTML(s.color)}"></span><div><strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(s.code)} · target ${targetFor(s)}%</small></div><button data-edit="subject" data-id="${escapeHTML(s.id)}">Edit</button><button data-delete="subject" data-id="${escapeHTML(s.id)}">Delete</button></div>`).join(""):`<div class="empty-state">No subjects yet.</div>`;
    $("#displayName").value=data.profile.name||"ECE Student";$("#defaultTarget").value=String(data.profile.target||75);$("#defaultPomodoro").value=String(data.profile.pomodoro||25);
  }
  function renderAll(){renderDashboard();renderCalendar();renderAttendance();renderTasks();renderStudy();renderExams();renderSettings();$("#lastSaved").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
  const pageTitles={dashboard:["Dashboard","YOUR ACADEMIC OVERVIEW"],calendar:["Timetable & Calendar","YOUR SCHEDULE, ONE VIEW"],attendance:["Attendance Guardian","ATTENDANCE ANALYTICS"],tasks:["Tasks & Lab Records","YOUR WORKSPACE"],study:["StudyFlow","FOCUS & PROGRESS"],exams:["Exams & Revision","PREPARE WITH A PLAN"],data:["My College Data","SETTINGS & BACKUP"]};
  function showPage(page){if(!pageTitles[page])return;currentPage=page;$$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));$$(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("#pageTitle").textContent=pageTitles[page][0];$("#topEyebrow").textContent=pageTitles[page][1];$("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});}
  function subjectOptions(selected=""){return `<option value="">Choose subject</option>`+data.subjects.map(s=>`<option value="${escapeHTML(s.id)}" ${s.id===selected?"selected":""}>${escapeHTML(s.name)}</option>`).join("");}
  function field(label,name,type="text",value="",extra={}){const cls=extra.full?"field-label full":"field-label";let control="";if(type==="select"){control=`<select name="${name}" ${extra.required?"required":""}>${extra.options||""}</select>`;}else if(type==="textarea"){control=`<textarea name="${name}" rows="3" placeholder="${escapeHTML(extra.placeholder||"")}" ${extra.required?"required":""}>${escapeHTML(value)}</textarea>`;}else{control=`<input type="${type}" name="${name}" value="${escapeHTML(value)}" ${extra.required?"required":""} ${extra.placeholder?`placeholder="${escapeHTML(extra.placeholder)}"`:""} ${extra.min!==undefined?`min="${extra.min}"`:""} ${extra.max!==undefined?`max="${extra.max}"`:""}>`;}return `<label class="${cls}">${label}${control}</label>`;}
  function openModal(type,id=null){
    modalType=type;editingId=id;const item=id?({task:data.tasks,exam:data.exams,subject:data.subjects,event:data.extraEvents,study:data.sessions,topic:data.topics}[type]||[]).find(x=>x.id===id):null;
    const title=({task:"Task or lab record",exam:"Exam",subject:"Subject",event:"Calendar event",study:"Study session",topic:"Revision topic"})[type]||"Add item";$("#modalTitle").textContent=item?`Edit ${title.toLowerCase()}`:`Add ${title.toLowerCase()}`;$("#modalSubmit").textContent=item?"Save changes":"Add item";
    let f="";
    if(type==="task"){f=field("Task title","title","text",item?.title||"",{full:true,required:true,placeholder:"e.g. PPS lab record"})+field("Subject","subjectId","select", "",{options:subjectOptions(item?.subjectId)})+field("Type","type","select","",{options:["assignment","lab","practical","other"].map(v=>`<option value="${v}" ${v===(item?.type||"assignment")?"selected":""}>${v[0].toUpperCase()+v.slice(1)}</option>`).join("")})+field("Due date","dueDate","date",item?.dueDate||"")+field("Priority","priority","select","",{options:["low","medium","high"].map(v=>`<option value="${v}" ${v===(item?.priority||"medium")?"selected":""}>${v[0].toUpperCase()+v.slice(1)}</option>`).join("")})+field("Notes","notes","textarea",item?.notes||"",{full:true,placeholder:"Optional details"});}
    if(type==="exam"){f=field("Exam name","title","text",item?.title||"",{full:true,required:true,placeholder:"e.g. Physics mid exam"})+field("Subject","subjectId","select","",{options:subjectOptions(item?.subjectId)})+field("Exam date","date","date",item?.date||plusDays(todayISO(),7),{required:true})+field("Notes","notes","textarea",item?.notes||"",{full:true});}
    if(type==="subject"){f=field("Subject name","name","text",item?.name||"",{full:true,required:true,placeholder:"e.g. Applied Physics"})+field("Short code","code","text",item?.code||"",{required:true,placeholder:"e.g. PHY"})+field("Attendance target (%)","target","number",item?.target||data.profile.target||75,{min:1,max:100,required:true})+field("Color","color","select","",{options:COLORS.map(c=>`<option value="${c}" ${(item?.color||COLORS[data.subjects.length%COLORS.length])===c?"selected":""}>${c}</option>`).join("")});}
    if(type==="event"){f=field("Event title","title","text",item?.title||"",{full:true,required:true,placeholder:"e.g. Club meeting"})+field("Date","date","date",item?.date||todayISO(),{required:true})+field("Start time","start","time",item?.start||"12:00")+field("End time","end","time",item?.end||"12:30")+field("Location","room","text",item?.room||"")+field("Notes","notes","textarea",item?.notes||"",{full:true});}
    if(type==="study"){f=field("Session title","title","text",item?.title||"",{full:true,required:true,placeholder:"e.g. Revise arrays"})+field("Subject","subjectId","select","",{options:subjectOptions(item?.subjectId)})+field("Date","date","date",item?.date||todayISO(),{required:true})+field("Start time","time","time",item?.time||"17:00")+field("Duration (minutes)","minutes","number",item?.minutes||25,{min:1,max:600,required:true})+field("Notes","notes","textarea",item?.notes||"",{full:true});}
    if(type==="topic"){f=field("Topic","title","text",item?.title||"",{full:true,required:true,placeholder:"e.g. Kirchhoff's laws"})+field("Subject","subjectId","select","",{options:subjectOptions(item?.subjectId)})+field("Progress (%)","progress","number",item?.progress||0,{min:0,max:100,required:true})+field("Status","status","select","",{options:[["not-started","Not started"],["in-progress","In progress"],["done","Completed"]].map(([v,l])=>`<option value="${v}" ${v===(item?.status||"not-started")?"selected":""}>${l}</option>`).join("")})+field("Exam (optional)","examId","select","",{options:`<option value="">No exam linked</option>`+data.exams.map(e=>`<option value="${escapeHTML(e.id)}" ${e.id===item?.examId?"selected":""}>${escapeHTML(e.title)}</option>`).join("")});}
    $("#modalFields").innerHTML=f;$("#modalBackdrop").classList.add("open");$("#modalBackdrop").setAttribute("aria-hidden","false");setTimeout(()=>$("#modalFields input, #modalFields select")?.focus(),40);
  }
  function closeModal(){$("#modalBackdrop").classList.remove("open");$("#modalBackdrop").setAttribute("aria-hidden","true");$("#modalForm").reset();modalType=null;editingId=null;}
  function saveModal(event){event.preventDefault();const fd=new FormData($("#modalForm"));const v=Object.fromEntries(fd.entries());const isEdit=!!editingId;
    if(modalType==="task"){const item={id:editingId||uid(),title:v.title.trim(),subjectId:v.subjectId||"",type:v.type,priority:v.priority,dueDate:v.dueDate||"",notes:v.notes||"",done:isEdit?(data.tasks.find(x=>x.id===editingId)?.done||false):false,createdAt:isEdit?(data.tasks.find(x=>x.id===editingId)?.createdAt||new Date().toISOString()):new Date().toISOString()};upsert("tasks",item);}
    if(modalType==="exam"){const item={id:editingId||uid(),title:v.title.trim(),subjectId:v.subjectId||"",date:v.date,notes:v.notes||""};upsert("exams",item);}
    if(modalType==="subject"){const id=editingId||uid();const item={id,name:v.name.trim(),code:(v.code||v.name).trim().toUpperCase(),target:Math.min(100,Math.max(1,Number(v.target)||75)),color:v.color||COLORS[data.subjects.length%COLORS.length]};upsert("subjects",item);data.profile.target=Number(data.profile.target)||75;}
    if(modalType==="event"){const item={id:editingId||uid(),title:v.title.trim(),date:v.date,start:v.start||"12:00",end:v.end||"12:30",room:v.room||"",notes:v.notes||""};upsert("extraEvents",item);}
    if(modalType==="study"){const item={id:editingId||uid(),title:v.title.trim(),subjectId:v.subjectId||"",date:v.date,time:v.time||"17:00",minutes:Math.max(1,Number(v.minutes)||25),notes:v.notes||"",completed:false};upsert("sessions",item);}
    if(modalType==="topic"){const item={id:editingId||uid(),title:v.title.trim(),subjectId:v.subjectId||"",progress:Math.min(100,Math.max(0,Number(v.progress)||0)),status:v.status||"not-started",examId:v.examId||""};if(item.status==="done")item.progress=100;upsert("topics",item);}
    const label=modalType;closeModal();saveData();renderAll();notify(`${isEdit?"Updated":"Added"} ${label}.`);
  }
  function upsert(key,item){const i=data[key].findIndex(x=>x.id===item.id);if(i>=0)data[key][i]=item;else data[key].push(item);}
  function deleteItem(type,id){
    const map={task:["tasks","task"],exam:["exams","exam"],subject:["subjects","subject"],topic:["topics","topic"]};if(!map[type])return;
    const [key,label]=map[type];const item=data[key].find(x=>x.id===id);if(!item)return;
    if(type==="subject"){if(!confirm(`Delete "${item.name}"? Related attendance logs remain in the backup, but the subject will no longer appear in selectors.`))return;data.attendance=data.attendance.filter(a=>a.subjectId!==id);data.timetable=data.timetable.filter(t=>t.subjectId!==id);}
    else if(!confirm(`Delete "${item.title}"?`))return;
    data[key]=data[key].filter(x=>x.id!==id);
    if(type==="exam")data.topics.forEach(t=>{if(t.examId===id)t.examId="";});
    if(type==="subject"){data.tasks.forEach(t=>{if(t.subjectId===id)t.subjectId="";});data.exams.forEach(t=>{if(t.subjectId===id)t.subjectId="";});data.topics.forEach(t=>{if(t.subjectId===id)t.subjectId="";});data.sessions.forEach(t=>{if(t.subjectId===id)t.subjectId="";});}
    saveData();renderAll();notify(`${label[0].toUpperCase()+label.slice(1)} deleted.`);
  }
  function markAttendance(subjectId,status){
    const existing=data.attendance.find(a=>a.subjectId===subjectId&&a.date===todayISO());if(existing){notify("This subject is already marked today. Undo it first to change the status.");return;}
    data.attendance.push({id:uid(),subjectId,date:todayISO(),status,markedAt:new Date().toISOString()});saveData();renderAll();notify(`${subjectName(subjectId)} marked ${status}.`);
  }
  function undoAttendance(subjectId){data.attendance=data.attendance.filter(a=>!(a.subjectId===subjectId&&a.date===todayISO()));saveData();renderAll();notify("Today's attendance mark removed.");}
  function exportBackup(){const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString(),app:"CampusOS"},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`campusos-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);notify("Backup downloaded. Keep it somewhere safe.");}
  async function importBackup(file){if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.subjects)||!Array.isArray(parsed.tasks)||!Array.isArray(parsed.attendance))throw new Error("This doesn't look like a CampusOS backup.");if(!confirm("Importing will replace the data currently saved in this browser. Continue?"))return;data=normalize(parsed);saveData();renderAll();notify("Backup restored successfully.");}catch(e){notify(`Import failed: ${e.message||"Invalid backup file"}`);}finally{$("#importData").value="";}}
  function setTimerPreset(minutes,mode){pauseTimer();timerMode=mode;timerDuration=minutes*60;timerRemaining=timerDuration;renderTimer();$$(".timer-presets button").forEach(b=>b.classList.toggle("selected",Number(b.dataset.minutes)===minutes&&b.dataset.mode===mode));}
  function renderTimer(){const m=Math.floor(timerRemaining/60),s=timerRemaining%60;$("#timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;$("#timerModeLabel").textContent=timerMode==="focus"?"FOCUS SESSION":"BREAK TIME";$("#timerStatus").textContent=timerRunning?"RUNNING":"READY";$("#timerRing").classList.toggle("running",timerRunning);$("#timerStart").textContent=timerRunning?"Pause timer":timerRemaining===0?"Start again":timerRemaining<timerDuration?"Resume timer":timerMode==="focus"?"Start focus":"Start break";}
  function pauseTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=null;timerRunning=false;timerEndAt=null;renderTimer();}
  function startPauseTimer(){if(timerRunning){pauseTimer();return;}if(timerRemaining<=0)timerRemaining=timerDuration;timerRunning=true;timerEndAt=Date.now()+timerRemaining*1000;timerInterval=setInterval(()=>{timerRemaining=Math.max(0,Math.ceil((timerEndAt-Date.now())/1000));renderTimer();if(timerRemaining<=0)completeTimer();},250);renderTimer();}
  function completeTimer(){pauseTimer();timerRemaining=0;renderTimer();if(timerMode==="focus"){const minutes=Math.round(timerDuration/60);data.sessions.push({id:uid(),title:"Pomodoro focus session",subjectId:$("#timerSubject").value||"",date:todayISO(),time:new Date().toTimeString().slice(0,5),minutes,completed:true,notes:"Completed with the CampusOS Pomodoro timer."});saveData();renderAll();notify(`Focus session complete — ${minutes} minutes logged! Take a short break.`);}else notify("Break complete. Ready for another focus session?");}
  function init(){
    $("#modalForm").addEventListener("submit",saveModal);$("#modalClose").addEventListener("click",closeModal);$("#modalCancel").addEventListener("click",closeModal);$("#modalBackdrop").addEventListener("click",e=>{if(e.target===$("#modalBackdrop"))closeModal();});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
    document.addEventListener("click",e=>{
      const pageBtn=e.target.closest("[data-page]");if(pageBtn){e.preventDefault();showPage(pageBtn.dataset.page);return;}
      const openBtn=e.target.closest("[data-open-modal]");if(openBtn){openModal(openBtn.dataset.openModal);return;}
      const edit=e.target.closest("[data-edit]");if(edit){openModal(edit.dataset.edit,edit.dataset.id);return;}
      const del=e.target.closest("[data-delete]");if(del){deleteItem(del.dataset.delete,del.dataset.id);return;}
      const mark=e.target.closest("[data-mark]");if(mark){markAttendance(mark.dataset.mark,mark.dataset.status);return;}
      const undo=e.target.closest("[data-undo-attendance]");if(undo){undoAttendance(undo.dataset.undoAttendance);return;}
    });
    $("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
    $("#prevWeek").addEventListener("click",()=>moveCalendar(-1));$("#nextWeek").addEventListener("click",()=>moveCalendar(1));$("#todayWeek").addEventListener("click",()=>{calendarFocusDate=todayISO();renderCalendar();});$("#calendarFilter").addEventListener("change",renderCalendar);
    $$("[data-calendar-view]").forEach(btn=>btn.addEventListener("click",()=>{calendarView=btn.dataset.calendarView;renderCalendar();}));
    $("#weekGrid").addEventListener("click",e=>{const day=e.target.closest("[data-calendar-date]");if(day){calendarFocusDate=day.dataset.calendarDate;calendarView="day";renderCalendar();}});
    $("#importCalendar").addEventListener("change",e=>importCalendarFile(e.target.files[0]));
    $("#attendanceTarget").addEventListener("change",()=>{data.profile.target=Number($("#attendanceTarget").value);saveData();renderAttendance();renderDashboard();});
    $("#showAllClasses").addEventListener("click",()=>{showAllMarking=!showAllMarking;$("#showAllClasses").textContent=showAllMarking?"Show today's subjects":"Show all subjects";renderAttendance();});
    $$("#taskFilters button").forEach(b=>b.addEventListener("click",()=>{taskFilter=b.dataset.taskFilter;renderTasks();}));$("#taskTypeFilter").addEventListener("change",renderTasks);
    $("#taskList").addEventListener("change",e=>{const id=e.target.dataset.toggleTask;if(!id)return;const task=data.tasks.find(t=>t.id===id);if(task){task.done=e.target.checked;saveData();renderAll();notify(task.done?"Task completed!":"Task reopened.");}});
    $("#topicList").addEventListener("change",e=>{const id=e.target.dataset.topicStatus;if(id){const t=data.topics.find(t=>t.id===id);if(t){t.status=e.target.value;if(t.status==="done")t.progress=100;else if(t.progress===100)t.progress=90;saveData();renderAll();}}});
    $("#topicList").addEventListener("input",e=>{const id=e.target.dataset.topicProgress;if(id){const t=data.topics.find(t=>t.id===id);if(t){t.progress=Number(e.target.value);t.status=t.progress===100?"done":t.progress>0?"in-progress":"not-started";saveData();renderTopics();renderExams();}}});
    $("#examTopics").addEventListener("change",e=>{const id=e.target.dataset.topicStatus;if(id){const t=data.topics.find(t=>t.id===id);if(t){t.status=e.target.value;if(t.status==="done")t.progress=100;else if(t.progress===100)t.progress=90;saveData();renderAll();}}});
    $("#examTopics").addEventListener("input",e=>{const id=e.target.dataset.topicProgress;if(id){const t=data.topics.find(t=>t.id===id);if(t){t.progress=Number(e.target.value);t.status=t.progress===100?"done":t.progress>0?"in-progress":"not-started";saveData();renderTopics("#examTopics");renderTopics();}}});
    $("#timerStart").addEventListener("click",startPauseTimer);$("#timerReset").addEventListener("click",()=>{pauseTimer();timerRemaining=timerDuration;renderTimer();});$$(".timer-presets button").forEach(b=>b.addEventListener("click",()=>setTimerPreset(Number(b.dataset.minutes),b.dataset.mode)));
    $("#exportData").addEventListener("click",exportBackup);$("#importData").addEventListener("change",e=>importBackup(e.target.files[0]));
    $("#savePreferences").addEventListener("click",()=>{data.profile.name=$("#displayName").value.trim()||"ECE Student";data.profile.target=Number($("#defaultTarget").value)||75;data.profile.pomodoro=Number($("#defaultPomodoro").value)||25;data.subjects.forEach(s=>{if(!s.target)s.target=data.profile.target;});setTimerPreset(data.profile.pomodoro,"focus");saveData();renderAll();notify("Preferences saved.");});
    $("#resetData").addEventListener("click",()=>{if(confirm("This will overwrite current CampusOS data with the original sample data. Export a backup first if needed. Are you sure?")){pauseTimer();data=sampleData();saveData();calendarOffset=0;calendarFocusDate=todayISO();calendarView="week";taskFilter="open";renderAll();notify("CampusOS reset to sample data.");}});
    $("#modalFields").addEventListener("change",e=>{if(e.target.name==="status"&&e.target.value==="done"){const p=$('[name="progress"]',$("#modalFields"));if(p)p.value=100;}});
    const name=data.profile.name||"ECE Student";$(".profile-mini strong").textContent=name;$(".avatar").textContent=name.trim().charAt(0).toUpperCase()||"E";
    $("#attendanceTarget").value=String(data.profile.target||75);
    renderAll();setTimerPreset(Number(data.profile.pomodoro)||25,"focus");
    // If a saved record is corrupted or storage is unavailable, the rest of the app still loads.
  }
  init();
})();
