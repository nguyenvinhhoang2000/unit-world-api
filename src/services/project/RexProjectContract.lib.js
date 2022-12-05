const { RexProjectContract, UsdrTokenContract } = require('./index')
const Web3 = require('web3')
const { getWeb3 } = require('../web3/index')
const REX_CONTRACT = process.env[`${process.env.MODE}_REX_CONTRACT`]
const OWNER_ADDRESS = process.env[`${process.env.MODE}_OWNER_ADDRESS`]
const OWNER_PRIVATE_KEY = process.env[`${process.env.MODE}_OWNER_PRIVATE_KEY`]
const InputDataDecoder = require('ethereum-input-data-decoder');
const ABI = require('./contracts/project/BRealEstate.json')
const { CacheService } = require('../cache')
const { CacheConst } = require('../../constants')
const decoder = new InputDataDecoder(ABI);
const Utils = require('../../utils')

class BreP2pLib {
    constructor() {
        this.callFuncAbiMethod = async (method, privateKey = OWNER_PRIVATE_KEY, from = OWNER_ADDRESS, gas = false) => {
            try {
                const web3 = getWeb3()
                let gasPrice = await web3.eth.getGasPrice()

                let txData = method.encodeABI()
                const data = {
                    from: from,
                    to: REX_CONTRACT,
                    data: txData,
                }
                let estimateGas = await web3.eth.estimateGas(data)
                if (gas) {
                    return estimateGas
                }

                let tx = {
                    to: REX_CONTRACT,
                    value: 0,
                    gas: estimateGas,
                    gasPrice: gasPrice,
                    data: txData,
                }

                console.log(tx)
                const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
                console.log('signed.')
                const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)

                return receipt
            } catch (error) {
                throw error
            }
        }
    }

    getTransactionDecode = async (txHash) => {
        // Get transaction details
        const trans = await getWeb3().eth.getTransaction(txHash)
        if (!trans || !trans.input) {
            throw new Error(`Transaction ${txHash} is null`)
        }
        const result = decoder.decodeData(trans.input);

        return result
    }

    getTransactionLogs = async (txHash, eventName, filter = {}) => {
        // Get transaction details
        const trans = await getWeb3().eth.getTransaction(txHash)
        console.log({trans})
        if (!trans || !trans.input) {
            throw new Error(`Transaction ${txHash} is null`)
        }

        const logs = await RexProjectContract.getPastEvents(eventName, {
            filter,
            fromBlock: trans.blockNumber,
            toBlock: trans.blockNumber
        })

        return logs.find(l => l.transactionHash === txHash)
    }

    //permission: owner
    addAdmin = async (addrs, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.addAdmin(addrs)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    //permission: owner
    removeAdmin = async (addrs, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.removeAdmin(addrs)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    //permission: admin
    addWhitelist = async (addrs, privateKey = OWNER_PRIVATE_KEY, from = OWNER_ADDRESS) => {
        try {
            let method = await RexProjectContract.methods.addWhitelist(addrs)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    //permission: admin
    removeWhitelist = async (addrs, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.removeWhitelist(addrs)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    createProject = async ({
        _symbol,
        _lockedTime,
        _startTime,
        _endTime,
        _expectedInterestRate,
        _circulatingSupply,
        _totalSupply,
        _idoPrice,
        _minBuyIdo,
        _maxBuyIdo,
    }) => {
        try {
            let method = await RexProjectContract.methods.createProject(
                _symbol,
                _lockedTime,
                _startTime,
                _endTime,
                _expectedInterestRate,
                _circulatingSupply,
                _totalSupply,
                _idoPrice,
                _minBuyIdo,
                _maxBuyIdo,
            )
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    deleteProject = async (_symbol) => {
        try {
            let method = await RexProjectContract.methods.createProject(_symbol)
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    updateIdoInfo = async (_symbol, _lockedTime, _startTime, _endTime, _expectedInterestRate) => {
        try {
            let method = await RexProjectContract.methods.updateIdoInfo(
                _symbol,
                _lockedTime,
                _startTime,
                _endTime,
                _expectedInterestRate,
            )
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    buyIdoGas = async ({ _symbol, _amount, privateKey, from }) => {
        try {
            let method = await RexProjectContract.methods.buyIdo(_symbol, _amount)
            return await this.callFuncAbiMethod(method, privateKey, from, true)
        } catch (error) {
            throw error
        }
    }

    buyIdo = async ({ _symbol, _amount, privateKey, from }) => {
        try {
            console.log(`[BreContract] buy IDO ${_symbol} ${_amount} to ${REX_CONTRACT}`)
            let method = await RexProjectContract.methods.buyIdo(_symbol, _amount)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    getProject = async (symbol, cache = true) => {
        try {
            let project = await CacheService.getObj(`${CacheConst.CACHE_KEY.CONTRACT_PROJECT}:${symbol}`)
            if (!cache || !project) {
                console.log(`[RexProjectContractLib] get project ${symbol} via blockchain`)
                project = await RexProjectContract.methods.projects(symbol).call()
                await CacheService.setObj(`${CacheConst.CACHE_KEY.CONTRACT_PROJECT}:${symbol}`, project, CacheConst.CACHE_TIME.CONTRACT_PROJECT)
            }
            return project
        } catch (error) {
            throw error
        }
    }


    getBuyerOffer = async (index, cache = true) => {
        try {
            let offer = await CacheService.getObj(`${CacheConst.CACHE_KEY.CONTRACT_OFFER}:${index}`)
            if (!cache || !offer) {
                console.log(`[RexProjectContractLib] get offer ${index} via blockchain`)
                offer = await RexProjectContract.methods.buyerOffers(index).call()
                offer.index = index
                await CacheService.setObj(`${CacheConst.CACHE_KEY.CONTRACT_OFFER}:${index}`, offer, CacheConst.CACHE_TIME.CONTRACT_OFFER)
            }
            return {
                "index": offer.index,
                "buyer": offer.buyer,
                "symbol": offer.symbol,
                "offerValue": Utils.Token.weiToEther(offer.offerValue),
                "totalVoter": offer.totalVoter,
                "start": offer.start,
                "end": offer.end,
                "accepted": offer.accepted,
                "rejected": offer.rejected,
                "isCanceled": offer.isCanceled
            }
        } catch (error) {
            console.log(error.message)
            return null
            // throw error
        }
    }

    addBuyerOffer = async (_buyer, _symbol, _offerValue, _startTime, _endTime) => {
        try {
            let method = await RexProjectContract.methods.addBuyerOffer(_buyer, _symbol, _offerValue, _startTime, _endTime)
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    voteAcceptOffer = async (offerIndex, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.voteAcceptOffer(offerIndex)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    voteRejectedOffer = async (offerIndex, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.voteRejectedOffer(offerIndex)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    cancelVoteOffer = async (offerIndex, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.cancelVoteOffer(offerIndex)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    cancelOffer = async (offerIndex) => {
        try {
            let method = await RexProjectContract.methods.cancelOffer(offerIndex)
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    distributeProject = async (_symbol, usdtrexRatio) => {
        try {
            let method = await RexProjectContract.methods.distributeProject(_symbol, usdtrexRatio)
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    refundProject = async (_symbol) => {
        try {
            let method = await RexProjectContract.methods.refundProject(_symbol)
            return await this.callFuncAbiMethod(method)
        } catch (error) {
            throw error
        }
    }

    claimReward = async (_symbol, _stockAmount, privateKey, from) => {
        try {
            let method = await RexProjectContract.methods.claimReward(_symbol, _stockAmount)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    //remove
    exchangeStock = async (
        _symbol,
        _seller,
        _stockAmount,
        _tokenAmount,
        privateKey = OWNER_PRIVATE_KEY,
        from = OWNER_ADDRESS,
    ) => {
        try {
            let method = await RexProjectContract.methods.exchangeStock(_symbol, _seller, _stockAmount, _tokenAmount)
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }

    exchangeP2pStockFiat = async ({
        _symbol,
        _buyer,
        _seller,
        _stockAmount,
        _fiatAmount,
        _rateStockFiat,
        fiatType,
        privateKey = OWNER_PRIVATE_KEY,
        from = OWNER_ADDRESS,
    }
    ) => {
        console.log({
            _symbol,
            _buyer,
            _seller,
            _stockAmount,
            _fiatAmount,
            _rateStockFiat,
            fiatType,
        })
        try {
            let method = await RexProjectContract.methods.exchangeP2pStockFiat(
                _symbol,
                _buyer,
                _seller,
                _stockAmount,
                _fiatAmount,
                _rateStockFiat,
                fiatType,
            )
            return await this.callFuncAbiMethod(method, privateKey, from)
        } catch (error) {
            throw error
        }
    }
    getClaimInfo = async (_symbol, _address) => {
        try {
            return await RexProjectContract.methods.getClaimInfo(
                _symbol, _address
            ).call()

        } catch (error) {
            throw error
        }
    }
}

const ContractProjectLib = new BreP2pLib()
exports.ContractProjectLib = ContractProjectLib
