const SIGNATURES=[
{name:'ZIP/JAR/APK/DOCX',bytes:[0x50,0x4B,0x03,0x04]},{name:'RAR archive',bytes:[0x52,0x61,0x72,0x21]},
{name:'PDF document',bytes:[0x25,0x50,0x44,0x46]},{name:'GZIP',bytes:[0x1F,0x8B,0x08]},
{name:'7-Zip',bytes:[0x37,0x7A,0xBC,0xAF]},{name:'PNG image',bytes:[0x89,0x50,0x4E,0x47]},
{name:'JPEG image',bytes:[0xFF,0xD8,0xFF]},{name:'GIF image',bytes:[0x47,0x49,0x46,0x38]},
{name:'ELF binary',bytes:[0x7F,0x45,0x4C,0x46]},{name:'EXE/DLL (MZ)',bytes:[0x4D,0x5A,0x90]},
{name:'bzip2',bytes:[0x42,0x5A,0x68]},{name:'SQLite',bytes:[0x53,0x51,0x4C,0x69,0x74,0x65]},
];
function findAll(b,sig){const o=[];outer:for(let i=0;i<=b.length-sig.length;i++){for(let j=0;j<sig.length;j++)if(b[i+j]!==sig[j])continue outer;o.push(i)}return o}
function trailingData(b){
  const has=(a,s)=>a.every((v,i)=>b[s+i]===v);
  if(has([0x89,0x50,0x4E,0x47],0)){const h=findAll(b,[0x49,0x45,0x4E,0x44]);if(h.length){const e=h[h.length-1]+8;return{kind:'PNG IEND',at:e,len:b.length-e}}}
  if(has([0xFF,0xD8],0)){for(let i=b.length-2;i>1;i--)if(b[i]===0xFF&&b[i+1]===0xD9)return{kind:'JPEG EOI',at:i+2,len:b.length-i-2}}
  return null;
}
function runFileScan(b){
  const el=$('fileScanResults');let h=`File size: ${b.length} bytes<br><br>`,found=false;
  const t=trailingData(b);
  if(t&&t.len>0){found=true;h+=`<div style="color:#6ee7a0">⚠ ${t.len} bytes after ${t.kind} (offset ${t.at}) — likely appended data</div>`}
  for(const s of SIGNATURES){const hits=findAll(b,s.bytes).filter(x=>x!==0);
    if(hits.length){found=true;h+=`<div style="color:#6ee7a0">⚠ ${s.name} signature at: ${hits.slice(0,10).join(', ')}${hits.length>10?' …':''}</div>`}}
  if(!found)h+='<span class="hint">No extra signatures or trailing data found.</span>';
  el.innerHTML=h;
}
