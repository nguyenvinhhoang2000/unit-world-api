const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { RestError } = require('../utils')

class KycAction {
    static instance

    static getInstance(context) {
        if (!KycAction.instance) {
            KycAction.instance = new KycAction(context)
        }

        return KycAction.instance
    }

    constructor(opts) {
        this.model = opts.model
        this.codeLength = 5
    }

    updateGeneral = async ({ userId, name, phone, birthday, gender, add_info, country }) => {
        if (!add_info) console.log(`[KYC] update infor for user ${userId}`)
        let kyc = await this.model.Kyc.findOne({ user: userId })
        if (!kyc) {
            kyc = await this.model.Kyc.createOne({
                user: userId,
                status: CONSTANTS.EntityConst.KYC.STATUS.PENDING,
                lastest_update: Date.now(),
            })

            //update user
            await this.model.User.findOneAndUpdate({
                _id: userId
            }, { kyc: kyc._id })
        }

        if (kyc['step_1']['status'] == CONSTANTS.EntityConst.KYC.STATUS.COMPLETED)
            throw RestError.NewNotAcceptableError('KYC_ALREADY_DONE')

        const userInfo = {}
        name && (userInfo.name = name)
        phone && (userInfo.phone = phone)
        birthday && (userInfo.birthday = birthday)
        gender && (userInfo.gender = gender)
        add_info && (userInfo.add_info = add_info)
        country && (userInfo.country = country)

        let info = await this.model.User.findOneAndUpdate({ _id: userId }, userInfo)
        kyc['step_1']['status'] = CONSTANTS.EntityConst.KYC.STATUS.PROCESSING

        const { verified, rejected } = this._checkAllVerified(kyc)
        if (rejected) {
            kyc['status'] = CONSTANTS.EntityConst.KYC.STATUS.REJECTED
        } else {
            kyc['status'] = CONSTANTS.EntityConst.KYC.STATUS.PROCESSING
        }

        await kyc.save()

        info = info.toObject()
        delete info.password
        delete info.password_salt
        delete info.password_alg
        info.status = kyc.status

        // console.log({info, kyc})
        return info
    }

    _checkAllVerified = (kyc) => {
        let verified = true
        let rejected = false

        Object.values(CONSTANTS.EntityConst.KYC.STEP).map((step) => {
            let status = kyc[step] && kyc[step]['status']
            if (!Array.isArray(status)) status = [status]

            status.map((s) => {
                if (s != CONSTANTS.EntityConst.KYC.STATUS.COMPLETED) {
                    verified = false
                }

                if (s == CONSTANTS.EntityConst.KYC.STATUS.REJECTED) {
                    rejected = true
                }
            })
        })

        return { verified, rejected }
    }

    updateKyc = async ({ userId, step, type, location, side, status, additional, note }) => {
        console.log({ additional })
        let kyc = await this.model.Kyc.findOne({ user: userId })
        if (!kyc) {
            kyc = await this.model.Kyc.createOne({
                user: userId,
                status: CONSTANTS.EntityConst.KYC.STATUS.PENDING,
                lastest_update: Date.now(),
            })
        }
        if (kyc[step] && kyc[step]['status'] == CONSTANTS.EntityConst.KYC.STATUS.COMPLETED) {
            throw RestError.NewNotAcceptableError(`This verification step already done`)
        }

        if (step == CONSTANTS.EntityConst.KYC.STEP.STEP_DOCCUMENT) {
            type && (kyc[step]['type'] = type)
            if (location) {
                if (side == CONSTANTS.EntityConst.KYC.SIDE.BACK) kyc[step]['behind_doc_img'] = location
                else kyc[step]['front_doc_img'] = location
            }

            const s = JSON.parse(JSON.stringify(kyc[step]['status']))
            if (side == CONSTANTS.EntityConst.KYC.SIDE.FRONT) {
                if (status) {
                    s[0] = status
                    kyc[step]['status'] = s
                }
            } else if (side == CONSTANTS.EntityConst.KYC.SIDE.BACK) {
                if (status) {
                    s[1] = status
                    kyc[step]['status'] = s
                }
            } else {
                status && (kyc[step]['status'] = [status, status])
            }
        } else {
            location && (kyc[step]['img_location'] = location)
            status && (kyc[step]['status'] = status)
            type && (kyc[step]['type'] = type)
            additional && (kyc[step]['additional'] = additional)
        }

        const { verified, rejected } = this._checkAllVerified(kyc)
        if (rejected) {
            kyc['status'] = CONSTANTS.EntityConst.KYC.STATUS.REJECTED
            note && (kyc[step]['note'] = note)
        } else if (verified) {
            kyc['status'] = CONSTANTS.EntityConst.KYC.STATUS.COMPLETED
        } else {
            kyc['status'] = CONSTANTS.EntityConst.KYC.STATUS.PROCESSING
        }
        return await kyc.save({ new: true })
    }

    getKyc = async (userId) => {
        const user = await this.model.User.findOne({ _id: userId }, {}, '', '', true)
        console.log(user, userId)
        if (!user) throw RestError.NewNotFoundError('USER_NOT_FOUND')
        delete user['password']
        delete user['password_salt']
        delete user['password_alg']
        delete user['status']
        const kyc = await this.model.Kyc.findOne({ user: userId }, {}, '', '', true)
        if (!kyc) {
            user.status = CONSTANTS.EntityConst.KYC.STATUS.PENDING
        }

        return Object.assign({}, user, kyc)
    }

    getKycs = async ({ status, page, limit, search, sortBy, sortDirection }) => {
        const query = status ? { status } : {}

        let users = []
        if (search) {
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                // Yes, it's a valid ObjectId
                query['_id'] = search;
            } else {
                users = await this.model.User.getModel()
                .find({
                    $or: [
                        { username: { $regex: `.*${search}.*`, $options: 'i' } },
                        { phone: { $regex: `.*${search}.*`, $options: 'i' } },
                        { email: { $regex: `.*${search}.*`, $options: 'i' } },
                    ],
                })
                .select('_id')
                .lean()
                query.user = { $in: users.map((u) => u._id) }
            }
        }
        console.log({ search, users, query })
        const total = await this.model.Kyc.getModel().countDocuments(query)
        const kycs = await this.model.Kyc.getModel()
            .find(query)
            .sort({ [sortBy]: sortDirection })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('user', 'username name email phone gender')
            .lean() // Todo: improve query perf by avoid using skip

        return { total, kycs }
    }

    getKycStatus = async (userId, step = '') => {
        const kyc = await this.model.Kyc.findOne({ user: userId })
        if (step) {
            const { status } = (kyc && kyc[step]) || {}
            return status
        }

        const steps = Object.values(CONSTANTS.EntityConst.KYC.STEP)
        for (const step of steps) {
            if (kyc[step] != CONSTANTS.EntityConst.KYC.STATUS.COMPLETED) {
                return kyc[step]
            }
        }

        return CONSTANTS.EntityConst.KYC.STATUS.COMPLETED
    }
}

module.exports = KycAction
