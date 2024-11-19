#!/bin/bash

# Base URL for the new CDN
BASE_URL="https://cdn.chainroot.io/images/tokens"

# Find all `*_2.json` files under the `go/` directory
find go/ -type f -name "*_2.json" | while read -r json_file; do
  echo "Processing file: $json_file"

  # Extract URLs that match the specific pattern
  grep -Eo 'https?://[^"]+\.(png|svg|jpg|jpeg|gif)' "$json_file" | grep 'https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/' | while read -r url; do
    # Extract the last part of the URL (e.g., usdc.png)
    last_part=$(echo "$url" | sed -E 's|.*/([^/]+\.png)$|\1|')

    # Construct the new URL using the last part
    new_url="$BASE_URL/$last_part"

    # Replace the old URL with the new one in the JSON file
    sed -i '' "s|\"$url\"|\"$new_url\"|g" "$json_file" 2>/dev/null

    echo "Replaced: $url -> $new_url"
  done
done

echo "Cosmostation URL replacement completed."
