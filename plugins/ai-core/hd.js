// plugins/hd.js — port langsung dari plugin bot WA (BeautyPlus)

const crypto = require('crypto');

const SCENE = 'HD', RATIO = 2, REAL_RATIO = 4;
const UA     = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';
const ORIGIN = 'https://www.beautyplus.com';
const REFERER= 'https://www.beautyplus.com/id/image-enhancer';

function randomUid(){ return `bplus-${crypto.randomBytes(16).toString('hex')}`; }

function guessMime(b){
  if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return {suffix:'jpg',mime:'image/jpeg'};
  if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return {suffix:'png',mime:'image/png'};
  if(b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46) return {suffix:'webp',mime:'image/webp'};
  return {suffix:'jpg',mime:'image/jpeg'};
}

function amzDate(d=new Date()){ return d.toISOString().replace(/[:-]|\.\d{3}/g,''); }
function hmac(key,data,enc){ return crypto.createHmac('sha256',key).update(data).digest(enc); }
function getSigningKey(secret,date,region){
  const kDate=hmac(`AWS4${secret}`,date);
  const kRegion=hmac(kDate,region);
  const kService=hmac(kRegion,'s3');
  return hmac(kService,'aws4_request');
}
function signPolicy(secret,policy,date,region){
  return hmac(getSigningKey(secret,date,region),policy,'hex');
}
function bpHeaders(uid){
  return {
    'accept':'application/json, text/plain, */*',
    'x-tenant':'bplus','x-locale':'id',
    'x-anonymous-uid':uid,
    'origin':ORIGIN,'referer':REFERER,'user-agent':UA
  };
}

async function getPolicy(suffix){
  const res = await fetch(
    `https://strategy.pixocial.com/upload/policy?app=BeautyPlusWeb&suffix=${suffix}&type=tmp-photo`,
    { headers:{accept:'*/*',origin:ORIGIN,referer:`${ORIGIN}/`,'user-agent':UA}, signal:AbortSignal.timeout(20000) }
  );
  if(!res.ok) throw new Error(`policy_failed: ${res.status}`);
  const data = await res.json();
  if(!Array.isArray(data)) throw new Error('policy format salah');
  return data[0].oss;
}

async function uploadFile(buffer, suffix, mime, oss){
  const creds = oss.credentials;
  const now = new Date();
  const xAmzDate = amzDate(now);
  const date = xAmzDate.slice(0,8);
  const credential = `${creds.access_key}/${date}/${oss.region}/s3/aws4_request`;

  const policyObj = {
    expiration: new Date(now.getTime()+10*60*1000).toISOString(),
    conditions: [
      {bucket:oss.bucket},
      ['starts-with','$key','tmp-photo/'],
      ['starts-with','$Content-Type','image/'],
      {success_action_status:'200'},
      {'X-Amz-Credential':credential},
      {'X-Amz-Algorithm':'AWS4-HMAC-SHA256'},
      {'X-Amz-Security-Token':creds.session_token},
      {'X-Amz-Date':xAmzDate}
    ]
  };

  const policy    = Buffer.from(JSON.stringify(policyObj)).toString('base64');
  const signature = signPolicy(creds.secret_key, policy, date, oss.region);

  const form = new FormData();
  form.append('key', oss.key);
  form.append('Content-Type', mime);
  form.append('success_action_status','200');
  form.append('X-Amz-Credential', credential);
  form.append('X-Amz-Algorithm','AWS4-HMAC-SHA256');
  form.append('X-Amz-Security-Token', creds.session_token);
  form.append('X-Amz-Date', xAmzDate);
  form.append('Policy', policy);
  form.append('X-Amz-Signature', signature);
  form.append('file', new Blob([buffer],{type:mime}), `image.${suffix}`);

  const res = await fetch(`https://${oss.bucket}.oss-ap-southeast-1.aliyuncs.com/`, {
    method:'POST', body:form,
    headers:{origin:ORIGIN,referer:`${ORIGIN}/`,'user-agent':UA,accept:'*/*'},
    signal:AbortSignal.timeout(60000)
  });
  if(!res.ok) throw new Error(`upload_failed: ${res.status}`);
  return oss.data;
}

async function checkQuota(uid){
  const res = await fetch(
    `https://www.beautyplus.com/core-api/v1/img-enhancer/quota/info?scene=${SCENE}`,
    { headers:bpHeaders(uid), signal:AbortSignal.timeout(15000) }
  );
  if(!res.ok) throw new Error(`quota_failed: ${res.status}`);
  const data = await res.json();
  if(data?.needUpgrade) throw new Error('need_upgrade');
  return data;
}

async function createTask(sourceUrl, uid){
  const res = await fetch('https://www.beautyplus.com/core-api/v2/img-enhancer/task', {
    method:'POST',
    headers:{...bpHeaders(uid),'content-type':'application/json'},
    body:JSON.stringify({sourceUrl,scene:SCENE,ratio:RATIO,realRatio:REAL_RATIO,functionRatio:null}),
    signal:AbortSignal.timeout(20000)
  });
  if(res.status!==201) throw new Error(`task_failed: ${res.status}`);
  const taskId = (await res.text()).replace(/"/g,'').trim();
  if(!taskId||taskId.startsWith('{')) throw new Error('taskId invalid');
  return taskId;
}

async function getResultSSE(taskId, uid){
  // pake SSE endpoint persis seperti plugin bot WA
  const res = await fetch(
    `https://www.beautyplus.com/core-api/v2/img-enhancer/query-sse/${taskId}`,
    {
      headers:{...bpHeaders(uid), accept:'text/event-stream', authorization:''},
      signal:AbortSignal.timeout(120000)
    }
  );
  if(!res.ok) throw new Error(`sse_failed: ${res.status}`);

  // baca stream line by line
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while(true){
    const {done, value} = await reader.read();
    if(done) break;
    buffer += decoder.decode(value, {stream:true});
    const lines = buffer.split('\n');
    buffer = lines.pop(); // simpan potongan terakhir yang belum lengkap

    for(const line of lines){
      const trimmed = line.trim();
      if(!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if(!jsonStr||jsonStr===':') continue;
      try{
        const data = JSON.parse(jsonStr);
        if(data.status==='success'&&data.effectUrl) return data.effectUrl;
        if(data.status==='failed'||data.status==='error') throw new Error('process_failed di BeautyPlus');
      }catch(e){
        if(e.message.includes('BeautyPlus')) throw e;
        // JSON parse error biasa, lanjut
      }
    }
  }

  throw new Error('SSE stream selesai tanpa hasil');
}

async function runHd(imageBase64, mimeType){
  if(!imageBase64){ const e=new Error('gambar kosong'); e.status=400; throw e; }
  const clean = imageBase64.replace(/^data:[^;]+;base64,/,'');
  const buffer = Buffer.from(clean,'base64');
  const {suffix,mime} = guessMime(buffer);
  const uid = randomUid();

  const oss       = await getPolicy(suffix);
  const sourceUrl = await uploadFile(buffer, suffix, mime, oss);
  await checkQuota(uid);
  const taskId    = await createTask(sourceUrl, uid);
  const resultUrl = await getResultSSE(taskId, uid);

  if(!resultUrl) throw new Error('hasil kosong dari BeautyPlus');
  return {resultUrl};
}

module.exports = {runHd};
