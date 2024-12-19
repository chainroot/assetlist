import * as fs from 'fs';
import * as path from 'path';

// Define the base directory paths
const CHAINLIST_DIR = 'src/chainlist/chain';
const TARGET_DIR = 'go';

// Get all chain folders ending with /assets.json
const chainPaths = fs.readdirSync(CHAINLIST_DIR)
    .map((chain) => path.join(CHAINLIST_DIR, chain, 'assets.json'))
    .filter((chainPath) => fs.existsSync(chainPath));

for (const chainPath of chainPaths) {
    // Extract the chain name from the path (e.g., "juno" from "src/chainlist/chain/juno/assets.json")
    const chainName = path.basename(path.dirname(chainPath));

    console.log(`Processing ${chainName}...`);

    // Check if the file exists
    if (!fs.existsSync(chainPath)) {
        console.warn(`Warning: ${chainPath} not found`);
        continue;
    }

    // Parse the JSON file to find all entries with "type": "staking" and extract the denom
    const chainData = JSON.parse(fs.readFileSync(chainPath, 'utf-8'));
    const denoms = chainData
        .filter((entry: any) => entry.type === 'staking')
        .map((entry: any) => entry.denom);

    for (const denom of denoms) {
        console.log(`Found staking denom: ${denom}`);

        // Define the path to the assets_2.json file
        const assets2Path = path.join(TARGET_DIR, chainName, 'assets_2.json');

        // Check if the assets_2.json exists
        if (!fs.existsSync(assets2Path)) {
            console.warn(`Warning: ${assets2Path} not found`);
            continue;
        }

        try {
            // Parse the assets_2.json file
            const assets2Data = JSON.parse(fs.readFileSync(assets2Path, 'utf-8'));

            // Update the "type" of the matching denom to "staking"
            const updatedData = assets2Data.map((entry: any) => {
                if (entry.denom === denom && entry.type === 'native') {
                    entry.type = 'staking';
                }
                return entry;
            });

            // Write the updated data back to the assets_2.json file
            fs.writeFileSync(assets2Path, JSON.stringify(updatedData, null, 4));

            console.log(`Updated ${denom} in ${assets2Path} to type: staking`);
        } catch (error) {
            console.error(`Error updating ${denom} in ${assets2Path}:`, error);
        }
    }
}

console.log('Staking Denom change completed.');
