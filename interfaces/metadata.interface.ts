interface NFTMetadataAttr {
	trait_type: string;
	value: number;
}

export interface NFTMetadata {
	name: string;
	description: string;
	image: string;
	attributes: NFTMetadataAttr[];
}
