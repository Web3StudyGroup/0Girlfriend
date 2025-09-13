import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const AIGirlfriendINFT = await hre.ethers.getContractFactory("AIGirlfriendINFT");
  // Deploy with mock oracle address (in production, use real oracle)
  const aiGirlfriendINFT = await AIGirlfriendINFT.deploy(deployer.address, deployer.address);

  await aiGirlfriendINFT.waitForDeployment();

  console.log("AIGirlfriendINFT deployed to:", await aiGirlfriendINFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});