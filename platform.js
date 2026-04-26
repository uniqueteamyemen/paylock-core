const express = require('express');
const crypto = require('crypto');
const Redis = require('ioredis');

const app = express();
app.use(express.json());

// إعداد Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// سر المنصة (يجب تغييره في الإنتاج عبر متغيرات البيئة)
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || 'dev-secret-key-change-in-production';

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
// الحالة: INITIATED
app.post('/v1/session', async (req, res) => {
  const {
    service_id,
    service_name,
    provider_id,
    provider_name,
    device_id,
    device_type,
    device_specs,
    payment_method,
    service_url,
    constraints,
    receipt_id
  } = req.body;

  if (!device_id || !service_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    service_id,
    service_name: service_name || null,
    provider_id: provider_id || null,
    provider_name: provider_name || null,
    device_id,
    device_type: device_type || null,
    device_specs: device_specs || null,
    payment_method: payment_method || null,
    service_url: service_url || null,
    constraints: constraints || {}
  };

  const payloadString = JSON.stringify(payload);
  const h0 = crypto.createHmac('sha256', PLATFORM_SECRET).update(payloadString).digest('hex');

  const session = {
    h0,
    status: 'INITIATED',
    payload,
    device_id,
    receipt_id: receipt_id || null,
    created_at: Date.now(),
    signals: []
  };

  await redis.set(`session:${h0}`, JSON.stringify(session));

  res.json({ h0, status: 'INITIATED' });
});

// ========== نقطة النهاية 3: إلحاق إشارة ==========
// لا يغير الحالة، فقط يسجل الإشارة داخل الجلسة
app.post('/v1/signal', async (req, res) => {
  const { h0, signal_type, signal_ref } = req.body;
  if (!h0 || !signal_type || !signal_ref) {
    return res.status(400).json({ error: 'h0, signal_type, and signal_ref are required' });
  }

  const sessionData = await redis.get(`session:${h0}`);
  if (!sessionData) return res.status(404).json({ error: 'Session not found' });

  const session = JSON.parse(sessionData);

  // إلحاق الإشارة فقط، لا تغيير في الحالة
  session.signals.push({
    type: signal_type,
    ref: signal_ref,
    timestamp: Date.now()
  });

  await redis.set(`session:${h0}`, JSON.stringify(session));

  res.json({ h0, signal_recorded: true });
});

// ========== نقطة النهاية 4: الحل وإصدار H1 ==========
// يصدر H1 فقط عند وجود إشارة موافقة من مزود الخدمة
// Idempotent: لا يصدر H1 جديدًا إذا كان موجودًا مسبقًا
app.post('/v1/resolve', async (req, res) => {
  const { h0 } = req.body;
  if (!h0) return res.status(400).json({ error: 'h0 is required' });

  const sessionData = await redis.get(`session:${h0}`);
  if (!sessionData) return res.status(404).json({ error: 'Session not found' });

  const session = JSON.parse(sessionData);

  // Idempotency
  if (session.h1) {
    return res.json({ h1: session.h1, status: 'EXECUTION_PROVEN' });
  }

  // البحث عن إشارة موافقة مزود الخدمة
  const providerAck = session.signals.find(s => s.type === 'provider_ack');
  if (!providerAck) {
    return res.status(400).json({ error: 'Provider acknowledgment not found' });
  }

  // توليد H1
  const h1Payload = `${h0}:${providerAck.ref}:${session.device_id}`;
  const h1 = crypto.createHmac('sha256', PLATFORM_SECRET).update(h1Payload).digest('hex');

  session.h1 = h1;
  session.status = 'EXECUTION_PROVEN';
  await redis.set(`session:${h0}`, JSON.stringify(session));

  res.json({ h1, status: 'EXECUTION_PROVEN' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PayLock Core running on port ${PORT}`);
});