import {seed,migrate,ensureReviewLevels} from './model.js';
let dbPromise;
function database(){
  dbPromise ||= new Promise((resolve,reject)=>{
    const request=indexedDB.open('pond-admin',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('workspace');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  return dbPromise;
}
export async function store(data){
  const db=await database();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('workspace','readwrite');
    tx.objectStore('workspace').put(data,'current');
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장 실패'));
  });
}
export async function load(){
  const db=await database();
  const saved=await new Promise((resolve,reject)=>{
    const r=db.transaction('workspace').objectStore('workspace').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  if(saved){const next=ensureReviewLevels(migrate(saved));if(saved.reviewNavigationVersion!==1||!saved.legacyReviewLevelIds)await store(next);return next;}
  const legacy=localStorage.getItem('pond-v1');
  // 파싱 실패 시 원본을 덮어쓰지 않고 복구 가능한 오류를 표시한다.
  const data=ensureReviewLevels(migrate(legacy?JSON.parse(legacy):seed()));
  await store(data);return data;
}
