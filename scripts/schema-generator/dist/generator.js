import fs from "fs";
import path from "path";
import { request } from "graphql-request";
import { ALL_CHAINS, GET_CHAIN_ASSETS } from "./gql/queries.js";
import { QueryClient, setupIbcExtension } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { getDenomsInfo } from "./utils/chain.js";
async function main() {
    const { chains } = await request("https://gql.chainroot.io", ALL_CHAINS);
    const generatedDir = path.resolve("generated");
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }
    for (const chain of chains) {
        console.log("GENERATING", chain);
        const { chainAssets } = await request("https://gql.chainroot.io", GET_CHAIN_ASSETS, {
            networkName: chain.networkName,
            pagination: {
                limit: 10000,
                offset: 0,
            },
        });
        console.log("LENGTH", chain.networkName, chainAssets.results.length);
        try {
            const client = await createClient(chain.networkName);
            const denomInfos = await getDenomsInfo(chainAssets.results.map((d) => d.denom), client);
            await fs.promises.writeFile(`generated/${chain.networkName}.json`, JSON.stringify(denomInfos, null, 2));
        }
        catch (err) {
            console.error("ERROR", chain.networkName, err);
        }
    }
}
function getRpcEndpoint(networkName) {
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
async function createClient(networkName) {
    const cmclient = await Tendermint34Client.connect(getRpcEndpoint(networkName));
    const ibcClient = QueryClient.withExtensions(cmclient, setupIbcExtension);
    return ibcClient;
}
main();
