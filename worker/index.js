import { cleanText, cleanDataText, cleanNumber, cleanImageUrl, cleanGenomicData } from './lib/validation.js';
import { publicSires, listSires, getSire, createSire, updateSire, setSireActive } from './routes/sires.js';
import { handleUpload } from './routes/upload.js';

const SESSION_COOKIE='gu_admin_session';
const MAX_BODY_BYTES=3_000_000;
const MAX_ROWS=500;

function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff',...headers}});}
function cookieValue(request,name){const cookie=request.headers.get('cookie')||'';for(const part of cookie.split(';')){const [key,...value]=part.trim().split('=');if(key===name)return value.join('=');}return null;}
function base64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decodeBase64url(value){const normalized=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');return Uint8Array.from(atob(normalized),char=>char.charCodeAt(0));}
async function hmac(value,secret){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));}
async function secureEqual(left,right){const [a,b]=await Promise.all([left,right].map(value=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));return crypto.subtle.timingSafeEqual(a,b);}

// PBKDF2-SHA256 sobre la contraseña + un salt fijo por instalación, guardado
// como secreto (ADMIN_PASSWORD_HASH/ADMIN_PASSWORD_SALT) en vez de la
// contraseña en texto plano. Ver ADMIN_DEPLOY.md para rotar el secreto.
async function hashPassword(password,saltHex){
  const salt=Uint8Array.from(saltHex.match(/.{2}/g)||[],b=>parseInt(b,16));
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},key,256);
  return [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function verifyPassword(password,env){
  if(!env.ADMIN_PASSWORD_HASH||!env.ADMIN_PASSWORD_SALT)return false;
  const computed=await hashPassword(password,env.ADMIN_PASSWORD_SALT);
  return secureEqual(computed,env.ADMIN_PASSWORD_HASH);
}

async function createSession(email,secret){const payload=base64url(new TextEncoder().encode(JSON.stringify({email,exp:Date.now()+8*60*60*1000})));return `${payload}.${base64url(await hmac(payload,secret))}`;}
async function readSession(request,env){
  const token=cookieValue(request,SESSION_COOKIE);if(!token||!env.SESSION_SECRET)return null;const [payload,signature]=token.split('.');if(!payload||!signature)return null;
  try{const expected=await hmac(payload,env.SESSION_SECRET),provided=decodeBase64url(signature);if(expected.length!==provided.length||!crypto.subtle.timingSafeEqual(expected,provided))return null;const session=JSON.parse(new TextDecoder().decode(decodeBase64url(payload)));if(session.exp<Date.now()||session.email!==env.ADMIN_EMAIL)return null;return session;}catch{return null;}
}
async function readJson(request){const length=Number(request.headers.get('content-length')||0);if(!length||length>MAX_BODY_BYTES)throw new Error('Tamaño de solicitud inválido');return request.json();}
function sameOrigin(request){const origin=request.headers.get('origin');return origin===new URL(request.url).origin;}
function publicCors(request,env){const origin=request.headers.get('origin');const allowed=(env.PUBLIC_ORIGINS||'').split(',').map(value=>value.trim());return allowed.includes(origin)?{'access-control-allow-origin':origin,'vary':'Origin'}:{};}
async function loginLimited(request,env){
  const ip=request.headers.get('cf-connecting-ip')||'unknown',digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)),key=base64url(new Uint8Array(digest));const now=Date.now(),windowMs=15*60*1000;
  const row=await env.DB.prepare('SELECT attempts, window_started FROM login_attempts WHERE ip_hash = ?1').bind(key).first();
  if(row&&now-Number(row.window_started)<windowMs&&Number(row.attempts)>=5)return true;
  if(!row||now-Number(row.window_started)>=windowMs)await env.DB.prepare('INSERT INTO login_attempts(ip_hash, attempts, window_started) VALUES(?1, 0, ?2) ON CONFLICT(ip_hash) DO UPDATE SET attempts=0, window_started=?2').bind(key,now).run();return false;
}
async function recordLoginFailure(request,env){const ip=request.headers.get('cf-connecting-ip')||'unknown',digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)),key=base64url(new Uint8Array(digest));await env.DB.prepare('UPDATE login_attempts SET attempts = attempts + 1 WHERE ip_hash = ?1').bind(key).run();}

async function handleApi(request,env,url){
  if(request.method==='OPTIONS'&&url.pathname==='/api/public/sires'){const headers=publicCors(request,env);return new Response(null,{status:204,headers:{...headers,'access-control-allow-methods':'GET, OPTIONS'}});}
  if(url.pathname==='/api/public/sires'&&request.method==='GET'){
    const data=await publicSires(env);
    return json(data,200,{...publicCors(request,env),'cache-control':'public, max-age=300'});
  }
  if(!['GET','HEAD'].includes(request.method)&&!sameOrigin(request))return json({error:'Origen no autorizado'},403);
  if(url.pathname==='/api/login'&&request.method==='POST'){
    if(await loginLimited(request,env))return json({error:'Demasiados intentos. Espera 15 minutos.'},429);
    if(!env.ADMIN_EMAIL||!env.ADMIN_PASSWORD_HASH||!env.SESSION_SECRET)return json({error:'El administrador todavía no tiene sus secretos configurados.'},503);
    const body=await readJson(request),email=cleanText(body.email,180).toLowerCase(),password=cleanText(body.password,300);const [validEmail,validPassword]=await Promise.all([secureEqual(email,env.ADMIN_EMAIL.toLowerCase()),verifyPassword(password,env)]);
    if(!validEmail||!validPassword){await recordLoginFailure(request,env);return json({error:'Correo o contraseña incorrectos'},401);}
    const session=await createSession(env.ADMIN_EMAIL,env.SESSION_SECRET);return json({email:env.ADMIN_EMAIL},200,{'set-cookie':`${SESSION_COOKIE}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
  }
  const session=await readSession(request,env);
  if(url.pathname==='/api/session'&&request.method==='GET')return json(session?{authenticated:true,email:session.email}:{authenticated:false},session?200:401);
  if(!session)return json({error:'Sesión vencida. Vuelve a ingresar.'},401);
  if(url.pathname==='/api/logout'&&request.method==='POST')return json({ok:true},200,{'set-cookie':`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});

  if(url.pathname==='/api/sires'&&request.method==='GET')return json(await listSires(env));
  if(url.pathname==='/api/sires'&&request.method==='POST'){
    try{return json(await createSire(env,session,await readJson(request)),201);}catch(error){return json({error:error.message},error.status||400);}
  }
  const sireMatch=url.pathname.match(/^\/api\/sires\/([A-Za-z0-9]{3,20})$/);
  if(sireMatch&&request.method==='GET'){const row=await getSire(env,sireMatch[1].toUpperCase());return row?json(row):json({error:'No encontrado'},404);}
  if(sireMatch&&request.method==='PUT'){
    try{return json(await updateSire(env,session,sireMatch[1].toUpperCase(),await readJson(request)));}catch(error){return json({error:error.message},error.status||400);}
  }
  if(sireMatch&&request.method==='DELETE'){
    try{return json(await setSireActive(env,sireMatch[1].toUpperCase(),false));}catch(error){return json({error:error.message},error.status||400);}
  }
  const restoreMatch=url.pathname.match(/^\/api\/sires\/([A-Za-z0-9]{3,20})\/restore$/);
  if(restoreMatch&&request.method==='POST'){
    try{return json(await setSireActive(env,restoreMatch[1].toUpperCase(),true));}catch(error){return json({error:error.message},error.status||400);}
  }
  if(url.pathname==='/api/upload'&&request.method==='POST'){
    try{return json(await handleUpload(request,env,session));}catch(error){return json({error:error.message},error.status||400);}
  }

  if(url.pathname==='/api/import'&&request.method==='POST'){
    const body=await readJson(request);if(!Array.isArray(body.rows)||!body.rows.length||body.rows.length>MAX_ROWS)return json({error:`La carga debe contener entre 1 y ${MAX_ROWS} filas.`},400);
    const rows=[],seen=new Set();for(const input of body.rows){const codigo=cleanDataText(input.codigo,60).toUpperCase(),nombre=cleanDataText(input.nombre,120).toUpperCase();if(!codigo||!nombre)return json({error:'Cada fila necesita código y nombre.'},400);if(seen.has(codigo))return json({error:`Código duplicado: ${codigo}`},400);seen.add(codigo);rows.push({codigo,nombre,nm:cleanNumber(input.nm),cm:cleanNumber(input.cm),milk:cleanNumber(input.milk),fat:cleanNumber(input.fat),beta:cleanDataText(input.beta,20).toUpperCase(),kappa:cleanDataText(input.kappa,20).toUpperCase(),ped:cleanDataText(input.ped,240),foto:cleanImageUrl(input.foto),raza:cleanDataText(input.raza,50)||'Holstein',activo:input.activo===false?0:1,genomic:JSON.stringify(cleanGenomicData(input.genomic_data))});}
    const importId=crypto.randomUUID(),createdAt=new Date().toISOString(),filename=cleanDataText(body.filename,180),sheet=cleanDataText(body.sheet,120);
    await env.DB.prepare("INSERT INTO import_batches(id,filename,sheet_name,row_count,status,created_by,created_at) VALUES(?1,?2,?3,?4,'processing',?5,?6)").bind(importId,filename,sheet,rows.length,session.email,createdAt).run();
    const sql=`INSERT INTO sires(codigo,nombre,nm,cm,milk,fat,beta,kappa,ped,foto,raza,activo,genomic_json,import_id,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15) ON CONFLICT(codigo) DO UPDATE SET nombre=excluded.nombre,nm=excluded.nm,cm=excluded.cm,milk=excluded.milk,fat=excluded.fat,beta=excluded.beta,kappa=excluded.kappa,ped=excluded.ped,foto=excluded.foto,raza=excluded.raza,activo=excluded.activo,genomic_json=excluded.genomic_json,import_id=excluded.import_id,updated_at=excluded.updated_at`;
    try{for(let offset=0;offset<rows.length;offset+=50){const statements=rows.slice(offset,offset+50).map(row=>env.DB.prepare(sql).bind(row.codigo,row.nombre,row.nm,row.cm,row.milk,row.fat,row.beta,row.kappa,row.ped,row.foto,row.raza,row.activo,row.genomic,importId,createdAt));await env.DB.batch(statements);}await env.DB.prepare("UPDATE import_batches SET status='completed' WHERE id=?1").bind(importId).run();}catch(error){await env.DB.prepare("UPDATE import_batches SET status='failed' WHERE id=?1").bind(importId).run();throw error;}
    console.log(JSON.stringify({message:'catalog import completed',importId,rows:rows.length,email:session.email}));return json({imported:rows.length,importId});
  }
  return json({error:'Ruta no encontrada'},404);
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    try{
      if(url.pathname.startsWith('/api/'))return await handleApi(request,env,url);
      const response=await env.ASSETS.fetch(request),headers=new Headers(response.headers);headers.set('x-content-type-options','nosniff');headers.set('referrer-policy','strict-origin-when-cross-origin');headers.set('permissions-policy','camera=(), microphone=(), geolocation=()');headers.set('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }catch(error){console.error(JSON.stringify({message:'request failed',path:url.pathname,error:error instanceof Error?error.message:String(error)}));return url.pathname.startsWith('/api/')?json({error:'Error interno del administrador'},500):new Response('Error interno',{status:500});}
  }
};
