import { cleanText, cleanDataText } from './lib/validation.js';
import { publicSires, listSires, getSire, createSire, updateSire, setSireActive, bulkUpsertSires } from './routes/sires.js';
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
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256);
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
  try{
    const expected=await hmac(payload,env.SESSION_SECRET),provided=decodeBase64url(signature);if(expected.length!==provided.length||!crypto.subtle.timingSafeEqual(expected,provided))return null;
    const session=JSON.parse(new TextDecoder().decode(decodeBase64url(payload)));if(session.exp<Date.now())return null;
    if(session.email!==env.ADMIN_EMAIL){const row=await env.DB.prepare('SELECT 1 FROM admin_users WHERE email=?1').bind(session.email).first();if(!row)return null;}
    return session;
  }catch{return null;}
}
async function mustChangePassword(email,env){
  if(email===env.ADMIN_EMAIL)return false;
  const row=await env.DB.prepare('SELECT must_change_password FROM admin_users WHERE email=?1').bind(email).first();
  return Boolean(row?.must_change_password);
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
    const body=await readJson(request),email=cleanText(body.email,180).toLowerCase(),password=cleanText(body.password,300);
    let authenticatedEmail=null;
    if(await secureEqual(email,env.ADMIN_EMAIL.toLowerCase())&&await verifyPassword(password,env)){
      authenticatedEmail=env.ADMIN_EMAIL;
    }else{
      const row=await env.DB.prepare('SELECT email,password_hash,password_salt FROM admin_users WHERE email=?1').bind(email).first();
      if(row&&await secureEqual(await hashPassword(password,row.password_salt),row.password_hash))authenticatedEmail=row.email;
    }
    if(!authenticatedEmail){await recordLoginFailure(request,env);return json({error:'Correo o contraseña incorrectos'},401);}
    const session=await createSession(authenticatedEmail,env.SESSION_SECRET);
    return json({email:authenticatedEmail,mustChangePassword:await mustChangePassword(authenticatedEmail,env)},200,{'set-cookie':`${SESSION_COOKIE}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
  }
  const session=await readSession(request,env);
  if(url.pathname==='/api/session'&&request.method==='GET'){
    if(!session)return json({authenticated:false},401);
    return json({authenticated:true,email:session.email,mustChangePassword:await mustChangePassword(session.email,env)});
  }
  if(!session)return json({error:'Sesión vencida. Vuelve a ingresar.'},401);
  if(url.pathname==='/api/logout'&&request.method==='POST')return json({ok:true},200,{'set-cookie':`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
  if(url.pathname==='/api/change-password'&&request.method==='POST'){
    const row=await env.DB.prepare('SELECT password_hash,password_salt FROM admin_users WHERE email=?1').bind(session.email).first();
    if(!row)return json({error:'Esta cuenta no admite cambio de contraseña desde aquí.'},400);
    const body=await readJson(request),current=cleanText(body.currentPassword,300),next=cleanText(body.newPassword,300);
    if(next.length<10)return json({error:'La nueva contraseña debe tener al menos 10 caracteres.'},400);
    if(!await secureEqual(await hashPassword(current,row.password_salt),row.password_hash))return json({error:'La contraseña actual no es correcta.'},401);
    const saltBytes=crypto.getRandomValues(new Uint8Array(16)),saltHex=[...saltBytes].map(b=>b.toString(16).padStart(2,'0')).join('');
    const newHash=await hashPassword(next,saltHex);
    await env.DB.prepare('UPDATE admin_users SET password_hash=?1,password_salt=?2,must_change_password=0,updated_at=?3 WHERE email=?4').bind(newHash,saltHex,new Date().toISOString(),session.email).run();
    return json({ok:true});
  }

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
    const importId=crypto.randomUUID(),createdAt=new Date().toISOString(),filename=cleanDataText(body.filename,180),sheet=cleanDataText(body.sheet,120);
    await env.DB.prepare("INSERT INTO import_batches(id,filename,sheet_name,row_count,status,created_by,created_at) VALUES(?1,?2,?3,?4,'processing',?5,?6)").bind(importId,filename,sheet,body.rows.length,session.email,createdAt).run();
    try{
      const imported=await bulkUpsertSires(env,session,body.rows);
      await env.DB.prepare("UPDATE import_batches SET status='completed' WHERE id=?1").bind(importId).run();
      console.log(JSON.stringify({message:'catalog import completed',importId,rows:imported,email:session.email}));
      return json({imported,importId});
    }catch(error){
      await env.DB.prepare("UPDATE import_batches SET status='failed' WHERE id=?1").bind(importId).run();
      return json({error:error.message},error.status||400);
    }
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
