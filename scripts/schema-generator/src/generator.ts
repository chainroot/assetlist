import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { request } from "graphql-request";
import { ALL_CHAINS, GET_CHAIN_ASSETS } from "./gql/queries.js";
import { ChainAssetsQueryResponse, ChainReturn } from "./types/chains.js";
import { QueryClient, setupIbcExtension } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { getDenomsInfo } from "./utils/chain.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const { chains } = await request<ChainReturn>(
    "https://gql.chainroot.io",
    ALL_CHAINS
  );

  for (const chain of chains) {
    console.log("GENERATING", chain);
    const { chainAssets } = await request<ChainAssetsQueryResponse>(
      "https://gql.chainroot.io",
      GET_CHAIN_ASSETS,
      {
        networkName: chain.networkName,
        pagination: {
          limit: 10000,
          offset: 0,
        },
      }
    );

    console.log("LENGTH", chain.networkName, chainAssets.results.length);

    try {
      const client = await createClient(chain.networkName);

      const denomInfos = await getDenomsInfo(
        chainAssets.results.map((d) => d.denom),
        client
      );

      const networkName =
        chain.networkName.toLowerCase() === "ux" ? "umee" : chain.networkName;

      const generatedDir = join(__dirname, `../../../go/${networkName}`);
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }

      await fs.promises.writeFile(
        `${generatedDir}/custom_2.json`,
        JSON.stringify(denomInfos, null, 2)
      );
    } catch (err) {
      console.error("ERROR", chain.networkName, err);
    }
  }
}

function getRpcEndpoint(networkName: string) {
  const network = networkName.toLowerCase();

  if (network === "pryzm") {
    return `https://rpc.pryzm.zone`;
  }

  if (network === "ux") {
    return "https://umee-rpc.polkachu.com";
  }

  if (network === "comdex") {
    return "https://rpc.comdex.one";
  }

  return `https://${network}-rpc.polkachu.com`;
}

async function createClient(networkName: string) {
  const cmclient = await Tendermint34Client.connect(
    getRpcEndpoint(networkName)
  );
  const ibcClient = QueryClient.withExtensions(cmclient, setupIbcExtension);

  return ibcClient;
}

main();
