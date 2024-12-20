#!/bin/bash

# Directory to save images
mkdir -p images

# File with 404 URLs from the previous script
input_file="images/404_urls.txt"

# Second 404 list for URLs that still fail after retries
retry_404_file="images/second_404_urls.txt"
echo -n >"$retry_404_file"

# List of chains that should use the "_non-cosmos" path
non_cosmos_chains=("0l" "aptos" "arbitrum" "avail" "avalanche" "base" "binancesmartchain" "bitcoin" "bitcoincash" "comex" "composablepolkadot" "dogecoin" "ethereum" "fantom" "filecoin" "forex" "internetcomputer" "kusama" "litecoin" "mantle" "moonbeam" "neo" "optimism" "penumbra" "picasso" "polkadot" "polygon" "rootstock" "solana" "stellar" "statemine" "sui" "tinkernet" "ton" "tron" "xrpl" "zilliqa")

# Function to check if a chain is in the non-cosmos list
is_in_array() {
  local element="$1"
  shift
  for item in "$@"; do
    if [[ "$item" == "$element" ]]; then
      return 0
    fi
  done
  return 1
}

# Read each URL from the input file and process it
while read -r old_url; do
  # Extract the chain and asset parts
  chain=$(echo "$old_url" | sed -E 's|.*/master/([^/]+)/images/.*|\1|')
  asset=$(echo "$old_url" | sed -E 's|.*/images/(.*)|\1|')

  # Step 1: Check if the chain is in the non-cosmos list
  if is_in_array "$chain" "${non_cosmos_chains[@]}"; then
    # Try downloading with the "_non-cosmos" path and .png suffix first
    non_cosmos_url="https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/$chain/images/$asset"
    wget -q --spider "$non_cosmos_url"

    if [ $? -eq 0 ]; then
      wget -q -O "images/$asset" "$non_cosmos_url"
      echo "Downloaded (non-cosmos): $non_cosmos_url"
      continue
    fi

    # Step 2: Retry with .svg suffix for non-cosmos path
    non_cosmos_svg_url="https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/$chain/images/${asset%.png}.svg"
    wget -q --spider "$non_cosmos_svg_url"

    if [ $? -eq 0 ]; then
      wget -q -O "images/${asset%.png}.svg" "$non_cosmos_svg_url"
      echo "Downloaded (non-cosmos SVG): $non_cosmos_svg_url"
      continue
    fi
  fi

  # Step 3: If not in the non-cosmos list or failed above, try the original URL with .svg suffix
  svg_url="https://raw.githubusercontent.com/cosmos/chain-registry/master/$chain/images/${asset%.png}.svg"
  wget -q --spider "$svg_url"

  if [ $? -eq 0 ]; then
    wget -q -O "images/${asset%.png}.svg" "$svg_url"
    echo "Downloaded (SVG): $svg_url"
    continue
  fi

  # If all attempts fail, add the URL to the second 404 list
  echo "$old_url" >>"$retry_404_file"
  echo "Still not found: $old_url"
done <"$input_file"

echo "Script completed. Check 'images' directory for downloaded images and '$retry_404_file' for URLs that still failed."
