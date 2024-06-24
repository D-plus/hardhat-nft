import {
	VERIFICATION_BLOCK_CONFIRMATIONS,
	developmentChains,
} from "../helper-hardhat-config";
import { verify } from "../utils/verify";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployBasicNFT = async (hre: HardhatRuntimeEnvironment) => {
	const { getNamedAccounts, deployments, network } = hre;
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();

	const waitBlockConfirmations = developmentChains.includes(network.name)
		? 1
		: VERIFICATION_BLOCK_CONFIRMATIONS;

	log("-----------");
	const basicNFT = await deploy("BasicNFT", {
		from: deployer,
		log: true,
		waitConfirmations: waitBlockConfirmations,
	});

	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		log("Verifying...");
		await verify(basicNFT.address);
	}
};

deployBasicNFT.tags = ["all", "basicnft", "main"];
export default deployBasicNFT;
