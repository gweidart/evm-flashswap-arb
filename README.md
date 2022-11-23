### evm-flashswap-arb

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/cusdt-LINK/evm-flashswap-arb/graphs/commit-activity) &nbsp; [![GitHub issues](https://img.shields.io/github/issues/cusdt-LINK/evm-flashswap-arb.svg)](https://GitHub.com/cusdt-LINK/evm-flashswap-arb/issues/) &nbsp; ![GitHub last commit](https://img.shields.io/github/last-commit/cusdt-LINK/evm-flashswap-arb?style=plastic) &nbsp; ![](https://img.shields.io/github/forks/cusdt-LINK/evm-flashswap-arb) &nbsp; ![](https://img.shields.io/github/license/cusdt-LINK/evm-flashswap-arb) &nbsp; [![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)

#### 🚧 23 Nov 2022: This repo / codebase is officially being updated! 🚧

In light of recent market events I have decided to completely restructure the codebase to significantly improve upon:
- Functionality
- Efficiency
- Profitability
- UI
- UX

The project will remain **FREE**, **open source**, and of course **100% functional** during the update process. 

___________________________________________
An arbitrageur contract and typescript bot implementation that leverages flash swaps to arbitrage between Uniswap V2 AMMs & related forks

#### The rationale

There are a lot of AMMs on Ethereum and other blockchains that support EVM. Many of these AMMs are just forks of UniswapV2 or share the same interface. A list of a few of these AMMs:

- SpookySwap (FTM)
- TraderJoe (AVAX)
- Uniswap V2 (Ethereum)
- Sushi Swap (Ethereum)
- Pancake Swap (BSC)
- etc

...

We can exploit this inefficiency, and arbitrage between these AMMs once the price of the same token pair diverges on different AMMs. All without ever risking more than a menial txn fee. 

Flash Swaps are similar to Aave Flash Loans, which allow you to withdraw all the liquidity of any ERC20 token from Uniswap without any cost, given at the end of the transaction you either:

- pay for the withdrawn ERC20 tokens 
with the corresponding pool/pair tokens.

or 


- return the withdrawn ERC20 tokens before the next block is mined. 

If you were unable to meet either of the conditions mentioned above, the flash swap transaction will fail, and any other arbitrary execution involved in that transaction will be rolled back.

This is possible because flash swaps are atomic Ethereum transactions.

Suppose we'd like to arbitrage token pair ETH/USDT. The ETH/USDT pair must exists on multiple AMMs on ETH(or other EVM compatible blockchains such as BSC).

- We call USDT as the Base token. It can be any token with actual value such as USDT/USDC/DAI/BUSD...

- We call ETH as the Quote token. It can be any token regardless of value. Quote tokens won't be reserved after the arbitrage is executed.

- After arbitrage, only the base tokens are reserved. So our profit is denominate in the base token.

- If two tokens in a pair can both be considered as base tokens. Either one can be reserved after arbitrage.

The type of arbitrage referenced above can be done by using Uniswap V2's flashswap.

For example:

- Suppose pair0 and pair1 are two pairs of the same two tokens on different AMMs. Once the price diverges, we can exploit this inefficiency with our arbitrage bot.

- We call the `FlashBot` contract to start the arbitrage

- The contract calculates the price denominated in the quote token.

Suppose the price of our quote token in Pair0 is lower:

1. By using a flash swap, the contract first borrows quote tokens from Pair0, the amount is *x*. The contract needs to repay the debt to Pair0. The debt can be denominated in base tokens. This is a functionality of Uniswap V2.

2. Sell all the borrowed quote tokens on Pair1. The contract get base tokens of amount *y2*.

3. Repay the debt to Pair0 in base tokens of amount *y1*.

4. The contract keeps the profit of *y2* - *y1*.

The point of this process is to calculate how much of the amount *x*, so we can extract as much profit as possible.

Supoose the initial state of Pair0 and Pair1 are as follows:

| | Pair0 | Pair1 |
| :------------------| :---- | :---- |
| Base Token amount | a1 | a2 |
| Quote Token amount | b1 | b2 |

So we get：

![img](https://i.ibb.co/y0FcRxf/A806-DABD-7-A56-4879-8074-D700-A010-A32-F.png)

The amount borrowed in quote tokens, so `Delta b1 = Delta b2, let x = \Delta b`, then the profit as a function of x :

![img](https://i.ibb.co/tHPkPHT/4-A5-FE15-F-12-FB-43-A8-B806-8-ABDE3-EA15-A8.png)


We want to calculate the value of *X*, when the function gets a maximum value. First we need to get the derivative of function:

![img](https://i.ibb.co/v1F3DCT/E9-A77-C78-EBE1-47-B9-9-A22-A1-FB4082-F12-B.png)

When the derivative function is 0, the function has a maximum/minimum value, and we can set some conditions to ignore the solution at the minimum. It is possible to solve.

![img](https://i.ibb.co/PMcnBd5/ABDF7-D84-E0-D0-421-B-8-ED7-16180-E637673.png )

![img](https://i.ibb.co/hMTcSyz/DD6-CC8-EB-9013-4639-A676-A675-BCD2628-E.png)

Let：

![img](https://i.ibb.co/njVdNqS/04-E07391-C4-CF-4-EBF-8-FC5-4-FC7388-F2467.png )

The previous equation is reduced to a general quadratic equation:

![img](https://i.ibb.co/vBFxPy5/F1-BF9231-D0-A1-47-D8-89-BC-2863-AB1-C4691.png)

Which we solve for:

![img](https://i.ibb.co/CBskKY2/525-B4-D01-9-E1-B-4-B15-BF2-A-13-FDBEB6-A299.png)

The solution x is the amount we need to borrow from Pair0.

### Usage:

#### Deploy the flash swap contract 📄 

1. Edit network config in `hardhat.config.ts`.(It is currently configured for ETH, however you can also deploy to any EVM compatible chain)

2. Copy the secret sample config：

```bash
$ cp .secret.ts.sample .secret.ts

```

3. Edit the `private key` and wallet address fields in above `.secret` config.


4. Run the `deploy.js` script. By default, it deploys to ETH. If you want to dpeloy to a different network, you will need to change the network settings in `hardhat.config.ts`. You also need to change the WKCS or other token address in the `deploy.ts`, it's Set to the WKCS address by default.


``` bash
$ hardhart --network XXX run scripts/deploy.ts

```

For example,

```bash
$ npx hardhat --network ETH run scripts/deploy.ts

```

### Bot implementation

The contract function `getProfit(address pool1, address pool2)`, can be used to calculate the maximum profit between two pairs(denominated in base token).

The bot needs to call `getProfit()` to get the possible profit between token pairs. Once it is profitable, the bot calls `flashArbitrage(pool1, pool2)` to execute the arbitrage. The profit will will remain in the contract address until you withdraw.

Only the contract owner may call `withdraw()` to withdraw the profit.

#### To run the bot:

``` bash
$ sudo yarn bot

```

#### Testing

``` bash
$ hardhat test

```

## FAQ

#### Do I need to hold any tokens to perform arbitrage?

To be simple, this bot exploits the divergence in prices between different AMMs. You'll profit by filling this gap. This contract helps you to make the maximum profit. All while using flashswaps so you only need enough tokens to pay for txn fees (gas) to run it.


#### How can I change the token pairs the bot is monitoring?

Upon startup, the bot uses `ethBaseTokens`, `ethQuoteTokens`, and `ethDexes` in `tokens.ts` to automatically get all possible token pairs and saves them into `eth-pairs.json`. This json file will be reused until you delete it.

If you want to reconfigure pairs, simply delete the `kcc-pairs.json` and edit the three variables above. Rerun the bot so it uses the new pairs. You can check the new pairs in eth-pairs.json.

#### Please note: 

If you use a public RPC provider, chances are you will be rate limited within a few seconds/minutes. Or the connection will be too slow to be effective. This bot works best when connected to a private light node. 

#### License
[MIT](https://choosealicense.com/licenses/mit/)
