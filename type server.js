const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'derrick-ghana-wallet-secret-2024';

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

let users = [];
let transactions = [];

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } 
  catch { return res.status(401).json({ error: 'Invalid token' }); }
}

const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>DerrickPay - Ghana Wallet</title><style>
body{font-family:Arial;background:#f5f7fb;margin:0;padding:15px}
.card{background:#fff;padding:18px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:420px;margin:14px auto}
input,button,select{width:100%;padding:12px;margin:7px 0;border-radius:10px;border:1px solid #ddd;box-sizing:border-box;font-size:15px}
button{background:#000;color:#fff;font-weight:bold;border:none;cursor:pointer}
.balance{font-size:32px;font-weight:bold;color:#0a7d33}
.tx{font-size:13px;border-bottom:1px solid #eee;padding:8px 0}
.h{text-align:center}
</style></head><body>
<div class="card h"><h2>🇬🇭 DerrickPay</h2><p>Ghana Cedis Real Wallet</p><p style="font-size:12px;color:#666">MTN MoMo | Vodafone Cash | AirtelTigo</p></div>
<div id="auth" class="card"><h3>Login / Register</h3><input id="email" placeholder="Email"><input id="password" type="password" placeholder="Password"><button onclick="register()">Register New Account</button><button onclick="login()" style="background:#0a7d33">Login</button><p id="authMsg"></p></div>
<div id="wallet" class="card" style="display:none"><h3>Hello <span id="userEmail"></span></h3><div>Balance:</div><div class="balance">GHS <span id="bal">0.00</span></div><hr>
<h4>💳 Deposit (MoMo)</h4><select id="momoNet"><option>MTN Mobile Money</option><option>Vodafone Cash</option><option>AirtelTigo Money</option></select><input id="depAmount" type="number" placeholder="Amount GHS e.g. 50"><input id="momoNumber" placeholder="MoMo Number e.g. 024XXXXXXX"><button onclick="deposit()">Deposit GHS (Simulated MoMo)</button>
<h4>📤 Send Money</h4><input id="sendEmail" placeholder="Recipient Email"><input id="sendAmount" type="number" placeholder="Amount GHS"><button onclick="sendMoney()" style="background:#0a7d33">Send GHS</button>
<h4>📥 Withdraw to MoMo</h4><input id="withAmount" type="number" placeholder="Amount GHS"><input id="withNumber" placeholder="Your MoMo Number"><button onclick="withdraw()" style="background:#d32f2f">Withdraw to MoMo</button>
<button onclick="logout()" style="background:#888;margin-top:20px">Logout</button><h4>History</h4><div id="txs"></div></div>
<script>
let token=null;
async function register(){const e=document.getElementById('email').value;const p=document.getElementById('password').value;const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})});const d=await r.json();document.getElementById('authMsg').innerText=d.message||d.error;if(r.ok)login();}
async function login(){const e=document.getElementById('email').value;const p=document.getElementById('password').value;const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})});const d=await r.json();if(d.token){token=d.token;localStorage.setItem('token',token);showWallet(d.user);}else{document.getElementById('authMsg').innerText=d.error;}}
function showWallet(u){document.getElementById('auth').style.display='none';document.getElementById('wallet').style.display='block';document.getElementById('userEmail').innerText=u.email;refresh();}
async function refresh(){const r=await fetch('/api/balance',{headers:{Authorization:'Bearer '+token}});const d=await r.json();if(d.balance!==undefined)document.getElementById('bal').innerText=Number(d.balance).toFixed(2);const r2=await fetch('/api/transactions',{headers:{Authorization:'Bearer '+token}});const d2=await r2.json();document.getElementById('txs').innerHTML=(d2||[]).reverse().map(t=>'<div class=tx><b>'+t.type+'</b> GHS '+t.amount+' - '+t.details+'<br><small>'+new Date(t.date).toLocaleString()+'</small></div>').join('');}
async function deposit(){const a=document.getElementById('depAmount').value;const n=document.getElementById('momoNumber').value;const net=document.getElementById('momoNet').value;const r=await fetch('/api/deposit',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({amount:a,number:n,network:net})});const d=await r.json();alert(d.message||d.error);refresh();}
async function sendMoney(){const to=document.getElementById('sendEmail').value;const a=document.getElementById('sendAmount').value;const r=await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({to,amount:a})});const d=await r.json();alert(d.message||d.error);refresh();}
async function withdraw(){const a=document.getElementById('withAmount').value;const n=document.getElementById('withNumber').value;const r=await fetch('/api/withdraw',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({amount:a,number:n})});const d=await r.json();alert(d.message||d.error);refresh();}
function logout(){localStorage.clear();location.reload();}
const st=localStorage.getItem('token');if(st){token=st;fetch('/api/me',{headers:{Authorization:'Bearer '+st}}).then(r=>r.json()).then(d=>{if(d.email)showWallet(d);});}
</script></body></html>`;

app.get('/', (req,res)=>res.send(html));
app.post('/api/register', async (req,res)=>{
  const {email,password}=req.body;
  if(!email||!password) return res.status(400).json({error:'Email and password required'});
  if(users.find(u=>u.email===email)) return res.status(400).json({error:'User exists, please login'});
  const hashed=await bcrypt.hash(password,10);
  users.push({id:uuidv4(),email,password:hashed,balance:0});
  res.json({message:'Registered! Now login'});
});
app.post('/api/login', async (req,res)=>{
  const {email,password}=req.body;
  const user=users.find(u=>u.email===email);
  if(!user) return res.status(400).json({error:'User not found'});
  const ok=await bcrypt.compare(password,user.password);
  if(!ok) return res.status(400).json({error:'Wrong password'});
  const token=jwt.sign({id:user.id,email:user.email},JWT_SECRET,{expiresIn:'30d'});
  res.json({token,user:{email:user.email,balance:user.balance}});
});
app.get('/api/me', auth, (req,res)=>{
  const user=users.find(u=>u.id===req.user.id);
  if(!user) return res.status(404).json({error:'Not found'});
  res.json({email:user.email,balance:user.balance});
});
app.get('/api/balance', auth, (req,res)=>{
  const user=users.find(u=>u.id===req.user.id);
  res.json({balance:user.balance});
});
app.get('/api/transactions', auth, (req,res)=>{
  res.json(transactions.filter(t=>t.userId===req.user.id));
});
app.post('/api/deposit', auth, (req,res)=>{
  const amt=parseFloat(req.body.amount);
  if(!amt||amt<=0) return res.status(400).json({error:'Invalid amount'});
  const user=users.find(u=>u.id===req.user.id);
  user.balance+=amt;
  transactions.push({id:uuidv4(),userId:user.id,type:'DEPOSIT',amount:amt,details:(req.body.network||'MoMo')+' '+(req.body.number||''),date:new Date()});
  res.json({message:'Deposited GHS '+amt.toFixed(2),balance:user.balance});
});
app.post('/api/send', auth, (req,res)=>{
  const amt=parseFloat(req.body.amount);
  const sender=users.find(u=>u.id===req.user.id);
  if(!amt||amt<=0) return res.status(400).json({error:'Invalid amount'});
  if(sender.balance<amt) return res.status(400).json({error:'Insufficient balance'});
  const recipient=users.find(u=>u.email===req.body.to);
  if(!recipient) return res.status(400).json({error:'Recipient not found (must register first)'});
  if(recipient.id===sender.id) return res.status(400).json({error:'Cannot send to self'});
  sender.balance-=amt; recipient.balance+=amt;
  const now=new Date();
  transactions.push({id:uuidv4(),userId:sender.id,type:'SEND',amount:-amt,details:'To '+req.body.to,date:now});
  transactions.push({id:uuidv4(),userId:recipient.id,type:'RECEIVE',amount:amt,details:'From '+sender.email,date:now});
  res.json({message:'Sent GHS '+amt.toFixed(2)+' to '+req.body.to});
});
app.post('/api/withdraw', auth, (req,res)=>{
  const amt=parseFloat(req.body.amount);
  const user=users.find(u=>u.id===req.user.id);
  if(!amt||amt<=0) return res.status(400).json({error:'Invalid amount'});
  if(user.balance<amt) return res.status(400).json({error:'Insufficient balance'});
  user.balance-=amt;
  transactions.push({id:uuidv4(),userId:user.id,type:'WITHDRAW',amount:-amt,details:'To MoMo '+req.body.number,date:new Date()});
  res.json({message:'Withdrawal GHS '+amt.toFixed(2)+' to '+req.body.number+' queued',balance:user.balance});
});
app.listen(PORT, ()=>console.log('Wallet running on '+PORT));
