const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
let wallets = {};
app.get('/', (req,res)=>{res.send('Derrick Wallet API Running');});
app.post('/api/wallets', (req,res)=>{
const id = 'WALLET-'+Date.now()+'-'+Math.random().toString(36).substr(2,5).toUpperCase();
const wallet = {id, username: req.body.username||'Derrick', balance: 0};
wallets[id]=wallet; res.json({success:true,wallet});});
app.get('/api/wallets/:id', (req,res)=>{
const w=wallets[req.params.id]; if(!w) return res.status(404).json({error:'Wallet not found'});
res.json({success:true,wallet:w,balance:w.balance});});
app.post('/api/wallets/balance', (req,res)=>{
const walletId=req.body.id||req.body.walletId||req.body.userId;
const w=wallets[walletId]; if(!w) return res.status(404).json({error:'Wallet not found'});
res.json({success:true,balance:w.balance,wallet:w});});
app.post('/api/deposit', (req,res)=>{
const walletId=req.body.id||req.body.walletId||req.body.userId;
const w=wallets[walletId]; if(!w) return res.status(404).json({error:'Wallet not found'});
w.balance+=Number(req.body.amount); res.json({success:true,wallet:w,balance:w.balance});});
app.post('/api/transfer', (req,res)=>{
const from=wallets[req.body.from||req.body.fromId]; const to=wallets[req.body.to||req.body.toId];
if(!from||!to) return res.status(404).json({error:"Wallet not found"});
const amt=Number(req.body.amount); if(from.balance<amt) return res.status(400).json({error:"Insufficient funds"});
from.balance-=amt; to.balance+=amt; res.json({success:true,from,to});});
app.post('/api/wallet/transfer', (req,res)=>{
const from=wallets[req.body.from||req.body.fromUserId||req.body.fromId];
const to=wallets[req.body.to||req.body.toUserId||req.body.toId||req.body.walletId];
if(!from||!to) return res.status(404).json({error:"Wallet not found"});
const amt=Number(req.body.amount); if(from.balance<amt) return res.status(400).json({error:"Insufficient funds"});
from.balance-=amt; to.balance+=amt; res.json({success:true,from,to});});
app.post('/api/wallets/transfer', (req,res)=>{
const from=wallets[req.body.from||req.body.fromUserId||req.body.fromId];
const to=wallets[req.body.to||req.body.toUserId||req.body.toId||req.body.walletId];
if(!from||!to) return res.status(404).json({error:"Wallet not found"});
const amt=Number(req.body.amount); if(from.balance<amt) return res.status(400).json({error:"Insufficient funds"});
from.balance-=amt; to.balance+=amt; res.json({success:true,from,to});});
const PORT=process.env.PORT||10000; app.listen(PORT, ()=>{console.log(`Server running on port ${PORT}`);});
