import {boardColumns,lessonBoardCard} from './lesson-board.js';
import {draftLesson,validateLesson,saveLessonDraft,businessToday,productionDefinitions} from './lesson-model.js';
export function lessonMoveRule(data,id,target){
 const lesson=data.lessons.find(l=>l.id===id);
 if(!lesson||!boardColumns.includes(target))return {allowed:false,reason:'이동할 Lesson과 저작 영역을 확인해주세요.'};
 const p=lessonBoardCard(lesson),current=p.column;
 if(current===target)return {allowed:true,action:null};
 if(target==='제작 완료')return {allowed:false,reason:`6단계 중 ${p.completed}개만 완료되었습니다. 상세 화면에서 모든 단계를 완료해주세요.`};
 if(p.completed===6)return {allowed:false,reason:'완료된 Lesson은 드래그로 재개하지 않습니다. 상세 화면에서 필요한 단계를 확인해주세요.'};
 if(target==='제작 대기'){
  const reviewHistory=data.logs.some(r=>r.lessonId===id)||Object.values(lesson.noErrors||{}).some(Boolean)||Object.values(lesson.reviewConfirmations||{}).some(Boolean)||lesson.legacyCompletionHistory?.length||lesson.status==='검수 완료';
  if(p.completed||reviewHistory)return {allowed:false,reason:'완료 단계나 검수 기록이 있어 대기로 되돌릴 수 없습니다. 기록은 그대로 유지됩니다.'};
  if(productionDefinitions.slice(1).some(d=>p.stages[d.id].status!=='대기')||p.stages.source.status!=='진행 중')return {allowed:false,reason:'이미 진행한 후속 단계 또는 보류 상태가 있습니다. 상세 화면에서 단계별 상태를 확인해주세요.'};
  return {allowed:true,action:'queue'};
 }
 if(target==='제작 진행'&&current==='제작 대기')return {allowed:true,action:'start'};
 return {allowed:false,reason:'현재 단계 상태와 충돌하는 이동입니다. 상세 화면에서 확인해주세요.'};
}
export function prepareLessonMove(data,id,target,{canEdit=false,at=new Date().toISOString()}={}){
 if(!canEdit)throw new Error('현재 역할에는 Lesson 수정 권한이 없습니다.');
 const rule=lessonMoveRule(data,id,target);if(!rule.allowed)throw new Error(rule.reason);if(!rule.action)return null;
 const original=data.lessons.find(l=>l.id===id),draft=draftLesson(original),source=draft.production.stages.source;
 source.status=rule.action==='start'?'진행 중':'대기';
 if(rule.action==='start'&&!source.actualStart)source.actualStart=businessToday(new Date(at));
 const error=validateLesson(data,draft,{original});if(error)throw new Error(error);
 const saved=saveLessonDraft(data,original,draft,at),history=saved.productionHistory||[];
 saved.productionHistory=history.map((entry,index)=>index>= (original.productionHistory||[]).length?{...entry,reason:rule.action==='start'?'보드 드래그로 저작 시작':'보드 드래그로 대기 재배치'}:entry);
 return {...data,lessons:data.lessons.map(l=>l.id===id?saved:l)};
}
