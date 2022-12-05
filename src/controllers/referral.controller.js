const CONSTANTS = require('../constants')
const {RestError, ResponseFormat} = require('../utils')
const {getEnv} = require('../utils/getEnv.util')
const QRCode = require('qrcode')
const Promise = require('bluebird')
const { getPagination } = require('../utils/common.util')
class Referral {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    get = async (user) => {
        const data = await this.model.Referral.getModel().findOne({user: user._id}).lean()
        const url = `${getEnv('DOMAIN', 'http://localhost:3000')}/register?referrer=${data && data.code}`
        data.referUrlQR = await QRCode.toDataURL(url)
        data.referUrl = url
        return ResponseFormat.formatResponseObj({data})
    }

    listReferrals = async ({user, page, limit, filter, sort, key_search}) => {
        console.log(`list referral`)
        const pagination = getPagination(page, limit)
        const kycFilter = {}
        sort = Object.assign({ "updatedAt": -1 }, sort)

        filter = filter ? filter : {}
        Object.keys(filter).map(key => {
            if(key.startsWith(`kyc.`)) {
                kycFilter[key.replace('kyc.', '')] = filter[key]
                delete filter[key]
            }
        })

        if (key_search) {
            filter = Object.assign(filter || {}, {
                $or: [
                    {username: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {email: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {phone: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {name: { $regex: `.*${key_search}.*`, $options: 'i' }},
                ]
            })
        }

        const myRef = await this.model.Referral.findOne({user: user._id})
        if (!myRef) {
            throw RestError.NewNotFoundError(`[Referral] not found for user ${user._id}`)
        }
        const {code} = myRef

        const refs = await this.model.Referral.getModel().aggregate([{
                $match: { 
                    referrer: code
                }
                },{
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        pipeline: [ {
                                $match: filter
                            }, { 
                                $project: { 
                                    kyc:1, _id:1, 
                                    role:1, email:1, 
                                    username:1, name:1, 
                                    country:1, birthday:1, 
                                    status:1, avatar:1, 
                                    gender:1, phone:1 
                                }
                            }
                        ],
                        as: "users"
                    },
                }, {
                    $lookup: {
                        from: "kycs",
                        localField: "user",
                        foreignField: "user",
                        pipeline: [ { 
                            $match: kycFilter
                            }, { 
                                $project: { status:1 }
                            }
                        ],
                        as: "kycs"
                    },
                }, {
                    $match: { 
                        $and: [ 
                            {kycs: { $ne: null }}, 
                            { kycs: { $ne: [] }},
                            {users: { $ne: null }}, 
                            { users: { $ne: [] }}
                        ]
                    }
                },
                { $sort: sort },
                { $skip: pagination.skip },
                { $limit: pagination.limit }
            ])
        
        const total = await this.model.Referral.getModel().aggregate([{
            $match: { 
                referrer: code
            }
            },{
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    pipeline: [ {
                            $match: filter
                        }, { 
                            $project: { 
                                _id:1
                            }
                        }
                    ],
                    as: "users"
                },
            }, {
                $lookup: {
                    from: "kycs",
                    localField: "user",
                    foreignField: "user",
                    pipeline: [ { 
                        $match: kycFilter
                        }, { 
                            $project: { _id:1 }
                        }
                    ],
                    as: "kycs"
                },
            }, {
                $match: { 
                    $and: [ 
                        {kycs: { $ne: null }}, 
                        { kycs: { $ne: [] }},
                        {users: { $ne: null }}, 
                        { users: { $ne: [] }}
                    ]
                }
            }, {
                $count: "total"
             }
        ])

        console.log({total})
        let totalDeposit = 0

        await Promise.map(
            refs,
            async (ref) => {
                // Get vnd deposit
                let vndDeposit = await this.model.BankDeposit.getModel().aggregate([
                    {
                        $match: {
                            owner: ref.user,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: '$quantity'},
                        },
                    },
                ])
                vndDeposit = vndDeposit && vndDeposit.length > 0 ? vndDeposit[0].amount : 0
                // Get usdt deposit
                let usdtDeposit = await this.model.Transaction.getModel().aggregate([
                    {
                        $match: {
                            type: CONSTANTS.EntityConst.TRANSACTION.TYPE.DEPOSIT,
                            user: ref.user,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            amount: {$sum: '$amount'},
                        },
                    },
                ])
                usdtDeposit = usdtDeposit && usdtDeposit.length > 0 ? usdtDeposit[0].amount : 0

                const deposit = usdtDeposit > 0 || vndDeposit > 0 ? true : false
                if (deposit) totalDeposit++

                ref.user = ref.users[0]
                ref.kyc = ref.kycs[0]
                delete ref.users
                //delete ref.kycs
                Object.assign(ref, {
                    usdtDeposit,
                    vndDeposit,
                    deposit,
                })
            }, {concurrency: 3})

        return ResponseFormat.formatResponseObj({
            data: {
                total: total && total.length > 0 && total[0].total,
                totalDeposit,
                refs
            },
        })
    }

    reward = async ({amount, userId, note}) => {
        const data = await this.action.Referral.reward({userId, amount, note})
        return ResponseFormat.formatResponseObj({data})
    }

    adminRewardStatistic = async ({filter}) => {
        const totalRewardedUsers = await this.model.TransactionLog.getModel().distinct('to', filter)
        const totalRewardedBre = await this.model.TransactionLog.getModel().aggregate([
            {
                $match: filter,
            },
            {
                $group: {
                    _id: null,
                    amount: {$sum: '$amount'},
                },
            },
        ])

        return ResponseFormat.formatResponseObj({
            data: {
                totalRewardedUsers: totalRewardedUsers.length,
                totalRewardedBre:
                    totalRewardedBre && totalRewardedBre.length > 0 ? Number(totalRewardedBre[0].amount.toFixed(5)) : 0,
            },
        })
    }

    rewardHistory = async ({userId, search, filter, sort, page = 1, limit = 100}) => {
        const query = Object.assign({}, filter)
        sort = Object.assign({}, sort)
        const pagination = {
            skip: Number(page - 1) * Number(limit),
            limit: limit,
        }

        if (userId) query.to = userId
        else if (search) {
            const users = await await this.model.User.getModel()
                .find({
                    $or: [
                        {name: {$regex: `.*${search}.*`, $options: 'i'}},
                        {phone: {$regex: `.*${search}.*`, $options: 'i'}},
                        {email: {$regex: `.*${search}.*`, $options: 'i'}},
                    ],
                })
                .select('_id')
                .lean()
            if (users.length > 0) {
                query.to = {
                    $in: users,
                }
            }
        }

        console.log({query, sort})

        const total = await this.model.TransactionLog.getModel().count(query)
        const data = await this.model.TransactionLog.getModel()
            .find(query)
            .sort(sort)
            .skip(pagination.skip)
            .limit(pagination.limit)
            .populate('to', 'email username name phone')
            .lean()

        return ResponseFormat.formatResponseObj({
            data: {
                total: total,
                rewards: data,
            },
        })
    }

    setReferralConfig = async ({registration, ido_investment}) => {
        const value = {}

        if (!registration && !ido_investment) throw RestError.NewBadRequestError('INCORRECT_INPUT_PARAMS')
        if (registration) value.registration = registration
        if (ido_investment) value.ido_investment = ido_investment

        const setting = await this.model.SystemSetting.getModel().findOneAndUpdate(
            {
                key: 'REFERRAL_REWARD',
            },
            {
                'value.registration': Number(registration),
                'value.ido_investment': Number(ido_investment),
            },
            {
                new: true,
                upsert: true,
            },
        )

        return ResponseFormat.formatResponseObj({data: setting})
    }
}

module.exports = Referral
