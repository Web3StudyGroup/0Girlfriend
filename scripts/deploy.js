const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("开始部署 AI Girlfriend INFT 合约...");

  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "OG");

  // 暂时使用部署者地址作为 oracle 地址，实际项目中需要部署专门的 oracle
  const oracleAddress = deployer.address;

  console.log("部署 AIGirlfriendINFT 合约...");
  const AIGirlfriendINFT = await ethers.getContractFactory("AIGirlfriendINFT");
  const aiGirlfriendNFT = await AIGirlfriendINFT.deploy(deployer.address, oracleAddress);

  await aiGirlfriendNFT.waitForDeployment();
  const contractAddress = await aiGirlfriendNFT.getAddress();

  console.log("✅ AIGirlfriendINFT 部署成功!");
  console.log("合约地址:", contractAddress);
  console.log("Oracle 地址:", oracleAddress);
  console.log("所有者地址:", deployer.address);

  // 验证合约配置
  const mintPrice = await aiGirlfriendNFT.MINT_PRICE();
  const chatPrice = await aiGirlfriendNFT.CHAT_PRICE();

  console.log("\n📋 合约配置信息:");
  console.log("铸造价格:", ethers.formatEther(mintPrice), "OG");
  console.log("聊天价格:", ethers.formatEther(chatPrice), "OG");

  console.log("\n🚀 部署完成! 请更新前端代码中的合约地址:");
  console.log(`const AI_GIRLFRIEND_CONTRACT = '${contractAddress}';`);

  // 保存部署信息到文件
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    oracleAddress: oracleAddress,
    deployer: deployer.address,
    mintPrice: ethers.formatEther(mintPrice),
    chatPrice: ethers.formatEther(chatPrice),
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    'front/src/lib/contract-addresses.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("✅ 合约地址信息已保存到 front/src/lib/contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });