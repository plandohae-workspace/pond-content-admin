// Local attachment adapter. Replace this boundary when server storage is introduced.
import {maxMaterialFileSize} from './material-model.js';
export function readMaterialFile(file){
 if(file.size>maxMaterialFileSize)return Promise.reject(new Error('자료 파일은 개별 2MB까지 첨부할 수 있습니다. 서버 기반 대용량 저장은 지원하지 않습니다.'));
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(reader.error||new Error('파일을 읽지 못했습니다.'));reader.onload=()=>resolve({fileName:file.name,fileSize:file.size,fileMime:file.type,fileData:reader.result});reader.readAsDataURL(file);});
}
