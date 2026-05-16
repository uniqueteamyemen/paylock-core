const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const used = new Map(); // lock + replay protection

function lock(h1) {
  used.set(h1, 'PENDING');
}

function release(h1) {
  used.delete(h1);
}

function markUsed(h1) {
  used.set(h1, Date.now());
  setTimeout(() => used.delete(h1), 5 * 60 * 1000);
}

app.post('/v1/activate', async (req, res) => {
  const { h0 } = req.body;

  // جلب الجلسة
  const sessionRes = await fetch(`http://localhost:3000/v1/session/${h0}`);
  if (!sessionRes.ok) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = await sessionRes.json();

  // تحقق الدفع
  if (session.status !== 'PAYMENT_ATTESTED') {
    return res.status(403).json({ error: 'Payment not confirmed' });
  }

  const h1 = crypto.createHash('sha256').update(h0).digest('hex');

  // 🔒 منع التكرار + lock
  if (used.has(h1)) {
    return res.status(409).json({ error: 'Already used or processing' });
  }

  lock(h1);

  try {
    // استدعاء المزود
    const providerRes = await fetch('http://localhost:3002/v1/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ h0 })
    });

    if (!providerRes.ok) {
      console.log(`[${h0}] Provider failed`);
      release(h1);
      return res.status(500).json({ error: 'Provider failed' });
    }

    // نجاح
    markUsed(h1);

    // تأكيد بدون انتظار
    fetch(`http://localhost:3000/v1/confirm/${h0}`, {
      method: 'POST'
    }).catch(() => {});

    console.log(`[${h0}] Activated successfully`);

    res.json({ h1, status: 'ACTIVE' });

  } catch (err) {
    release(h1);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(3001, () => console.log("Adapter running on 3001"));