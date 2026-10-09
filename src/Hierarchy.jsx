import React,{useState} from 'react';
import {Plus,ChevronRight,Download} from 'lucide-react';
import {stages,hierarchy,progress,normalizeLogs} from './model.js';
export function Cascade({data,value,onChange,disabled=false,includeLesson=true,disableLevel=false,prefix='',levelOptions=data.projects}){
 const h=hierarchy(data,value.lessonId);
 const linkedUnit=data.units.find(u=>u.id===value.unitId)||h.unit;
 const linkedBook=data.textbooks.find(t=>t.id===(value.textbookId||linkedUnit?.textbookId))||h.textbook;
 const levelId=value.levelId??linkedBook?.levelId??h.level?.id??'';
 const textbookId=value.textbookId??linkedBook?.id??h.textbook?.id??'';
 const unitId=value.unitId??h.unit?.id??'';
 const lessonId=value.lessonId||'';
 return <div className="cascade">{[
  ['levelId','Level',levelOptions,levelId],
  ['textbookId','Textbook',data.textbooks.filter(t=>t.levelId===levelId),textbookId],
  ['unitId','Unit',data.units.filter(u=>u.textbookId===textbookId),unitId],
  ...(includeLesson?[['lessonId','Lesson',data.lessons.filter(l=>l.unitId===unitId),lessonId]]:[]),
 ].map(([key,label,options,current],i)=><select key={key} aria-label={`${prefix}${label}`} disabled={disabled||(disableLevel&&key==='levelId')} value={current} onChange={e=>{
 const next={levelId,textbookId,unitId,lessonId,[key]:e.target.value};
 for(const child of ['levelId','textbookId','unitId','lessonId'].slice(i+1))next[child]='';
 onChange(next);
 }}><option value="">{label} 선택</option>{options.map(o=><option key={o.id} value={o.id}>{key==='lessonId'?`Lesson ${o.number} · ${o.name}`:o.name}</option>)}</select>)}</div>;
}
export default function HierarchyManager({data,save,can,initialLevel,onLesson,exportLogs,notify}){
 const [choice,setChoice]=useState({levelId:initialLevel||data.projects[0]?.id||'',textbookId:'',unitId:'',lessonId:''});
 const [edit,setEdit]=useState(null),[busy,setBusy]=useState(false);
 const level=data.projects.find(p=>p.id===choice.levelId);
 const book=data.textbooks.find(t=>t.id===choice.textbookId);
 const unit=data.units.find(u=>u.id===choice.unitId);
 const ls=data.lessons.filter(l=>l.projectId===choice.levelId);
 const begin=(kind,item)=>setEdit({kind,values:item?{...item}:{name:'',description:'',...(kind==='level'?{course:'',team:'콘텐츠 1팀',owner:'',start:new Date().toISOString().slice(0,10),end:new Date().toISOString().slice(0,10),status:'진행 중'}:{}),...(kind==='textbook'?{levelId:choice.levelId}:{}),...(kind==='unit'?{textbookId:choice.textbookId}:{})}});
 const input=(key,label,type='text',required=true)=><label>{label}<input required={required} type={type} value={edit.values[key]||''} onChange={e=>setEdit({...edit,values:{...edit.values,[key]:e.target.value}})}/></label>;
 async function submit(e){e.preventDefault();if(!can('Level 관리'))return;const v=edit.values;if(edit.kind==='level'&&v.end<v.start){notify('종료일은 시작일 이후여야 합니다.');return;}
 const key={level:'projects',textbook:'textbooks',unit:'units'}[edit.kind];const item={...v,id:v.id||crypto.randomUUID()};
 let next={...data,[key]:v.id?data[key].map(x=>x.id===v.id?item:x):[...data[key],item]};
 next.logs=normalizeLogs(next,next.logs);setBusy(true);if(await save(next))setEdit(null);setBusy(false);
 }
 const collection=(title,items,kind,selected,change,disabled)=><section className="panel hierarchy-panel"><div className="section-title"><h2>{title} <span className="count">{items.length}</span></h2><button disabled={!can('Level 관리')||disabled} onClick={()=>begin(kind)}><Plus size={15}/>추가</button></div>{items.map(item=><div className={`hierarchy-item ${selected===item.id?'chosen':''}`} key={item.id}><button className="hierarchy-select" onClick={()=>change(item.id)}><strong>{item.name}</strong><small>{item.description||item.course||'상세 내용 없음'}</small><ChevronRight size={15}/></button><button disabled={!can('Level 관리')} onClick={()=>begin(kind,item)}>수정</button></div>)}{!items.length&&<p className="empty">상위 항목을 선택하거나 새 항목을 추가하세요.</p>}</section>;
 return <><div className="info-banner"><div><strong>Level → Textbook → Unit → Lesson</strong><p>왼쪽부터 선택하여 콘텐츠를 관리하세요. 기존 프로젝트와 Lesson은 원본 ID를 유지한 채 기본 Textbook·Unit에 연결됩니다.</p></div></div><div className="hierarchy-grid">
 {collection('학년 / Level',data.projects,'level',choice.levelId,id=>setChoice({levelId:id,textbookId:'',unitId:'',lessonId:''}),false)}
 {collection('Textbook',data.textbooks.filter(t=>t.levelId===choice.levelId),'textbook',choice.textbookId,id=>setChoice({...choice,textbookId:id,unitId:'',lessonId:''}),!level)}
 {collection('Unit',data.units.filter(u=>u.textbookId===choice.textbookId),'unit',choice.unitId,id=>setChoice({...choice,unitId:id,lessonId:''}),!book)}
 </div>{level&&<div className="detail-summary"><div><small>Level 담당</small><strong>{level.team} · {level.owner}</strong></div><div><small>기간</small><strong>{level.start} — {level.end}</strong></div><div><small>진행률 / 상태</small><strong>{progress(ls)}% · {level.status}</strong></div><button disabled={!can('Level 완료')||level.status==='완료'} onClick={()=>{if(!ls.length||ls.some(l=>l.status!=='검수 완료')){notify('모든 Lesson이 검수 완료되어야 Level을 완료할 수 있습니다.');return;}save({...data,projects:data.projects.map(p=>p.id===level.id?{...p,status:'완료'}:p)});}}>Level 완료 처리</button><button onClick={()=>exportLogs(data.logs.filter(l=>hierarchy(data,l.lessonId).level?.id===level.id),level.name)}><Download size={15}/>Level Excel</button></div>}
 <section className="panel"><div className="section-title"><h2>{unit?.name||book?.name||level?.name||'전체'} · Lesson</h2><button disabled={!can('Lesson 수정')||!unit||level?.status==='완료'} onClick={()=>onLesson(null,{projectId:level.id,unitId:unit.id,number:String(data.lessons.filter(l=>l.unitId===unit.id).length+1).padStart(2,'0'),name:'',team:level.team,owner:'',sourceDue:new Date().toISOString().slice(0,10),authorDue:new Date().toISOString().slice(0,10),reviewDue:new Date().toISOString().slice(0,10),status:stages[0]})}><Plus size={15}/>Lesson 추가</button></div><div className="table-wrap"><table><thead><tr><th>Lesson</th><th>Textbook / Unit</th><th>담당자</th><th>검수 예정</th><th>상태</th><th>관리</th></tr></thead><tbody>{data.lessons.filter(l=>{const h=hierarchy(data,l.id);return (!choice.levelId||h.level?.id===choice.levelId)&&(!choice.textbookId||h.textbook?.id===choice.textbookId)&&(!choice.unitId||l.unitId===choice.unitId);}).map(l=>{const h=hierarchy(data,l.id);return <tr key={l.id}><td><button className="text-button" onClick={()=>onLesson(l.id)}>Lesson {l.number} · {l.name}</button></td><td>{h.textbook?.name}<small>{h.unit?.name}</small></td><td>{l.owner}</td><td>{l.reviewDue}</td><td>{l.status}</td><td><button disabled={!can('Lesson 수정')||level?.status==='완료'} onClick={()=>onLesson(null,l)}>수정</button></td></tr>;})}</tbody></table></div></section>
 {edit&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-label="계층 정보"><div className="modal-title"><h2>{edit.kind==='level'?'Level':edit.kind==='textbook'?'Textbook':'Unit'} {edit.values.id?'수정':'추가'}</h2><button onClick={()=>setEdit(null)}>닫기</button></div><form onSubmit={submit}><div className="form-grid">{input('name','이름')}{edit.kind==='level'?<>{input('course','콘텐츠 설명')}{input('team','담당팀')}{input('owner','담당자')}{input('start','시작일','date')}{input('end','종료 예정일','date')}</>:input('description','설명','text',false)}</div><div className="modal-actions"><button type="button" onClick={()=>setEdit(null)}>취소</button><button className="primary" disabled={busy}>저장</button></div></form></section></div>}
 </>;
}
