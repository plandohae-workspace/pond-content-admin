import {hierarchy,hasPendingReview,needsReviewAssignment,reviewLevelOptions} from './model.js';
export const productionDefinitions=[
 {id:'source',name:'소스 제출'}, {id:'authoring',name:'저작 작업'},
 {id:'firstReview',name:'1차 검수',round:'1st Review'}, {id:'revision',name:'수정 작업'},
 {id:'finalReview',name:'최종 검수',round:'Final Review'}, {id:'delivery',name:'제작 완료'},
];
export const productionStatuses=['대기','진행 중','완료','보류'];
export const materialCategories=['소스 자료','저작 작업 파일','수정본','최종본','기타 참고 자료'];
export function businessToday(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const get=t=>parts.find(p=>p.type===t).value;return `${get('year')}-${get('month')}-${get('day')}`;
}
export function productionStages(lesson){
 return Object.fromEntries(productionDefinitions.map((d,i)=>{const proof=d.round&&(lesson.noErrors?.[d.round]||(!lesson.reviewConfirmations?.[d.round]?.invalidatedAt&&lesson.reviewConfirmations?.[d.round]?.completedAt?{date:businessToday(new Date(lesson.reviewConfirmations[d.round].completedAt))}:null));return [d.id,{
  status:'대기',team:lesson.team||'',owner:lesson.owner||'',plannedStart:'',deadline:[lesson.sourceDue,lesson.authorDue,lesson.reviewDue][i]||'',actualStart:'',actualComplete:proof?.date||'',note:'',...(proof?{status:'완료'}:{}),...lesson.production?.stages?.[d.id],
 }];}));
}
export function stageDelayed(stage,today=businessToday()){return !!stage.deadline&&stage.deadline<today&&stage.status!=='완료';}
export function lessonProduction(lesson,today=businessToday()){
 const stages=productionStages(lesson),completed=productionDefinitions.filter(d=>stages[d.id].status==='완료').length;
 const current=productionDefinitions.find(d=>stages[d.id].status==='진행 중')||productionDefinitions.find(d=>stages[d.id].status!=='완료');
 const state=completed===6?'제작 완료':productionDefinitions.some(d=>stages[d.id].status==='보류')?'보류':productionDefinitions.some(d=>stages[d.id].status!=='대기')?'제작 중':'제작 대기';
 return {stages,completed,progress:Math.round(completed/6*100),current:current?.name||'제작 완료',state,delayed:productionDefinitions.filter(d=>stageDelayed(stages[d.id],today)).length};
}
export function lessonReview(data,lesson,round){
 const logs=data.logs.filter(r=>r.lessonId===lesson.id&&r['검수 차수']===round);
 const pending=logs.filter(r=>hasPendingReview(r.STATUS)).length;
 const confirmation=lesson.reviewConfirmations?.[round];
 // v1 명시적 오류 없음 기록은 차수별 확인의 근거이며, 단순 0건은 근거가 아니다.
 const noErrors=logs.length===0&&!!lesson.noErrors?.[round];
 const completed=pending===0&&(!!confirmation?.completedAt&&!confirmation.invalidatedAt||noErrors);
 return {total:logs.length,pending,completed,noErrors,confirmation};
}
export function lessonStats(data,levelId,today=businessToday()){
 const lessons=data.lessons.filter(l=>!needsReviewAssignment(data,{lessonId:l.id})&&hierarchy(data,l.id).level?.id===levelId);
 return {total:lessons.length,working:lessons.filter(l=>['제작 중','보류'].includes(lessonProduction(l,today).state)).length,completed:lessons.filter(l=>lessonProduction(l,today).state==='제작 완료').length,delayed:lessons.filter(l=>lessonProduction(l,today).delayed>0).length};
}
export function visibleLessons(data){const ids=new Set(reviewLevelOptions(data).map(l=>l.id));return data.lessons.filter(l=>ids.has(hierarchy(data,l.id).level?.id)&&!needsReviewAssignment(data,{lessonId:l.id}));}
export function draftLesson(lesson){return {...structuredClone(lesson),production:{...structuredClone(lesson.production||{}),stages:productionStages(lesson)}};}
function validDate(value){return !value||/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function changedLessonStages(original,draft){
 if(!original)return productionDefinitions.map(d=>d.id);
 const before=productionStages(original),after=productionStages(draft);
 return productionDefinitions.filter(d=>JSON.stringify(before[d.id])!==JSON.stringify(after[d.id])).map(d=>d.id);
}
export function validateLesson(data,draft,{original}={}){
 const changed=new Set(changedLessonStages(original,draft));
 const basicChanged=!original||['number','name','team','owner','unitId','projectId','sourceDue','authorDue','reviewDue','status'].some(key=>original[key]!==draft[key]);
 if(basicChanged){
 const unit=data.units.find(u=>u.id===draft.unitId),book=data.textbooks.find(t=>t.id===unit?.textbookId);
 if(!book||!data.projects.some(p=>p.id===book.levelId))return 'Level, Textbook, Unit을 모두 선택해주세요.';
 if(!draft.number?.trim()||!draft.name?.trim()||!draft.team?.trim()||!draft.owner?.trim())return 'Lesson 번호·이름·담당팀·담당자는 필수입니다.';
 for(const key of ['sourceDue','authorDue','reviewDue'])if(!draft[key]||!validDate(draft[key]))return '기본 제작 일정에 올바른 날짜를 입력해주세요.';
 if(draft.sourceDue>draft.authorDue||draft.authorDue>draft.reviewDue)return '소스 → 저작 → 검수 일정 순서를 확인해주세요.';
 if(data.lessons.some(l=>l.id!==draft.id&&l.unitId===draft.unitId&&l.number.trim()===draft.number.trim()))return '같은 Unit에 동일한 Lesson 번호가 있습니다.';
 }
 const stages=productionStages(draft);
 for(const d of productionDefinitions.filter(d=>changed.has(d.id))){
  const s=stages[d.id];
  if(!productionStatuses.includes(s.status))return `${d.name}: 올바른 상태를 선택해주세요.`;
  if(![s.plannedStart,s.deadline,s.actualStart,s.actualComplete].every(validDate))return `${d.name}: 올바른 날짜를 입력해주세요.`;
  if(s.plannedStart&&s.deadline&&s.plannedStart>s.deadline)return `${d.name}: 예정 시작일은 마감일 이전이어야 합니다.`;
  if(s.actualStart&&s.actualComplete&&s.actualStart>s.actualComplete)return `${d.name}: 실제 완료일은 실제 시작일 이후여야 합니다.`;
  if(s.status==='완료'&&!s.actualComplete)return `${d.name}: 완료 단계에는 실제 완료일을 입력해주세요.`;
  if(d.round&&s.status==='완료'&&lessonReview(data,draft,d.round).pending>0)return `${d.name}: 미해결 검수 오류를 먼저 처리해주세요.`;
 }
 if(changed.size>0&&stages.delivery.status==='완료'&&productionDefinitions.slice(0,5).some(d=>stages[d.id].status!=='완료'))return '제작 완료 처리 전에 앞선 5개 단계를 모두 완료해주세요.';
 if(basicChanged&&draft.status==='검수 완료'&&data.lessons.find(l=>l.id===draft.id)?.status!=='검수 완료'&&['firstReview','finalReview'].some(key=>stages[key].status!=='완료'))return '1차·최종 검수를 명시적으로 완료한 뒤 Lesson 검수 완료를 선택해주세요.';
 if(basicChanged&&draft.status==='검수 완료'&&['1st Review','Final Review'].some(round=>lessonReview(data,draft,round).pending>0))return '미해결 오류가 있어 Lesson 검수 완료 상태로 저장할 수 없습니다.';
 return '';
}
function audit(lesson,stageId,from,to,reason,at){
 const entry={id:crypto.randomUUID(),stageId,stageName:productionDefinitions.find(d=>d.id===stageId)?.name,from:{...from},to:{...to},reason,at};
 return [...(lesson.productionHistory||[]),entry];
}
export function saveLessonDraft(data,original,draft,at=new Date().toISOString()){
 let next=draftLesson(draft);
 const unit=data.units.find(u=>u.id===next.unitId),book=data.textbooks.find(t=>t.id===unit?.textbookId);
 if(book)next.projectId=book.levelId;
 const previous=productionStages(original||next),stages=next.production.stages;
 if(next.status==='검수 완료'&&productionDefinitions.filter(d=>d.round).some(d=>previous[d.id].status==='완료'&&stages[d.id].status!=='완료'))next.status='검수 대기';
 for(const d of productionDefinitions.filter(d=>changedLessonStages(original,next).includes(d.id))){
  const before=previous[d.id],after=stages[d.id];
  if(JSON.stringify(before)!==JSON.stringify(after))next.productionHistory=audit(next,d.id,before,after,'담당자 수정',at);
  if(d.round){
   const changed=before.status!==after.status;
   if(after.status==='완료'&&(changed||!lessonReview(data,next,d.round).completed))next.reviewConfirmations={...next.reviewConfirmations,[d.round]:{completedAt:at,reviewer:'데모 검수자',source:'제작 단계에서 명시적으로 완료',invalidatedAt:''}};
   if(after.status!=='완료'&&changed){
    const confirmation=next.reviewConfirmations?.[d.round];
    next.reviewConfirmations={...next.reviewConfirmations,[d.round]:{...confirmation,invalidatedAt:at}};
    next.noErrors={...next.noErrors,[d.round]:null};
   }
  }
 }
 // 이전 전체 상태 기록을 보존하고 신규 관리에서 완료 상태의 근거를 확인한다.
 if(original?.status==='검수 완료'&&next.status!=='검수 완료')next.legacyCompletionHistory=[...(original.legacyCompletionHistory||[]),{status:original.status,at,reason:'명시적 Lesson 수정'}];
 return next;
}
export function confirmReview(data,lesson,round,noErrors=false,at=new Date().toISOString()){
 const summary=lessonReview(data,lesson,round);
 if(summary.pending>0)throw new Error('미해결 오류가 있어 검수를 완료할 수 없습니다.');
 if(noErrors&&summary.total>0)throw new Error('등록된 오류가 있는 차수는 오류 없음으로 확인할 수 없습니다.');
 const next=draftLesson(lesson),key=productionDefinitions.find(d=>d.round===round).id;
 const before=next.production.stages[key];
 const after={...before,status:'완료',actualComplete:before.actualComplete||businessToday(new Date(at))};
 next.production.stages[key]=after;
 next.reviewConfirmations={...next.reviewConfirmations,[round]:{completedAt:at,reviewer:'데모 검수자',source:noErrors?'오류 없음 확인':'명시적 검수 완료',invalidatedAt:''}};
 if(noErrors)next.noErrors={...next.noErrors,[round]:{date:businessToday(new Date(at)),reviewer:'데모 검수자'}};
 next.productionHistory=audit(next,key,before,after,noErrors?'오류 없음 확인':'검수 완료 확인',at);
 if(['1st Review','Final Review'].every(r=>lessonReview(data,next,r).completed))next.status='검수 완료';
 return next;
}
export function cancelReview(data,lesson,round,at=new Date().toISOString()){
 const next=draftLesson(lesson),key=productionDefinitions.find(d=>d.round===round).id,before=next.production.stages[key];
 const after={...before,status:'대기'};next.production.stages[key]=after;
 next.noErrors={...next.noErrors,[round]:null};next.reviewConfirmations={...next.reviewConfirmations,[round]:{...next.reviewConfirmations?.[round],invalidatedAt:at}};
 next.productionHistory=audit(next,key,before,after,'검수 완료 확인 취소',at);
 if(next.production.stages.delivery.status==='완료'){const d=next.production.stages.delivery;next.production.stages.delivery={...d,status:'보류'};next.productionHistory=audit(next,'delivery',d,next.production.stages.delivery,'검수 완료 취소로 제작 완료 보류',at);}
 if(next.status==='검수 완료'){next.legacyCompletionHistory=[...(next.legacyCompletionHistory||[]),{status:next.status,at,reason:'검수 완료 확인 취소'}];next.status='검수 대기';}
 return next;
}
export function reconcileLessonReviews(previous,data,at=new Date().toISOString()){
 if(previous.logs===data.logs)return data;
 const lessons=data.lessons.map(lesson=>{
  // 신규 제작 단계 관리가 없는 기존 Lesson은 원본 상태를 자동 변경하지 않는다.
  if(!lesson.production?.stages)return lesson;
  let next=lesson;
  for(const d of productionDefinitions.filter(d=>d.round)){
   const summary=lessonReview(data,next,d.round),stage=productionStages(next)[d.id];
   if(summary.pending>0&&(stage.status==='완료'||next.reviewConfirmations?.[d.round]?.completedAt&&!next.reviewConfirmations[d.round].invalidatedAt)){
    if(next===lesson)next=structuredClone(lesson);
    const after={...stage,status:'진행 중'};next.production.stages[d.id]=after;
    next.reviewConfirmations={...next.reviewConfirmations,[d.round]:{...next.reviewConfirmations?.[d.round],invalidatedAt:at}};
    next.noErrors={...next.noErrors,[d.round]:null};next.productionHistory=audit(next,d.id,stage,after,'미해결 오류로 검수 재개',at);
    if(next.production.stages.delivery?.status==='완료'){const old=next.production.stages.delivery;next.production.stages.delivery={...old,status:'보류'};next.productionHistory=audit(next,'delivery',old,next.production.stages.delivery,'재검수 필요로 제작 완료 보류',at);}
    if(next.status==='검수 완료'){next.legacyCompletionHistory=[...(next.legacyCompletionHistory||[]),{status:next.status,at,reason:'미해결 검수 오류'}];next.status='수정 중';}
   }
  }
  return next;
 });
 return {...data,lessons};
}
