const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {RestError, ResponseFormat} = require('../utils')
const S3 = require('../utils/s3.util')
const Bluebird = require('bluebird')
// TODO sync address data
const {JsonDB} = require('node-json-db')
const {Config} = require('node-json-db/dist/lib/JsonDBConfig')
const jsonDb = new JsonDB(new Config('./src/constants/address.json', true, false, '/'))
const Queue = require('../services/queue')
const {QUEUE_NAME} = require('../constants/job.constant')
const BscService = require('../services/web3/bsc/bsc')
const {encrypt} = require('../utils/encrypt.util')

class Kyc {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
        this.stepMap = {
            [CONSTANTS.EntityConst.KYC.TYPE.ID_CARD]: CONSTANTS.EntityConst.KYC.STEP.STEP_DOCCUMENT,
            [CONSTANTS.EntityConst.KYC.TYPE.PASSPOST]: CONSTANTS.EntityConst.KYC.STEP.STEP_DOCCUMENT,
            [CONSTANTS.EntityConst.KYC.TYPE.PERSIONAL]: CONSTANTS.EntityConst.KYC.STEP.STEP_PERSONAL,
            [CONSTANTS.EntityConst.KYC.TYPE.INVOICE]: CONSTANTS.EntityConst.KYC.STEP.STEP_ADDRESS,
        }
    }

    _mapTypeToStep = (type) => {
        if (!this.stepMap.hasOwnProperty(type)) {
            throw RestError.NewBadRequestError('Invalid document type')
        }
        return this.stepMap[type]
    }

    _validateDoc = (type, side, file) => {
        if (!file) {
            throw RestError.NewBadRequestError('File not found')
        }

        if (!Object.values(CONSTANTS.EntityConst.KYC.TYPE).includes(type)) {
            throw RestError.NewBadRequestError('Invalid document type')
        }

        if ([CONSTANTS.EntityConst.KYC.TYPE.ID_CARD, CONSTANTS.EntityConst.KYC.TYPE.PASSPOST].includes(type)) {
            if (!side || !Object.values(CONSTANTS.EntityConst.KYC.SIDE).includes(side)) {
                throw RestError.NewBadRequestError('Invalid document side. required value: FR or BA')
            }
        }
    }

    updateGeneralInfo = async ({user, name, phone, birthday, gender, add_info, country}) => {
        try {
            const data = await this.action.Kyc.updateGeneral({
                userId: user._id,
                name,
                phone,
                birthday,
                gender,
                add_info,
                country,
            })
            return ResponseFormat.formatResponseObj({data})
        } catch (error) {
            throw error
        }
    }

    _retrieveImages = async (kyc, trim = false) => {
        const image_keys = ['front_doc_img', 'back_doc_img', 'img_location', 'behind_doc_img']
        for (let step of Object.values(CONSTANTS.EntityConst.KYC.STEP)) {
            if (kyc[step]) {
                await Bluebird.map(
                    Object.keys(kyc[step]),
                    async (key) => {
                        if (image_keys.includes(key) && kyc[step][key]) {
                            if (trim) {
                                //console.log('Delete ', step, key)
                                delete kyc[step][key]
                            } else {
                                let s3Key = kyc[step][key].split('com/')
                                s3Key = s3Key && s3Key.length >= 2 ? s3Key[1] : null
                                kyc[step][key] = await S3.getImageBase64(s3Key)
                            }
                        }
                    },
                    {concurrency: 1},
                )
            }
        }

        return kyc
    }

    uploadDoc = async ({type, side, file, user, additional}) => {
        try {
            this._validateDoc(type, side, file)

            const filename = `${type}-${side}`
            const {Location: location, Bucket, Key} = await S3.uploadImagePublic(file, filename, 'kyc', user._id, null)
            const step = this._mapTypeToStep(type)
            const status = CONSTANTS.EntityConst.KYC.STATUS.PENDING

            const rst = await this.action.Kyc.updateKyc({
                userId: user._id,
                step,
                type,
                side,
                location,
                status,
                additional,
            })
            await this._retrieveImages(rst)
            return ResponseFormat.formatResponse(200, '', rst)
        } catch (error) {
            console.log(`[KYC] error`, error)
            throw error
        }
    }

    adminConfirm = async (userId, step, note, side) => {
        let data = await this.action.Kyc.updateKyc({
            userId,
            step,
            side,
            status: CONSTANTS.EntityConst.KYC.STATUS.COMPLETED,
            note,
        })
        data = data.toObject()
        await this._retrieveImages(data, true)

        if (data.status === CONSTANTS.EntityConst.KYC.STATUS.COMPLETED) {
            // Add whitelist\
            let bcwallet = await this.model.BcWallet.findOne({user: userId})
            if (!bcwallet) {
                const newWallet = BscService.generateAccount(process.env[`${process.env.MODE}_USER_NMEMONIC_ENABLE`])
                bcwallet = await this.model.BcWallet.createOne({
                    user: userId,
                    address: newWallet.address,
                    private_key: encrypt(newWallet.privateKey),
                    mnemonic: newWallet.mnemonic,
                    default: true,
                })
            }
            await Queue.add(QUEUE_NAME.CONTRACT_ADD_WHITELIST, {address: bcwallet.address})
        }


        return ResponseFormat.formatResponseObj({data})
    }

    adminReject = async (userId, step, note, side) => {
        let data = await this.action.Kyc.updateKyc({
            userId,
            step,
            side,
            status: CONSTANTS.EntityConst.KYC.STATUS.REJECTED,
            note,
        })
        data = data.toObject()
        await this._retrieveImages(data, true)
        console.log({data})
        return ResponseFormat.formatResponseObj({data})
    }

    adminList = async ({limit = 100, page = 1, status = '', search = null, sortBy = 'updatedAt', sortDirection = -1}) => {
        // list all kyc
        try {
            limit = parseInt(limit)
            page = parseInt(page)
            let data = await this.action.Kyc.getKycs({limit, page, status, search, sortBy, sortDirection})
            data.kycs = await Bluebird.map(data.kycs, async (kyc) => {
                await this._retrieveImages(kyc, true)
                return kyc
            })

            return ResponseFormat.formatResponseObj({data})
        } catch (error) {
            throw error
        }
    }
    get = async (user, image = true) => {
        // get an user kyc
        const data = await this.action.Kyc.getKyc(user._id ? user._id : user)

        if (image) {
            await this._retrieveImages(data)
        }
        return ResponseFormat.formatResponseObj({data})
    }

    isVerified = async () => {
        const status = this.action.Kyc.getKycStatus(user._id)

        return status == CONSTANTS.EntityConst.KYC.STATUS.COMPLETED
    }

    address = async (province, district) => {
        let idx1 = -1,
            idx2 = -1

        if (province) {
            idx1 = jsonDb.getIndex('/data', province, 'codename')
        }
        if (district && idx1 > -1) {
            idx2 = jsonDb.getIndex(`/data[${idx1}]/districts`, district, 'codename')
        }
        let path = '/data'
        if (idx1 > -1) path += `[${idx1}]/districts`
        if (idx2 > -1) path += `[${idx2}]/wards`

        const len = jsonDb.count(path)
        const data = []
        for (let i = 0; i < len; i++) {
            const name = jsonDb.getObject(`${path}[${i}]/name`)
            const codename = jsonDb.getObject(`${path}[${i}]/codename`)
            data.push({name, codename})
        }
        return ResponseFormat.formatResponseObj({data})
    }
}

module.exports = Kyc
