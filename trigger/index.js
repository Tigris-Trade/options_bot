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
        await this.updateNonce();
        if(type == 0) {
            await this.closeTrade(nftId, data);
            this.updateNonce();
        }
    }

    async closeTrade(id, data) {
        console.log(data);
        try {
            await this.optionsContract.closeTrade(id, data.price, data.sig, {gasPrice: this.gasPrice, gasLimit: this.gasAmount})
            // .on('transactionHash', function(hash){
            //     console.log("`Hash: `"+hash);
            // })
            // .on('receipt', function(receipt){
            //     console.log("Close Handled");
            // })
            // .on('error', function(error, receipt) {
            //     console.log(error);
            //     console.log(receipt);
            // });
        } catch(error) {
            console.log("close catch");
            console.log(error);
        }
    }

    async init(network) {
        if(network == 0) {
            this.optionsAddress = "0x2BFf45c93C39ab5D31Bb01300E2dd6EEf59836bC";
        } else {
            this.optionsAddress = "0x2BFf45c93C39ab5D31Bb01300E2dd6EEf59836bC";
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
