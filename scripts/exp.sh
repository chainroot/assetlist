#!/bin/bash

# Directory to save images
mkdir -p images/exp

# Function to generate a hash of a URL
hash_url() {
  echo -n "$1" | sha256sum | awk '{print $1}'
}

# Find all `*_2.json` files in the `go/` directory and process them
find go/ -type f -name "*_2.json" | while read -r json_file; do
  echo "Processing file: $json_file"

  # Extract all URLs that do not match the specified pattern
  grep -Eo 'https?://[^"]+\.(png|svg|jpg|jpeg|gif)' "$json_file" | grep -v 'https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/' | while read -r url; do
    # Extract the original file extension
    extension="${url##*.}"

    # Generate a hashed filename using the URL
    hashed_filename="$(hash_url "$url").$extension"

    # Download the file to the `images/exp` directory
    wget -q -O "images/exp/$hashed_filename" "$url"

    # Check if the download was successful
    if [ $? -eq 0 ]; then
      echo "Downloaded: $url -> images/exp/$hashed_filename"
    else
      echo "Failed to download: $url"
    fi
  done
done

echo "Script completed. Check 'images/exp' directory for downloaded images."
