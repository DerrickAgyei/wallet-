const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
let wallets = {};
let userWallets = {};
app.get('/', (req, res) => {
  res.json({ status: 'Wallet API Running', endpoints: ['/create', '/balance/:id', '/wallets'] });
});
app.post('/create', (req, res) => {
  const { userId } = req.body;
  const walletId = 'WALLET-' + Date.now();
  const wallet = { id: walletId, balance: 0, userId: userId || 'guest', created: new Date() };
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
  res.json({ balance: wallet.balance, wallet });
});
app.get('/wallets', (req, res) => {
  res.json(Object.values(wallets));
});
app.post('/add-funds', (req, res) => {
  const { walletId, amount } = req.body;
  if (!wallets[walletId]) return res.status(404).json({ error: 'Wallet not found' });
  wallets[walletId].balance += Number(amount);
  res.json({ success: true, wallet: wallets[walletId] });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
