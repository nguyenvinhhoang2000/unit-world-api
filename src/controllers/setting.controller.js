const CONSTANTS = require('../constants')
const {RestError, ResponseFormat} = require('../utils')
const {encrypt} = require('../utils/encrypt.util')
const BscService = require('../services/web3/bsc/bsc')
class Setting {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    addOwnerWallet = async ({user, mnemonic, address, private_key, create_new = false}) => {
        await this.model.BcWallet.findOneAndUpdate({default: true}, {default: false})

        if (create_new) {
            const newWallet = BscService.generateAccount()
            await this.model.BcWallet.createOne({
                user: user._id,
                address: newWallet.address,
                private_key: encrypt(newWallet.privateKey),
                mnemonic: encrypt(newWallet.mnemonic),
                default: true,
            })

            return ResponseFormat.formatResponseObj({
                data: {
                    address: newWallet.address,
                    mnemonic: newWallet.mnemonic,
                },
            })
        }

        if (mnemonic) {
            const importedWallet = BscService.importMnemonic(mnemonic)
            private_key = importedWallet.privateKey
            address = importedWallet.address
        }

        let data = await this.model.BcWallet.findOneAndUpdate(
            {
                $or: mnemonic ? [{mnemonic: encrypt(mnemonic)}, {address}] : [{address}],
            },
            {
                user: user._id,
                mnemonic: mnemonic ? encrypt(mnemonic) : '',
                address,
                private_key: encrypt(private_key),
                default: true,
            },
            {
                new: true,
                insert: true,
            },
        )

        if (!data) {
            throw RestError('WALLET_DUPPLICATE')
        }

        data = data.toObject()
        delete data.mnemonic
        delete data.private_key
        return ResponseFormat.formatResponseObj({data})
    }

    listOwnerWallet = async ({user}) => {
        const data = await this.model.BcWallet.getModel()
            .find({user: user._id})
            .limit(100)
            .select('address user _id default inactive type createdAt updatedAt')
            .sort({createdAt: -1})
            .lean()

        return ResponseFormat.formatResponseObj({data})
    }

    getBlockConfirmation = async ({network = 'BSC'}) => {
        const data = await this.model.SystemSetting.getModel()
            .findOne({
                key: `SCAN_${network}`,
            })
            .lean()

        return ResponseFormat.formatResponseObj({data})
    }

    setBlockConfirmation = async ({network = 'BSC', block, confirmation, limit}) => {
        const updating = {
            key: `SCAN_${network}`,
        }
        if (block) updating['value.block'] = block
        if (confirmation) updating['value.confirmation'] = confirmation
        if (limit) updating['value.limit'] = limit

        const data = await this.model.SystemSetting.getModel().findOneAndUpdate(
            {
                key: `SCAN_${network}`,
            },
            updating,
            {new: true, insert: true},
        )

        return ResponseFormat.formatResponseObj({data})
    }
}

module.exports = Setting
