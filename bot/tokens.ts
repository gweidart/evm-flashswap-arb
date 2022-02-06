import fs from 'fs';
import path from 'path';
import 'lodash.combinations';
import lodash from 'lodash';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'hardhat';

import log from './log';

export enum Network {
  KCC = 'kcc',
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const kccBaseTokens: Tokens = {
  wkcs: { symbol: 'WKCS', address: '0x4446fc4eb47f2f6586f9faab68b3498f86c07521' },
  usdt: { symbol: 'USDT', address: '0x0039f574ee5cc39bdd162e9a88e3eb1f111baf48' },
  busd: { symbol: 'BUSD', address: '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d' },
};

const kccQuoteTokens: Tokens = {
  eth: { symbol: 'ETH', address: '0xf55af137a98607f7ed2efefa4cd2dfe70e4253b1' },
  btcb: { symbol: 'BTCK', address: '0xfa93c12cd345c658bc4644d1d4e1b9615952258c' },
  alpha: { symbol: 'ALPHA', address: '0x0490c1076552ed3c91876ead9f6a547b389e69d4' },
  zone: { symbol: 'ZONE', address: '0x32930590244e31a9e4bbda8ab743539af62f3c5a' },
  kus: { symbol: 'KUS', address: '0x4a81704d8c16d9fb0d7f61b747d0b5a272badf14' },
  mjt: { symbol: 'MJT', address: '0x2ca48b4eea5a731c2b54e7c3944dbdb87c0cfb6f' },
  usdt: { symbol: 'USDT', address: '0x0039f574ee5cc39bdd162e9a88e3eb1f111baf48' },
  usdc: { symbol: 'USDC', address: '0x980a5afef3d17ad98635f6c5aebcbaeded3c3430' },
  kbnb: { symbol: 'BNB', address: '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c' },
  busd: { symbol: 'BUSD', address: '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d' },
  koffee: { symbol: 'KOFFEE', address: '0xc0ffee0000921eb8dd7d506d4de8d5b79b856157' },
  kudoge: { symbol: 'KUDOGE', address: '0x6665d66afa48f527d86623723342cfa258cb8666' },
  tiku: { symbol: 'TIKU', address: '0xd4b52510719c594514ce7fed6cc876c03278ccf8' },
  link: { symbol: 'LINK', address: '0x47841910329aaa6b88d5e9dcde9000195151dc72' },
  cro: { symbol: 'CRO', address: '0x652d253b7ca91810a4a05acfc39729387c5090c0' },
  zdex: { symbol: 'ZDEX', address: '0x461d52769884ca6235b685ef2040f47d30c94eb5' },
  twlt: { symbol: 'TWLT', address: '0x905bb6419948455847bef285485495fb570973b0' },
};

const kccDexes: AmmFactories = {
  AlphaSwap: '0x87383F77AddEB3cEaD7A78009AfcCF53C9F5bfCf',
  Kuswap: '0xAE46cBBCDFBa3bE0F02F463Ec5486eBB4e2e65Ae',
  MojitoSwap: '0x79855A03426e15Ad120df77eFA623aF87bd54eF3',
  KsfSwapp: '0x60C48b5232a43306c16D492cF1562c7398518170',
  KoffeeSwap: '0xc0ffee00000e1439651c6ad025ea2a71ed7f3eab',
  // value: '0x1B8E12F839BD4e73A47adDF76cF7F0097d74c14C',
};

function getFactories(network: Network): AmmFactories {
  switch (network) {
    case Network.KCC:
      return kccDexes;
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

export function getTokens(network: Network): [Tokens, Tokens] {
  switch (network) {
    case Network.KCC:
      return [kccBaseTokens, kccQuoteTokens];
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

async function updatePairs(network: Network): Promise<ArbitragePair[]> {
  log.info('Updating arbitrage token pairs');
  const [baseTokens, quoteTokens] = getTokens(network);
  const factoryAddrs = getFactories(network);

  const factoryAbi = ['function getPair(address, address) view returns (address pair)'];
  let factories: Contract[] = [];

  log.info(`Fetch from dexes: ${Object.keys(factoryAddrs)}`);
  for (const key in factoryAddrs) {
    const addr = factoryAddrs[key];
    const factory = new ethers.Contract(addr, factoryAbi, ethers.provider);
    factories.push(factory);
  }

  let tokenPairs: TokenPair[] = [];
  for (const key in baseTokens) {
    const baseToken = baseTokens[key];
    for (const quoteKey in quoteTokens) {
      const quoteToken = quoteTokens[quoteKey];
      let tokenPair: TokenPair = { symbols: `${quoteToken.symbol}-${baseToken.symbol}`, pairs: [] };
      for (const factory of factories) {
        const pair = await factory.getPair(baseToken.address, quoteToken.address);
        if (pair != ZERO_ADDRESS) {
          tokenPair.pairs.push(pair);
        }
      }
      if (tokenPair.pairs.length >= 2) {
        tokenPairs.push(tokenPair);
      }
    }
  }

  let allPairs: ArbitragePair[] = [];
  for (const tokenPair of tokenPairs) {
    if (tokenPair.pairs.length < 2) {
      continue;
    } else if (tokenPair.pairs.length == 2) {
      allPairs.push(tokenPair as ArbitragePair);
    } else {
      // @ts-ignore
      const combinations = lodash.combinations(tokenPair.pairs, 2);
      for (const pair of combinations) {
        const arbitragePair: ArbitragePair = {
          symbols: tokenPair.symbols,
          pairs: pair,
        };
        allPairs.push(arbitragePair);
      }
    }
  }
  return allPairs;
}

function getPairsFile(network: Network) {
  return path.join(__dirname, `../pairs-${network}.json`);
}

export async function tryLoadPairs(network: Network): Promise<ArbitragePair[]> {
  let pairs: ArbitragePair[] | null;
  const pairsFile = getPairsFile(network);
  try {
    pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf-8'));
    log.info('Load pairs from json');
  } catch (err) {
    pairs = null;
  }

  if (pairs) {
    return pairs;
  }
  pairs = await updatePairs(network);

  fs.writeFileSync(pairsFile, JSON.stringify(pairs, null, 2));
  return pairs;
}
