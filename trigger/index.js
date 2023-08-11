import Web3 from 'web3';
import fs from 'fs';
import { ethers } from 'ethers';

export default class Trigger {

    constructor(provider, network, wallet, priv) {
        this.optionsABI = JSON.parse(fs.readFileSync('./abis/OptionsContractABI.json', 'utf-8'));
        const privateKey = priv;
        this.signer = new ethers.Wallet(privateKey, new ethers.providers.StaticJsonRpcProvider(provider));
        this.web3 = new Web3(new Web3.providers.HttpProvider(provider));
        this.walletAddress = wallet; 

        this.nonce = -1;
        this.gasAmount = 1000000;

        if(network == 0) {
            this.gasPrice = 1000 * 1000000000;
        } else {
            this.gasPrice = 1000 * 1000000000;
        }

        this.init(network);
    }

    async trig(type, nftId, data) {

        console.log(type, "trigging....");
        if(type == 0) {
            await this.closeTrade(nftId, data);
        } else if(type == 1) {
            await this.executeLimit(nftId, data);
        }
    }

    async closeTrade(id, data) {
        try {
            await this.optionsContract.closeTrade(id, data.price, data.sig, {gasPrice: this.gasPrice, gasLimit: this.gasAmount, nonce: this.nonce++})
        } catch(error) {
            console.log("close catch");
            console.log(error);
        }
    }

    async executeLimit(id, data) {
        try {
            await this.optionsContract.executeLimitOrder(id, data.price, data.sig, {gasPrice: this.gasPrice, gasLimit: this.gasAmount, nonce: this.nonce++})
        } catch(error) {
            console.log("execute catch");
            console.log(error);
        }
    }

    async init(network) {
        if(network == 0) {
            this.optionsAddress = "0x72cCBECE3F4cB0aF63865240F240496BC5E4351d";
        } else {
            this.optionsAddress = "0x72cCBECE3F4cB0aF63865240F240496BC5E4351d";
        }

        this.optionsContract = new ethers.Contract(this.optionsAddress, this.optionsABI, this.signer);

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
