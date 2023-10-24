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

        console.log(type, "Triggering...");
        if(type == 0) {
            await this.closeTrade(nftId, data);
        } else if(type == 1) {
            await this.executeLimit(nftId, data);
        }
    }

    async closeTrade(id, data) {
        try {
            await this.optionsContract.closeTrade(id, data, {gasPrice: this.gasPrice, gasLimit: this.gasAmount, nonce: this.nonce++})
        } catch(error) {
            console.log("close catch");
            console.log(error);
        }
    }

    async executeLimit(id, data) {
        try {
            await this.optionsContract.executeLimitOrder(id, data, {gasPrice: this.gasPrice, gasLimit: this.gasAmount, nonce: this.nonce++})
        } catch(error) {
            console.log("execute catch");
            console.log(error);
        }
    }

    async init(network) {
        if(network == 137) {
            this.optionsAddress = "0xFeABeC2CaC8A1A2f1C0c181572aA88c8b91288B2";
        } else {
            this.optionsAddress = "0x8895b0B946b3d5bCd7D1E9E31DCfaeB51644922A";
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
