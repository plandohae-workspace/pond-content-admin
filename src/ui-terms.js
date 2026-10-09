// Official display terminology only. Stored keys/status codes/history stay intact.
export function uiText(value){return typeof value==='string'?value.replaceAll('Lesson Production Board','Lesson Authoring Board').replaceAll('제작','저작'):value;}
