import Web3 from 'web3';
import fs from 'fs';

export default class Onchain {

    constructor(provider, network, numberOfAssets) {
        const tradenftABI = JSON.parse(fs.readFileSync('./abis/TradeNFTContractABI.json', 'utf-8'));

        this.network = network;
        this.setAddresses(network);

        const web3 = new Web3(new Web3.providers.HttpProvider(provider));

        this.tradenftContract = new web3.eth.Contract(tradenftABI, this.tradenftAddress);
        this.numberOfAssets = 40;
    }

    async updatePositionsAndIds() {
        let allIds = [];
        let allPromises = [];

        for(var pair=0; pair<this.numberOfAssets; pair++) {
            allPromises.push(this.tradenftContract.methods.assetOpenTrades(pair).call());
            allPromises.push(this.tradenftContract.methods.limitOrders(pair).call());
        }

        await Promise.all(allPromises).then(all => {
            for(let i=0; i<all.length; i++) {
                allIds = allIds.concat(all[i]);
            }
        })

        this.allIds = allIds;

        await this.updateAllTrades();
    }

    async updateAllTrades() {
        let tradesPromise = [];
    
        for(var i=0; i<this.allIds.length; i++) {
            try {
                let x;
                try {
                    x = await this.tradenftContract.methods.trades(this.allIds[i]).call();
                    tradesPromise.push(x);
                } catch(e) {}
            } catch(e) {}
        }

        await Promise.all(tradesPromise).then(async s => {
            let trades = s.map((item) => 
                Object.assign({}, item, {network: this.network})
            )

            this.allTrades = trades;
        });
    }

    setAddresses(network) {
        if(network == 137) {
            this.tradenftAddress = "0x7B7ce91d7d69f49D86FCA80B034c6A103837CbB8";
        } else {
            this.tradenftAddress = "0x4E0bb7b156eb236260C18F98fB7f83F647F9C1Dd";
        }
    }
}
