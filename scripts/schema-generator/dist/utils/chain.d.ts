import { CosmosClient } from "src/types/chains.js";
export declare function getDenomsInfo(denoms: string[], client: CosmosClient): Promise<{
    type?: string | undefined;
    denom?: string | undefined;
    name?: string | undefined;
    symbol?: string | undefined;
    description?: string | undefined;
    decimals?: number | undefined;
    image?: string | undefined;
    coinGeckoId?: string | undefined;
}[]>;
