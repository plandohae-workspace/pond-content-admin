import {reviewLevelOptions} from './model.js';
export const folderLevelNames=['ECP6m','ECP7m','ECP7','S1','MAG1','MAG2'];
export const folderDefinitions=[
 'POND Lesson Flow','Content Dev. List','Content Sample','Manuscript Prototype','Inputting Statements','VL','Multimedia Contents','Prototype Resources',"Teacher's Tip",'POND Resources',
].map((name,index)=>({number:index+1,name}));
export function folderLevels(data){const levels=reviewLevelOptions(data);return folderLevelNames.map(name=>levels.find(l=>l.name===name)).filter(Boolean);}
// Validate syntax only. Never fetch the folder or infer access permissions.
export function driveFolderUrl(value){try{const u=new URL((value||'').trim());return u.protocol==='https:'&&u.hostname==='drive.google.com'&&!u.port&&!u.username&&!u.password&&/^\/(?:drive\/(?:u\/\d+\/)?)?folders\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)?u.href:'';}catch{return '';}}
export function folderRows(data,levelId){return folderDefinitions.map(folder=>({folder,record:(data.levelFolderLinks||[]).find(r=>r.levelId===levelId&&r.folderNumber===folder.number)}));}
export function folderRegisteredCount(data,levelId){return folderRows(data,levelId).filter(r=>driveFolderUrl(r.record?.url)).length;}
export function saveFolderLink(data,draft,{isAdmin=false,at=new Date().toISOString()}={}){
 if(!isAdmin)throw new Error('Admin 데모 역할에서만 링크를 변경할 수 있습니다.');
 if(!folderLevels(data).some(l=>l.id===draft.levelId))throw new Error('등록할 Level을 확인해주세요.');
 if(!folderDefinitions.some(f=>f.number===draft.folderNumber))throw new Error('고정 폴더 번호를 확인해주세요.');
 const url=driveFolderUrl(draft.url);
 if(!url)throw new Error('HTTPS Google Drive 폴더 주소를 입력해주세요. 예: https://drive.google.com/drive/folders/폴더ID');
 const rows=data.levelFolderLinks||[],previous=rows.find(r=>r.levelId===draft.levelId&&r.folderNumber===draft.folderNumber);
 const saved={...previous,id:previous?.id||crypto.randomUUID(),levelId:draft.levelId,folderNumber:draft.folderNumber,url,registeredAt:previous?.registeredAt||at,modifiedAt:at};
 return {...data,levelFolderLinks:previous?rows.map(r=>r===previous?saved:r):[...rows,saved]};
}
export function deleteFolderLink(data,levelId,folderNumber,{isAdmin=false}={}){
 if(!isAdmin)throw new Error('Admin 데모 역할에서만 링크를 삭제할 수 있습니다.');
 return {...data,levelFolderLinks:(data.levelFolderLinks||[]).filter(r=>r.levelId!==levelId||r.folderNumber!==folderNumber)};
}
