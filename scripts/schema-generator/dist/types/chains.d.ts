import { QueryClient, IbcExtension } from "@cosmjs/stargate";
export type Chain = {
    networkName: string;
};
export type ChainReturn = {
    chains: Chain[];
};
export type ChainAsset = {
    denom: string;
    amount: string;
};
export type PaginationResponse = {
    currentPage: number;
    totalPage: number;
    totalCount: number;
    limit: number;
};
export type ChainAssetsQueryResponse = {
    chainAssets: {
        results: ChainAsset[];
        paginationInfo: PaginationResponse;
    };
};
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type Asset = DeepPartial<{
    type: string;
    denom: string;
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    image: string;
    coinGeckoId: string;
}>;
export type DenomInfo = {
    denom: string;
    exponent: number;
    display: string;
    symbol: string;
    logo: string;
    coinId?: string | undefined;
};
export type CosmosClient = QueryClient & IbcExtension;
export {};
