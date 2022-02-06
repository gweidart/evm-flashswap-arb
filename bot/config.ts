import { BigNumber, BigNumberish, utils } from 'ethers';

interface Config {
  contractAddr: string;
  logLevel: string;
  minimumProfit: number;
  gasPrice: BigNumber;
  gasLimit: BigNumberish;
  kccScanUrl: string;
  concurrency: number;
}

const contractAddr = '//////ENTERYOURFLASHBOTADDRESSHERE\\\\\\\\\\'; // flash bot contract address
const gasPrice = utils.parseUnits('3', 'gwei');
const gasLimit = 300000;

const VS_CURRENCY = 'currencies=usd'; // kccscan API key
const kccScanUrl = `https://api.coingecko.com/api/v3/simple/price?ids=kucoin-shares&vs${VS_CURRENCY}`;

const config: Config = {
  contractAddr: contractAddr,
  logLevel: 'debug',
  concurrency: 50,
  minimumProfit: 50, // in USD
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  kccScanUrl: kccScanUrl,
};

export default config;
