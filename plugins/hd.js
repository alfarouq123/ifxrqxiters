// plugins/hd.js
// enhance gambar via BeautyPlus (pixocial) — persis logika dari plugin bot WA

const crypto = require('crypto');

const SCENE     = 'HD';
const RATIO     = 2;
const REAL_RATIO = 4;
const UA        = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';
const ORIGIN    = 'https://www.beautyplus.com';
const REFERER   = 'https://www.beautyplus.com/id/image-enhancer';

function randomUid() {
  return `bplus-${crypto.randomBytes(16).toString('hex')}`;
}

function guessMime(buffer) {
  if (buffer[0]===0xff && buffer[1]===0xd8) return { suffix:'jpg', mime:'image/jpeg' };
  if (buffer[0]===0x89 && buffer[1]===0x50) return { suffix:'png', mime:'image/png' };
  if (buffer[0]===0x52 && buffer[1]===0x49) return { suffix:'webp', mime:'image/webp' };
  return { suffix:'jpg', mime:'image/jpeg' };
}

function amzDate(d = new Date()) {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, '');
}
function hmac(key, data, enc) {
  return crypto.createHmac('sha256', key).update(data).digest(enc || undefined);
}
function getSigningKey(secret, date, region) {
  const kDate    = hmac(`AWS4${secret}`, date);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}
function signPolicy(secret, policy, date, region) {
  return hmac(getSigningKey(secret, date, region), policy, 'hex');
}

function bpHeaders(uid) {
  return {
    'accept':             'application/json, text/plain, */*',
    'x-tenant':           'bplus',
    'x-locale':           'id',
    'x-anonymous-uid':    uid,
    'origin':             ORIGIN,
    'referer':            REFERER,
    'user-agent':         UA
  };
}

async function getPolicy(suffix) {
  const res = await fetch(
    `https://strategy.pixocial.com/upload/policy?app=BeautyPlusWeb&suffix=${suffix}&type=tmp-photo`,
    { headers: { accept:'*/*', origin:ORIGIN, referer:`${ORIGIN}/`, 'user-agent':UA }, signal:AbortSignal.timeout(20000) }
  );
  if (!res.ok) throw new Error('policy_failed: ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('policy format salah');
  return data[0].oss;
}

async function uploadToS3(buffer, suffix, mime, oss) {
  const creds = oss.credentials;
  const now   = new Date();
  const xAmzDate  = amzDate(now);
  const date      = xAmzDate.slice(0, 8);
  const credential = `${creds.access_key}/${date}/${oss.region}/s3/aws4_request`;

  const policyObj = {
    expiration: new Date(now.getTime() + 10*60*1000).toISOString(),
    conditions: [
      { bucket: oss.bucket },
      ['starts-with','$key','tmp-photo/'],
      ['starts-with','$Content-Type','image/'],
      { success_action_status: '200' },
      { 'X-Amz-Credential': credential },
      { 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256' },
      { 'X-Amz-Security-Token': creds.session_token },
      { 'X-Amz-Date': xAmzDate }
    ]
  };

  const policy    = Buffer.from(JSON.stringify(policyObj)).toString('base64');
  const signature = signPolicy(creds.secret_key, policy, date, oss.region);

  const form = new FormData();
  form.append('key', oss.key);
  form.append('Content-Type', mime);
  form.append('success_action_status', '200');
  form.append('X-Amz-Credential', credential);
  form.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
  form.append('X-Amz-Security-Token', creds.session_token);
  form.append('X-Amz-Date', xAmzDate);
  form.append('Policy', policy);
  form.append('X-Amz-Signature', signature);
  form.append('file', new Blob([buffer], { type: mime }), `image.${suffix}`);

  const res = await fetch(`https://${oss.bucket}.oss-ap-southeast-1.aliyuncs.com/`, {
    method: 'POST', body: form,
    headers: { origin:ORIGIN, referer:`${ORIGIN}/`, 'user-agent':UA, accept:'*/*' },
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error('upload_to_s3_failed: ' + res.status);
  return oss.data;
}

async function checkQuota(uid) {
  const res = await fetch(
    `https://www.beautyplus.com/core-api/v1/img-enhancer/quota/info?scene=${SCENE}`,
    { headers: bpHeaders(uid), signal:AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error('quota_failed: ' + res.status);
  const data = await res.json();
  if (data?.needUpgrade) throw new Error('quota_habis');
  return data;
}

async function createTask(sourceUrl, uid) {
  const res = await fetch('https://www.beautyplus.com/core-api/v2/img-enhancer/task', {
    method: 'POST',
    headers: { ...bpHeaders(uid), 'content-type':'application/json' },
    body: JSON.stringify({ sourceUrl, scene:SCENE, ratio:RATIO, realRatio:REAL_RATIO, functionRatio:null }),
    signal: AbortSignal.timeout(20000)
  });
  if (res.status !== 201) throw new Error('task_failed: ' + res.status);
  const taskId = await res.text();
  if (!taskId || taskId.startsWith('{')) throw new Error('task_id invalid');
  return taskId.replace(/"/g, '');
}

async function pollResult(taskId, uid) {
  // SSE gak bisa di-stream di serverless, jadi poll query endpoint langsung
  const POLL_URL = `https://www.beautyplus.com/core-api/v2/img-enhancer/query/${taskId}`;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(POLL_URL, { headers: bpHeaders(uid), signal:AbortSignal.timeout(15000) });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === 'success' && data.effectUrl) return data.effectUrl;
    if (data.status === 'failed' || data.status === 'error') throw new Error('beautyplus process_failed');
  }
  throw new Error('timeout nunggu hasil HD');
}

async function runHd(imageBase64, mimeType) {
  if (!imageBase64) { const e = new Error('gambar kosong'); e.status = 400; throw e; }

  const clean  = imageBase64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(clean, 'base64');
  const { suffix, mime } = guessMime(buffer);
  const uid    = randomUid();

  const oss       = await getPolicy(suffix);
  const sourceUrl = await uploadToS3(buffer, suffix, mime, oss);
  await checkQuota(uid);
  const taskId    = await createTask(sourceUrl, uid);
  const resultUrl = await pollResult(taskId, uid);

  return { resultUrl };
}

module.exports = { runHd };
