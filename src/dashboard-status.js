import {levelLessons} from './level-metrics.js';
import {lessonProduction,lessonReview,productionStatuses} from './lesson-model.js';
export function authoringStatus(data,levelId){
 const lessons=levelLessons(data,levelId).map(lesson=>{const p=lessonProduction(lesson);return {lesson,current:p.current,status:p.completed===6?'완료':Object.values(p.stages).some(s=>s.status!=='대기')?'진행 중':'대기',held:Object.values(p.stages).some(s=>s.status==='보류')};});
 const working=lessons.filter(l=>l.status==='진행 중'),waiting=lessons.filter(l=>l.status==='대기'),completed=lessons.filter(l=>l.status==='완료').length;
 const candidates=working.length?working:waiting;
 return {total:lessons.length,completed,items:candidates.slice(0,3),extra:Math.max(0,candidates.length-3),allCompleted:lessons.length>0&&completed===lessons.length};
}
export function reviewStatus(data,levelId,round){
 const lessons=levelLessons(data,levelId),stageId=round==='1st Review'?'firstReview':'finalReview';
 const counts={completed:0,working:0,waiting:0,unknown:0};
 for(const lesson of lessons){const review=lessonReview(data,lesson,round),stage=lesson.production?.stages?.[stageId];
  if(review.completed)counts.completed++;
  else if(review.total>0||stage&&['진행 중','보류'].includes(stage.status))counts.working++;
  else if(stage&&productionStatuses.includes(stage.status)&&stage.status==='대기')counts.waiting++;
  else counts.unknown++;
 }
 const total=lessons.length,status=!total||counts.unknown?'상태 확인 필요':counts.completed===total?'완료':counts.working||counts.completed?'진행 중':'대기';
 return {total,status,...counts};
}
