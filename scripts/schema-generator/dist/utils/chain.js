import { assetLists } from "@chain-registry/v2/mainnet/index.js";
function getAssetByDenom(denom) {
    for (const asset of assetLists) {
        const result = asset.assets.find((prev) => prev.base === denom);
        if (result)
            return result;
    }
    return undefined;
}
function getDenomImage(asset) {
    if (asset.images && asset.images.length > 0) {
        for (const image of asset.images) {
            if (image.svg) {
                return image.svg;
            }
            if (image.png)
                return image.png;
            return "";
        }
    }
    return "";
}
export async function getDenomsInfo(denoms, client) {
    const failedDenoms = [];
    const formattedData = [];
    for (const denom of denoms) {
        try {
            const ast = getAssetByDenom(denom);
            if (!ast) {
                if (denom.startsWith("ibc")) {
                    failedDenoms.push(denom);
                }
                else {
                    console.log("NOT FOUND", denom);
                }
            }
        }
        catch (err) {
            if (denom.startsWith("ibc")) {
                failedDenoms.push(denom);
            }
            continue;
        }
    }
    if (failedDenoms.length > 0) {
        for (const failed of failedDenoms) {
            try {
                const metadata = await client.ibc.transfer.denomTrace(failed);
                if (!metadata.denomTrace)
                    throw new Error("No Metadata");
                const asset = getAssetByDenom(metadata.denomTrace.baseDenom);
                const tracedDenom = {
                    denom: failed,
                    symbol: asset.symbol,
                    name: asset.display,
                    description: asset.description ?? "",
                    decimals: asset.denomUnits.find((prev) => prev.denom === asset.display).exponent,
                    image: getDenomImage(asset),
                    coinGeckoId: asset.coingeckoId ?? "",
                };
                formattedData.push(tracedDenom);
            }
            catch (err) {
                continue;
            }
        }
    }
    return formattedData;
}
