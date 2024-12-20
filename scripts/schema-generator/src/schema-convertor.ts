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
  logo_URIs: z.object({
    png: z.string().optional(),
    svg: z.string().optional(),
  }).optional(),
  ibc: ibcInfoSchema.optional(),
});

const assetListSchema = z.object({
  chain_name: z.string(),
  assets: z.array(assetSchema),
});

// Transform function
const transformAssetList = (input: z.infer<typeof assetListSchema>) => {
  return input.assets.map((asset) => {
    const denomUnit = asset.denom_units.find((unit) => unit.denom === asset.display);

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

const [inputFile, outputFile] = args;

try {
  const inputData = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  const validatedInput = assetListSchema.parse(inputData);
  const transformedAssets = transformAssetList(validatedInput);

  fs.writeFileSync(outputFile, JSON.stringify(transformedAssets, null, 2));
  console.log(`Transformed data written to ${outputFile}`);
} catch (error) {
  console.error("Error processing files:", error);
  process.exit(1);
}

