import Web3 from 'web3';
import fs from 'fs';

export default class Trigger {

    constructor(provider, network, wallet, priv) {
        this.optionsABI = JSON.parse(fs.readFileSync('./abis/OptionsContractABI.json', 'utf-8'));
        const privateKey = priv;
        this.web3 = new Web3(new Web3.providers.HttpProvider(provider));
        const account = this.web3.eth.accounts.privateKeyToAccount('0x' + privateKey);

        this.walletAddress = wallet; 

        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;
        this.nonce = -1;
        this.gasAmount = 10000000;

        if(network == 0) {
            this.gasPrice = 1000 * 1000000000;
        } else {
            this.gasPrice = 100000000;
        }

        this.init(network);
    }

    async trig(type, nftId, data) {

        console.log(type, "trigging....");
        await this.updateNonce();
        if(type == 0) {
            await this.closeTrade(nftId, data);
            this.updateNonce();
        }
    }

    async closeTrade(id, data) {
        console.log(data);
        try {
            console.log(data.price);
            await this.optionsContract.methods.closeTrade(id, data.price, data.sig).send({from: this.walletAddress, gas: this.gasAmount, gasPrice: this.gasPrice, nonce: this.nonce})
            .on('transactionHash', function(hash){
                console.log("`Hash: `"+hash);
            })
            .on('receipt', function(receipt){
                console.log("Close Handled");
            })
            .on('error', function(error, receipt) {
                console.log(error);
                console.log(receipt);
            });
        } catch(error) {
            console.log("close catch");
            console.log(error);
        }
    }

    async init(network) {
        if(network == 0) {
            this.optionsAddress = "0x39d079C8116aD20C547a2981c5F312eaDA956E80";
        } else {
            this.optionsAddress = "0x39d079C8116aD20C547a2981c5F312eaDA956E80";
        }

        this.optionsContract = new this.web3.eth.Contract(this.optionsABI, this.optionsAddress);

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