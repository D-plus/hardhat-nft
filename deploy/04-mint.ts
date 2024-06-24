import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const mint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { getNamedAccounts, network, ethers } = hre;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	// // Basic NFT
	const basicNft = await ethers.getContract("BasicNFT", deployer);
	const basicMintTx = await basicNft.mintNFT();
	await basicMintTx.wait(1);
	console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI(0)}`);

	// Dynamic SVG  NFT
	const highValue = ethers.utils.parseEther("4000");
	const dynamicSvgNft = await ethers.getContract("DynamicSvgNFT", deployer);
	const dynamicSvgNftMintTx = await dynamicSvgNft.mintNFT(highValue);
	await dynamicSvgNftMintTx.wait(1);
	console.log(
		`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
	);

	// Random IPFS NFT
	const randomIpfsNft = await ethers.getContract("RandomIpfsNFT", deployer);
	const mintFee = await randomIpfsNft.getMintFee();
	const randomIpfsNftMintTx = await randomIpfsNft.requestNFT({
		value: mintFee.toString(),
	});
	const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);
	// Need to listen for response
	await new Promise<void>(async (resolve) => {
		setTimeout(resolve, 300000); // 5 minute timeout time
		// setup listener for our event
		randomIpfsNft.once("NftMinted", async () => {
			resolve();
		});
		if (chainId == 31337) {
			const requestId =
				randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
			const vrfCoordinatorV2Mock = await ethers.getContract(
				"VRFCoordinatorV2Mock",
				deployer
			);
			await vrfCoordinatorV2Mock.fulfillRandomWords(
				requestId,
				randomIpfsNft.address
			);
		}
	});
	console.log(
		`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`
	);
};
mint.tags = ["all", "mint"];
export default mint;
