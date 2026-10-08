export async function readImage(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG, JPEG, WebP 이미지 파일만 첨부할 수 있습니다.');
 if(file.size>5*1024*1024)throw new Error('이미지는 개별 5MB 이하로 첨부해주세요.');
 const originalData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('원본 파일을 읽을 수 없습니다.'));r.readAsDataURL(file);});
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('이미지를 읽을 수 없습니다.'));i.src=url;});
  const scale=Math.min(1,1200/Math.max(image.width,image.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  return {id:crypto.randomUUID(),name:file.name||'붙여넣은 이미지.png',width:canvas.width,height:canvas.height,originalWidth:image.width,originalHeight:image.height,originalData,data:canvas.toDataURL('image/png')};
 }finally{URL.revokeObjectURL(url);}
}
