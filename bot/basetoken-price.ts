import axios from 'axios';
import AsyncLock from 'async-lock';

import config from './config';
import log from './log';

const lock = new AsyncLock();

let kcsPrice = 0;

// clear KCS price every hour
setInterval(() => {
  lock
    .acquire('kucoin-shares', () => {
      kcsPrice = 0;
      return;
    })
    .then(() => {});
}, 3600000);

export async function getKcsPrice(): Promise<number> {
  return await lock.acquire('kucoin-shares', async () => {
    if (kcsPrice !== 0) {
      return kcsPrice;
    }
    const res = await axios.get(config.kccScanUrl);
    kcsPrice = parseFloat(res.data.result.ethusd);
    log.info(`KCS price: $${kcsPrice}`);
    return kcsPrice;
  });
}
