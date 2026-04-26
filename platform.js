const express = require('express');
const crypto = require('crypto');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

// ========== 1. المتانة: التحقق من سر المنصة ==========
const PLATFORM_SECRET = process.env.PLATFORM_SECRET;
if (!PLATFORM_SECRET) {
  console.error('FATAL: PLATFORM_SECRET environment variable is required.');
  process.exit(1); // يفشل التطبيق فورًا إذا لم يتم تعيين السر في متغيرات البيئة
}

// إعداد Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ========== 2. التدقيق: سجل إضافي (Append-only Log) ==========
async function appendLog(event) {
  const entry = JSON.stringify({ ...event, ts: Date.now() });
  await redis.rpush('audit_log', entry);
}

// ========== 3. المتانة: منع تكرار الطلبات (Idempotency Middleware) ==========
const idempotencyCache = new Map();
function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  if (idempotencyCache.has(key)) {
    return res.json(idempotencyCache.get(key));
  }

  const originalSend = res.json.bind(res);
  res.json = (body) => {
    idempotencyCache.set(key, body);
    // تنظيف اختياري: حذف المفتاح بعد فترة لمنع تضخم الذاكرة
    setTimeout(() => idempotencyCache.delete(key), 5 * 60 * 1000);
    return originalSend(body);
  };
  next();
}
app.use(idempotency);

// ========== 4. المتانة: دالة مساعدة للتحقق من صحة المدخلات ==========
function requireFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null) return false;
  }
  return true;
}

// ========== نقطة النهاية 1: فحص الصحة ==========
app.get('/v1/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', redis: true, service: 'paylock-core' });
  } catch (e) {
    res.status(500).json({ status: 'error', redis: false });
  }
});

// ========== نقطة النهاية 2: إنشاء جلسة (H0) ==========
app.post('/v1/session', async (req, res) => {
  if (!requireFields(req.body, ['service_id', 'device_id'])) {
    return res.status(400).json({ error: 'Missing required fields: service_id, device_id' });
  }

  const {
    service_id, service_name, provider_id, provider_name,
    device_id, device_type, device_specs,
    payment_method, service_url, constraints, receipt_id
  } = req.body;

  const payload = {
    service_id, service_name: service_name || null,
    provider_id: provider_id || null, provider_name: provider_name || null,
    device_id, device_type: device_type || null, device_specs: device_specs || null,
    payment_method: payment_method || null, service_url: service_url || null,
    constraints: constraints || {}
  };

  const payloadString = JSON.stringify(payload);
  const h0 = crypto.createHmac('sha256', PLATFORM_SECRET).update(payloadString).digest('hex');

  const session = {
    h0, status: 'INITIATED', payload, device_id,
    receipt_id: receipt_id || null, created_at: Date.now(), signals: []
  };

  // 5. المتانة: وقت انتهاء صلاحية للجلسات
  await redis.set(`session:${h0}`, JSON.stringify(session), 'EX', 3600);

  // تسجيل الحدث
  await appendLog({ type: 'SESSION_CREATED', h0, service_id, device_id });

  res.json({ h0, status: 'INITIATED' });
});

// ========== نقطة النهاية 3: إلحاق إشارة ==========
app.post('/v1/signal', async (req, res) => {
  if (!requireFields(req.body, ['h0', 'signal_type', 'signal_ref'])) {
    return res.status(400).json({ error: 'Missing required fields: h0, signal_type, signal_ref' });
  }

  const { h0, signal_type, signal_ref } = req.body;
  const sessionData = await redis.get(`session:${h0}`);
  if (!sessionData) return res.status(404).json({ error: 'Session not found' });

  const session = JSON.parse(sessionData);
  session.signals.push({ type: signal_type, ref: signal_ref, timestamp: Date.now() });
  await redis.set(`session:${h0}`, JSON.stringify(session), 'EX', 3600);

  await appendLog({ type: 'SIGNAL_RECORDED', h0, signal_type });

  res.json({ h0, signal_recorded: true });
});

// ========== نقطة النهاية 4: الحل وإصدار H1 ==========
app.post('/v1/resolve', async (req, res) => {
  if (!requireFields(req.body, ['h0'])) {
    return res.status(400).json({ error: 'Missing required field: h0' });
  }

  const { h0 } = req.body;
  const sessionData = await redis.get(`session:${h0}`);
  if (!sessionData) return res.status(404).json({ error: 'Session not found' });

  const session = JSON.parse(sessionData);

  // Idempotency داخلية
  if (session.h1) {
    return res.json({ h1: session.h1, status: 'EXECUTION_PROVEN' });
  }

  const providerAck = session.signals.find(s => s.type === 'provider_ack');
  if (!providerAck) {
    return res.status(400).json({ error: 'Provider acknowledgment not found' });
  }

  const h1Payload = `${h0}:${providerAck.ref}:${session.device_id}`;
  const h1 = crypto.createHmac('sha256', PLATFORM_SECRET).update(h1Payload).digest('hex');

  session.h1 = h1;
  session.status = 'EXECUTION_PROVEN';
  await redis.set(`session:${h0}`, JSON.stringify(session), 'EX', 3600);

  await appendLog({ type: 'RESOLVED', h0, h1 });

  res.json({ h1, status: 'EXECUTION_PROVEN' });
});

// ========== بدء الخادم ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PayLock Core (Production Ready) running on port ${PORT}`);
});