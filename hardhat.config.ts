import { task, HardhatUserConfig } from 'hardhat/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';

import deployer from './.secret';

// const KCC_RPC = 'https://127.0.0.1:8545/';
const KCC_RPC = 'http://127.0.0.1:8545';
const KCC_Tetsnet_RPC = 'https://rpc-testnet.kcc.network';

const config: HardhatUserConfig = {
  solidity: { version: '0.7.6' },
  networks: {
    hardhat: {
       loggingEnabled: true,
      forking: {
        url: KCC_RPC,
        enabled: true,
      },
      accounts: {
        accountsBalance: '1000000000000000000000000', // 1 mil ether
      },
    },
    kccTestnet: {
      url: KCC_Tetsnet_RPC,
      chainId: 0x141,
      accounts: [deployer.private],
    },
    kcc: {
      url: KCC_RPC,
      chainId: 0x141,
      accounts: [deployer.private],
    },
  },
  mocha: {
    timeout: 40000,
  },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = config;
