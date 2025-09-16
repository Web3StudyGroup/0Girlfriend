// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Simple ERC721 NFT for AI Girlfriend
contract AIGirlfriendNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId = 1;
    uint256 public constant MINT_PRICE = 0.01 ether; // 0.01 $OG
    uint256 public constant CHAT_PRICE = 0.01 ether; // 0.01 $OG per chat session

    // Simple NFT data structure for AI Girlfriend
    struct AIGirlfriend {
        string name;
        string personality; // Plain text personality description
        string imageHash; // 0G Storage hash for profile image
        address creator;
        uint256 createdAt;
        uint256 totalChats;
        bool isPublic; // Whether others can chat with this AI girlfriend
    }

    mapping(uint256 => AIGirlfriend) public girlfriends;
    mapping(uint256 => mapping(address => uint256)) public chatSessions; // tokenId => user => chat count
    mapping(address => uint256[]) public userCreatedGirlfriends;

    event AIGirlfriendMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        string personality,
        string imageHash
    );

    event ChatSessionStarted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 sessionCount
    );

    constructor(address initialOwner)
        ERC721("AI Girlfriend NFT", "AIGF")
        Ownable(initialOwner)
    {}

    // Simple NFT mint function
    function mintGirlfriend(
        string memory name,
        string memory personality,
        string memory imageHash,
        bool isPublic
    ) external payable nonReentrant {
        require(msg.value >= MINT_PRICE, "Insufficient payment for minting");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(personality).length > 0, "Personality cannot be empty");
        require(bytes(imageHash).length > 0, "Image hash cannot be empty");

        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        girlfriends[tokenId] = AIGirlfriend({
            name: name,
            personality: personality,
            imageHash: imageHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            totalChats: 0,
            isPublic: isPublic
        });

        userCreatedGirlfriends[msg.sender].push(tokenId);

        emit AIGirlfriendMinted(
            tokenId,
            msg.sender,
            name,
            personality,
            imageHash
        );
    }

    function startChatSession(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "AI Girlfriend does not exist");
        require(msg.value >= CHAT_PRICE, "Insufficient payment for chat");

        AIGirlfriend storage girlfriend = girlfriends[tokenId];
        address nftOwner = ownerOf(tokenId);

        // Allow owner to chat for free, others need to pay and girlfriend must be public
        if (msg.sender != nftOwner) {
            require(girlfriend.isPublic, "This AI girlfriend is private");
            // Pay 90% to owner, 10% to contract owner
            uint256 ownerShare = (msg.value * 90) / 100;
            uint256 platformShare = msg.value - ownerShare;

            payable(nftOwner).transfer(ownerShare);
            payable(owner()).transfer(platformShare);
        } else {
            // Refund owner since they chat for free
            payable(msg.sender).transfer(msg.value);
        }

        chatSessions[tokenId][msg.sender]++;
        girlfriend.totalChats++;

        emit ChatSessionStarted(tokenId, msg.sender, chatSessions[tokenId][msg.sender]);
    }

    function getAllPublicGirlfriends() external view returns (uint256[] memory) {
        uint256 totalSupply = _nextTokenId - 1;
        uint256[] memory temp = new uint256[](totalSupply);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_exists(i) && girlfriends[i].isPublic) {
                temp[count] = i;
                count++;
            }
        }

        uint256[] memory publicGirlfriends = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            publicGirlfriends[i] = temp[i];
        }

        return publicGirlfriends;
    }

    function getUserCreatedGirlfriends(address user) external view returns (uint256[] memory) {
        return userCreatedGirlfriends[user];
    }

    function getGirlfriendDetails(uint256 tokenId) external view returns (AIGirlfriend memory) {
        require(_exists(tokenId), "AI Girlfriend does not exist");
        return girlfriends[tokenId];
    }

    function getUserChatCount(uint256 tokenId, address user) external view returns (uint256) {
        return chatSessions[tokenId][user];
    }

    function setGirlfriendPublic(uint256 tokenId, bool isPublic) external {
        require(ownerOf(tokenId) == msg.sender, "Only owner can change publicity");
        girlfriends[tokenId].isPublic = isPublic;
    }


    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Override tokenURI to return public metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        AIGirlfriend memory gf = girlfriends[tokenId];

        // Return basic public metadata including personality
        return string(abi.encodePacked(
            '{"name":"', gf.name, '",',
            '"personality":"', gf.personality, '",',
            '"image":"', gf.imageHash, '",',
            '"creator":"', addressToString(gf.creator), '",',
            '"totalChats":', uintToString(gf.totalChats), ',',
            '"isPublic":', gf.isPublic ? "true" : "false", '}'
        ));
    }

    // Utility functions
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}