function lzwDecode(min,data,n){
  const clear=1<<min,eoi=clear+1;let size=min+1,next=eoi+1,dict=[],out=[],prev=null,cur=0,nb=0,p=0;
  const reset=()=>{dict=[];for(let i=0;i<clear;i++)dict[i]=[i];size=min+1;next=eoi+1;prev=null};
  reset();
  while(out.length<n){
    while(nb<size&&p<data.length){cur|=data[p++]<<nb;nb+=8}
    if(nb<size)break;
    const code=cur&((1<<size)-1);cur>>=size;nb-=size;
    if(code===clear){reset();continue}
    if(code===eoi)break;
    let e;
    if(dict[code])e=dict[code];else if(prev)e=prev.concat(prev[0]);else break;
    for(const v of e)out.push(v);
    if(prev&&next<4096){dict[next++]=prev.concat(e[0]);if(next===(1<<size)&&size<12)size++}
    prev=e;
  }
  return out;
}
function parseGif(b){
  const r={info:[],comments:[],apps:[],frames:[],gct:null,trailing:null};
  r.version=String.fromCharCode(...b.slice(0,6));
  const W=b[6]|(b[7]<<8),H=b[8]|(b[9]<<8),pk=b[10];
  r.info.push(`${r.version}, ${W}×${H}, bg index ${b[11]}`);
  let p=13;
  if(pk&0x80){const n=3*(1<<((pk&7)+1));r.gct=b.slice(p,p+n);p+=n}
  const subs=()=>{const d=[];while(p<b.length&&b[p]){d.push(...b.slice(p+1,p+1+b[p]));p+=b[p]+1}p++;return d};
  while(p<b.length){
    const t=b[p++];
    if(t===0x3B){if(p<b.length)r.trailing=b.slice(p);break}
    if(t===0x21){
      const label=b[p++];
      if(label===0xFE)r.comments.push(bytesToStr(subs(),true));
      else if(label===0xFF){const hl=b[p];const id=String.fromCharCode(...b.slice(p+1,p+1+hl));p+=hl+1;r.apps.push(id+' ('+subs().length+' data bytes)')}
      else{while(p<b.length&&b[p])p+=b[p]+1;p++}
    }else if(t===0x2C){
      const fw=b[p+4]|(b[p+5]<<8),fh=b[p+6]|(b[p+7]<<8),f=b[p+8];p+=9;
      let lct=null;if(f&0x80){const n=3*(1<<((f&7)+1));lct=b.slice(p,p+n);p+=n}
      const min=b[p++];const data=subs();
      r.frames.push({fw,fh,interlaced:!!(f&0x40),pal:lct||r.gct,min,data});
    }else break;
  }
  return r;
}
function lsbText(vals,bitsPer){
  const bits=[];for(const v of vals)for(let k=bitsPer-1;k>=0;k--)bits.push((v>>k)&1);
  return bytesToStr(bitsToBytes(bits).slice(0,300),true);
}
function analyzeGif(bytes){
  const g=parseGif(bytes),out=[];
  out.push(card('Structure',esc(g.info[0])+`<br>Frames: ${g.frames.length}${g.frames.some(f=>f.interlaced)?' (interlaced — index order may be scrambled)':''}`));
  if(g.comments.length)out.push(card('Comment extensions ('+g.comments.length+')',esc(g.comments.join(' | ')),!!findFlag(g.comments.join())));
  if(g.apps.length)out.push(card('Application extensions',esc(g.apps.join('<br>'))));
  if(g.trailing&&g.trailing.length)out.push(card('⚠ Data after GIF trailer ('+g.trailing.length+' bytes)',esc(bytesToStr(g.trailing.slice(0,300),true)),!!findFlag(bytesToStr(g.trailing,true))));
  const f=g.frames[0];
  if(f&&f.pal){
    const pal=Array.from(f.pal),n=pal.length/3;
    out.push(card('Palette',n+' colours. Duplicate colours or odd ordering can indicate palette-order stego.'));
    for(const[nm,vals]of[['Palette LSB (all R,G,B bytes)',pal],['Palette R only',pal.filter((_,i)=>i%3===0)],['Palette G only',pal.filter((_,i)=>i%3===1)],['Palette B only',pal.filter((_,i)=>i%3===2)]]){
      const s=lsbText(vals.map(v=>v&1),1);out.push(card(nm,esc(s),!!findFlag(s)))}
    const seen=new Set(),dups=[];for(let i=0;i<n;i++){const k=pal.slice(i*3,i*3+3).join(',');if(seen.has(k))dups.push(i);seen.add(k)}
    if(dups.length)out.push(card('Duplicate palette entries','Indices: '+dups.slice(0,40).join(', ')+' — often a sign of hidden data in index choice.',true));
  }
  if(f){
    const idx=lzwDecode(f.min,f.data,f.fw*f.fh);
    out.push(card('Frame 1 pixel indices','Decoded '+idx.length+' / '+(f.fw*f.fh)+' pixels'));
    for(let nb=1;nb<=Math.min(f.min,4);nb++){
      const s=lsbText(idx,nb),sc=readableScore(Array.from(s,c=>c.charCodeAt(0)));
      out.push(card(`Index LSB, ${nb} bit${nb>1?'s':''} (readable ${sc.toFixed(2)})`,esc(s.slice(0,200)),!!findFlag(s)));
    }
  }
  return out.join('');
}
