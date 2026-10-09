import {hierarchy,safeUrl} from './model.js';
export const materialTypes=['이미지','음원','영상','문서','PPT','기타'];
export const maxMaterialFileSize=2*1024*1024;
export function inferMaterialType(name=''){
 const ext=name.split('.').pop().toLowerCase();
 for(const [type,extensions] of [['이미지',['png','jpg','jpeg','gif','webp','bmp','svg']],['음원',['mp3','wav','ogg','m4a','aac','flac']],['영상',['mp4','mov','webm','avi','mkv']],['문서',['pdf','doc','docx','txt','hwp','hwpx','xls','xlsx','csv']],['PPT',['ppt','pptx']]])if(extensions.includes(ext))return type;
 return '기타';
}
export function materialType(m){return materialTypes.includes(m.type)?m.type:m.fileName?inferMaterialType(m.fileName):({'원고':'문서','Textbook PDF':'문서','Workbook':'문서','이미지 Source':'이미지','Audio':'음원','Dev List':'문서','참고자료':'문서'}[m.type]||'기타');}
export function validateMaterial(data,item,scope){
 if(!item.name?.trim())throw new Error('자료명을 입력해주세요.');
 const h=hierarchy(data,item.lessonId);
 if(!h.level||!h.textbook||!h.unit||!h.lesson||h.textbook.levelId!==h.level.id||h.unit.textbookId!==h.textbook.id)throw new Error('Level → Textbook → Unit → Lesson을 모두 선택해주세요.');
 if(scope&&(['levelId','textbookId','unitId','lessonId'].some(k=>!scope[k])||scope.levelId!==h.level.id||scope.textbookId!==h.textbook.id||scope.unitId!==h.unit.id||scope.lessonId!==h.lesson.id))throw new Error('자료의 콘텐츠 선택값을 확인해주세요.');
 if(!materialTypes.includes(item.type))throw new Error('자료 유형을 선택해주세요.');
 if(item.mode==='url'&&!safeUrl(item.url))throw new Error('공유폴더 URL은 http 또는 https 주소로 입력해주세요.');
 return {...item,name:item.name.trim()};
}
export function readableSize(bytes){return bytes==null?'크기 정보 없음':bytes<1024?`${bytes} B`:`${(bytes/1024/1024).toFixed(2)} MB`;}
export function imagePreview(m){return /^data:image\/(png|jpeg|gif|webp|bmp);base64,/i.test(m.fileData||'')?m.fileData:null;}
export function materialPath(data,m){const h=hierarchy(data,m.lessonId);return [h.level?.name,h.textbook?.name,h.unit?.name,h.lesson&&`Lesson ${h.lesson.number} · ${h.lesson.name}`].filter(Boolean).join(' / ')||'연결 확인 필요';}
