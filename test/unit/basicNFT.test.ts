import { assert } from "chai";
import { developmentChains } from "../../helper-hardhat-config";
import { BasicNFT } from "../../typechain-types";
// @ts-ignore
import { network, deployments, ethers } from "hardhat";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Basic NFT Unit Tests", function () {
			let basicNft: BasicNFT;

			beforeEach(async () => {
				await deployments.fixture(["mocks", "basicnft"]);
				basicNft = await ethers.getContract("BasicNFT");
			});

			it("Allows users to mint an NFT, and updates appropriately", async function () {
				const txResponse = await basicNft.mintNFT();
				await txResponse.wait(1);
				const tokenURI = await basicNft.tokenURI(0);
				const tokenCounter = await basicNft.getTokenCounter();

				assert.equal(tokenCounter.toString(), "1");
				assert.equal(tokenURI, await basicNft.TOKEN_URI());
			});
	  });
