// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RangeOutOfBounds();
error MintFeeIsMoreThanProvided();
error TransferFailed();
error AlreadyInitialized();

/*
	When we mint an NFT, we will trigger Cahinlink VRF call to get us a random number
	Using that number we will ger a random NFT
	Pug/ Shina Inu/ St. Bernard
	Chance to get: 10% Rare/ 20% Sort of Rare/ 70% common
 */

// users have to pay to mint an NFT
// the owner og the contract can withdraw the ETH

contract RandomIpfsNFT is ERC721URIStorage, VRFConsumerBaseV2, Ownable {
	// Type declaration
	enum Breed {
		PUG,
		SHIBA_INU,
		ST_BERNARD
	}

	// Chainlink VRF variables
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	uint64 private immutable i_subscriptionId;
	bytes32 private immutable i_gasLane;
	uint32 private immutable i_callbackGasLimit;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint16 private constant NUM_WORDS = 1;

	// VRF Helpers
	mapping(uint256 => address) public s_requestIdToSender;

	// NFT variables
	uint256 private s_tokenCounter = 0;
	uint256 internal constant MAX_CHANCE_VALUE = 100;
	string[] private s_dogTokenURIs;
	uint256 private immutable i_mintFee;
	bool private s_initialized;

	// Events
	event NftRequested(uint256 indexed requestId, address requester);
	event NftMinted(Breed dogBreed, address minter);

	constructor(
		address vrfConsumerBaseV2,
		uint64 subscriptionId,
		bytes32 gasLane,
		uint32 callbackGasLimit,
		string[3] memory dogTokenURIs,
		uint256 mintFee
	) VRFConsumerBaseV2(vrfConsumerBaseV2) ERC721("Random_IPFS_NFT", "RIN") {
		i_vrfCoordinator = VRFCoordinatorV2Interface(vrfConsumerBaseV2);
		i_subscriptionId = subscriptionId;
		i_gasLane = gasLane;
		i_callbackGasLimit = callbackGasLimit;
		i_mintFee = mintFee;
		_initializeContract(dogTokenURIs);
	}

	function requestNFT() public payable returns (uint256 requestId) {
		if (msg.value < i_mintFee) {
			revert MintFeeIsMoreThanProvided();
		}

		requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane,
			i_subscriptionId,
			REQUEST_CONFIRMATIONS,
			i_callbackGasLimit,
			NUM_WORDS
		);

		s_requestIdToSender[requestId] = msg.sender;

		emit NftRequested(requestId, msg.sender);
	}

	function fulfillRandomWords(
		uint256 requestId,
		uint256[] memory randomWords
	) internal override {
		address nftOwner = s_requestIdToSender[requestId];
		uint256 newTokenId = s_tokenCounter++;

		// get NFT rareness
		uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE; // moddedRng will be from 0 to 99.

		Breed dogBreed = getBreedFromModdedRng(moddedRng);
		_safeMint(nftOwner, newTokenId);
		_setTokenURI(newTokenId, s_dogTokenURIs[uint256(dogBreed)]);

		emit NftMinted(dogBreed, nftOwner);
	}

	function getBreedFromModdedRng(
		uint256 moddedRng
	) public view returns (Breed) {
		uint256[3] memory chanceArray = getChanceArray();

		for (uint256 i = 0; i < chanceArray.length; i++) {
			if (moddedRng < chanceArray[i]) {
				return Breed(i);
			}
		}
		// if for some reson Breed is not chosen
		revert RangeOutOfBounds();
	}

	function withdraw() public onlyOwner {
		uint256 amount = address(this).balance;
		(bool success, ) = payable(msg.sender).call{value: amount}("");

		if (!success) {
			revert TransferFailed();
		}
	}

	function _initializeContract(string[3] memory dogTokenURIs) private {
		if (s_initialized) {
			revert AlreadyInitialized();
		}
		s_dogTokenURIs = dogTokenURIs;
		s_initialized = true;
	}

	function getChanceArray() public pure returns (uint256[3] memory) {
		return [10, 30, MAX_CHANCE_VALUE];
	}

	function getMintFee() public view returns (uint256) {
		return i_mintFee;
	}

	function getDogTokensURI(uint256 index) public view returns (string memory) {
		return s_dogTokenURIs[index];
	}

	function getInitialized() public view returns (bool) {
		return s_initialized;
	}

	function getTokenCounter() public view returns (uint256) {
		return s_tokenCounter;
	}
}
