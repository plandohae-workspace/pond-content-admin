import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,migrate} from './model.js';
import {createWorkbook} from './excel.js';
test('Excel은 차수별 색상 구분과 실제 이미지의 오류 행 위치 및 원본 비율을 유지',async()=>{
 const d=migrate(seed());const image={data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=',width:1,height:1};
 const base={...d.logs[0],screenshots:[image],'검수 차수':'1st Review'};
 const wb=await createWorkbook(d,[{...base,id:'first'}, {...base,id:'second'}, {...base,id:'final','검수 차수':'Final Review'}]);
 const sheet=wb.worksheets[0];assert.equal(sheet.columnCount,12);assert.equal(sheet.rowCount,7);
 assert.ok(sheet.getCell('A1').value.includes('[1st REVIEW COMMENTS]'));assert.ok(sheet.getCell('A5').value.includes('[Final REVIEW COMMENTS]'));
 assert.notEqual(sheet.getRow(1).fill.fgColor.argb,sheet.getRow(5).fill.fgColor.argb);
 assert.equal(sheet.getCell('A2').value,'PIC');assert.equal(sheet.getCell('L2').value,'진행 상황/처리 결과');assert.equal(sheet.getCell('A6').value,'PIC');assert.equal(sheet.getRow(1).font.color.argb,'FFFFFFFF');assert.equal(sheet.getRow(1).alignment.horizontal,'left');assert.equal(sheet.getCell('A3').border.top.style,'thin');assert.equal(sheet.getCell('I3').alignment.wrapText,true);
 const images=sheet.getImages();assert.equal(images.length,3);assert.deepEqual(images.map(i=>i.range.tl.nativeRow),[2,3,6]);for(const i of images){assert.equal(i.range.tl.nativeCol,9);assert.equal(i.range.ext.width,i.range.ext.height);}
 const bytes=await wb.xlsx.writeBuffer();assert.ok(bytes.byteLength>1000);assert.equal(wb.worksheets[1].rowCount,4);
});

test('이미지 8장은 Excel 최대 행 높이 내에서 겹침 없이 배치하고 출력은 원본을 변경하지 않음',async()=>{
 const d=migrate(seed());const image={data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=',width:100,height:200};
 const log={...d.logs[0],screenshots:Array.from({length:8},()=>({...image})),STATUS:'IT is in progress','처리 결과':'샘플 결과','검수 차수':'Final Review'};const before=structuredClone(log);const wb=await createWorkbook(d,[log]);const s=wb.worksheets[0];assert.equal(s.getRow(3).height,409.5);assert.equal(s.getCell('K3').value,'IT is in progress');assert.equal(s.getCell('L3').value,'샘플 결과');assert.equal(s.getRow(1).fill.fgColor.argb,'FF77539C');assert.deepEqual(log,before);
 const images=s.getImages();const height=s.getRow(3).height*96/72;let bottom=0;for(const i of images){const top=(i.range.tl.row-2)*height;assert.ok(top>=bottom);bottom=top+i.range.ext.height;assert.ok(bottom<=height);assert.equal(i.range.ext.height/i.range.ext.width,2);}
});
