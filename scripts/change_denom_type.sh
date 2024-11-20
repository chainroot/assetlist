#!/bin/bash

# Define the base directory paths
CHAINLIST_DIR="src/chainlist/chain"
GO_DIR="go"

# Iterate over each chain folder in src/chainlist/chain/*/assets.json
for chain_path in $CHAINLIST_DIR/*/assets.json; do
  # Extract the chain name from the path (e.g., juno from src/chainlist/chain/juno/assets.json)
  chain_name=$(basename $(dirname "$chain_path"))

  # Check if the file exists
  if [ -f "$chain_path" ]; then
    echo "Processing $chain_name..."

    # Use jq to find all entries with "type": "staking" and extract the denom
    denoms=$(jq -r '.[] | select(.type == "staking") | .denom' "$chain_path")

    for denom in $denoms; do
      echo "Found staking denom: $denom"

      # Define the path to the assets_2.json file
      assets_2_path="$GO_DIR/$chain_name/assets_2.json"

      # Check if the assets_2.json exists
      if [ -f "$assets_2_path" ]; then
        # Update the "type" of the matching denom in assets_2.json to "staking"
        jq --arg denom "$denom" '
                    .[] | 
                    select(.denom == $denom and .type == "native") |
                    .type = "staking"
                ' "$assets_2_path" >temp_assets_2.json

        # Rebuild the full JSON array with the updated objects, without replacing the entire file
        jq --arg denom "$denom" '
                    map(
                        if .denom == $denom and .type == "native" then 
                            .type = "staking" 
                        else 
                            . 
                        end
                    )
                ' "$assets_2_path" >temp_assets_2.json && mv temp_assets_2.json "$assets_2_path"

        echo "Updated $denom in $assets_2_path to type: staking"
      else
        echo "Warning: $assets_2_path not found"
      fi
    done
  else
    echo "Warning: $chain_path not found"
  fi
done

echo "Script completed."
