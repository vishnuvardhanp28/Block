# 🚀 Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
copy .env.example .env
```
Edit `.env` with your values (or skip for local testing).

### 3. Compile Smart Contract
```bash
npm run compile
```

### 4. Run Tests (Verify Everything Works)
```bash
npm test
```

✅ You should see all tests passing!

---

## Local Development (Recommended for Testing)

### 1. Start Local Blockchain
```bash
npm run node
```
Leave this terminal running.

### 2. Deploy Contract (New Terminal)
```bash
npm run deploy:local
```

Copy the contract address from the output.

### 3. Configure Frontend
The deployment script automatically updates `public/CertificateRegistry.json`.

Ensure `public/config.js` has:
```javascript
EXPECTED_NETWORK: "LOCALHOST"
```

### 4. Start Frontend
```bash
cd public
python -m http.server 8000
```
Or use VS Code Live Server.

### 5. Configure MetaMask
- Network: Localhost 8545
- RPC: http://127.0.0.1:8545
- Chain ID: 31337
- Import one of the test accounts from Hardhat output

### 6. Test the DApp!
1. Open http://localhost:8000
2. Connect wallet
3. Issue a test certificate
4. Verify it
5. Try revoking it

---

## Deploy to Sepolia (Free Testnet)

### 1. Get Free Test ETH
- Visit https://sepoliafaucet.com/
- Enter your wallet address
- Get free test ETH

### 2. Get Free RPC URL
- Sign up at https://www.alchemy.com/ (free)
- Create a new app (Sepolia network)
- Copy the RPC URL

### 3. Update .env
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_metamask_private_key
```

⚠️ **NEVER commit the .env file!**

### 4. Deploy to Sepolia
```bash
npm run deploy:sepolia
```

Save the contract address!

### 5. Update Frontend Config
In `public/config.js`:
```javascript
CONTRACT_ADDRESS: "0xYourContractAddress", // from deployment
EXPECTED_NETWORK: "SEPOLIA"
```

### 6. Deploy to Vercel (Free Hosting)
```bash
git add .
git commit -m "Deploy to Sepolia"
git push origin main
```

Then:
1. Go to https://vercel.com/
2. Import your GitHub repo
3. Deploy!

Your DApp is now live! 🎉

---

## Common Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Clean artifacts
npm run clean

# Deploy to local network
npm run deploy:local

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

---

## Troubleshooting

**"Contract not initialized"**
→ Make sure contract is deployed and address is in `config.js`

**"Wrong Network"**
→ Switch MetaMask to the correct network (Localhost or Sepolia)

**"Not an authorized issuer"**
→ Use the account that deployed the contract (automatically authorized)

**"Insufficient funds"**
→ Get free test ETH from faucets (Sepolia) or use Hardhat accounts (localhost)

---

## What's Next?

✅ Test locally
✅ Deploy to Sepolia
✅ Host on Vercel
✅ Share with friends!

For detailed docs, see [README.md](README.md)
