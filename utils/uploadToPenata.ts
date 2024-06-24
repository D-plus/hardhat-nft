import PinataClient from "@pinata/sdk";
import fs from "fs";
import path from "path";
import { NFTMetadata } from "../interfaces/metadata.interface";

const pinataApiKey = process.env.PINATA_API_KEY || "";
const pinataApiSecret = process.env.PINATA_API_SECRET || "";
const pinata = new PinataClient(pinataApiKey, pinataApiSecret);

export async function storeImages(imagesFilePath: string) {
	const fullImagesPath = path.resolve(imagesFilePath);
	const files = fs.readdirSync(fullImagesPath);
	let responses: any[] = [];
	for (const fileIndex in files) {
		const readableStreamForFile = fs.createReadStream(
			`${fullImagesPath}/${files[fileIndex]}`
		);
		try {
			console.log(`Upploading to IFS the file: ${files[fileIndex]}`);
			const response = await pinata.pinFileToIPFS(readableStreamForFile, {
				pinataMetadata: { name: files[fileIndex] },
			});
			responses.push(response);
		} catch (error) {
			console.log(error);
		}
	}

	return { responses, files };
}

export async function storeTokenURIMetadata(metadata: NFTMetadata) {
	try {
		return await pinata.pinJSONToIPFS(metadata);
	} catch (error) {
		console.log(error);
	}
}
