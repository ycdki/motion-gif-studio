import {draw, dimensions} from './render.js';
const $=id=>document.getElementById(id), canvas=$('preview'), ctx=canvas.getContext('2d');
let image, phase=0, playing=true, last=0, preset='elastic', worker, downloadURL, filename='motion';
const settings=()=>({intensity:+$('intensity').value,amplitude:+$('amplitude').value,speed:+$('speed').value,background:$('background').value,size:+$('size').value,frames:+$('frames').value,preset});
function update(){const s=settings();$('intensity-out').value=s.intensity+'%';$('amplitude-out').value=s.amplitude+'%';$('speed-out').value=s.speed.toFixed(2).replace(/0$/,'')+'×';$('duration').textContent=(2/s.speed).toFixed(2)+' s';$('export-duration').textContent=(2/s.speed).toFixed(2)+' 秒';$('fps').textContent=(Math.min(s.frames,Math.floor(100/s.speed))*s.speed/2).toFixed(1)+' fps';if(image){const [w,h]=dimensions(image,s.size);$('dimensions').textContent=w+' × '+h;const [pw,ph]=dimensions(image,640);canvas.width=pw;canvas.height=ph;}}
function tick(now){if(playing)phase=(phase+Math.min((now-last)/1000,.1)*settings().speed/2)%1;last=now;if(image)draw(ctx,image,phase,settings());if(playing)$('timeline').value=Math.floor(phase*1000);requestAnimationFrame(tick);}
function setPlay(value){playing=value;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暂停动画':'播放动画');}
$('play').onclick=()=>setPlay(!playing);$('timeline').oninput=()=>{setPlay(false);phase=+$('timeline').value/1000;};
for(const id of ['intensity','amplitude','speed','background','size','frames'])$(id).oninput=update;
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{preset=b.dataset.preset;document.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));});
$('reset').onclick=()=>{$('intensity').value=60;$('amplitude').value=45;$('speed').value=1;document.querySelector('[data-preset="elastic"]').click();phase=0;update();};
let loadSequence=0;
async function load(file){if(!file)return;const seq=++loadSequence;try{if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type))throw Error('请选择 PNG、JPG 或 WebP 图片。');const next=await createImageBitmap(file);if(seq!==loadSequence){next.close();return;}image?.close();image=next;filename=(file.name||'motion').replace(/\.[^.]+$/,'');$('filename').textContent=file.name||'正在使用示例';phase=0;update();$('status').textContent='图片已就绪，可以调整参数或导出。';}catch(e){$('status').textContent='图片读取失败：'+e.message;}}
$('upload').onchange=e=>load(e.target.files[0]);
for(const event of ['dragenter','dragover'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.add('drag');});
for(const event of ['dragleave','drop'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.remove('drag');if(event==='drop')load(e.dataTransfer.files[0]);});
async function demo(){const img=new Image();img.src='./demo.svg';await img.decode();const c=document.createElement('canvas');c.width=600;c.height=600;c.getContext('2d').drawImage(img,0,0);const blob=await new Promise(resolve=>c.toBlob(resolve));await load(new File([blob],'开心云朵.png',{type:'image/png'}));}
$('demo').onclick=demo;
function finish(){worker?.terminate();worker=null;$('export').disabled=false;$('cancel').hidden=true;$('progress').hidden=true;}
$('cancel').onclick=()=>{finish();$('status').textContent='已取消导出，参数已保留。';};
$('export').onclick=async()=>{if(!image)return;const s=settings(), exportName=filename;$('export').disabled=true;$('cancel').hidden=false;$('progress').hidden=false;$('progress').value=0;$('status').textContent='正在生成 GIF…';$('download').hidden=true;
  try {const bitmap=await createImageBitmap(image);worker=new Worker('./worker.js',{type:'module'});worker.onmessage=({data})=>{if(data.error){finish();$('status').textContent='导出失败：'+data.error;return;}if(data.progress){$('progress').value=data.progress;$('status').textContent='正在生成 GIF… '+data.progress+'%';}if(data.bytes){if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([data.bytes],{type:'image/gif'}));const a=$('download');a.href=downloadURL;a.download=exportName+'-动一下.gif';a.hidden=false;a.click();finish();$('status').textContent='已生成 '+data.w+' × '+data.h+' GIF · '+(data.bytes.length/1024/1024).toFixed(2)+' MB';}};worker.onerror=e=>{finish();$('status').textContent='导出失败：'+e.message;};worker.postMessage({image:bitmap,settings:s},[bitmap]);}catch(e){finish();$('status').textContent='导出失败：'+e.message;}
};
update();requestAnimationFrame(tick);demo();

