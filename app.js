import * as dotenv from 'dotenv';
import Onchain from './onchain/index.js';
import COraclePrices from './COraclePrices/index.js';
import Trigger from './trigger/index.js'
import socketio from 'socket.io-client';
import axios from 'axios';
dotenv.config();

class App {

    constructor() {
        if(process.env.WORK == 1) { 
            this.numberOfAssets = 45;
            this.oraclePrices = new COraclePrices(this.numberOfAssets);
            
            this.onchain = new Onchain(process.env.POLYGON_PROVIDER ?? "https://polygon-rpc.com", 137, this.numberOfAssets);
            this.onchainArbi = new Onchain(process.env.ARB_PROVIDER ?? "https://arb1.arbitrum.io/rpc", 42161, this.numberOfAssets);

            this.trigger = new Trigger(process.env.POLYGON_PROVIDER ?? "https://polygon-rpc.com", 137, process.env.WALLET, process.env.PRIV_KEY);
            this.triggerArbi = new Trigger(process.env.ARB_PROVIDER ?? "https://arb1.arbitrum.io/rpc", 42161, process.env.WALLET, process.env.PRIV_KEY);

            const socket = socketio('https://beta-events-a43k8.ondigitalocean.app', { transports: ['websocket'] });

            socket.on('error', (error) => {
                console.log('Events Socket Error:', error);
            });

            socket.on('TradeOpened', (data) => {
                console.log(data.chainId);
                this.update(false, data.chainId);
            });

            socket.on('TradeClosed', (data) => {
                this.update(false, data.chainId);
            });

            socket.on('LimitOrderExecuted', (data) => {
                this.update(false, data.chainId);
            });

            socket.on('LimitCancelled', (data) => {
                this.update(false, data.chainId);
            });

            this.openPositions = [];
            this.triggered = {
                137: [], 
                42161: []
            };

            this.update();
            this.runContinuously();
        } else {
            setInterval(()=>{
                console.log("Idle");
            }, 1000);
        }
    }

    async update(print=true, chain = 0) {
        let promises;
        if(chain == 42161) {
            promises = [this.onchainArbi.updatePositionsAndIds()];
        } else if(chain == 137) {
            promises = [this.onchain.updatePositionsAndIds()];
        } else {
            promises = [this.onchainArbi.updatePositionsAndIds(), this.onchain.updatePositionsAndIds()];
        }

        Promise.all(promises).then(() => {
            this.openPositions = this.onchain.allTrades.concat(this.onchainArbi.allTrades);
            if(print) console.log("Number of open trades on Polygon:",this.onchain.allTrades.length + "\nNumber of open trades on Arbitrum:", this.onchainArbi.allTrades.length);
            else console.log("Positions updated.");
        });
    }

    async runContinuously() {
        await this.check();

        await new Promise(r => setTimeout(r, 1000));
        this.runContinuously();
    }

    async check() {
        if(this.openPositions.length == 0) return;
        let data = await this.oraclePrices.getPrices();
        if(!data) return;
        let prices = data.prices;
        let sigData = data.data;

        for(let i=0; i<this.openPositions.length; i++) {
            if(this.triggered[this.openPositions[i].network].includes(this.openPositions[i].id)) continue;

            const asset = this.openPositions[i].asset;
            if(!sigData[asset]) continue;

            if(this.openPositions[i].orderType == 0) {
                const timeNow = sigData[asset][5];
                const expires = this.openPositions[i].expires;

                if(expires < 1691752121 || expires == 1691753171) {
                    this.triggered[this.openPositions[i].network].push(this.openPositions[i].id);
                } else if(timeNow >= expires + 10) {
                    this.triggered[this.openPositions[i].network].push(this.openPositions[i].id);

                    console.log("Triggering old #"+this.openPositions[i].id);
                    let xoldSig;
                    
                    try {
                        xoldSig = await axios.get(`https://db.tigrisoracle.net/pair/${asset}/${(expires/1)+1}`);
                    } catch(e) {
                        continue;
                    }

                    const oldSig = xoldSig.data;

                    const sig = [
                            oldSig.provider,
                            oldSig.is_closed,
                            oldSig.asset,
                            oldSig.price,
                            oldSig.spread,
                            oldSig.timestamp,
                            oldSig.signature
                        ];
                    
                    this.handleTrigger(this.openPositions[i], sig, 0);
                    break;
                } else if(timeNow >= expires) {
                    this.triggered[this.openPositions[i].network].push(this.openPositions[i].id);

                    console.log("Triggering #"+this.openPositions[i].id);
                    this.handleTrigger(this.openPositions[i], sigData[asset], 0);
                    break;
                } else {
                    // log
                    console.log("#"+this.openPositions[i].id, timeNow, expires, timeNow >= expires + 10 ? "Old" : timeNow >= expires ? "Normal" : "Not yet");
                }
            } else if(this.openPositions[i].orderType == 1) {
                const openPrice = this.openPositions[i].openPrice;
                const isLong = this.openPositions[i].direction;
                const currentPrice = prices[this.openPositions[i].asset];

                console.log(openPrice, currentPrice, isLong);
                if((isLong && openPrice >= currentPrice) || (!isLong && openPrice <= currentPrice)) {
                    this.triggered[this.openPositions[i].network].push(this.openPositions[i].id);

                    console.log("Triggering limit #"+this.openPositions[i].id);
                    this.handleTrigger(this.openPositions[i], sigData[asset], 1);
                } 
            }
        }
    }

    async handleTrigger(trade, data, type) {
        if(trade.network == 42161) {
            this.triggerArbi.trig(type, trade.id, data);
        } else if(trade.network == 137) {
            this.trigger.trig(type, trade.id, data);
        }
    }
}

async function main() {
    const x = new App();
}

main().catch((error) => {
    console.error(error);
});