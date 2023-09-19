# Tigris options bot

## You need:

- Git: [https://git-scm.com/downloads/](https://git-scm.com/downloads/)
- Node package manager: [https://www.npmjs.com/](https://www.npmjs.com/)
- Fresh wallet with ETH / MATIC for gas

## Instructions:

1. Clone the repo
    #### `git clone https://github.com/Tigris-Trade/options_bot.git`

2. Install dependencies
    #### `npm install`

3. Create .env file and fill it out as shown in .env.example
   - `ARB_PROVIDER` is arbitrum custom rpc, to use public rpc don't add this key in env
   - `POLYGON_PROVIDER` is polygon custom rpc, to use public rpc don't add this key in env
   - `PRIV_KEY` is the bots wallet private key
   - `WALLET` is the bots wallet address
   - `WORK` should always be 1, otherwise bot will do nothing (for server testing)
   - Check the [docs](https://docs.tigris.trade/) for specific info


4. Run the bot
    #### `npm start`

## Other Info:
- Bot works on both Arbitrum and Polygon, make sure to fund the wallet with both ETH on Arbitrum and MATIC on Polygon
- First bot to execute an order gets the reward
- Rewards are in tigTokens, such as tigUSD
- Anyone can run a bot
