// Configuration for Certificate Verification DApp
// Update CONTRACT_ADDRESS after deploying the contract

const CONFIG = {
    // Contract address - UPDATE THIS after deployment!
    CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000000",

    // Supported networks
    NETWORKS: {
        LOCALHOST: {
            chainId: "0x7a69", // 31337 in hex
            chainName: "Localhost 8545",
            rpcUrl: "http://127.0.0.1:8545"
        },
        SEPOLIA: {
            chainId: "0xaa36a7", // 11155111 in hex
            chainName: "Sepolia Test Network",
            rpcUrl: "https://sepolia.infura.io/v3/",
            blockExplorer: "https://sepolia.etherscan.io"
        }
    },

    // Expected network (change based on deployment)
    EXPECTED_NETWORK: "SEPOLIA" // Changed to SEPOLIA for Vercel deployment
};

// Contract ABI will be loaded from CertificateRegistry.json
// This file is auto-generated when you run the deployment script
