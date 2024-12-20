#!/bin/bash

# Directory to save images
mkdir -p images

# File to store 404 URLs
echo -n >images/404_urls.txt

# Find all 'assets_2.json' files under the 'go/' directory
find go/ -type f -name "assets_2.json" | while read -r json_file; do
  echo "Processing file: $json_file"

  # Grep for the URLs in each file and process them
  grep -Eo 'https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/[^/]+/asset/[^/]+\.png' "$json_file" | while read -r old_url; do
    # Extract the chain and asset parts using regex
    chain=$(echo "$old_url" | sed -E 's|.*/chain/([^/]+)/asset/.*|\1|')
    asset=$(echo "$old_url" | sed -E 's|.*/asset/(.*)|\1|')

    # Construct the new URL
    new_url="https://raw.githubusercontent.com/cosmos/chain-registry/master/$chain/images/$asset"

    # Download the image
    wget -q --spider "$new_url"

    if [ $? -eq 0 ]; then
      # If the URL is valid, download the file
      wget -q -O "images/$asset" "$new_url"
      echo "Downloaded: $new_url"
    else
      # If the URL returns 404, save it in a file
      echo "$new_url" >>images/404_urls.txt
      echo "404 Not Found: $new_url"
    fi
  done
done

echo "Script completed. Check 'images' directory and 'images/404_urls.txt' for results."
