#!/bin/bash

# Source and target directories
source_dir="images/chainlist_only"
target_dir="images/chainlist_spec"

# Create the target directory if it doesn't exist
mkdir -p "$target_dir"

# Loop through all image files in the source directory
for file in "$source_dir"/*.{jpg,jpeg,png}; do
    # Check if the file exists (skip if there are no matches)
    [ -e "$file" ] || continue

    # Extract EXIF data using exiftool
    gamma=$(exiftool -Gamma "$file" | awk -F': ' '{print $2}' | xargs)
    image_size=$(exiftool -ImageSize "$file" | awk -F': ' '{print $2}' | xargs)
    megapixels=$(exiftool -Megapixels "$file" | awk -F': ' '{print $2}' | xargs)

    # Check if the image matches the specified criteria
    if [[ "$image_size" == "192x192" ]] && (( $(echo "$megapixels == 0.037" | bc -l) )); then
        echo "Moving: $file"
        mv "$file" "$target_dir/"
    fi
done

echo "Script completed. Check the '$target_dir' directory for the sorted images."

