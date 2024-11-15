#!/bin/bash

# Base URL for the CDN
BASE_URL="https://cdn.chainroot.io/images/tokens"

# Function to generate a SHA-256 hash of a URL
hash_url() {
  echo -n "$1" | sha256sum | awk '{print $1}'
}

# Find all `*_2.json` files under the `go/` directory
find go/ -type f -name "*_2.json" | while read -r json_file; do
  echo "Processing file: $json_file"

  # Extract all URLs ending with common image extensions
  grep -Eo 'https?://[^"]+\.(png|svg|jpg|jpeg|gif)' "$json_file" | grep -v 'https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/' | while read -r url; do
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

echo "URL replacement completed."
