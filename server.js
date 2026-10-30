const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(cors());
app.use(bodyParser.json());

let wallets = {};
let userWallets = {};

// 🔒 SECURITY CHECK - Lock API with secret key
function checkApiKey(req, res, next) {
  // Allow homepage without key
  if (req.path === '/') return next();
  // If no API_KEY set in Render, allow all (for now)
  if (!API_KEY) return next();
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
  }
  next();
}

app.use(checkApiKey);

app.get('/', (req, res) => {
  res.json({ status: 'Wallet API Running', secure: !!API_KEY });
});

app.post('/create', (req, res) => {
  const { userId } = req.body;
  const walletId = 'WALLET-' + Date.now();
  const wallet = { id: walletId, balance: 0 };
  wallets[walletId] = wallet;
  if (userId) {
    if (!userWallets[userId]) userWallets[userId] = [];
    userWallets[userId].push(walletId);
  }
  res.json({ success: true, wallet });
});

app.get('/balance/:id', (req, res) => {
  const wallet = wallets[req.params.id];
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json(wallet);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
