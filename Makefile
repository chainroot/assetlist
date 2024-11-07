# Define the source and target directories
SRC_DIR = src/chainlist/chain
TARGET_DIR = go

.PHONY: def update-registry update-chain-data
# Find all asset_list.json files and their corresponding target directories
FILES_TO_COPY = assets_2.json erc20_2.json cw20_2.json

def: update-registry uupdate-chain-data

update-chainlist:
	@echo "Updating cosmostation/chainlist submodule to latest"
	git submodule update --remote --init --recursive src/chainlist

update-chain-data:
	@echo "Update chains assets lists"
	@for dir in $(shell find $(SRC_DIR) -mindepth 1 -maxdepth 1 -type d); do \
		for file in $(FILES_TO_COPY); do \
			if [ -f "$$dir/$$file" ]; then \
   			target_dir="$(TARGET_DIR)/$$(basename $$dir)"; \
				mkdir -p "$$target_dir"; \
				cp "$$dir/$$file" "$$target_dir/"; \
			fi; \
		done; \
	done

