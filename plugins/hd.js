// plugins/hd.js — BeautyPlus HD enhance

const crypto = require('crypto');

const SCENE      = 'HD';
const RATIO      = 2;
const REAL_RATIO = 4;
const UA         = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';
const ORIGIN     = 'https://www.beautyplus.com';
const REFERER    = 'https://www.beautyplus.com/id/image-enhancer';

function randomUid(){ return `bplus-${crypto.randomBytes(16).toString('hex')}`; }
function guessMime(b){
  if(b[0]===0xff&&b[1]===0xd8) return {suffix:'jpg',mime:'image/jpeg'};
  if(b[0]===0x89&&b[1]===0x50) return {suffix:'png',mime:'image/png'};
  return {suffix:'jpg',mime:'image/jpeg'};
}
function amzDate(d=new Date()){ return d.toISOString().replace(/[:-]|\.\d{3}/g,''); }
function hmac(key,data,enc){ return crypto.createHmac('sha256',key).update(data).digest(enc||undefined); }
function getSigningKey(secret,date,region){
  return hmac(hmac(hmac(hmac(`AWS4${secret}`,date),region),'s3'),'aws4_request');
}
function bpH(uid){
  return {'accept':'application/json, text/plain, */*','x-tenant':'bplus','x-locale':'id',
    'x-anonymous-uid':uid,'origin':ORIGIN,'referer':REFERER,'user-agent':UA};
}

async function getPolicy(suffix){
  const r = await fetch(`https://strategy.pixocial.com/upload/policy?app=BeautyPlusWeb&suffix=${suffix}&type=tmp-photo`,
    {headers:{accept:'*/*',origin:ORIGIN,referer:`${ORIGIN}/`,'user-agent':UA},signal:AbortSignal.timeout(20000)});
  if(!r.ok) throw new Error('policy gagal: '+r.status);
  const d = await r.json();
  if(!Array.isArray(d)||!d[0]) throw new Error('format policy salah');
  return d[0].oss;
}

async function uploadS3(buffer,suffix,mime,oss){
  const c=oss.credentials, now=new Date(), xAmzDate=amzDate(now), date=xAmzDate.slice(0,8);
  const credential=`${c.access_key}/${date}/${oss.region}/s3/aws4_request`;
  const policyObj={expiration:new Date(now.getTime()+10*60*1000).toISOString(),conditions:[
    {bucket:oss.bucket},['starts-with','$key','tmp-photo/'],['starts-with','$Content-Type','image/'],
    {success_action_status:'200'},{['X-Amz-Credential']:credential},{['X-Amz-Algorithm']:'AWS4-HMAC-SHA256'},
    {['X-Amz-Security-Token']:c.session_token},{['X-Amz-Date']:xAmzDate}]};
  const policy=Buffer.from(JSON.stringify(policyObj)).toString('base64');
  const sig=hmac(getSigningKey(c.secret_key,date,oss.region),policy,'hex');
  const form=new FormData();
  form.append('key',oss.key); form.append('Content-Type',mime);
  form.append('success_action_status','200'); form.append('X-Amz-Credential',credential);
  form.append('X-Amz-Algorithm','AWS4-HMAC-SHA256'); form.append('X-Amz-Security-Token',c.session_token);
  form.append('X-Amz-Date',xAmzDate); form.append('Policy',policy); form.append('X-Amz-Signature',sig);
  form.append('file',new Blob([buffer],{type:mime}),`image.${suffix}`);
  const r=await fetch(`https://${oss.bucket}.oss-ap-southeast-1.aliyuncs.com/`,
    {method:'POST',body:form,headers:{origin:ORIGIN,referer:`${ORIGIN}/`,'user-agent':UA,accept:'*/*'},
    signal:AbortSignal.timeout(60000)});
  if(!r.ok) throw new Error('S3 upload gagal: '+r.status);
  return oss.data;
}

async function createTask(sourceUrl,uid){
  const r=await fetch('https://www.beautyplus.com/core-api/v2/img-enhancer/task',
    {method:'POST',headers:{...bpH(uid),'content-type':'application/json'},
    body:JSON.stringify({sourceUrl,scene:SCENE,ratio:RATIO,realRatio:REAL_RATIO,functionRatio:null}),
    signal:AbortSignal.timeout(20000)});
  if(r.status!==201) throw new Error('create task gagal: '+r.status);
  const t=(await r.text()).replace(/"/g,'');
  if(!t||t.startsWith('{')) throw new Error('taskId invalid');
  return t;
}

async function pollResult(taskId,uid){
  // poll query endpoint — lebih reliable dari SSE di serverless
  const endpoints=[
    `https://www.beautyplus.com/core-api/v2/img-enhancer/query/${taskId}`,
    `https://www.beautyplus.com/core-api/v1/img-enhancer/query/${taskId}`
  ];
  for(let i=0;i<80;i++){
    await new Promise(r=>setTimeout(r,3000));
    for(const url of endpoints){
      try{
        const r=await fetch(url,{headers:bpH(uid),signal:AbortSignal.timeout(10000)});
        if(!r.ok) continue;
        const d=await r.json();
        if(d.status==='success'&&(d.effectUrl||d.resultUrl)) return d.effectUrl||d.resultUrl;
        if(d.status==='failed'||d.status==='error') throw new Error('process gagal di server BeautyPlus');
        if(d.effectUrl||d.resultUrl) return d.effectUrl||d.resultUrl;
      }catch(e){ if(e.message.includes('BeautyPlus')) throw e; }
    }
  }
  throw new Error('timeout 4 menit — server BeautyPlus lagi lambat, coba lagi nanti');
}

async function runHd(imageBase64,mimeType){
  if(!imageBase64){ const e=new Error('gambar kosong'); e.status=400; throw e; }
  const clean=imageBase64.replace(/^data:[^;]+;base64,/,'');
  const buffer=Buffer.from(clean,'base64');
  const {suffix,mime}=guessMime(buffer);
  const uid=randomUid();
  const oss=await getPolicy(suffix);
  const sourceUrl=await uploadS3(buffer,suffix,mime,oss);
  await (async()=>{
    const r=await fetch(`https://www.beautyplus.com/core-api/v1/img-enhancer/quota/info?scene=${SCENE}`,
      {headers:bpH(uid),signal:AbortSignal.timeout(15000)});
    const d=await r.json();
    if(d?.needUpgrade) throw new Error('quota BeautyPlus habis');
  })();
  const taskId=await createTask(sourceUrl,uid);
  const resultUrl=await pollResult(taskId,uid);
  return {resultUrl};
}

module.exports={runHd};
