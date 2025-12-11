# 🎓 Certificate Verification System

A blockchain-based decentralized application (DApp) for issuing, verifying, and managing tamper-proof certificates on the Ethereum blockchain.

![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- **🔐 Tamper-Proof Certificates**: Certificates stored immutably on the blockchain
- **✅ Easy Verification**: Anyone can verify certificate authenticity instantly
- **👥 Access Control**: Role-based authorization for certificate issuers
- **🚫 Revocation Support**: Ability to revoke certificates when needed
- **🎨 Modern UI**: Beautiful, responsive web interface with dark mode
- **🦊 MetaMask Integration**: Seamless wallet connection
- **💰 Free Deployment**: Works on free Ethereum testnets (Sepolia)
- **🌐 Vercel Ready**: Deployable to Vercel for free

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Running the Frontend](#running-the-frontend)
- [Testing](#testing)
- [Deployment to Vercel](#deployment-to-vercel)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Free Resources](#free-resources)
- [Troubleshooting](#troubleshooting)

## 🏗 Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (MetaMask UI)  │
└────────┬────────┘
         │
         │ ethers.js
         ▼
┌─────────────────────────┐
│   Frontend (HTML/CSS/JS) │
│   - Issue Certificates   │
│   - Verify Certificates  │
│   - MetaMask Integration │
└────────┬────────────────┘
         │
         │ Web3 Provider
         ▼
┌──────────────────────────┐
│  Ethereum Network        │
│  (Sepolia Testnet)       │
│                          │
│  ┌────────────────────┐ │
│  │ CertificateRegistry│ │
│  │  Smart Contract    │ │
│  └────────────────────┘ │
└──────────────────────────┘
```

### Components

1. **Smart Contract** (`CertificateRegistry.sol`): Manages certificate lifecycle
2. **Frontend** (`public/`): User interface for interaction
3. **Hardhat**: Development environment for testing and deployment

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/)

## 🚀 Installation

1. **Clone or navigate to the repository**:
   ```bash
   cd c:\Users\vishn\Desktop\V
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and add your values:
   - Get free Sepolia RPC URL from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
   - Export your MetaMask private key (Account Details → Export Private Key)
   - **⚠️ NEVER commit the `.env` file to GitHub!**

## 📝 Smart Contract Deployment

### Option 1: Deploy to Local Hardhat Network (Recommended for Testing)

1. **Start local blockchain**:
   ```bash
   npm run node
   ```
   Keep this terminal running.

2. **In a new terminal, compile and deploy**:
   ```bash
   npm run compile
   npm run deploy:local
   ```

3. **Configure MetaMask for localhost**:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

4. **Import a test account** from Hardhat output into MetaMask

### Option 2: Deploy to Sepolia Testnet (FREE!)

1. **Get free Sepolia ETH**:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

2. **Update `.env`** with your Sepolia RPC URL and private key

3. **Update `public/config.js`**:
   ```javascript
   EXPECTED_NETWORK: "SEPOLIA"
   ```

4. **Deploy to Sepolia**:
   ```bash
   npm run deploy:sepolia
   ```

5. **Contract address** will be saved in `deployments/sepolia-deployment.json` and `public/CertificateRegistry.json`

## 🖥 Running the Frontend

### Development Server

You can use any static file server. Here are a few options:

**Option 1: Using Python** (if installed):
```bash
cd public
python -m http.server 8000
```
Visit: http://localhost:8000

**Option 2: Using Node.js http-server**:
```bash
npx http-server public -p 8080
```
Visit: http://localhost:8080

**Option 3: Using VS Code Live Server**:
- Install "Live Server" extension in VS Code
- Right-click `public/index.html` → Open with Live Server

### Connect MetaMask

1. Click "Connect Wallet" button
2. Approve connection in MetaMask
3. Ensure you're on the correct network (localhost or Sepolia)

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run with gas reporting
npm run test

# Generate coverage report
npm run test:coverage
```

The test suite includes 25+ test cases covering:
- ✅ Contract deployment
- ✅ Issuer management
- ✅ Certificate issuance (valid & invalid)
- ✅ Duplicate prevention
- ✅ Certificate verification
- ✅ Revocation (authorized & unauthorized)
- ✅ Access control

## 🌐 Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Certificate Verification System"
git branch -M main
git remote add origin https://github.com/vishnuvardhanp28/Block.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "Import Project"
3. Import your GitHub repository
4. Vercel will auto-detect settings
5. Click "Deploy"

**That's it!** Your DApp frontend is now live (100% FREE)

⚠️ **Important**: After deployment, ensure:
- Smart contract is deployed to Sepolia testnet
- `public/config.js` has correct `CONTRACT_ADDRESS`
- `EXPECTED_NETWORK` is set to `"SEPOLIA"`

## 📖 Usage Guide

### For Certificate Issuers

1. **Connect Wallet**: Must be an authorized issuer
2. **Navigate to "Issue Certificate" tab**
3. **Fill in the form**:
   - Recipient Address (optional)
   - Recipient Name (required)
   - Course/Program (required)
   - Grade/Score (required)
   - IPFS CID (optional - for PDF storage)
4. **Click "Issue Certificate"**
5. **Confirm transaction** in MetaMask
6. **Save the Certificate ID** shown in the results

### For Certificate Verifiers

1. **Navigate to "Verify Certificate" tab**
2. **Enter Certificate ID**
3. **Click "Verify Certificate"**
4. **View certificate details**:
   - ✅ Green badge = Valid certificate
   - ⚠️ Red badge = Revoked certificate
   - ✕ Not found = Invalid/non-existent

### Revoking Certificates

1. **Navigate to "Revoke Certificate" tab**
2. **Enter Certificate ID**
3. **Click "Revoke Certificate"**
4. **Confirm** the action (permanent!)
5. Certificate is now marked as revoked

## 📁 Project Structure

```
Block/
├── contracts/
│   └── CertificateRegistry.sol    # Smart contract
├── scripts/
│   └── deploy.js                  # Deployment script
├── test/
│   └── CertificateRegistry.test.js # Test suite
├── public/
│   ├── index.html                 # Main HTML
│   ├── styles.css                 # Styling
│   ├── app.js                     # Frontend logic
│   ├── config.js                  # Configuration
│   └── CertificateRegistry.json   # ABI (auto-generated)
├── deployments/                   # Deployment records
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Dependencies
├── vercel.json                    # Vercel config
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## 💰 Free Resources

Everything in this project can be used **100% FREE**:

### Blockchain Testnets (Free)
- **Sepolia Testnet**: Free test ETH from faucets
- **Hardhat Network**: Free local blockchain

### RPC Providers (Free Tier)
- [Alchemy](https://www.alchemy.com/): 300M requests/month free
- [Infura](https://infura.io/): 100k requests/day free

### Hosting (Free)
- [Vercel](https://vercel.com/): Unlimited free deployments
- [GitHub Pages](https://pages.github.com/): Free static hosting

### Test ETH Faucets (Free)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)

## 🛠 Troubleshooting

### MetaMask Issues

**Problem**: "Wrong Network" warning
- **Solution**: Switch MetaMask to the correct network (Sepolia or Localhost)

**Problem**: Transactions fail with "insufficient funds"
- **Solution**: Get free test ETH from faucets (for Sepolia) or use Hardhat accounts (for localhost)

### Contract Issues

**Problem**: "Contract not initialized"
- **Solution**: 
  1. Ensure contract is deployed
  2. Check `public/config.js` has correct `CONTRACT_ADDRESS`
  3. Verify `public/CertificateRegistry.json` exists

**Problem**: "Not an authorized issuer"
- **Solution**: 
  1. Contract deployer is automatically an authorized issuer
  2. Owner can add other issuers using `addIssuer()` function
  3. Use the deployer account to issue certificates

### Frontend Issues

**Problem**: "Please install MetaMask"
- **Solution**: Install [MetaMask extension](https://metamask.io/)

**Problem**: UI not loading
- **Solution**: 
  1. Check browser console for errors
  2. Ensure you're serving from the `public/` directory
  3. Verify all files are present

## 🔐 Security Notes

- **Never commit `.env` file** - contains private keys
- **Never share your private key** - it controls your wallet
- **Use testnets for development** - real ETH on mainnet costs money
- **Verify contracts on Etherscan** - for transparency (optional)

## 📄 Smart Contract API

### Write Functions (Requires Gas)

- `issueCertificate()`: Issue new certificate (issuers only)
- `revokeCertificate()`: Revoke certificate (issuer/owner only)
- `addIssuer()`: Add authorized issuer (owner only)
- `removeIssuer()`: Remove issuer (owner only)

### Read Functions (Free)

- `getCertificate()`: Get full certificate details
- `certificateExists()`: Check if certificate exists
- `isRevoked()`: Check revocation status
- `authorizedIssuer()`: Check if address is authorized
- `getIssuer()`: Get certificate issuer

## 🎯 Future Enhancements

- [ ] IPFS integration for PDF storage
- [ ] Batch certificate issuance
- [ ] QR code generation for certificates
- [ ] Multi-signature authorization
- [ ] Certificate templates
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 📜 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Vishnu Vardhan P**
- GitHub: [@vishnuvardhanp28](https://github.com/vishnuvardhanp28)

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Ethereum community for development tools
- Hardhat team for excellent testing framework

---

**Built with ❤️ using Ethereum, Solidity, and Web3**

For questions or issues, please open an issue on GitHub.
