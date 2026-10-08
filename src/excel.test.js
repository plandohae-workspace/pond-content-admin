import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,migrate} from './model.js';
import {createWorkbook} from './excel.js';
test('Excel은 차수별 색상 구분과 실제 이미지의 오류 행 위치 및 원본 비율을 유지',async()=>{
 const d=migrate(seed());const image={data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=',width:1,height:1};
 const base={...d.logs[0],screenshots:[image],'검수 차수':'1st Review'};
 const wb=await createWorkbook(d,[{...base,id:'first'}, {...base,id:'second'}, {...base,id:'final','검수 차수':'Final Review'}]);
 const sheet=wb.worksheets[0];assert.equal(sheet.columnCount,12);assert.equal(sheet.rowCount,6);
 assert.ok(sheet.getCell('A2').value.includes('[1st REVIEW COMMENTS]'));assert.ok(sheet.getCell('A5').value.includes('[Final REVIEW COMMENTS]'));
 assert.notEqual(sheet.getRow(2).fill.fgColor.argb,sheet.getRow(5).fill.fgColor.argb);
 const images=sheet.getImages();assert.equal(images.length,3);assert.deepEqual(images.map(i=>i.range.tl.nativeRow),[2,3,5]);for(const i of images){assert.equal(i.range.tl.nativeCol,9);assert.equal(i.range.ext.width,i.range.ext.height);}
 const bytes=await wb.xlsx.writeBuffer();assert.ok(bytes.byteLength>1000);assert.equal(wb.worksheets[1].rowCount,4);
});
