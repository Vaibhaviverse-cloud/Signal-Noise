const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const S={pixels:null,w:0,h:0,raw:null};
function bitsToBytes(bits){const o=[];for(let i=0;i+8<=bits.length;i+=8){let b=0;for(let k=0;k<8;k++)b=(b<<1)|bits[i+k];o.push(b)}return o}
function readableScore(a){if(!a.length)return 0;let g=0;for(const b of a)if(b>=32&&b<=126)g++;return g/a.length}
function bytesToStr(a,dots){return a.map(b=>dots&&(b<32||b>126)?'.':String.fromCharCode(b)).join('')}
function findFlag(s){const m=s.match(/[A-Za-z0-9_]{2,15}\{[^}]{2,100}\}/);return m?m[0]:null}
function card(title,body,ok){return `<div class="card${ok?' ok':''}"><div class="t">${title}</div><div class="b">${body}</div></div>`}
