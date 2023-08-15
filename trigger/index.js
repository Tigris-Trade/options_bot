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
        this.gasAmount = 10000000;

        if(network == 137) {
            this.gasPrice = 500 * 1000000000;
        } else {
            this.gasPrice = 0.1 * 1000000000;
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
        if(network == 137) {
            this.optionsAddress = "0x28969DeD75cf3BCe9f2b6bd49ac92D8Ba8dfc3D1";
        } else {
            this.optionsAddress = "0xc6d1ba6363fFe4FDdA9FFbEa8d91974De9775331";
        }

        this.optionsContract = new ethers.Contract(this.optionsAddress, this.optionsABI, this.signer);

        this.web3.eth.getTransactionCount(
            this.walletAddress,
            "pending"
        ).then(async (nonce) => {
            this.nonce = nonce;
        });

        setInterval(() => {
            this.updateNonce();
        }, 30*1000);
    }

    async updateNonce() {
        console.log("Nonce updated");
        this.nonce = await this.web3.eth.getTransactionCount(
            this.walletAddress,
            "pending"
        );
    }
}
