import {traceLessonSave,saveErrorMessage} from './runtime.js';
import React,{useState,useEffect,useRef} from 'react';
import {X,Check,Clock} from 'lucide-react';
import {Cascade} from './Hierarchy.jsx';
import {stages,reviewLevelOptions,hierarchy} from './model.js';
import {draftLesson,productionDefinitions,productionStatuses,validateLesson,saveLessonDraft,businessToday,stageDelayed} from './lesson-model.js';
export default function LessonEditor({data,lesson,onSave,onClose,can,onDirty}){
 const [draft,setDraft]=useState(()=>draftLesson(lesson)),[tab,setTab]=useState('basic'),[step,setStep]=useState('source'),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{onDirty(dirty||busy);return()=>onDirty(false);},[dirty,busy,onDirty]);
 useEffect(()=>{const warning=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warning);return()=>window.removeEventListener('beforeunload',warning);},[dirty]);
 const errorRef=useRef(null);
 useEffect(()=>{if(error){errorRef.current?.scrollIntoView({block:'nearest'});errorRef.current?.focus();}},[error]);
 const patch=changes=>{setDraft(d=>({...d,...changes}));setDirty(true);setError('');};
 const patchStage=changes=>{setDraft(d=>({...d,production:{...d.production,stages:{...d.production.stages,[step]:{...d.production.stages[step],...changes}}}}));setDirty(true);setError('');};
 const close=()=>{if(dirty&&!confirm('저장하지 않은 Lesson 변경을 버리고 닫을까요?'))return;onClose();};
 const stage=draft.production.stages[step],definition=productionDefinitions.find(d=>d.id===step);
 const levelOptions=reviewLevelOptions(data);const existing=hierarchy(data,lesson.id).level;if(existing&&!levelOptions.some(l=>l.id===existing.id))levelOptions.unshift(existing);
 const field=(key,label,type='text',required=true)=><label>{label}{required&&<em> *</em>}<input aria-label={label} required={required} type={type} value={draft[key]||''} onChange={e=>patch({[key]:e.target.value})}/></label>;
 const stageField=(key,label,type='text',wide=false)=><label className={wide?'wide':undefined}>{label}{key==='actualComplete'&&stage.status==='완료'&&<em> * 필수</em>}<input aria-label={`단계 ${label}`} type={type} aria-invalid={!!error&&error.startsWith(`${definition.name}:`)&&((key==='actualComplete'&&/실제 완료일/.test(error))||(key==='plannedStart'&&/예정 시작일/.test(error)))} aria-describedby={error?'lesson-save-error':undefined} value={stage[key]||''} onChange={e=>patchStage({[key]:e.target.value})}/></label>;
 async function submit(e){
  e.preventDefault();traceLessonSave('저장 버튼 클릭 감지',{lessonId:draft.id,stageId:step,tab});if(busy)return;
  if(!can('Lesson 수정')){setError('현재 역할에는 Lesson 수정 권한이 없습니다.');return;}
  const invalid=[...e.currentTarget.elements].find(el=>el.validity?.badInput);
  if(invalid){console.warn('[Lesson 날짜 입력 오류]',{lessonId:draft.id,field:invalid.getAttribute('aria-label')});setError(`${invalid.getAttribute('aria-label')||'입력값'}: 올바른 날짜를 달력에서 선택해주세요.`);return;}
  setBusy(true);
  try{
   const original=data.lessons.find(l=>l.id===draft.id);
   const validation=validateLesson(data,draft,{original});traceLessonSave('입력값 검증 결과',{lessonId:draft.id,stageId:step,valid:!validation,reason:validation});if(validation){console.warn('[Lesson 저장 검증 실패]',{lessonId:draft.id,selectedStage:step,reason:validation});setError(validation);return;}
   traceLessonSave('변경 이력·저장 데이터 생성',{lessonId:draft.id,stageId:step});const item=saveLessonDraft(data,original,draft);
   traceLessonSave('저장 함수 호출',{lessonId:item.id,stageId:step});const saved=await onSave({...item,id:item.id||crypto.randomUUID()});
   traceLessonSave('저장 함수 결과',{lessonId:item.id,stageId:step,saved});
   if(saved===true){setDirty(false);traceLessonSave('팝업 닫기 함수 호출',{lessonId:item.id,stageId:step});onClose();}
   else {console.error('[Lesson 저장 실패]',{lessonId:draft.id,selectedStage:step,reason:'저장 함수가 성공을 반환하지 않음'});setError('브라우저 저장소에 저장하지 못했습니다. 저장 공간·사이트 저장 권한을 확인하고 다시 시도해주세요. 입력 내용은 유지됩니다.');}
  }catch(err){console.error('[Lesson 저장 실패]',{lessonId:draft.id,selectedStage:step,error:err});setError(saveErrorMessage(err));}
  finally{setBusy(false);}
 }

 return <div className="modal-backdrop"><section className="modal lesson-editor" role="dialog" aria-modal="true" aria-label="Lesson 정보 편집"><div className="modal-title"><div><h2>{lesson.id?'Lesson 정보 수정':'Lesson 추가'}</h2><small>기본 정보와 단계별 제작 현황을 구분해 편집합니다.</small></div><button aria-label="닫기" disabled={busy} onClick={close}><X size={20}/></button></div><div className="lesson-editor-tabs" role="tablist" aria-label="Lesson 편집 구역"><button role="tab" aria-selected={tab==='basic'} onClick={()=>setTab('basic')}>기본 정보·일정</button><button role="tab" aria-selected={tab==='stages'} onClick={()=>setTab('stages')}>단계별 제작 현황</button></div><form onSubmit={submit} noValidate>{error&&<p className="form-error" role="alert" id="lesson-save-error" ref={errorRef} tabIndex={-1}>{error}</p>}
 {tab==='basic'?<div className="form-grid"><div className="wide"><Cascade data={data} levelOptions={levelOptions} includeLesson={false} value={draft.scope||{lessonId:draft.id,unitId:draft.unitId}} prefix="Lesson 정보 " onChange={scope=>patch({scope,unitId:scope.unitId,projectId:scope.levelId})}/></div>{field('number','Lesson 번호')}{field('name','Lesson명')}{field('team','담당팀')}{field('owner','담당자')}{field('sourceDue','소스 마감일','date')}{field('authorDue','저작 마감일','date')}{field('reviewDue','검수 예정일','date')}<label>현재 상태<select aria-label="현재 상태" value={draft.status||'소스 대기'} onChange={e=>patch({status:e.target.value})}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><p className="form-help wide">기존 전체 상태와 일정은 보존합니다. 단계별 완료 여부는 ‘단계별 제작 현황’에서 별도로 관리합니다.</p></div>:<div className="stage-editor-layout"><nav className="stage-editor-nav" aria-label="편집할 제작 단계">{productionDefinitions.map(d=><button type="button" key={d.id} aria-pressed={step===d.id} onClick={()=>setStep(d.id)}>{d.name}<small>{draft.production.stages[d.id].status}</small></button>)}</nav><div className="stage-editor-fields"><h3>{definition.name}</h3><div className="form-grid"><label>진행 상태<select aria-label="단계 진행 상태" disabled={!!definition.round&&!can('검수 편집')} value={stage.status} onChange={e=>patchStage({status:e.target.value})}>{productionStatuses.map(s=><option key={s}>{s}</option>)}</select></label>{stageField('team','담당팀')}{stageField('owner','담당자','text',true)}{stageField('plannedStart','예정 시작일','date')}{stageField('deadline','예정 마감일','date')}{stageField('actualStart','실제 시작일','date')}{stageField('actualComplete','실제 완료일','date')}<label className="wide">비고<textarea aria-label="단계 비고" value={stage.note} onChange={e=>patchStage({note:e.target.value})}/></label>{stageDelayed(stage,businessToday())&&<p className="delay-note wide"><Clock size={14}/>마감일이 지났고 완료되지 않은 단계입니다.</p>}<p className="form-help wide">완료 선택 시 실제 완료일은 필수입니다. 예정 시작일 ≤ 예정 마감일, 실제 시작일 ≤ 실제 완료일을 확인해주세요. 기본 정보의 소스 → 저작 → 검수 날짜도 순서대로 입력해야 합니다. 검수 단계 완료는 미해결 오류가 없어야 합니다. 이전 완료일과 변경 기록은 보존됩니다.</p></div></div></div>}
 <div className="modal-actions"><button type="button" disabled={busy} onClick={close}>취소</button><button type="submit" className="primary" disabled={busy||!can('Lesson 수정')}><Check size={16}/>{busy?'저장 중…':'저장'}</button></div></form></section></div>;
}
