import {logColumns,reviewColumns,columnLabel,normalizeLogs,reviewGroups,reviewGroupLabel} from './model.js';
export async function createWorkbook(data,logs){
 const {default:ExcelJS}=await import('exceljs');
 const wb=new ExcelJS.Workbook();
 const sheet=wb.addWorksheet('검수 로그');
 sheet.columns=reviewColumns.map(k=>({header:columnLabel(k),key:k,width:k==='SCREENSHOT'?54:k==='DETAILS'||k==='처리 결과'?50:24}));
 const screenshotCol=reviewColumns.indexOf('SCREENSHOT');
 for(const group of reviewGroups(data,normalizeLogs(data,logs))){
  const divider=sheet.addRow([reviewGroupLabel(data,group)]);
  sheet.mergeCells(divider.number,1,divider.number,reviewColumns.length);
  divider.height=28;divider.font={bold:true,color:{argb:'FF263B34'}};
  divider.fill={type:'pattern',pattern:'solid',fgColor:{argb:group.round==='1st Review'?'FFE4EEF8':'FFFCE5D5'}};
  for(const log of group.rows){
   const row=sheet.addRow(Object.fromEntries(reviewColumns.map(k=>[k,k==='SCREENSHOT'?'':log[k]||''])));
   row.alignment={vertical:'top',wrapText:true};
   const images=log.screenshots||[];
   row.height=images.length?Math.max(120,images.length*130):45;
   images.forEach((image,i)=>{
     const source=image.originalData||image.data;
     // WebP는 Excel 호환 PNG로, PNG/JPEG는 보존된 원본으로 내보낸다.
     const originalSupported=/^data:image\/(png|jpeg);/.test(source);
     const base64=originalSupported?source:image.data;
     const extension=base64.startsWith('data:image/jpeg;')?'jpeg':'png';
     const w=image.originalWidth||image.width||280,h=image.originalHeight||image.height||115;
     const scale=Math.min(340/w,150/h);
     const id=wb.addImage({base64,extension});
     sheet.addImage(id,{tl:{col:screenshotCol+0.04,row:row.number-1+(i/images.length)+0.025},ext:{width:w*scale,height:h*scale},editAs:'oneCell'});
   });
  }
 }
 sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
 sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF297657'}};
 sheet.views=[{state:'frozen',ySplit:1}];
 // 기존 검수 이력 필드도 별도 시트로 보존한다.
 const history=wb.addWorksheet('검수 이력');
 history.columns=[{header:'오류 ID',key:'id',width:38},...logColumns.filter(k=>k!=='SCREENSHOT').map(k=>({header:columnLabel(k),key:k,width:24}))];
 normalizeLogs(data,logs).forEach(log=>history.addRow(log));
 history.getRow(1).font={bold:true};
 return wb;
}
export async function downloadExcel(data,logs,name){
 const wb=await createWorkbook(data,logs);const buffer=await wb.xlsx.writeBuffer();
 const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download=`POND_${name}_검수로그.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
