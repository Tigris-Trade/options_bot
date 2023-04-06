import Web3 from 'web3';
import fs from 'fs';

export default class Trigger {

    constructor(provider, network, wallet, priv) {
        this.tradingABI = JSON.parse(fs.readFileSync('./abis/TradingContractABI.json', 'utf-8'));
        const privateKey = priv;
        this.web3 = new Web3(new Web3.providers.HttpProvider(provider));
        const account = this.web3.eth.accounts.privateKeyToAccount('0x' + privateKey);

        this.walletAddress = wallet; 

        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;
        this.nonce = -1;
        this.gasAmount = 3000000;

        if(network == 0) {
            this.gasPrice = 1000 * 1000000000;
        } else {
            this.gasPrice = 300000000;
        }

        this.init(network);
    }

    async trig(type, nftId, data) {

        console.log(type, "trigging....");
        await this.updateNonce();
        if(type == 0) {
            await this.limitClose(nftId, data, false);
            this.updateNonce();
        } if(type == 1) {
            await this.liquidatePosition(nftId, data);
            this.updateNonce();
        } else if(type == 2) {
            await this.limitClose(nftId, data, true);
            this.updateNonce();
        } else if(type == 3) {
            await this.exeLimit(nftId, data);
            this.updateNonce();
        }
    }

    async limitClose(id, data, isTp) {
        try {
            await this.tradingContract.methods.limitClose(id, isTp, data.price, data.sigs).send({from: this.walletAddress, gas: this.gasAmount, gasPrice: this.gasPrice, nonce: this.nonce})
            .on('transactionHash', function(hash){
                console.log("`Hash: `"+hash);
            })
            .on('receipt', function(receipt){
                console.log("Limit close Handled");
            })
            .on('error', function(error, receipt) {
                console.log(error);
                console.log(receipt);
            });
        } catch(error) {
            console.log("tp catch");
            console.log(error);
        }
    }

    async liquidatePosition(id, data) {
        try {
            await this.tradingContract.methods.liquidatePosition(id, data.price, data.sigs).send({from: this.walletAddress, gas: this.gasAmount, gasPrice: this.gasPrice, nonce: this.nonce})
            .on('transactionHash', function(hash){
                console.log("`Hash: `"+hash);
            })
            .on('receipt', function(receipt){
                console.log("Liquidation Handled");
            })
            .on('error', function(error, receipt) {
                console.log(error);
                console.log(receipt);
            });
        } catch(error) {
            console.log("liq catch");
            console.log(error);
        }
    }

    async exeLimit(id, data) {
        try {
            await this.tradingContract.methods.executeLimitOrder(id, data.price, data.sigs).send({from: this.walletAddress, gas: this.gasAmount, gasPrice: this.gasPrice, nonce: this.nonce})
            .on('transactionHash', function(hash){
                console.log("`Hash: `"+hash);
            })
            .on('receipt', function(receipt){
                console.log("Limit exe Handled");
            })
            .on('error', function(error, receipt) {
                console.log(error);
                console.log(receipt);
            });
        } catch(error) {
            console.log("limit catch");
            console.log(error);
        }
    }

    async init(network) {
        if(network == 0) {
            this.tradingAddress = "0xCde587E333327fBF887548b3eAf111Fb50D38388";
        } else {
            this.tradingAddress = "0x0CC23BF1761C85e010D257F02fd638d4E4221579";
        }

        this.tradingContract = new this.web3.eth.Contract(this.tradingABI, this.tradingAddress);

        this.web3.eth.getTransactionCount(
            this.walletAddress,
            "pending"
        ).then(async (nonce) => {
            this.nonce = nonce;
        });
    }

    async updateNonce() {
        this.nonce = await this.web3.eth.getTransactionCount(
            this.walletAddress,
            "pending"
        );
    }
}