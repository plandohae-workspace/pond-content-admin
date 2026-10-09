// randomUUID is restricted to secure contexts. getRandomValues also works
// on ordinary HTTP previews; retain UUID v4 format without weak randomness.
export function uuidV4(cryptoApi=globalThis.crypto){
 if(!cryptoApi?.getRandomValues)throw new Error('이 브라우저에서 ID를 생성할 수 없습니다. 최신 브라우저에서 다시 열어주세요.');
 const bytes=cryptoApi.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function installUUIDCompatibility(cryptoApi=globalThis.crypto){
 if(cryptoApi&&typeof cryptoApi.randomUUID!=='function'&&typeof cryptoApi.getRandomValues==='function'){
  Object.defineProperty(cryptoApi,'randomUUID',{value:()=>uuidV4(cryptoApi),configurable:true,writable:true});return true;
 }
 return false;
}
installUUIDCompatibility();
export function traceLessonSave(event,context={}){
 console.info('[POND Lesson 저장 추적]',{event,...context,secureContext:globalThis.isSecureContext,build:globalThis.document?.querySelector('meta[name="pond-build"]')?.content||'web'});
}

export function saveErrorMessage(error){
 const detail=error instanceof Error?`${error.name}: ${error.message}`:'알 수 없는 오류';
 const explanation=error?.name==='QuotaExceededError'?'브라우저 저장 공간이 부족합니다. 저장 공간을 확보한 뒤 다시 시도해주세요.':error?.name==='SecurityError'?'이 미리보기 환경에서 브라우저 저장 권한이 차단되었습니다. 다운로드한 HTML을 브라우저에서 직접 열거나 사이트 저장 권한을 확인해주세요.':'변경 내용을 저장하지 못했습니다.';
 return `${explanation} (${detail}) 입력 내용은 유지됩니다.`;
}
