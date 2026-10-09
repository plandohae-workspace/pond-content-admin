import {hierarchy} from './model.js';
export const hubDefinitions=[
 {id:'lesson-flow',name:'Lesson Flow',type:'Google Drive 파일 / 폴더',required:true},
 {id:'inputting-statement',name:'Inputting Statement',type:'Lesson별 Excel',required:true},
 {id:'teacher-tip',name:'Teacher Tip',type:'Google Sheets',required:true},
 {id:'audio',name:'음원 파일',type:'Google Drive 폴더',required:true},
 {id:'images',name:'이미지 파일',type:'Google Drive 폴더',required:true},
 {id:'answer-key',name:'AK (Answer Key)',type:'PDF',required:true},
];
export const hubStatuses=['미등록','수신 대기','등록 완료'];
export function hubUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export function hubRows(data,lessonId){return hubDefinitions.map(definition=>({definition,record:(data.materialHubLinks||[]).find(r=>r.lessonId===lessonId&&r.kind===definition.id)}));}
export function hubSummary(data,lessonId){const rows=hubRows(data,lessonId).filter(r=>r.definition.required&&r.record?.applicable!==false),registered=rows.filter(r=>r.record?.status==='등록 완료'&&hubUrl(r.record.url)).length,waiting=rows.filter(r=>r.record?.status==='수신 대기').map(r=>r.definition.name),missing=rows.filter(r=>!r.record||r.record.status==='미등록'||r.record.status==='등록 완료'&&!hubUrl(r.record.url)).map(r=>r.definition.name);return {total:rows.length,registered,percent:rows.length?Math.round(registered/rows.length*100):null,waiting,missing};}
export function validateHubRecord(data,record){
 const h=hierarchy(data,record.lessonId);
 if(!h.lesson||!h.unit||!h.textbook||!h.level)throw new Error('연결된 Lesson과 상위 콘텐츠 정보를 확인해주세요.');
 if(!hubDefinitions.some(d=>d.id===record.kind))throw new Error('자료 종류를 선택해주세요.');
 if(!record.name?.trim())throw new Error('자료 이름을 입력해주세요.');
 if(!hubStatuses.includes(record.status))throw new Error('등록 상태를 선택해주세요.');
 const url=(record.url||'').trim();
 if(url&&!hubUrl(url))throw new Error('원본 URL은 유효한 HTTPS 주소여야 합니다. 사용자 정보가 포함된 주소는 사용할 수 없습니다.');
 if(record.status==='등록 완료'&&!url)throw new Error('등록 완료 상태에는 원본 HTTPS 링크가 필요합니다.');
 if((data.materialHubLinks||[]).some(r=>r.id!==record.id&&r.lessonId===record.lessonId&&r.kind===record.kind))throw new Error('해당 Lesson에 같은 종류의 자료가 이미 있습니다. 기존 자료의 수정 버튼을 사용해주세요.');
 return {...record,name:record.name.trim(),url:url?hubUrl(url):''};
}
export function upsertHubRecord(data,record,at=new Date().toISOString()){
 const validated=validateHubRecord(data,record),previous=(data.materialHubLinks||[]).find(r=>r.id===record.id);
 if(record.id&&(!previous||previous.lessonId!==record.lessonId))throw new Error('수정할 자료의 원래 Lesson 연결을 확인해주세요.');
 const saved={...previous,...validated,id:previous?.id||crypto.randomUUID(),applicable:previous?.applicable??true,registrar:previous?.registrar||'데모 등록자',registeredAt:previous?.registeredAt||at,modifiedAt:at};
 return {...data,materialHubLinks:previous?data.materialHubLinks.map(r=>r.id===saved.id?saved:r):[...(data.materialHubLinks||[]),saved]};
}
export function removeHubRecord(data,id){return {...data,materialHubLinks:(data.materialHubLinks||[]).filter(r=>r.id!==id)};}
