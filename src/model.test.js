import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,migrate,reviewLevelOptions,ensureReviewLevels,initialReviewLevels,reviewSummary,needsReviewAssignment,applyReviewLogs,hierarchy,normalizeLogs,progress,safeUrl,permissions,logColumns,reviewColumns,reviewStatuses,reviewGroups,reviewGroupLabel} from './model.js';
test('샘플 연결 관계와 진행률',()=>{const d=seed();assert.equal(d.lessons.length,24);for(const l of d.lessons)assert.ok(d.projects.some(p=>p.id===l.projectId));for(const m of d.materials)assert.ok(d.lessons.some(l=>l.id===m.lessonId));assert.equal(progress([]),0);assert.equal(progress([{status:'검수 완료'}]),100);assert.equal(progress([{status:'소스 대기'}]),0);});
test('외부 링크는 HTTP(S)만 허용',()=>{assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('https://example.com'),'https://example.com/');});
test('데모 권한과 Excel 컬럼',()=>{assert.ok(permissions.Admin.includes('권한 변경'));assert.ok(!permissions['Source Team'].includes('검수 편집'));assert.equal(logColumns.length,18);});

test('v1 마이그레이션은 기존 ID, 필드, 파일, URL과 로그를 보존하고 중복 생성하지 않음',()=>{
 const old=seed();old.materials[0].fileData='data:sample';old.logs[0].SCREENSHOT='https://example.com/legacy.png';const upgraded=migrate(old);
 assert.equal(upgraded.lessons.length,old.lessons.length);assert.equal(upgraded.logs.length,old.logs.length);assert.deepEqual(upgraded.projects,old.projects);assert.deepEqual(upgraded.materials,old.materials);
 assert.equal(upgraded.logs[0].legacyScreenshot,old.logs[0].SCREENSHOT);assert.equal(upgraded.logs[0].SCREENSHOT,'');assert.equal(upgraded.logs[0].id,old.logs[0].id);assert.deepEqual(old.textbooks,undefined);
 for(const l of upgraded.lessons){const h=hierarchy(upgraded,l.id);assert.equal(h.level.id,l.projectId);assert.ok(h.textbook&&h.unit);}
 assert.deepEqual(migrate(upgraded),upgraded);
});
test('계층 명칭 수정과 로그 건수에 독립적인 검수 완료',()=>{const d=migrate(seed());d.units[0].name='Unit 수정';const logs=normalizeLogs(d,d.logs);assert.equal(logs[0].UNIT,'Unit 수정');const empty=d.lessons.find(l=>!d.logs.some(r=>r.lessonId===l.id));empty.status='검수 완료';assert.equal(progress([empty]),100);assert.equal(d.logs.filter(r=>r.lessonId===empty.id).length,0);});

test('검수 그룹은 오류 행만 포함하고 Lesson별 1차/최종을 구분',()=>{const d=migrate(seed());const first={...d.logs[0],id:'first',lessonId:d.lessons[0].id,'검수 차수':'1st Review'};const final={...first,id:'final','검수 차수':'Final Review'};const groups=reviewGroups(d,[final,first]);assert.equal(groups.length,2);assert.equal(groups[0].round,'1st Review');assert.equal(groups[1].round,'Final Review');assert.ok(reviewGroupLabel(d,groups[0]).includes('[1st REVIEW COMMENTS]'));assert.deepEqual(reviewGroups(d,[]),[]);assert.equal(groups.flatMap(g=>g.rows).length,2);assert.equal(reviewColumns.length,12);assert.equal(reviewStatuses.length,8);});

test('검수 저장은 Lesson 일정·자료·Level 및 확장 필드를 변경하지 않음',()=>{
 const data=migrate(seed());data.customWorkspace={stage:'future'};data.lessons[0].production={submitted:false};data.materials[0].fileData='data:text/plain;base64,c2FtcGxl';
 const before=structuredClone(data);const logs=data.logs.map((r,i)=>i===0?{...r,DETAILS:'검수 내용 수정'}:r);const result=applyReviewLogs(data,logs);
 assert.deepEqual(result.projects,before.projects);assert.deepEqual(result.textbooks,before.textbooks);assert.deepEqual(result.units,before.units);assert.deepEqual(result.lessons,before.lessons);assert.deepEqual(result.materials,before.materials);assert.deepEqual(result.customWorkspace,before.customWorkspace);assert.deepEqual(data,before);assert.equal(result.logs[0].DETAILS,'검수 내용 수정');
});
test('오류 없음 확인만 해당 차수에서 해제하고 제작 상태·다른 차수는 보존',()=>{
 const data=migrate(seed());data.lessons[0].status='검수 완료';data.lessons[0].noErrors={'1st Review':{date:'2026-10-08'},'Final Review':{date:'2026-10-08'}};
 const result=applyReviewLogs(data,[{...data.logs[0],'검수 차수':'1st Review'}]);assert.equal(result.lessons[0].status,'검수 완료');assert.ok(!result.lessons[0].noErrors['1st Review']);assert.deepEqual(result.lessons[0].noErrors['Final Review'],data.lessons[0].noErrors['Final Review']);assert.strictEqual(result.lessons[1],data.lessons[1]);
});

test('6개 검수 레벨을 추가해도 기존 로그·이미지·소속은 보존하고 재실행은 중복 없음',()=>{
 const old=migrate(seed());old.logs[0].screenshots=[{id:'original',data:'data:image/png;base64,sample'}];old.logs.push({id:'orphan',lessonId:'missing',DETAILS:'연결 확인',screenshots:[{id:'keep',data:'original'}]});
 const next=ensureReviewLevels(old);assert.equal(next.reviewLevelIds.length,6);assert.deepEqual(next.reviewLevelIds.map(id=>next.projects.find(p=>p.id===id).name),initialReviewLevels);
 assert.deepEqual(next.logs.slice(0,old.logs.length),old.logs);assert.deepEqual(next.lessons.slice(0,old.lessons.length),old.lessons);assert.deepEqual(next.materials,old.materials);assert.equal(needsReviewAssignment(next,next.logs.find(l=>l.id==='orphan')),true);assert.equal(needsReviewAssignment(next,next.logs[0]),false);assert.strictEqual(ensureReviewLevels(next),next);
 const s=reviewSummary(next,next.reviewLevelIds[0]);assert.deepEqual(s,{lessons:2,pending:1,completed:1});
 const renamed=structuredClone(next);renamed.projects.find(p=>p.id===renamed.reviewLevelIds[0]).name='관리자 수정';assert.equal(ensureReviewLevels(renamed).projects.find(p=>p.id===renamed.reviewLevelIds[0]).name,'관리자 수정');
});

test('일반 검수 레벨은 지정 순서와 관리자 신규 레벨만 표시하고 과거 데이터는 유지',()=>{const d=ensureReviewLevels(migrate(seed()));const before=structuredClone(d);d.projects.reverse();assert.deepEqual(reviewLevelOptions(d).map(l=>l.name),initialReviewLevels);d.projects.push({id:'new-admin-level',name:'NEW LEVEL'});assert.deepEqual(reviewLevelOptions(d).map(l=>l.name),[...initialReviewLevels,'NEW LEVEL']);assert.deepEqual(d.logs,before.logs);assert.deepEqual(d.lessons,before.lessons);assert.equal(d.projects.filter(l=>/^Project [A-D]$/.test(l.name)).length,4);});
