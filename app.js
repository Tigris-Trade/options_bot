import * as dotenv from 'dotenv';
import Onchain from './onchain/index.js';
import COraclePrices from './COraclePrices/index.js';
import Trigger from './trigger/index.js'
import socketio from 'socket.io-client';
dotenv.config();

class App {

    constructor() {
        if(process.env.WORK == 1) { 
            this.numberOfAssets = 1;
            this.oraclePrices = new COraclePrices(this.numberOfAssets);
            this.onchain = new Onchain(process.env.PROVIDER_ARBI, 1, this.numberOfAssets);
            this.onchainArbi = new Onchain(process.env.PROVIDER_ARBI, 1, this.numberOfAssets);
            //this.trigger = new Trigger(process.env.PROVIDER, 0, process.env.WALLET, process.env.PRIV_KEY);
            this.triggerArbi = new Trigger(process.env.PROVIDER_ARBI, 1, process.env.WALLET, process.env.PRIV_KEY);

            const socket = socketio(new Date().getTimezoneOffset() < -120 ? 'https://us1events.tigristrade.info' : 'https://eu1events.tigristrade.info', { transports: ['websocket'] });

            socket.on('error', (error) => {
                console.log('Events Socket Error:', error);
            });

            socket.on('TradeOpened', (data) => {
                this.update(false);
            });

            socket.on('TradeClosed', (data) => {
                this.update(false);
            });

            socket.on('LimitOrderExecuted', (data) => {
                this.update(false);
            });

            socket.on('LimitCancelled', (data) => {
                this.update(false);
            });

            this.openPositions = [];
            this.triggered = [[], []];

            this.update();
            this.runContinuously();
        } else {
            setInterval(()=>{
                console.log("Idle");
            }, 1000);
        }
    }

    async update(print=true) {
        let promises = [this.onchainArbi.updatePositionsAndIds()];//, this.onchain.updatePositionsAndIds()];

        Promise.all(promises).then(() => {
            this.openPositions = this.onchainArbi.allTrades;//.concat(this.onchainArbi.allTrades);
            if(print) console.log("Number of open trades on Arbi:",this.onchainArbi.allTrades.length);//, "\nNumber of open trades on Arbitrum:", this.onchainArbi.allTrades.length);
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

        for(let i=0; i<this.openPositions.length; i++) { //this.openPositions.length
            if(this.triggered[this.openPositions[i].network].includes(this.openPositions[i].id)) continue;

            const asset = this.openPositions[i].asset;
            if(!sigData[asset]) continue;

            const timeNow = new Date().getTime() / 1000;
            const expires = this.openPositions[i].expires;

            console.log("#"+this.openPositions[i].id, timeNow, expires, timeNow >= expires);

            if(timeNow >= expires) {
                this.triggered[this.openPositions[i].network].push(this.openPositions[i].id);

                console.log("triggering #"+this.openPositions[i].id);
                this.handleTrigger(this.openPositions[i], sigData[asset], 0);
                break;
            }
        }
    }

    async handleTrigger(trade, data, type) {
        if(trade.network == 0) {
            this.triggerArbi.trig(type, trade.id, data);
        } else if(trade.network == 1) {
            this.triggerArbi.trig(type, trade.id, data);
        }
    }
}

async function main() {
    const x = new App();
}

main().catch((error) => {
    console.error(error);
});