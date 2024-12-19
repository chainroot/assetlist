import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
// @ts-ignore
import exiftool from 'node-exiftool';

const RAW_IMAGE_PATH = 'images';
const DST_IMAGE_PATH = 'final';
const RETRY_IMAGE_PATH = 'chainlist';
const RETRY_LIST = 'retry';
const BASE_URL = 'https://cdn.chainroot.io/images/tokens';

const NON_COSMOS_CHAINS = [
  "0l", "aptos", "arbitrum", "avail", "avalanche", "base", "binancesmartchain", "bitcoin",
  "bitcoincash", "comex", "composablepolkadot", "dogecoin", "ethereum", "fantom", "filecoin",
  "forex", "internetcomputer", "kusama", "litecoin", "mantle", "moonbeam", "neo", "optimism",
  "penumbra", "picasso", "polkadot", "polygon", "rootstock", "solana", "stellar", "statemine",
  "sui", "tinkernet", "ton", "tron", "xrpl", "zilliqa"
];

// Ensure directories exist
[RAW_IMAGE_PATH, DST_IMAGE_PATH, RETRY_IMAGE_PATH].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Hash a URL
const hashUrl = (url: string): string => {
  return crypto.createHash('sha256').update(url).digest('hex');
};

// Download a file
const downloadFile = async (url: string, dest: string): Promise<boolean> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);

    const buffer = await response.buffer();
    fs.writeFileSync(dest, buffer);
    console.log(`Downloaded: ${url} -> ${dest}`);
    return true;
  } catch (error) {
    console.error(`Failed to download: ${url}`, error);
    return false;
  }
};

// Process JSON files for image URLs
const processJsonFiles = async (files: string[], directory: string) => {
  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const urls = Array.from(content.matchAll(/https?:\/\/[^"\s]+\.(png|svg|jpg|jpeg|gif)/g));

    for (const match of urls) {
      const url = match[0];
      if (url.includes(BASE_URL)) continue;

      const extension = path.extname(url);
      const hashedFilename = `${hashUrl(url)}${extension}`;
      const destPath = path.join(RAW_IMAGE_PATH, hashedFilename);

      const success = await downloadFile(url, destPath);

      console.log(success)
      if (success && url.includes('https://raw.githubusercontent.com/cosmostation/chainlist/master/chain/')) {
        const ep = new exiftool.ExiftoolProcess();
        await ep.open();

        try {
        const metadata = await ep.readMetadata(destPath, ['Gamma', 'ImageSize', 'Megapixels']);
        const { Gamma, ImageSize, Megapixels } = metadata.data[0] ?? {};

        if (ImageSize === '192x192' && Megapixels === 0.037) {
          console.log(`File edited: ${url}, removing and retrying.`);
          fs.unlinkSync(destPath);
          fs.appendFileSync(RETRY_LIST, `${url}\n`);
        }

        await ep.close();
        }catch (error){
          continue;
        }
      }
    }
  }
};

// Traverse directories and process JSON files
const traverseDirectories = (directory: string, replace: boolean): void => {
  fs.readdirSync(directory).forEach((folder) => {
    const folderPath = path.join(directory, folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
      const jsonFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.json'));
      if (replace === true) {
        replaceUrlsInJson(jsonFiles, folderPath);
      }else {
      processJsonFiles(jsonFiles, folderPath);
      }
    }
  });
};

// Retry downloading from the retry list
const retryDownloads = async () => {
  if (!fs.existsSync(RETRY_LIST)) {
    console.log(`Retry list file (${RETRY_LIST}) does not exist.`);
    return;
  }

  const retryUrls = fs.readFileSync(RETRY_LIST, 'utf8').split('\n').filter(Boolean);

  for (const oldUrl of retryUrls) {
    const chain = oldUrl.match(/\/master\/([^\/]+)\/images\//)?.[1];
    const asset = oldUrl.match(/\/images\/([^\/]+)/)?.[1];

    if (!chain || !asset) {
      console.error(`Failed to parse chain or asset from URL: ${oldUrl}`);
      continue;
    }

    if (NON_COSMOS_CHAINS.includes(chain)) {
      const nonCosmosUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/${chain}/images/${asset}`;
      const nonCosmosBackupUrl = asset.endsWith('.png')
        ? `https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/${chain}/images/${asset.replace(/\.png$/, '.svg')}`
        : `https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/${chain}/images/${asset.replace(/\.svg$/, '.png')}`;

      if (await downloadFile(nonCosmosUrl, path.join(RAW_IMAGE_PATH, asset))) continue;
      if (await downloadFile(nonCosmosBackupUrl, path.join(RAW_IMAGE_PATH, asset.endsWith('.png') ? asset.replace(/\.png$/, '.svg') : asset.replace(/\.svg$/, '.png')))) continue;
    }

    const cosmosUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chain}/images/${asset}`;
    const cosmosBackupUrl = asset.endsWith('.png')
      ? `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chain}/images/${asset.replace(/\.png$/, '.svg')}`
      : `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chain}/images/${asset.replace(/\.svg$/, '.png')}`;

    if (await downloadFile(cosmosUrl, path.join(RAW_IMAGE_PATH, asset))) continue;
    if (await downloadFile(cosmosBackupUrl, path.join(RAW_IMAGE_PATH, asset.endsWith('.png') ? asset.replace(/\.png$/, '.svg') : asset.replace(/\.svg$/, '.png')))) continue;

    console.log(`Still not found: ${oldUrl}`);
    fs.appendFileSync(path.join(RETRY_IMAGE_PATH, '404_retries.log'), `${oldUrl}\n`);
  }
};

// Replace URLs in JSON
const replaceUrlsInJson = async (files: string[], directory: string) => {
  for (const file of files) {
    const filePath = path.join(directory, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const urls = Array.from(content.matchAll(/https?:\/\/(?!cdn\.chainroot\.io\/)[^"\s]+\.(png|svg|jpg|jpeg|gif)/g));

    for (const match of urls) {
      const url = match[0];
      const extension = path.extname(url);
      const hash = hashUrl(url);
      const newUrl = `${BASE_URL}/${hash}${extension}`;
      content = content.replace(new RegExp(url, 'g'), newUrl);
      console.log(`Replaced: ${url} -> ${newUrl}`);
    }

    fs.writeFileSync(filePath, content);
  }
};

(async () => {
//  traverseDirectories('go', false);
  await retryDownloads();
  traverseDirectories('go', true);
})();

