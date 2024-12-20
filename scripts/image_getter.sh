#!/bin/bash

# Directory to save images
RAW_IMAGE_PATH=images
DST_IMAGE_PATH=final
RETRY_IMAGE_PATH=chainlist
RETRY_LIST=retry
# Base URL for the CDN
BASE_URL="https://cdn.chainroot.io/images/tokens"
# List of chains that should use the "_non-cosmos" path
NON_COSMOS_CHAINS=("0l" "aptos" "arbitrum" "avail" "avalanche" "base" "binancesmartchain" "bitcoin" "bitcoincash" "comex" "composablepolkadot" "dogecoin" "ethereum" "fantom" "filecoin" "forex" "internetcomputer" "kusama" "litecoin" "mantle" "moonbeam" "neo" "optimism" "penumbra" "picasso" "polkadot" "polygon" "rootstock" "solana" "stellar" "statemine" "sui" "tinkernet" "ton" "tron" "xrpl" "zilliqa")

# Create the target directory if it doesn't exist
mkdir -p "$DST_IMAGE_PATH"
mkdir -p "$RAW_IMAGE_PATH"
mkdir -p "$RAW_IMAGE_PATH"

# Function to generate a hash of a URL
hash_url() {
  echo -n "$1" | sha256sum | awk '{print $1}'
}

# Find all `*_2.json` files in the `go/` directory and process them
find generated/ -type f -name "*.json" | while read -r json_file; do
  echo "Processing file: $json_file"

  # Extract all URLs that do not match the specified pattern
  grep -Eo 'https?://[^"]+\.(png|svg|jpg|jpeg|gif)' "$json_file" | grep -v 'https://cdn.chainroot.io' | while read -r url; do
    # Extract the original file extension
    extension="${url##*.}"

    # Generate a hashed filename using the URL
    hashed_filename="$(hash_url "$url").$extension"

    # Download the file to the `images/exp` directory
    wget -q -O "$RAW_IMAGE_PATH/$hashed_filename" "$url"

    # Check if the download was successful
    if [ $? -eq 0 ]; then
      if [[ $url == *"https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/"* ]]; then
        gamma=$(exiftool -Gamma "$RAW_IMAGE_PATH/hashed_filename" | awk -F': ' '{print $2}' | xargs)
        image_size=$(exiftool -ImageSize "$RAW_IMAGE_PATH/hashed_filename" | awk -F': ' '{print $2}' | xargs)
        megapixels=$(exiftool -Megapixels "$RAW_IMAGE_PATH/hashed_filename" | awk -F': ' '{print $2}' | xargs)
        # Check if the image matches the specified criteria
        if [[ "$image_size" == "192x192" ]] && (($(echo "$megapixels == 0.037" | bc -l))); then
          echo "The Downloaded file belongs to Cosmostation and the Image is edited; the image will be removed and url will be stored for retry in chain-registry"
          rm "$RAW_IMAGE_PATH/$hashed_filename"
          echo $url >>$RETRY_FILE
        fi
      fi
      echo "Downloaded: $url -> images/exp/$hashed_filename"
    else
      echo "Failed to download: $url"
    fi
  done
done
------------------------------

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
    NC_RETRY_URL="https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/$chain/images/$asset"
    wget -q --spider "$NC_RETRY_URL"

    if [ $? -eq 0 ]; then
      wget -q -O "$RAW_IMAGE_PATH/$asset" "$NC_RETRY_URL"
      echo "Downloaded (non-cosmos): $NC_RETRY_URL"
      continue
    else
      # Step 2: Retry with .svg suffix for non-cosmos path
      SVG_NC_RETRY_URL="https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/$chain/images/${asset%.png}.svg"
      wget -q --spider "$SVG_NC_RETRY_URL"

      if [ $? -eq 0 ]; then
        wget -q -O "$RAW_IMAGE_PATH/${asset%.png}.svg" "$SVG_NC_RETRY_URL"
        echo "Downloaded (non-cosmos SVG): $SVG_NC_RETRY_URL"
        continue
      fi
    fi
  fi

  # Step 3: If not in the non-cosmos list or failed above, try the original URL with .svg suffix
  C_RETRY_URL="https://raw.githubusercontent.com/cosmos/chain-registry/master/$chain/images/$asset"
  wget -q --spider "$C_RETRY_URL"

  if [ $? -eq 0 ]; then
    wget -q -O "$RAW_IMAGE_PATH/$asset" "$$C_RETRY_URL"
    echo "Downloaded (SVG): $svg_url"
    continue
  else
    # Step 2: Retry with .svg suffix for non-cosmos path
    SVG_C_RETRY_URL="https://raw.githubusercontent.com/cosmos/chain-registry/master/$chain/images/${asset%.png}.svg"
    wget -q --spider "$SVG_C_RETRY_URL"

    if [ $? -eq 0 ]; then
      wget -q -O "$RAW_IMAGE_PATH/${asset%.png}.svg" "$SVG_C_RETRY_URL"
      echo "Downloaded (cosmos SVG): $SVG_C_RETRY_URL"
      continue
    fi
  fi

  # If all attempts fail, add the URL to the second 404 list
  echo "$old_url" >>"$retry_404_file"
  echo "Still not found: $old_url"
done <"$RETRY_LIST"

--------------------------
# Find all `*_2.json` files under the `go/` directory
find go/ -type f -name "*_2.json" | while read -r json_file; do
  echo "Processing file: $json_file"

  # Extract all URLs ending with common image extensions
  grep -Eo 'https?://[^"]+\.(png|svg|jpg|jpeg|gif)' "$json_file" | grep -v 'https://cdn.chainroot.io' | while read -r url; do
    # Calculate the hash of the URL
    hash=$(hash_url "$url")

    # Extract the file extension from the original URL
    extension="${url##*.}"

    # Construct the new CDN URL
    new_url="$BASE_URL/$hash.$extension"

    # Use `sed` to replace the original URL with the new CDN URL in the JSON file
    sed -i '' "s|\"$url\"|\"$new_url\"|g" "$json_file"

    echo "Replaced: $url -> $new_url"
  done
done
