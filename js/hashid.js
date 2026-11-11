// [regex, name, hashcat mode, john format]
const HASH_RULES=[
[/^\$2[abxy]?\$\d\d\$[./A-Za-z0-9]{53}$/,'bcrypt','3200','bcrypt'],
[/^\$1\$[^$]{0,8}\$[./A-Za-z0-9]{22}$/,'MD5-crypt (Unix)','500','md5crypt'],
[/^\$apr1\$[^$]{0,8}\$[./A-Za-z0-9]{22}$/,'Apache apr1 (MD5)','1600','md5crypt-long'],
[/^\$5\$(rounds=\d+\$)?[^$]{0,16}\$[./A-Za-z0-9]{43}$/,'SHA-256-crypt','7400','sha256crypt'],
[/^\$6\$(rounds=\d+\$)?[^$]{0,16}\$[./A-Za-z0-9]{86}$/,'SHA-512-crypt','1800','sha512crypt'],
[/^\$y\$/,'yescrypt','—','yescrypt'],
[/^\$argon2(id|i|d)\$/,'Argon2','— (use argon2 tools)','argon2'],
[/^\$7\$/,'scrypt (crypt format)','—','scrypt'],
[/^\$scrypt\$/,'scrypt','—','scrypt'],
[/^\$[PH]\$[./0-9A-Za-z]{31}$/,'phpass (WordPress/phpBB3/Joomla)','400','phpass'],
[/^\$S\$[./0-9A-Za-z]{52}$/,'Drupal 7','7900','Drupal7'],
[/^\$8\$[./A-Za-z0-9]{14}\$[./A-Za-z0-9]{43}$/,'Cisco type 8 (PBKDF2-SHA256)','9200','cisco8'],
[/^\$9\$[./A-Za-z0-9]{14}\$[./A-Za-z0-9]{43}$/,'Cisco type 9 (scrypt)','9300','cisco9'],
[/^\$pbkdf2-sha(1|256|512)\$/,'PBKDF2 (passlib format)','10900 / 20300 / 20200','pbkdf2-hmac-sha*'],
[/^pbkdf2_sha256\$\d+\$/,'Django PBKDF2-SHA256','10000','Django'],
[/^sha1\$[^$]+\$[0-9a-f]{40}$/,'Django SHA-1','124','—'],
[/^\{SSHA\}[A-Za-z0-9+/=]{20,}$/,'LDAP salted SHA-1 (SSHA)','111','nsldap'],
[/^\{SHA\}[A-Za-z0-9+/=]{28}$/,'LDAP SHA-1','101','nsldap'],
[/^\{SSHA512\}/,'LDAP salted SHA-512','1711','ssha512'],
[/^\$krb5tgs\$23\$/,'Kerberos 5 TGS-REP etype 23 (Kerberoast)','13100','krb5tgs'],
[/^\$krb5tgs\$(17|18)\$/,'Kerberos 5 TGS-REP AES','19600 / 19700','krb5tgs-aes'],
[/^\$krb5asrep\$23\$/,'Kerberos 5 AS-REP etype 23','18200','krb5asrep'],
[/^\$krb5pa\$23\$/,'Kerberos 5 AS-REQ Pre-Auth etype 23','7500','krb5pa-md5'],
[/^\$DCC2\$\d+#/,'Domain Cached Credentials 2 (MS-Cache v2)','2100','mscash2'],
[/^[^:\s]+::[^:]*:[0-9a-fA-F]{16}:[0-9a-fA-F]{32}:[0-9a-fA-F]+$/,'NetNTLMv2','5600','netntlmv2'],
[/^[^:\s]+::[^:]*:[0-9a-fA-F]{48}:[0-9a-fA-F]{48}:[0-9a-fA-F]{16}$/,'NetNTLMv1','5500','netntlm'],
[/^WPA\*0[12]\*/,'WPA-PBKDF2-PMKID+EAPOL (hc22000)','22000','wpapsk'],
[/^\$pdf\$/,'PDF encrypted','10400–10700','pdf'],
[/^\$zip2\$/,'WinZip AES','13600','zip'],
[/^\$pkzip2?\$/,'PKZIP','17200–17225','PKZIP'],
[/^\$7z\$/,'7-Zip','11600','7z'],
[/^\$rar5\$/,'RAR5','13000','rar5'],
[/^\$RAR3\$/,'RAR3','12500','rar'],
[/^\$office\$/,'MS Office','9400–9800','office'],
[/^\$keepass\$/,'KeePass','13400','KeePass'],
[/^\$bitcoin\$/,'Bitcoin wallet.dat','11300','bitcoin'],
[/^\$ansible\$/,'Ansible Vault','16900','ansible'],
[/^\$ml\$\d+\$/,'macOS PBKDF2-SHA512','7100','PBKDF2'],
[/^\*[0-9A-F]{40}$/i,'MySQL 4.1+ (SHA-1 of SHA-1)','300','mysql-sha1'],
[/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,'JWT (HMAC-signed tokens crackable)','16500','HMAC-SHA256'],
[/^[./0-9A-Za-z]{13}$/,'DES-crypt (traditional Unix)','1500','descrypt'],
[/^[0-9a-f]{8}$/i,'CRC32 / Adler-32 / FNV-32 (checksums, not crypto)','—','crc32'],
[/^[0-9a-f]{16}$/i,'MySQL323 / DES-half / truncated MD5 / CRC-64','200','mysql'],
[/^[0-9a-f]{32}:[0-9a-f]{32}$/i,'LM:NT pair (Windows SAM dump) — crack NT half','1000 (NT) / 3000 (LM)','nt / lm'],
[/^[0-9a-f]{32}$/i,'MD5 · NTLM · MD4 · LM · RIPEMD-128 · MS-Cache v1','0 / 1000 / 900 / 3000 / 1100','raw-md5 / nt / raw-md4'],
[/^[0-9a-f]{40}$/i,'SHA-1 · RIPEMD-160 · double-SHA1','100 / 6000 / 4500','raw-sha1 / ripemd-160'],
[/^[0-9a-f]{48}$/i,'Tiger-192 / Haval-192','—','tiger'],
[/^[0-9a-f]{56}$/i,'SHA-224 · SHA3-224 · Keccak-224','1300 / 17300','raw-sha224 / raw-sha3'],
[/^[0-9a-f]{64}$/i,'SHA-256 · SHA3-256 · Keccak-256 · BLAKE2s · RIPEMD-256 · GOST','1400 / 17400 / 17800 / 600','raw-sha256 / raw-sha3 / raw-keccak-256'],
[/^[0-9a-f]{96}$/i,'SHA-384 · SHA3-384 · Keccak-384','10800 / 17500','raw-sha384'],
[/^[0-9a-f]{128}$/i,'SHA-512 · SHA3-512 · Whirlpool · BLAKE2b-512 · Keccak-512','1700 / 17600 / 6100 / 600','raw-sha512 / whirlpool'],
];
const B64_LENS={22:'MD5 digest (b64, unpadded)',24:'MD5 digest (b64)',27:'SHA-1 (b64, unpadded)',28:'SHA-1 digest (b64)',43:'SHA-256 (b64, unpadded)',44:'SHA-256 digest (b64)',64:'SHA-384 (b64)',86:'SHA-512 (b64, unpadded)',88:'SHA-512 digest (b64)'};
function identifyHash(input){
  const out=[];const s=input.trim().split(/\r?\n/)[0].trim();
  if(!s)return out;
  const test=(str,note)=>{for(const[r,n,hc,j]of HASH_RULES)if(r.test(str))out.push({name:n+(note||''),hc,john:j})};
  test(s);
  const m=s.match(/^([0-9a-fA-F]{8,128})[:$]([^\s]{1,64})$/);
  if(m&&!out.length)test(m[1],' — salted ("'+m[2]+'"), use salted modes (10/20/110/120/1410/1420…)');
  if(!out.length&&/^[A-Za-z0-9+/]+=*$/.test(s)){
    if(B64_LENS[s.length])out.push({name:B64_LENS[s.length]+' — decode Base64, then re-identify the hex',hc:'—',john:'—'});
    else if(s.length%4===0)out.push({name:'Possibly Base64 data — try Decode workbench',hc:'—',john:'—'});
  }
  return out;
}
function renderHashResult(el,list){
  if(!list.length){el.innerHTML='<span class="hint">No match — check whitespace, truncation, or an uncommon format.</span>';return}
  el.innerHTML=list.map(g=>card(esc(g.name),`hashcat: ${esc(g.hc)} &nbsp;|&nbsp; john: ${esc(g.john)}`,false)).join('');
}
