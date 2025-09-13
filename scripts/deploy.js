import hre from "hardhat";

async function main() {
    console.log("Starting deployment to 0G Testnet...");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "OG");

    if (balance < hre.ethers.parseEther("0.1")) {
        console.error("Insufficient balance! Need at least 0.1 OG for deployment.");
        console.error("Get testnet tokens from: https://faucet.0g.ai");
        process.exit(1);
    }

    // For now, use deployer as oracle (in production, use proper oracle)
    const oracleAddress = deployer.address;

    console.log("Deploying AIGirlfriendINFT contract...");

    // Deploy the contract
    const AIGirlfriendINFT = await hre.ethers.getContractFactory("AIGirlfriendINFT");
    const contract = await AIGirlfriendINFT.deploy(deployer.address, oracleAddress);

    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ AIGirlfriendINFT deployed to:", contractAddress);
    console.log("📝 Contract owner:", deployer.address);
    console.log("🔮 Oracle address:", oracleAddress);
    console.log("🌐 Network: 0G Testnet (Chain ID: 16601)");
    console.log("🔍 Explorer:", `https://chainscan-galileo.0g.ai/address/${contractAddress}`);

    // Verify contract constants
    const mintPrice = await contract.MINT_PRICE();
    const chatPrice = await contract.CHAT_PRICE();

    console.log("\n📊 Contract Configuration:");
    console.log("- Mint Price:", hre.ethers.formatEther(mintPrice), "OG");
    console.log("- Chat Price:", hre.ethers.formatEther(chatPrice), "OG");

    // Save deployment info
    const deploymentInfo = {
        network: "0g-testnet",
        chainId: 16601,
        contractAddress: contractAddress,
        deployer: deployer.address,
        oracle: oracleAddress,
        mintPrice: hre.ethers.formatEther(mintPrice),
        chatPrice: hre.ethers.formatEther(chatPrice),
        deploymentTime: new Date().toISOString(),
        explorer: `https://chainscan-galileo.0g.ai/address/${contractAddress}`
    };

    console.log("\n💾 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Instructions for frontend integration
    console.log("\n🔧 Frontend Integration:");
    console.log("1. Update frontend contract address to:", contractAddress);
    console.log("2. Use network RPC: https://evmrpc-testnet.0g.ai");
    console.log("3. Chain ID: 16601");
    console.log("4. Get testnet OG from: https://faucet.0g.ai");

    console.log("\n✨ Deployment completed successfully!");
}

main().catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});