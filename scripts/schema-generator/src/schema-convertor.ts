import { z } from "zod";
import fs from "fs";

// Zod schema for the original JSON
const denomUnitSchema = z.object({
  denom: z.string(),
  exponent: z.number(),
  aliases: z.array(z.string()).optional(),
});

const ibcInfoSchema = z.object({
  path: z.string(),
  client: z.object({
    channel: z.string(),
    port: z.string(),
  }),
  counterparty: z.object({
    channel: z.string(),
    port: z.string(),
    chain: z.string(),
    denom: z.string(),
  }),
});

const assetSchema = z.object({
  type_asset: z.string(),
  denom_units: z.array(denomUnitSchema),
  base: z.string(),
  display: z.string(),
  name: z.string(),
  symbol: z.string(),
  description: z.string().optional(),
  extended_description: z.string().optional(),
  coingecko_id: z.string().optional(),
  logo_URIs: z
    .object({
      png: z.string().optional(),
      svg: z.string().optional(),
    })
    .optional(),
  ibc: ibcInfoSchema.optional(),
});

const bitsongSchema = z.object({
  denom: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logo: z.string(),
  coingecko_id: z.string().nullable(),
});

const bitsongSchemaList = z.array(bitsongSchema);

const assetListSchema = z.object({
  chain_name: z.string(),
  assets: z.array(assetSchema),
});

// Transform bigsong schema to asset list schema
const transformBitsong = (input: z.infer<typeof bitsongSchemaList>) => {
  return input.map((asset) => {
    const transformed: any = {
      type: "native",
      denom: asset.denom,
      name: asset.name,
      symbol: asset.symbol,
      description: asset.name,
      decimals: asset.decimals,
      image: asset.logo,
      coinGeckoId: asset.coingecko_id,
      ibc_info: null,
    };

    return transformed;
  });
};

// Transform function
const transformAssetList = (input: z.infer<typeof assetListSchema>) => {
  return input.assets.map((asset) => {
    const denomUnit = asset.denom_units.find(
      (unit) => unit.denom === asset.display
    );

    const transformed: any = {
      type: asset.type_asset === "ics20" ? "ibc" : "native",
      denom: asset.base,
      name: asset.name,
      symbol: asset.symbol,
      description: asset.description || "",
      decimals: denomUnit?.exponent || 6,
      image: asset.logo_URIs?.png || asset.logo_URIs?.svg || "",
      coinGeckoId: asset.coingecko_id || "",
    };

    if (asset.ibc) {
      transformed.ibc_info = {
        path: asset.ibc.path,
        client: asset.ibc.client,
        counterparty: asset.ibc.counterparty,
      };
    }

    return transformed;
  });
};

// CLI Input and Output Handling
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: node script.js <inputFile> <outputFile>");
  process.exit(1);
}

const [type = "cr", inputFile, outputFile] = args;

try {
  const inputData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  let transformedAssets = [];
  if (type === "cr") {
    const validatedInput = assetListSchema.parse(inputData);
    transformedAssets = transformAssetList(validatedInput);
  } else if (type === "bitsong") {
    const validatedInput = bitsongSchemaList.parse(inputData);
    transformedAssets = transformBitsong(validatedInput);
  }

  fs.writeFileSync(outputFile, JSON.stringify(transformedAssets, null, 2));
  console.log(`Transformed data written to ${outputFile}`);
} catch (error) {
  console.error("Error processing files:", error);
  process.exit(1);
}
