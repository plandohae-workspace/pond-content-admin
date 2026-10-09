import test from 'node:test';import assert from 'node:assert/strict';
import {lessonBoardCard} from './lesson-board.js';import {productionDefinitions} from './lesson-model.js';
test('board derives waiting, partial, completed and held without writing state',()=>{
 const lesson={id:'demo',owner:'샘플 담당자',production:{stages:Object.fromEntries(productionDefinitions.map(d=>[d.id,{status:'대기'}]))}};
 const before=structuredClone(lesson);assert.equal(lessonBoardCard(lesson).column,'제작 대기');assert.deepEqual(lesson,before);
 lesson.production.stages.source={status:'완료'};assert.equal(lessonBoardCard(lesson).column,'제작 진행');assert.equal(lessonBoardCard(lesson).progress,17);
 lesson.production.stages.source.status='진행 중';assert.equal(lessonBoardCard(lesson).column,'제작 진행');assert.equal(lessonBoardCard(lesson).progress,0);
 lesson.production.stages.source.status='보류';assert.equal(lessonBoardCard(lesson).column,'제작 진행');assert.equal(lessonBoardCard(lesson).held,true);
 for(const d of productionDefinitions)lesson.production.stages[d.id].status='완료';assert.equal(lessonBoardCard(lesson).column,'제작 완료');assert.equal(lessonBoardCard(lesson).progress,100);
});
test('card deadline and owner come from the current production stage',()=>{const lesson={owner:'기본 담당자',production:{stages:{source:{status:'완료'},authoring:{status:'진행 중',owner:'가상 저작 담당자',deadline:'2026-10-20'}}}};const result=lessonBoardCard(lesson);assert.equal(result.current,'저작 작업');assert.equal(result.owner,'가상 저작 담당자');assert.equal(result.deadline,'2026-10-20');});
