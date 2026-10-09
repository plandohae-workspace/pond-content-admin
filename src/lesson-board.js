import {lessonProduction,productionDefinitions} from './lesson-model.js';
// Presentation only: never persist an additional board status.
export const boardColumns=['제작 대기','제작 진행','제작 완료'];
export function lessonBoardCard(lesson,today){
 const p=lessonProduction(lesson,today);
 const column=p.completed===6?'제작 완료':productionDefinitions.every(d=>p.stages[d.id].status==='대기')?'제작 대기':'제작 진행';
 const definition=productionDefinitions.find(d=>d.name===p.current);
 const stage=definition?p.stages[definition.id]:null;
 return {...p,column,owner:stage?.owner||lesson.owner||'담당자 미지정',deadline:stage?.deadline||'',held:productionDefinitions.some(d=>p.stages[d.id].status==='보류')};
}
