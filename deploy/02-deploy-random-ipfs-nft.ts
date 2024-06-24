import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
	VERIFICATION_BLOCK_CONFIRMATIONS,
	developmentChains,
	networkConfig,
} from "../helper-hardhat-config";
import { verify } from "../utils/verify";
import { storeImages, storeTokenURIMetadata } from "../utils/uploadToPenata";
import { NFTMetadata } from "../interfaces/metadata.interface";

const imagesLocation = "./images/randomNft";
const FUND_AMOUNT = "1000000000000000000000"; // 10 LINK

const deployRandomIPFSNFT = async (hre: HardhatRuntimeEnvironment) => {
	const { getNamedAccounts, deployments, network } = hre;
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;
	let tokenURIs: string[] = [];

	if (process.env.UPLOAD_TO_PENATA === "true") {
		tokenURIs = await handleTokenURIs();
	}

	let VRFCoordinatorV2Address;
	let subscriptionId;

	if (developmentChains.includes(network.name)) {
		const VRFCoordinatorV2Mock = await ethers.getContract(
			"VRFCoordinatorV2Mock"
		);
		VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address;

		const tx = await VRFCoordinatorV2Mock.createSubscription();
		const txReceipt = await tx.wait(1);
		subscriptionId = txReceipt.events[0].args.subId;

		// fund subscription
		console.log("Funding subscription...");
		await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
	} else {
		VRFCoordinatorV2Address = networkConfig[chainId!].vrfCoordinatorV2;
		subscriptionId = networkConfig[chainId!].subscriptionId;
	}

	log("-----------------------");

	const { gasLane, mintFee, callbackGasLimit } = networkConfig[chainId!];
	const args = [
		VRFCoordinatorV2Address,
		subscriptionId,
		gasLane,
		callbackGasLimit,
		tokenURIs,
		mintFee,
	];
	const waitConfirmations = developmentChains.includes(network.name)
		? 1
		: VERIFICATION_BLOCK_CONFIRMATIONS;

	const randomIpfsNft = await deploy("RandomIpfsNFT", {
		from: deployer,
		args,
		log: true,
		waitConfirmations,
	});

	log("-----------------------");

	// Verify the deployment
	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		log("Verifying...");
		await verify(randomIpfsNft.address, args);
	}
};

const handleTokenURIs = async () => {
	let tokenURIs = [];

	const { responses: imageUploadedResponses, files } = await storeImages(
		imagesLocation
	);

	for (let imageUploadedResponseIndex in imageUploadedResponses) {
		// create metadata
		// upload metadata
		const name = files[imageUploadedResponseIndex].replace(".webp", "");
		const tokenURIMetadata: NFTMetadata = {
			name,
			description: `An addorable ${name} pup!`,
			image: `ipfs://${imageUploadedResponses[imageUploadedResponseIndex].IpfsHash}`,
			attributes: [{ trait_type: "Cute pup!", value: 100 }],
		};

		const metadataUploadedResponse = await storeTokenURIMetadata(
			tokenURIMetadata
		);
		tokenURIs.push(`ipfs://${metadataUploadedResponse?.IpfsHash}`);
	}

	console.log(`Token URIs Uplaoded: ${tokenURIs}`);

	return tokenURIs;
};

deployRandomIPFSNFT.tags = ["all", "randomipfs", "main"];
export default deployRandomIPFSNFT;
