import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";

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

const deployDynamicSvgNFT = async (hre: HardhatRuntimeEnvironment) => {
	const { getNamedAccounts, deployments, network } = hre;
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId!;
	let ethUsdPriceFeedAddress;

	log("-----------------------");

	if (developmentChains.includes(network.name)) {
		const ethUsdAggregator = await ethers.getContract("MockV3Aggregator");
		ethUsdPriceFeedAddress = ethUsdAggregator.address;
	} else {
		ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
	}

	const lowSVG = await fs.readFileSync("./images/dynamicNFT/emoji-poker.svg", {
		encoding: "utf8",
	});
	const highSVG = await fs.readFileSync(
		"./images/dynamicNFT/happy-smiley.svg",
		{ encoding: "utf8" }
	);

	// const { gasLane, mintFee, callbackGasLimit } = networkConfig[chainId!];
	const args = [ethUsdPriceFeedAddress, lowSVG, highSVG];

	const waitConfirmations = developmentChains.includes(network.name)
		? 1
		: VERIFICATION_BLOCK_CONFIRMATIONS;

	const dynamicSvgNFT = await deploy("DynamicSvgNFT", {
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
		await verify(dynamicSvgNFT.address, args);
	}
};

deployDynamicSvgNFT.tags = ["all", "dynamicsvg", "main"];
export default deployDynamicSvgNFT;
