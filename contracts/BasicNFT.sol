// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity ^0.8.8;

contract BasicNFT is ERC721 {
	string public constant TOKEN_URI =
		"ipfs://QmS9GESkGGd75VMwEaA7GKacFzrzKHgqhhHGzC5iV8MG8e?filename=dog17.jpg";

	uint256 private s_tokenCounter;

	constructor() ERC721("Doggy", "DOG") {
		s_tokenCounter = 0;
	}

	function mintNFT() public returns (uint256) {
		_safeMint(msg.sender, s_tokenCounter);
		s_tokenCounter += 1;

		return s_tokenCounter;
	}

	function tokenURI(
		uint256 /* tokenId */
	) public pure override returns (string memory) {
		return TOKEN_URI;
	}

	function getTokenCounter() public view returns (uint256) {
		return s_tokenCounter;
	}
}
