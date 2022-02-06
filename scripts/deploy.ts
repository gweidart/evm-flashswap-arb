import { ethers, run } from 'hardhat';

import deployer from '../.secret';

// WKCS address on KCC, WETH address on ETH
const WethAddr = '0x4446fc4eb47f2f6586f9faab68b3498f86c07521';

async function main() {
  await run('compile');
  const FlashBot = await ethers.getContractFactory('FlashBot');
  const flashBot = await FlashBot.deploy(WethAddr);

  console.log(`FlashBot deployed to ${flashBot.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
