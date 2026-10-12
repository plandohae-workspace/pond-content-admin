import {roles,permissions} from './model.js';
const defaultTeams=['운영팀','소스팀','저작팀','검수팀'];
export function canManageUsers(actorRole){return !!permissions[actorRole]?.includes('권한 변경');}
export function userRecords(data){const rows=Array.isArray(data.users)?data.users:data.users==null?roles.map((role,i)=>({id:`demo-user-${i+1}`,name:`샘플 사용자 ${i+1}`,email:`sample.user${i+1}@example.com`,team:defaultTeams[i],role,active:true,createdAt:null,modifiedAt:null})):[];return rows.map((u,i)=>({...u,id:u.id||`legacy-user-${i+1}`,active:typeof u.active==='boolean'?u.active:u.status==='활성'}));}
export function userTeams(data){const values=[...(Array.isArray(data.teams)?data.teams.map(t=>typeof t==='string'?t:t.name):[]),...(data.projects||[]).map(p=>p.team),...(data.lessons||[]).map(l=>l.team),...userRecords(data).map(u=>u.team)].filter(t=>typeof t==='string'&&t.trim()).map(t=>t.trim());return values.length?[...new Set(values)]:defaultTeams;}
export function validUserEmail(value){if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value))return false;const parts=value.split('@');if(parts.length!==2)return false;const [local,domain]=parts;return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)&&local.length<=64&&!local.startsWith('.')&&!local.endsWith('.')&&!local.includes('..')&&domain.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));}
function invalid(field,message){const error=new Error(message);error.field=field;throw error;}
export function validateUser(data,draft){
 if(data.users!=null&&!Array.isArray(data.users))throw new Error('기존 사용자 데이터 형식을 확인해주세요. 원본 데이터는 유지됩니다.');
 const name=(draft.name||'').trim(),email=(draft.email||'').trim().toLowerCase(),team=(draft.team||'').trim();
 if(!name)invalid('name','이름을 입력해주세요.');
 if(!email)invalid('email','이메일 주소를 입력해주세요.');
 if(!validUserEmail(email))invalid('email','올바른 이메일 주소를 입력해주세요.');
 if(userRecords(data).some(u=>u.id!==draft.id&&String(u.email||'').trim().toLowerCase()===email))invalid('email','이미 등록된 이메일 주소입니다.');
 if(!team)invalid('team','소속 팀을 선택해주세요.');
 if(!userTeams(data).includes(team))invalid('team','기존 팀 목록에서 소속 팀을 선택해주세요.');
 if(!roles.includes(draft.role))invalid('role','기존 역할 중 하나를 선택해주세요.');
 return {name,email,team,role:draft.role};
}
export function saveUserRecord(data,draft,{actorRole,at=new Date().toISOString()}={}){
 if(!canManageUsers(actorRole))throw new Error('현재 데모 역할에는 사용자 관리 권한이 없습니다.');
 const values=validateUser(data,draft),rows=userRecords(data);if(new Set(rows.map(u=>u.id)).size!==rows.length)throw new Error('기존 사용자 ID 중복을 확인해주세요. 원본 데이터는 유지됩니다.');const previous=rows.find(u=>u.id===draft.id);
 if(draft.id&&!previous)throw new Error('수정할 사용자를 찾을 수 없습니다. 입력 내용은 유지됩니다.');
 if(previous&&typeof draft.active!=='boolean')invalid('active','활성 상태를 확인해주세요.');
 const saved={...previous,...values,id:previous?.id||crypto.randomUUID(),active:previous?draft.active:true,createdAt:previous?.createdAt??(previous?null:at),modifiedAt:at};
 if(previous&&'status' in previous)saved.status=saved.active?'활성':'비활성';
 return {...data,users:previous?rows.map(u=>u.id===saved.id?saved:u):[...rows,saved]};
}
export function searchUsers(data,query){const q=query.trim().toLowerCase();return userRecords(data).filter(u=>[u.name,u.email,u.team,u.role].some(value=>String(value||'').toLowerCase().includes(q)));}

export function setUserActive(data,id,active,{actorRole,at=new Date().toISOString()}={}){
 if(!canManageUsers(actorRole))throw new Error('현재 데모 역할에는 사용자 관리 권한이 없습니다.');
 const rows=userRecords(data);
 if(rows.filter(u=>u.id===id).length!==1)throw new Error('변경할 사용자 ID를 확인해주세요.');
 if(typeof active!=='boolean')throw new Error('활성 상태를 확인해주세요.');
 return {...data,users:rows.map(u=>u.id===id?{...u,active,modifiedAt:at,...('status' in u?{status:active?'활성':'비활성'}:{})}:u)};
}
