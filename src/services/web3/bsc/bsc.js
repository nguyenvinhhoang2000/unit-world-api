const {getWeb3} = require('../index')
const Contract = require('../contract')
const BigNumber = require('bignumber.js')
const {TokenConst, EntityConst} = require('../../../constants')
const ethers = require('ethers')
const USDT_BSC_CONTRACT = TokenConst.BSC_TOKEN[process.env.MODE].USDT //usdt
const {CacheService} = require('../../cache')
const { ENV, Encrypt } = require('../../../utils')
const { ContractTokenLib } = require('../../project/UsdrTokenContract.lib')
const { RexTokenLib } = require('../../project/RexTokenContract.lib')

const OWNER_ADDRESS = process.env[`${process.env.MODE}_OWNER_ADDRESS`]
const OWNER_PRIVATE_KEY = process.env[`${process.env.MODE}_OWNER_PRIVATE_KEY`]

const getLatestBlockNumber = async () => {
    let blockNumber = await CacheService.get(`bsc-getLatestBlockNumber`)
    if(!blockNumber) {
        blockNumber = await getWeb3().eth.getBlockNumber()
        await CacheService.set(`bsc-getLatestBlockNumber`, blockNumber, 5) // last long 5 second
    }
    return Number(blockNumber)
}

const generateAccount = (mnemonic = true) => {
    if (mnemonic) {
        const randomMnemonic = ethers.Wallet.createRandom().mnemonic
        const wallet = ethers.Wallet.fromMnemonic(randomMnemonic.phrase)
        return {
            privateKey: wallet.privateKey,
            address: wallet.address,
            mnemonic: randomMnemonic.phrase,
        }
    }

    const account = getWeb3().eth.accounts.create()
    return {
        privateKey: account.privateKey,
        address: getWeb3().utils.toChecksumAddress(account.address),
    }
}

const importMnemonic = (mnemonic) => {
    let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic)

    return {
        privateKey: mnemonicWallet.privateKey,
        address: mnemonicWallet.address,
    }
}

setImmediate(() => {
    generateAccount()
})

const getBscTokenBalance = async (tokenAddress, user) => {
    try {
        const token = Contract.constructTokenContract(tokenAddress)
        //let balance = (await token.methods.balanceOf(user).call({ from: process.env[`${process.env.MODE}_BSC_ACCOUNT_COLLECTION_ADDRESS`] }) / 10 ** 18)
        const balance = (await token.methods.balanceOf(user).call()) / TokenConst.TOKEN_UNIT.WEI

        console.log({balance})
        return balance
    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

const getBnbBalance = async (address) => {
    try {
        let balance = await getWeb3().eth.getBalance(address)
        console.log({balance})
        return balance / TokenConst.TOKEN_UNIT.WEI
    } catch (error) {
        throw error
    }
}
// getBnbBalance('0x615898F2ACbE77AB1b50BAB7D55ed2C6256E0D1D')
const createBscBnbTransfer = async (to, value, from = OWNER_ADDRESS, privateKey = OWNER_PRIVATE_KEY) => {
    try {
        const gasPrice = await getWeb3().eth.getGasPrice(from)
        if (gasPrice > 20 * 10 ** 9) {
            const eMsg = `Gas = ${gasPrice} - verify high -> stop collection`
            console.log(eMsg)
            throw new Error(eMsg)
        }
        const nonce = await getWeb3().eth.getTransactionCount()
        let amount = new BigNumber(value).multipliedBy(10 ** 18).integerValue()

        let tx = {
            to: to,
            from: from,
            value: amount,
            gas: 50000,
            gasPrice: gasPrice,
            data: '',
            nonce: nonce,
        }

        const signed = await getWeb3().eth.accounts.signTransaction(tx, privateKey)
        const receipt = await getWeb3().eth.sendSignedTransaction(signed.rawTransaction)
        // console.log(`receipt = `, receipt)

        console.log(
            '[',
            Date(),
            ']',
            'META RECEIPT - tx:',
            receipt.transactionHash,
            ' - block: ',
            receipt.blockNumber,
            ' - blockHash: ',
            receipt.blockHash,
        )
        console.log('Finish transfer BNB', 'to ', to, ' amount: ', value)
        return receipt
    } catch (error) {
        console.log(error)
        // throw new Error(error)
    }
}

const createBscBnbTransferFromOwner = async (to, value) => {
    try {
        const gasPrice = await getWeb3().eth.getGasPrice()
        if (gasPrice > 20 * 10 ** 9) {
            const eMsg = `Gas = ${gasPrice} - verify high -> stop collection`
            console.log(eMsg)
            throw new Error(eMsg)
        }
        const nonce = await getWeb3().eth.getTransactionCount(OWNER_ADDRESS)
        let amount = new BigNumber(value).multipliedBy(10 ** 18).integerValue()

        let tx = {
            to: to,
            from: OWNER_ADDRESS,
            value: amount,
            gas: 50000,
            gasPrice: gasPrice,
            data: '',
            nonce: nonce,
        }

        const signed = await getWeb3().eth.accounts.signTransaction(tx, OWNER_PRIVATE_KEY)
        const receipt = await getWeb3().eth.sendSignedTransaction(signed.rawTransaction)
        // console.log(`receipt = `, receipt)

        console.log(
            '[',
            Date(),
            ']',
            'META RECEIPT - tx:',
            receipt.transactionHash,
            ' - block: ',
            receipt.blockNumber,
            ' - blockHash: ',
            receipt.blockHash,
        )
        console.log('Finish transfer BNB', 'to ', to, ' amount: ', value)
        return receipt
    } catch (error) {
        console.log(error)
        // throw new Error(error)
    }
}


const createBscTransferToken = async (tokenAddress, to, value, privateKey, from) => {
    try {
        const token = Contract.constructTokenContract(tokenAddress)
        const gasPrice = await getWeb3().eth.getGasPrice()
        console.log(`gasPrice = `, gasPrice)
        if (gasPrice > 20 * 10 ** 9) {
            console.log(`Gas = ${gasPrice} - verify high -> stop collection`)
            return null
        }
        const nonce = await getWeb3().eth.getTransactionCount(from)

        const method = token.methods.transfer(to, new BigNumber(value).multipliedBy(10 ** 18).integerValue())
        // console.log(`tokenAddress = `, tokenAddress)
        // console.log(`method = `, method)
        const txData = method.encodeABI()
        console.log(`txData = `, txData)
        let estimateGas = await getWeb3().eth.estimateGas({
            from: from,
            to: USDT_BSC_CONTRACT,
            data: txData,
        })
        console.log(`estimateGas = `, estimateGas.toString())
        let tx = {
            to: USDT_BSC_CONTRACT,
            value: 0,
            from: from,
            gas: estimateGas,
            gasPrice: gasPrice,
            data: txData,
            nonce: nonce,
        }

        const signed = await getWeb3().eth.accounts.signTransaction(tx, privateKey)
        const receipt = await getWeb3().eth.sendSignedTransaction(signed.rawTransaction)
        // console.log(`receipt = `, receipt)

        console.log(
            '[',
            Date(),
            ']',
            'META RECEIPT - tx:',
            receipt.transactionHash,
            ' - block: ',
            receipt.blockNumber,
            ' - blockHash: ',
            receipt.blockHash,
        )
        console.log('Finish transfer to ', to, ' amount: ', value)
        return receipt
    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

const getConfirmations = async (txHash) => {
    try {
      // Get transaction details
      const trx = await getWeb3().eth.getTransaction(txHash)
  
      // Get current block number
      const currentBlock = await getLatestBlockNumber()
  
      // When transaction is unconfirmed, its block number is null.
      // In this case we return 0 as number of confirmations
      return trx.blockNumber === null ? 0 : currentBlock - Number(trx.blockNumber)
    }
    catch (error) {
      console.log(error)
    }
  }

const ensureBnbFee = async(address) => {
    console.log(`Prepare fee BNB..`)
    const gasFee = ENV.getEnv('GAS_FEE', 0.005)
    const bnbValue = await getBnbBalance(address)
    if (bnbValue < gasFee) {
        console.log(`Sending to ${address} ${gasFee} BNB`)
        const transfer = await createBscBnbTransferFromOwner(address, gasFee)
        console.log({transfer})
    }
    console.log(`Current user has ${bnbValue} BNB`)
}

const ensureTokenApproval = async(wallet, spender, tokenSymbol) => {
    if(!wallet.approved.includes(tokenSymbol)) {
        console.log(`Approve token`)
        let data = {
            spender, 
            amount: TokenConst.TOKEN_UNIT.MAX_APPROVAL,
            privateKey: Encrypt.decrypt(wallet.private_key)
        }
        const contract = (tokenSymbol == TokenConst.TOKEN.REX)? RexTokenLib: ContractTokenLib
        const approvedToken = await contract.approve(data)
        if(!approvedToken) throw new Error('Failed to approve bre token', data)
        console.log({approvedToken})
        wallet.approved = [...wallet.approved, tokenSymbol]
        await wallet.save()
    }
}

module.exports = {
    getLatestBlockNumber,
    generateAccount,
    getBscTokenBalance,
    createBscBnbTransfer,
    createBscTransferToken,
    getBnbBalance,
    importMnemonic,
    getConfirmations,
    createBscBnbTransferFromOwner,
    ensureBnbFee,
    ensureTokenApproval
}
