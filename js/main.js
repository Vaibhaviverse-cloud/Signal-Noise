const origCanvas=$('origCanvas');
const show=(id,v=true)=>$(id).classList.toggle('hidden',!v);
const VIEWS=[...document.querySelectorAll('.view')].map(v=>v.id.slice(2));
function go(name){
  if(!VIEWS.includes(name))name='start';
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+name));
  document.querySelectorAll('.side button').forEach(b=>b.classList.toggle('on',b.dataset.view===name));
  if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);
  scrollTo({top:0});
}
document.querySelectorAll('.side button').forEach(b=>b.onclick=()=>go(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
go(location.hash.slice(1)||'start');

const fmtSize=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
function detectType(b){
  const h=(...a)=>a.every((v,i)=>b[i]===v);
  if(h(0x89,0x50,0x4E,0x47))return'PNG';if(h(0xFF,0xD8,0xFF))return'JPEG';if(h(0x47,0x49,0x46,0x38))return'GIF';
  if(h(0x42,0x4D))return'BMP';if(h(0x52,0x49,0x46,0x46))return'WebP';return'Image';
}
async function loadFile(file){
  if(!file)return;
  S.raw=new Uint8Array(await file.arrayBuffer());
  const im=new Image();
  im.onload=()=>{
    S.w=im.width;S.h=im.height;origCanvas.width=S.w;origCanvas.height=S.h;
    const c=origCanvas.getContext('2d');c.drawImage(im,0,0);
    try{S.pixels=c.getImageData(0,0,S.w,S.h).data}catch(err){alert('Could not read pixel data.');return}
    const t=detectType(S.raw);
    $('fName').textContent=file.name;$('fType').textContent=t;$('fSize').textContent=fmtSize(S.raw.length);$('fDim').textContent=S.w+' × '+S.h;
    show('loaded');document.body.dataset.loaded=1;
    if(t==='GIF')document.body.dataset.gif=1;else delete document.body.dataset.gif;
    $('gifOut').innerHTML='';$('planeGrid').innerHTML='';show('zoomWrap',false);
    runFileScan(S.raw);
  };
  im.src=URL.createObjectURL(file);
}
$('fileInput').addEventListener('change',e=>loadFile(e.target.files[0]));
const drop=$('drop');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));

function renderBitPlanes(){
  if(!S.pixels)return;
  const grid=$('planeGrid');grid.innerHTML='';
  const ch=$('channelSel').value,idx={R:0,G:1,B:2}[ch]??-1,{w,h,pixels}=S;
  for(let bit=7;bit>=0;bit--){
    const cell=document.createElement('div');cell.className='cell';
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const cx=c.getContext('2d'),d=cx.createImageData(w,h);
    for(let p=0;p<pixels.length;p+=4){
      const v=idx<0?Math.round((pixels[p]+pixels[p+1]+pixels[p+2])/3):pixels[p+idx];
      const x=((v>>bit)&1)*255;d.data[p]=d.data[p+1]=d.data[p+2]=x;d.data[p+3]=255;
    }
    cx.putImageData(d,0,0);
    c.onclick=()=>{show('zoomWrap');const z=$('zoomCanvas');z.width=w;z.height=h;z.getContext('2d').drawImage(c,0,0);$('zoomWrap').scrollIntoView({behavior:'smooth'})};
    const l=document.createElement('span');l.textContent='bit '+bit+(bit===0?' (LSB)':bit===7?' (MSB)':'');
    cell.append(c,l);grid.appendChild(cell);
  }
}
$('renderBtn').onclick=renderBitPlanes;

$('lsbBtn').onclick=()=>{
  if(!S.pixels)return;
  const m=$('lsbChannels').value,bits=[],p=S.pixels;
  for(let i=0;i<p.length;i+=4){
    if(m==='RGB')bits.push(p[i]&1,p[i+1]&1,p[i+2]&1);
    else bits.push(p[i+{R:0,G:1,B:2}[m]]&1);
  }
  $('lsbOut').value=bytesToStr(bitsToBytes(bits.slice(0,16000)),true);
};
$('sendToDecoder').onclick=()=>{$('decodeInput').value=$('lsbOut').value;$('decodeInput').scrollIntoView({behavior:'smooth'})};

$('gifBtn').onclick=()=>{try{$('gifOut').innerHTML=analyzeGif(S.raw)}catch(e){$('gifOut').innerHTML=card('Error',esc(e.message))}};
$('hashIdBtn').onclick=()=>renderHashResult($('hashIdResult'),identifyHash($('hashInput').value));
$('decodeBtn').onclick=()=>runDecoders($('decodeInput').value,$('decodeResults'));

$('deepScanBtn').onclick=()=>{
  if(!S.pixels)return;
  const st=$('deepScanStatus'),res=$('deepScanResults');res.innerHTML='';st.textContent='Scanning...';
  setTimeout(()=>{
    const orders={R:[0],G:[1],B:[2],RGB:[0,1,2],BGR:[2,1,0],GRB:[1,0,2],RBG:[0,2,1],GBR:[1,2,0],BRG:[2,0,1]};
    const lim=Math.min((S.pixels.length/4)|0,3000),cands=[];
    for(const[name,ix]of Object.entries(orders))for(let nb=1;nb<=8;nb++){
      const bits=[];
      for(let pi=0;pi<lim;pi++)for(const i of ix){const v=S.pixels[pi*4+i];for(let b=nb-1;b>=0;b--)bits.push((v>>b)&1)}
      const arr=bitsToBytes(bits).slice(0,400),sc=readableScore(arr),str=bytesToStr(arr);
      const flag=sc>=0.85?findFlag(str):null;
      if(flag||sc>0.55)cands.push({name,nb,sc,flag,pv:bytesToStr(arr.slice(0,120),true)});
    }
    cands.sort((a,b)=>(b.flag?1:0)-(a.flag?1:0)||b.sc-a.sc);
    st.textContent=`Scanned 72 combinations over first ${lim} pixels.`;
    res.innerHTML=cands.length?cands.slice(0,12).map(c=>card(`order=${c.name} bits=${c.nb} score=${c.sc.toFixed(2)}${c.flag?' ✅ FLAG: '+esc(c.flag):''}`,esc(c.pv),!!c.flag)).join(''):'<span class="hint">No strong candidates. Try single bit planes, or check GIF/appended-data panels.</span>';
  },30);
};
