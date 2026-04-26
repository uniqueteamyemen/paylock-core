const express = require('express');
const app = express();
app.use(express.json());

app.post('/v1/service', (req, res) => {
  console.log(`[${req.body.h0}] Service executed`);
  res.json({ ok: true });
});

app.listen(3002, () => console.log("Provider running on 3002"));