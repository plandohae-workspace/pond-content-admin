import {hierarchy,reviewLevelOptions} from './model.js';
import {businessToday,visibleLessons,lessonProduction,lessonReview,productionDefinitions} from './lesson-model.js';
import {authoringMetrics,reviewMetrics} from './level-metrics.js';
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function dashboardMetrics(data,today=businessToday()){
 const lessons=visibleLessons(data),ids=new Set(lessons.map(l=>l.id));
 const end=new Date(`${today}T00:00:00Z`);end.setUTCDate(end.getUTCDate()+7);const through=end.toISOString().slice(0,10);
 const schedules=lessons.flatMap(lesson=>{const production=lessonProduction(lesson,today);const open=productionDefinitions.map(d=>({...production.stages[d.id],name:d.name})).filter(s=>s.status!=='완료'&&validDate(s.deadline));if(!open.length)return [];const deadline=open.map(s=>s.deadline).sort()[0];return [{lesson,deadline,stages:open.filter(s=>s.deadline===deadline).map(s=>s.name),level:hierarchy(data,lesson.id).level}];}).sort((a,b)=>a.deadline.localeCompare(b.deadline)||a.lesson.number.localeCompare(b.lesson.number));
 const reviewIncomplete=lessons.filter(l=>!['1st Review','Final Review'].every(r=>lessonReview(data,l,r).completed)).length;
 return {total:lessons.length,working:lessons.filter(l=>{const p=lessonProduction(l,today);return p.completed<6&&Object.values(p.stages).some(s=>s.status!=='대기');}).length,completed:lessons.filter(l=>lessonProduction(l,today).completed===6).length,reviewIncomplete,excluded:data.lessons.length-lessons.length,levels:reviewLevelOptions(data).map(level=>({level,authoring:authoringMetrics(data,level.id),review:reviewMetrics(data,level.id)})),overdue:schedules.filter(s=>s.deadline<today),upcoming:schedules.filter(s=>s.deadline>=today&&s.deadline<=through),today,through,recent:[...data.logs].filter(r=>ids.has(r.lessonId)).sort((a,b)=>String(b['등록일']||'').localeCompare(String(a['등록일']||''))).slice(0,5)};
}
