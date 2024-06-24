// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";

error TokenIdDoesNotExist();

/*
	When we mint an NFT, we will trigger Cahinlink VRF call to get us a random number
	Using that number we will ger a random NFT
	Pug/ Shina Inu/ St. Bernard
	Chance to get: 10% Rare/ 20% Sort of Rare/ 70% common
 */

// users have to pay to mint an NFT
// the owner og the contract can withdraw the ETH

contract DynamicSvgNFT is ERC721 {
	/* Token SVG is based on the ETH price */

	uint256 private s_tokenCounter;
	string private s_lowImageURI;
	string private s_highImageURI;
	string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
	AggregatorV3Interface internal immutable i_priceFeed;
	mapping(uint256 => int256) public s_tokenIdToHighValue; // high value to determine which svg to show

	event CreatedNFT(uint256 indexed tokenId, int256 highValue);

	constructor(
		address priceFeedAddress,
		string memory lowSVG,
		string memory highSVG
	) ERC721("Dynamic SVG NFT", "DSN") {
		s_tokenCounter = 0;
		s_lowImageURI = svgToImageURI(lowSVG);
		s_highImageURI = svgToImageURI(highSVG);
		i_priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

	function svgToImageURI(
		string memory svg
	) public pure returns (string memory) {
		string memory svgBase64Encoded = Base64.encode(
			bytes(string(abi.encodePacked(svg)))
		);
		return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
	}

	function mintNFT(int256 highPriceValue) public {
		s_tokenIdToHighValue[s_tokenCounter] = highPriceValue;
		_safeMint(msg.sender, s_tokenCounter);

		emit CreatedNFT(s_tokenCounter, highPriceValue);

		s_tokenCounter += 1;
	}

	function _baseURI() internal pure override returns (string memory) {
		return "data:application/json;base64,";
	}

	function tokenURI(
		uint256 tokenId
	) public view override returns (string memory) {
		if (!_exists(tokenId)) {
			revert TokenIdDoesNotExist();
		}

		string memory imageURI = s_lowImageURI;

		(, int256 price, , , ) = i_priceFeed.latestRoundData();

		if (price >= s_tokenIdToHighValue[tokenId]) {
			imageURI = s_highImageURI;
		}

		return
			// typecast to string
			string(
				// concat baseURI and base64 string contaning json
				abi.encodePacked(
					_baseURI(),
					// encode bytes to base64
					Base64.encode(
						// typecast to bytes
						bytes(
							// concat strings to prepare json
							abi.encodePacked(
								'{"name":"',
								name(),
								'", "description":"An NFT that changes based on ChainLink Feed", "attributes":[{"trait_type:"coolness","value":100}], "image":"',
								imageURI,
								'"}'
							)
						)
					)
				)
			);
	}

	function getLowSVG() public view returns (string memory) {
		return s_lowImageURI;
	}

	function getHighSVG() public view returns (string memory) {
		return s_highImageURI;
	}

	function getPriceFeed() public view returns (AggregatorV3Interface) {
		return i_priceFeed;
	}

	function getTokenCounter() public view returns (uint256) {
		return s_tokenCounter;
	}
}
