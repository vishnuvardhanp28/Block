// Certificate Verification DApp - Main Application Logic

let provider;
let signer;
let contract;
let contractABI;
let currentAccount = null;
let isAuthorizedIssuer = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    checkMetaMask();
    await loadContractABI();
});

// Check if MetaMask is installed
function checkMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        showToast('Please install MetaMask to use this application', 'error');
        showWalletNotice(true);
        return false;
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());

    return true;
}

// Load contract ABI from JSON file
async function loadContractABI() {
    try {
        const response = await fetch('CertificateRegistry.json');
        if (response.ok) {
            const data = await response.json();
            contractABI = data.abi;

            // Update contract address if provided in the JSON
            if (data.address && data.address !== ethers.ZeroAddress) {
                CONFIG.CONTRACT_ADDRESS = data.address;
            }
        } else {
            console.warn('Contract ABI file not found. Please deploy the contract first.');
        }
    } catch (error) {
        console.error('Error loading contract ABI:', error);
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Connect wallet button
    document.getElementById('connectWallet').addEventListener('click', connectWallet);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Forms
    document.getElementById('issueForm').addEventListener('submit', handleIssueCertificate);
    document.getElementById('verifyForm').addEventListener('submit', handleVerifyCertificate);
    document.getElementById('revokeForm').addEventListener('submit', handleRevokeCertificate);

    // Close results button
    document.getElementById('closeResults').addEventListener('click', () => {
        document.getElementById('resultsContainer').style.display = 'none';
    });
}

// Connect to MetaMask wallet
async function connectWallet() {
    if (!checkMetaMask()) return;

    try {
        showLoading('Connecting to MetaMask...');

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        hideLoading();

        if (accounts.length === 0) {
            showToast('No accounts found. Please check MetaMask.', 'error');
            return;
        }

        currentAccount = accounts[0];

        // Setup ethers.js provider and signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();

        // Initialize contract instance
        if (contractABI && CONFIG.CONTRACT_ADDRESS !== ethers.ZeroAddress) {
            contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, contractABI, signer);

            // Check if user is an authorized issuer
            await checkIssuerStatus();
        }

        // Update UI
        updateAccountUI();
        showWalletNotice(false);

        // Check network
        await checkNetwork();

        showToast('Wallet connected successfully!', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error connecting wallet:', error);
        showToast(`Connection failed: ${error.message}`, 'error');
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        currentAccount = null;
        isAuthorizedIssuer = false;
        updateAccountUI();
        showWalletNotice(true);
    } else {
        currentAccount = accounts[0];
        connectWallet();
    }
}

// Check if user is an authorized issuer
async function checkIssuerStatus() {
    try {
        isAuthorizedIssuer = await contract.authorizedIssuer(currentAccount);
    } catch (error) {
        console.error('Error checking issuer status:', error);
        isAuthorizedIssuer = false;
    }
}

// Update UI with account information
function updateAccountUI() {
    const connectBtn = document.getElementById('connectWallet');
    const accountInfo = document.getElementById('accountInfo');
    const accountAddress = document.getElementById('accountAddress');
    const accountBadge = document.getElementById('accountBadge');

    if (currentAccount) {
        connectBtn.textContent = `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        accountAddress.textContent = currentAccount;
        accountInfo.style.display = 'block';

        // Update badge
        if (isAuthorizedIssuer) {
            accountBadge.textContent = 'Authorized Issuer';
            accountBadge.className = 'badge badge-issuer';
        } else {
            accountBadge.textContent = 'User';
            accountBadge.className = 'badge badge-user';
        }
    } else {
        accountInfo.style.display = 'none';
    }
}

// Check if connected to correct network
async function checkNetwork() {
    try {
        const network = await provider.getNetwork();
        const networkInfo = document.getElementById('networkInfo');
        const expectedChainId = CONFIG.NETWORKS[CONFIG.EXPECTED_NETWORK].chainId;

        if (`0x${network.chainId.toString(16)}` === expectedChainId) {
            networkInfo.textContent = `✓ ${CONFIG.NETWORKS[CONFIG.EXPECTED_NETWORK].chainName}`;
            networkInfo.style.color = 'var(--success)';
        } else {
            networkInfo.textContent = `⚠ Wrong Network`;
            networkInfo.style.color = 'var(--warning)';
            showToast(`Please switch to ${CONFIG.NETWORKS[CONFIG.EXPECTED_NETWORK].chainName}`, 'error');
        }
    } catch (error) {
        console.error('Error checking network:', error);
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}Panel`).classList.add('active');
}

// Show/hide wallet connection notice
function showWalletNotice(show) {
    document.getElementById('walletNotice').style.display = show ? 'flex' : 'none';
}

// Compute certificate ID (must match Solidity computation)
function computeCertId(issuer, recipient, recipientName, course, issuedOn) {
    // Create a simple hash using the same parameters as in Solidity
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "string", "string", "uint256"],
        [issuer, recipient, recipientName, course, issuedOn]
    );
    return ethers.keccak256(encoded);
}

// Handle certificate issuance
async function handleIssueCertificate(e) {
    e.preventDefault();

    if (!currentAccount) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    if (!contract) {
        showToast('Contract not initialized. Please check deployment.', 'error');
        return;
    }

    if (!isAuthorizedIssuer) {
        showToast('You are not an authorized issuer', 'error');
        return;
    }

    try {
        // Get form data
        const recipientAddress = document.getElementById('recipientAddress').value.trim() || ethers.ZeroAddress;
        const recipientName = document.getElementById('recipientName').value.trim();
        const course = document.getElementById('course').value.trim();
        const grade = document.getElementById('grade').value.trim();
        const ipfsCID = document.getElementById('ipfsCID').value.trim() || '';

        // Validate
        if (!recipientName || !course || !grade) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Current timestamp
        const issuedOn = Math.floor(Date.now() / 1000);

        // Compute certificate ID
        const certId = computeCertId(currentAccount, recipientAddress, recipientName, course, issuedOn);

        showLoading('Issuing certificate... Please confirm transaction in MetaMask');

        // Call smart contract
        const tx = await contract.issueCertificate(
            certId,
            recipientAddress,
            recipientName,
            course,
            grade,
            issuedOn,
            ipfsCID
        );

        showLoading('Transaction submitted. Waiting for confirmation...');
        const receipt = await tx.wait();

        hideLoading();

        // Show success message with certificate ID
        displayIssuanceSuccess(certId, receipt);

        // Reset form
        document.getElementById('issueForm').reset();

        showToast('Certificate issued successfully!', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error issuing certificate:', error);

        let errorMsg = 'Failed to issue certificate';
        if (error.message.includes('user rejected')) {
            errorMsg = 'Transaction rejected by user';
        } else if (error.message.includes('already exists')) {
            errorMsg = 'Certificate already exists';
        }

        showToast(errorMsg, 'error');
    }
}

// Display issuance success
function displayIssuanceSuccess(certId, receipt) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsContent = document.getElementById('resultsContent');

    resultsContent.innerHTML = `
        <div class="cert-status cert-status-valid">
            ✓ Certificate Issued Successfully
        </div>
        <div class="cert-detail">
            <div class="cert-detail-label">Certificate ID</div>
            <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${certId}</div>
        </div>
        <div class="cert-detail">
            <div class="cert-detail-label">Transaction Hash</div>
            <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${receipt.hash}</div>
        </div>
        <div class="cert-detail">
            <div class="cert-detail-label">Block Number</div>
            <div class="cert-detail-value">${receipt.blockNumber}</div>
        </div>
        <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
            Save the Certificate ID above. You'll need it to verify the certificate.
        </p>
    `;

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Handle certificate verification
async function handleVerifyCertificate(e) {
    e.preventDefault();

    if (!contract) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    try {
        const certId = document.getElementById('certIdVerify').value.trim();

        // Validate cert ID format
        if (!certId.startsWith('0x') || certId.length !== 66) {
            showToast('Invalid certificate ID format', 'error');
            return;
        }

        showLoading('Verifying certificate...');

        // Check if certificate exists
        const exists = await contract.certificateExists(certId);

        if (!exists) {
            hideLoading();
            displayVerificationResult(null, false);
            return;
        }

        // Get certificate details
        const cert = await contract.getCertificate(certId);

        hideLoading();

        // Display results
        displayVerificationResult({
            certId: cert[0],
            issuer: cert[1],
            recipient: cert[2],
            recipientName: cert[3],
            course: cert[4],
            grade: cert[5],
            issuedOn: cert[6],
            ipfsCID: cert[7],
            revoked: cert[8]
        }, true);

    } catch (error) {
        hideLoading();
        console.error('Error verifying certificate:', error);
        showToast('Verification failed. Please check the certificate ID.', 'error');
    }
}

// Display verification result
function displayVerificationResult(cert, exists) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsContent = document.getElementById('resultsContent');

    if (!exists) {
        resultsContent.innerHTML = `
            <div class="cert-status cert-status-revoked">
                ✕ Certificate Not Found
            </div>
            <p style="margin-top: 1rem; color: var(--text-secondary); text-align: center;">
                This certificate does not exist in the blockchain registry.
            </p>
        `;
    } else {
        const statusClass = cert.revoked ? 'cert-status-revoked' : 'cert-status-valid';
        const statusText = cert.revoked ? '⚠ Certificate Revoked' : '✓ Certificate Valid';
        const date = new Date(Number(cert.issuedOn) * 1000).toLocaleDateString();

        resultsContent.innerHTML = `
            <div class="cert-status ${statusClass}">
                ${statusText}
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Certificate ID</div>
                <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${cert.certId}</div>
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Recipient Name</div>
                <div class="cert-detail-value">${cert.recipientName}</div>
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Course</div>
                <div class="cert-detail-value">${cert.course}</div>
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Grade</div>
                <div class="cert-detail-value">${cert.grade}</div>
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Issued On</div>
                <div class="cert-detail-value">${date}</div>
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Issued By</div>
                <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${cert.issuer}</div>
            </div>
            ${cert.recipient !== ethers.ZeroAddress ? `
            <div class="cert-detail">
                <div class="cert-detail-label">Recipient Address</div>
                <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${cert.recipient}</div>
            </div>
            ` : ''}
            ${cert.ipfsCID ? `
            <div class="cert-detail">
                <div class="cert-detail-label">IPFS CID</div>
                <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${cert.ipfsCID}</div>
            </div>
            ` : ''}
        `;
    }

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Handle certificate revocation
async function handleRevokeCertificate(e) {
    e.preventDefault();

    if (!currentAccount) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    if (!contract) {
        showToast('Contract not initialized', 'error');
        return;
    }

    try {
        const certId = document.getElementById('certIdRevoke').value.trim();

        // Validate
        if (!certId.startsWith('0x') || certId.length !== 66) {
            showToast('Invalid certificate ID format', 'error');
            return;
        }

        // Confirm action
        if (!confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
            return;
        }

        showLoading('Revoking certificate... Please confirm transaction in MetaMask');

        // Call contract
        const tx = await contract.revokeCertificate(certId);

        showLoading('Transaction submitted. Waiting for confirmation...');
        const receipt = await tx.wait();

        hideLoading();

        // Show success
        const resultsContainer = document.getElementById('resultsContainer');
        const resultsContent = document.getElementById('resultsContent');

        resultsContent.innerHTML = `
            <div class="cert-status cert-status-revoked">
                ✓ Certificate Revoked Successfully
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Certificate ID</div>
                <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${certId}</div>
            </div>
            <div class="cert-detail">
                <div class="cert-detail-label">Transaction Hash</div>
                <div class="cert-detail-value" style="font-family: monospace; word-break: break-all;">${receipt.hash}</div>
            </div>
            <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">
                This certificate has been permanently revoked and is no longer valid.
            </p>
        `;

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Reset form
        document.getElementById('revokeForm').reset();

        showToast('Certificate revoked successfully', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error revoking certificate:', error);

        let errorMsg = 'Failed to revoke certificate';
        if (error.message.includes('user rejected')) {
            errorMsg = 'Transaction rejected by user';
        } else if (error.message.includes('Not authorized')) {
            errorMsg = 'You are not authorized to revoke this certificate';
        } else if (error.message.includes('already revoked')) {
            errorMsg = 'Certificate is already revoked';
        } else if (error.message.includes('does not exist')) {
            errorMsg = 'Certificate does not exist';
        }

        showToast(errorMsg, 'error');
    }
}

// Show loading overlay
function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    messageEl.textContent = message;
    overlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}
