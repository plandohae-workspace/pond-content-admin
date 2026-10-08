import {logColumns,reviewColumns,columnLabel,normalizeLogs,reviewGroups,reviewGroupLabel} from './model.js';
export async function createWorkbook(data,logs){
 const {default:ExcelJS}=await import('exceljs');
 const wb=new ExcelJS.Workbook();
 const sheet=wb.addWorksheet('검수 로그');
 // header를 지정하면 자동 생성되는 첫 행을 막고 각 블록에 직접 배치한다.
 sheet.columns=reviewColumns.map(k=>({key:k,width:k==='SCREENSHOT'?54:k==='DETAILS'||k==='처리 결과'?50:24}));
 const screenshotCol=reviewColumns.indexOf('SCREENSHOT');
 const border={top:{style:'thin',color:{argb:'FFCAD8CC'}},bottom:{style:'thin',color:{argb:'FFCAD8CC'}},left:{style:'thin',color:{argb:'FFCAD8CC'}},right:{style:'thin',color:{argb:'FFCAD8CC'}}};
 function header(){const row=sheet.addRow(reviewColumns.map(columnLabel));row.height=32;row.eachCell(cell=>{cell.font={bold:true,color:{argb:'FF263B34'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE2EFDF'}};cell.alignment={vertical:'middle',wrapText:true,horizontal:'left'};cell.border=border;});}
 const groups=reviewGroups(data,normalizeLogs(data,logs));
 if(!groups.length){const title=sheet.addRow(['검수 로그 · 조회된 오류 없음']);sheet.mergeCells(1,1,1,reviewColumns.length);title.font={bold:true,color:{argb:'FFFFFFFF'}};title.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF32679B'}};title.alignment={horizontal:'left'};title.height=28;header();}
 for(const group of groups){
  const divider=sheet.addRow([reviewGroupLabel(data,group)]);
  sheet.mergeCells(divider.number,1,divider.number,reviewColumns.length);
  divider.height=30;divider.font={bold:true,color:{argb:'FFFFFFFF'}};divider.alignment={horizontal:'left',vertical:'middle',wrapText:true};
  divider.fill={type:'pattern',pattern:'solid',fgColor:{argb:group.round==='1st Review'?'FF32679B':'FF77539C'}};
  header();
  for(const log of group.rows){
   const row=sheet.addRow(Object.fromEntries(reviewColumns.map(k=>[k,k==='SCREENSHOT'?'':log[k]||''])));
   row.alignment={vertical:'top',wrapText:true};
   // Excel은 프로그램 방식으로 자동 행 높이를 계산하지 않으므로 줄 수를 추정한다.
   const textHeight=Math.max(...reviewColumns.filter(k=>k!=='SCREENSHOT').map(k=>String(log[k]||'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/(k==='DETAILS'||k==='처리 결과'?25:12))),0)))*15+10;
   const images=log.screenshots||[];
   row.height=Math.min(409.5,Math.max(45,textHeight,images.length*130));
   for(let col=1;col<=reviewColumns.length;col++)row.getCell(col).border=border;
   images.forEach((image,i)=>{
     const source=image.originalData||image.data;
     const originalSupported=/^data:image\/(png|jpeg);/.test(source);
     const base64=originalSupported?source:image.data;
     const extension=base64.startsWith('data:image/jpeg;')?'jpeg':'png';
     const w=image.originalWidth||image.width||280,h=image.originalHeight||image.height||115;
     const slotHeight=(row.height*96/72)/images.length;
     const scale=Math.min(340/w,150/h,(slotHeight-10)/h);
     const id=wb.addImage({base64,extension});
     sheet.addImage(id,{tl:{col:screenshotCol+0.04,row:row.number-1+((i+0.05)/images.length)},ext:{width:w*scale,height:h*scale},editAs:'oneCell'});
   });
  }
 }
 sheet.views=[{state:'frozen',ySplit:2}];
 const history=wb.addWorksheet('검수 이력');
 history.columns=[{header:'오류 ID',key:'id',width:38},...logColumns.filter(k=>k!=='SCREENSHOT').map(k=>({header:columnLabel(k),key:k,width:24}))];
 normalizeLogs(data,logs).forEach(log=>history.addRow(log));history.getRow(1).font={bold:true};
 return wb;
}
export async function downloadExcel(data,logs,name){
 const wb=await createWorkbook(data,logs);const buffer=await wb.xlsx.writeBuffer();
 const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download=`POND_${name}_검수로그.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
