const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🚀 Starting deployment process...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    // Get account balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy CertificateRegistry contract
    console.log("📜 Deploying CertificateRegistry contract...");
    const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
    const certificateRegistry = await CertificateRegistry.deploy();

    await certificateRegistry.waitForDeployment();
    const contractAddress = await certificateRegistry.getAddress();

    console.log("✅ CertificateRegistry deployed to:", contractAddress);
    console.log("🔗 Transaction hash:", certificateRegistry.deploymentTransaction().hash);

    // Get network information
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")\n");

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        chainId: Number(network.chainId),
        contractAddress: contractAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: certificateRegistry.deploymentTransaction().blockNumber,
        transactionHash: certificateRegistry.deploymentTransaction().hash,
    };

    const deploymentDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(
        deploymentDir,
        `${network.name}-deployment.json`
    );
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentFile);

    // Save contract ABI for frontend
    const artifactPath = path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "CertificateRegistry.sol",
        "CertificateRegistry.json"
    );

    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abiFile = path.join(__dirname, "..", "public", "CertificateRegistry.json");

        // Create public directory if it doesn't exist
        const publicDir = path.join(__dirname, "..", "public");
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(
            abiFile,
            JSON.stringify({ abi: artifact.abi, address: contractAddress }, null, 2)
        );
        console.log("💾 Contract ABI saved to:", abiFile);
    }

    console.log("\n✨ Deployment complete!\n");
    console.log("📋 Next steps:");
    console.log("1. Update public/config.js with the contract address:", contractAddress);
    console.log("2. If deployed to testnet, verify the contract (optional):");
    console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);
    console.log("3. Start the frontend and test the DApp\n");

    // Wait for block confirmations (if on testnet)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("⏳ Waiting for 5 block confirmations...");
        await certificateRegistry.deploymentTransaction().wait(5);
        console.log("✅ 5 confirmations received\n");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
