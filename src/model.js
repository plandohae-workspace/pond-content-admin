export const stages = ['소스 대기', '소스 등록', '저작 중', '검수 대기', '수정 중', 'Final Review', '검수 완료'];
export const roles = ['Admin', 'Source Team', 'Authoring Team', 'QA Reviewer'];
export const permissions = {
  Admin: ['Level 관리', 'Level 완료', 'Lesson 수정', '자료 등록', '검수 편집', '권한 변경'],
  'Source Team': ['자료 등록'],
  'Authoring Team': ['Lesson 수정', '자료 등록'],
  'QA Reviewer': ['Lesson 수정', '검수 편집'],
};
export const progress = (lessons) => lessons.length ? Math.round(lessons.reduce((sum, l) => sum + stages.indexOf(l.status) / 6 * 100, 0) / lessons.length) : 0;
export function safeUrl(value) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
export const logColumns = ['PIC', 'TEXTBOOK', 'UNIT', 'LESSON', 'CLASS', 'ACTIVITY', 'TEXTBOOK PAGE NO.', 'ERROR TYPE', 'DETAILS', 'SCREENSHOT', 'STATUS', '처리 결과', '검수 차수', '검수자', '등록일', '수정자', '수정일', '재검수 결과'];
export function seed() {
  const projects = ['A','B','C','D'].map((n,i)=>({id:`p${i}`,name:`Project ${n}`,course:['Everyday English','Creative Reading','Business Essentials','Starter Workbook'][i],team:['콘텐츠 1팀','콘텐츠 2팀','콘텐츠 1팀','콘텐츠 3팀'][i],owner:`담당자 ${i+1}`,start:'2026-09-01',end:`2026-10-${[30,23,28,31][i]}`,status:'진행 중'}));
  const lessons = projects.flatMap((p,i)=>Array.from({length:6},(_,j)=>({id:`l${i}-${j}`,projectId:p.id,number:`${j+1}`.padStart(2,'0'),name:['Meet & Greet','Daily Routines','At the Market','Our Neighborhood','Travel Together','Looking Ahead'][j],team:p.team,owner:`담당자 ${i*6+j+1}`,sourceDue:`2026-10-${String(8+j).padStart(2,'0')}`,authorDue:`2026-10-${12+j}`,reviewDue:`2026-10-${18+j}`,status:stages[(i+j+2)%7]})));
  const materials=lessons.slice(0,12).map((l,i)=>({id:`m${i}`,lessonId:l.id,name:`Lesson ${l.number} ${['최종 원고','Textbook PDF','Audio 소스'][i%3]}`,type:['원고','Textbook PDF','Audio'][i%3],description:'검수용 샘플 자료입니다. 실제 파일이 아닌 가상 공유폴더입니다.',team:l.team,registrar:'자료 담당자',date:'2026-10-07',mode:'url',url:`https://example.com/pond/${l.id}`}));
  const logs=lessons.slice(0,10).map((l,i)=>({id:`e${i}`,lessonId:l.id,PIC:l.owner,TEXTBOOK:projects.find(p=>p.id===l.projectId).course,LESSON:`Lesson ${l.number}`,CLASS:'Class A',ACTIVITY:`Activity ${i%3+1}`,'TEXTBOOK PAGE NO.':String(12+i),'ERROR TYPE':['Content','UI','Audio','Typo','Image'][i%5],DETAILS:['문항 지시문과 보기의 내용을 확인해주세요.','화면 하단 버튼의 정렬 수정이 필요합니다.','오디오 시작 부분에 공백이 있습니다.','본문의 철자 오류를 수정해주세요.','이미지 비율을 확인해주세요.'][i%5],SCREENSHOT:'',STATUS:reviewStatuses[i%reviewStatuses.length],'처리 결과':i%5===2?'수정 완료':'','검수 차수':i%3===0?'Final Review':'1st Review','검수자':`검수자 ${i%3+1}`,'등록일':'2026-10-07','수정자':'','수정일':'','재검수 결과':''}));
  return {projects,lessons,materials,logs};
}

// v1의 project ID와 모든 원본 필드를 그대로 유지한다.
export function migrate(input) {
  const d = structuredClone(input);
  const legacy = d.version !== 2;
  d.version = 2;
  d.textbooks ||= [];
  d.units ||= [];
  for (const p of d.projects) {
    if (legacy && !d.textbooks.some(t => t.levelId === p.id)) {
      const textbookId = `book-${p.id}`;
      d.textbooks.push({id:textbookId,levelId:p.id,name:p.course || '기존 Textbook',description:'기존 프로젝트에서 보존한 Textbook'});
      d.units.push({id:`unit-${p.id}`,textbookId,name:'Unit 01',description:'기존 Lesson을 보존한 기본 Unit'});
    }
  }
  for (const l of d.lessons) {
    if (legacy && !l.unitId) {
      const book = d.textbooks.find(t=>t.levelId===l.projectId);
      if (book) {
        let unit=d.units.find(u=>u.textbookId===book.id);
        if (!unit) {unit={id:`unit-${book.id}`,textbookId:book.id,name:'Unit 01',description:''};d.units.push(unit);}
        l.unitId=unit.id;
      }
    }
  }
  d.logs = d.logs.map(log=>{
    const h=hierarchy(d,log.lessonId);
    return {...log,UNIT:log.UNIT||h.unit?.name||'',screenshots:log.screenshots||[],legacyScreenshot:log.legacyScreenshot||log.SCREENSHOT||'',SCREENSHOT:''};
  });
  return d;
}
export function hierarchy(d,lessonId) {
  const lesson=d.lessons.find(l=>l.id===lessonId);
  const unit=d.units?.find(u=>u.id===lesson?.unitId);
  const textbook=d.textbooks?.find(t=>t.id===unit?.textbookId);
  const level=d.projects.find(p=>p.id===(textbook?.levelId||lesson?.projectId));
  return {level,textbook,unit,lesson};
}
export function linkedLog(d,log,lessonId) {
  const h=hierarchy(d,lessonId);
  if((!h.lesson||!h.unit||!h.textbook||!h.level)&&lessonId===log.lessonId)return {...log,lessonId};
  return {...log,lessonId,TEXTBOOK:h.textbook?.name||'',UNIT:h.unit?.name||'',LESSON:h.lesson?`Lesson ${h.lesson.number} · ${h.lesson.name}`:''};
}
export function normalizeLogs(d,logs) {return logs.map(l=>linkedLog(d,l,l.lessonId));}

export const reviewStatuses = ['Revised', 'Fixed in Launcher', 'Need IT check', 'IT is in progress', 'Keep as is', "Need Dev's check", 'Need to check on the smartboard', 'TLMS Revised'];
export const reviewColumns = logColumns.slice(0,12);
export const columnLabel = key => key === '처리 결과' ? '진행 상황/처리 결과' : key;
export function reviewGroups(data,logs){
  const buckets=new Map();
  for(const log of logs){
    const round=log['검수 차수']||'1st Review';
    const key=`${log.lessonId}|${round}`;
    if(!buckets.has(key))buckets.set(key,{key,lessonId:log.lessonId,round,rows:[]});
    buckets.get(key).rows.push(log);
  }
  const positions=new Map(data.lessons.map((l,i)=>[l.id,i]));
  return [...buckets.values()].sort((a,b)=>(positions.get(a.lessonId)??Infinity)-(positions.get(b.lessonId)??Infinity)||(a.round==='1st Review'?0:1)-(b.round==='1st Review'?0:1));
}
export function reviewGroupLabel(data,group){
 const h=hierarchy(data,group.lessonId);
 return `${h.level?.name||'미선택 Level'} / ${h.textbook?.name||'미선택 Textbook'} / ${h.unit?.name||'미선택 Unit'} / ${h.lesson?`Lesson ${h.lesson.number} · ${h.lesson.name}`:'Lesson 선택 필요'} [${group.round==='1st Review'?'1st REVIEW COMMENTS':'Final REVIEW COMMENTS'}]`;
}
export function hasPendingReview(status){return !['Revised','Fixed in Launcher','Keep as is','TLMS Revised','Fixed'].includes(status);}

// 검수 저장은 공통 lessonId 관계를 유지하고 다른 메뉴의 데이터를 그대로 전달한다.
export function applyReviewLogs(data,logs){
 const lessons=data.lessons.map(lesson=>{
  if(!lesson.noErrors)return lesson;
  const rounds=new Set(logs.filter(log=>log.lessonId===lesson.id).map(log=>log['검수 차수']));
  const clear=[...rounds].filter(round=>lesson.noErrors[round]);
  if(!clear.length)return lesson;
  const noErrors={...lesson.noErrors};
  clear.forEach(round=>delete noErrors[round]);
  return {...lesson,noErrors};
 });
 return {...data,lessons,logs};
}

export const initialReviewLevels=['ECP6m','ECP7m','ECP7','S1','MAG1','MAG2'];
export function ensureReviewLevels(input){
 if(input.reviewNavigationVersion===1)return input.legacyReviewLevelIds?input:{...input,legacyReviewLevelIds:input.projects.filter(p=>!input.reviewLevelIds?.includes(p.id)).map(p=>p.id)};
 const data=structuredClone(input);
 data.reviewNavigationVersion=1;
 data.reviewLevelIds=[];
 const previousLevelIds=data.projects.map(p=>p.id);
 initialReviewLevels.forEach((name,index)=>{
  // 명칭이 이미 정확히 등록된 Level은 재사용하며 기존 데이터를 옮기지 않는다.
  let level=data.projects.find(p=>p.name===name);
  if(!level){
   const id=`review-level-${name}`;
   level={id,name,course:'가상 검수 콘텐츠',team:'샘플 콘텐츠팀',owner:'샘플 담당자',start:'2026-10-01',end:'2026-11-30',status:'진행 중'};
   data.projects.push(level);
   const textbookId=`review-book-${name}`,unitId=`review-unit-${name}`;
   data.textbooks.push({id:textbookId,levelId:id,name:`${name} Sample Textbook`,description:'레벨 탐색을 확인하기 위한 가상 교재'});
   data.units.push({id:unitId,textbookId,name:'Unit 01',description:'가상 Unit'});
   [1,2].forEach(n=>data.lessons.push({id:`review-lesson-${name}-${n}`,projectId:id,unitId,number:String(n).padStart(2,'0'),name:`Sample Lesson ${n}`,team:level.team,owner:level.owner,sourceDue:'2026-10-12',authorDue:'2026-10-19',reviewDue:'2026-10-26',status:n===2?'검수 완료':'검수 대기'}));
   ['1st Review','Final Review'].forEach((round,n)=>data.logs.push(linkedLog(data,{id:`review-log-${name}-${n}`,PIC:'샘플 담당자',CLASS:'Class A',ACTIVITY:'Activity 01','TEXTBOOK PAGE NO.':'12','ERROR TYPE':n?'UI':'Content',DETAILS:n?'샘플 버튼 정렬을 확인해주세요.':'샘플 문항 지시문을 확인해주세요.',screenshots:[],SCREENSHOT:'',STATUS:n?'Revised':"Need Dev's check",'처리 결과':n?'샘플 수정 반영':'','검수 차수':round,'검수자':'샘플 검수자','등록일':'2026-10-08','수정자':'','수정일':'','재검수 결과':''},`review-lesson-${name}-1`)));
  }
  data.reviewLevelIds.push(level.id);
 });
 data.legacyReviewLevelIds=previousLevelIds.filter(id=>!data.reviewLevelIds.includes(id));
 return data;
}
export function reviewSummary(data,levelId){
 const lessons=data.lessons.filter(l=>!needsReviewAssignment(data,{lessonId:l.id})&&hierarchy(data,l.id).level?.id===levelId);
 const ids=new Set(lessons.map(l=>l.id));
 const logs=data.logs.filter(l=>ids.has(l.lessonId));
 return {lessons:lessons.length,pending:logs.filter(l=>hasPendingReview(l.STATUS)).length,completed:lessons.filter(l=>l.status==='검수 완료').length};
}
export function needsReviewAssignment(data,log){
 const h=hierarchy(data,log.lessonId);
 return !h.lesson||!h.unit||!h.textbook||!h.level||h.textbook.levelId!==h.lesson.projectId;
}

export function archivedReviewLevelIds(data){return data.projects.filter(p=>data.legacyReviewLevelIds?.includes(p.id)||/^Project [A-D]$/i.test(p.name.trim())).map(p=>p.id);}
export function reviewLevelOptions(data){
 const archived=new Set(archivedReviewLevelIds(data));
 const available=data.projects.filter(p=>!archived.has(p.id));
 const order=data.reviewLevelIds||[];
 return [...available.filter(p=>order.includes(p.id)).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)),...available.filter(p=>!order.includes(p.id))];
}
