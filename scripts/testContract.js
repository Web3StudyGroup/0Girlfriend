import hre from "hardhat";

async function main() {
    console.log("Testing AIGirlfriendNFT contract...");

    // Contract address from local deployment
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    try {
        const AIGirlfriendNFT = await hre.ethers.getContractFactory("AIGirlfriendNFT");
        const contract = AIGirlfriendNFT.attach(contractAddress);

        console.log("✅ Connected to contract:", contractAddress);

        // Check contract constants
        const mintPrice = await contract.MINT_PRICE();
        const chatPrice = await contract.CHAT_PRICE();
        console.log("💰 Mint Price:", hre.ethers.formatEther(mintPrice), "OG");
        console.log("💬 Chat Price:", hre.ethers.formatEther(chatPrice), "OG");

        // Get all public girlfriends
        console.log("\n🔍 Checking for minted girlfriends...");
        const publicGirlfriends = await contract.getAllPublicGirlfriends();

        console.log("📊 Total public girlfriends:", publicGirlfriends.length);

        if (publicGirlfriends.length === 0) {
            console.log("❌ No girlfriends found!");
            console.log("The contract is empty - no NFTs have been minted yet.");
        } else {
            console.log("✅ Found girlfriends! Token IDs:", publicGirlfriends.map(id => id.toString()));

            // Get details for each
            for (const tokenId of publicGirlfriends) {
                console.log(`\n👩 Girlfriend #${tokenId}:`);
                const details = await contract.getGirlfriendDetails(tokenId);
                console.log("  Name:", details.name);
                console.log("  Creator:", details.creator);
                console.log("  Image Hash:", details.imageHash);
                console.log("  Total Chats:", details.totalChats.toString());
                console.log("  Created:", new Date(Number(details.createdAt) * 1000).toLocaleString());

                // Try to get owner
                const owner = await contract.ownerOf(tokenId);
                console.log("  Owner:", owner);
            }
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.message.includes("call revert exception")) {
            console.log("Contract might not be deployed or address is incorrect");
        }
    }
}

main().catch(console.error);