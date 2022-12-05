const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { Lang, EntityConst } = CONSTANTS
const { RestError, ResponseFormat } = require('../utils')
const { getPagination } = require('../utils/common.util')
const mongoose = require("mongoose");
class Stake {
    constructor(opts) {
        this.model = opts.model,
            this.ONE_YEAR = 31536000000
    }

    //admin
    createStakePackage = async ({ lang, title, invest_duration, total_pool, min_staking, max_staking, interest, invest_full, invest_part }) => {
        try {
            let code = await this.model.Stake.total({}) + 1
            let stakePackage = await this.model.Stake.create({
                code, title, invest_duration, total_pool, min_staking, max_staking, interest, is_public: true, invest_full, invest_part
            })
            return ResponseFormat.formatResponse(200, 'OK', stakePackage)
        } catch (error) {
            throw error
        }
    }

    //admin
    updateStakePackage = async ({ lang, package_id, title, invest_duration, total_pool, min_staking, max_staking, interest, is_public, invest_full, invest_part }) => {
        try {
            //check update available
            await this.action.Stake.checkAvailableUpdate({ lang, package_id })

            const stakePackage = await this.model.StakePackage.findOneAndUpdate({ _id: package_id }, {
                title, invest_duration, total_pool, min_staking, max_staking, interest, is_public, invest_full, invest_part
            })
            return ResponseFormat.formatResponse(200, 'OK', stakePackage)

        } catch (error) {
            throw error
        }
    }

    //all
    getDetailStakePackage = async ({ lang, package_id }) => {
        try {
            let stakePackage = await this.model.StakePackage.findOne({ _id: package_id })
            return ResponseFormat.formatResponse(200, 'OK', stakePackage)
        } catch (error) {
            throw error
        }
    }

    //all
    getListStakePackage = async ({ page = 1, limit = 20 }) => {
        try {
            let packages = await this.model.StakePackage.findMany({ is_deleted: false }, page, limit)
            return ResponseFormat.formatResponse(200, 'OK', packages)
        } catch (error) {
            throw error
        }
    }

    //admin
    deleteStakePackage = async ({ lang, package_id }) => {
        try {
            //check update available
            await this.action.Stake.checkAvailableUpdate({ lang, package_id })
            let stakePackage = await this.model.StakePackage.findOneAndUpdate({ _id: package_id }, { is_deleted: true })
            return ResponseFormat.formatResponse(200, 'OK', stakePackage)
        } catch (error) {
            throw error
        }
    }

    //user
    staking = async ({ lang, user, package_id, amount }) => {
        try {
            //check stakePackage
            let stakePackage = await this.model.StakePackage.findOne({ _id: package_id })
            if (!stakePackage) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, "STAKE_PACKAGE__NOT_EXIST"))
            }

            if (stakePackage.total_staked + amount > stakePackage.total_pool) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, "STAKE_PACKAGE__NOT_ENOUGHT_SUPPLY"))
            }

            //check balance user 

            let stake
            let session = await mongoose.startSession();
            session.startTransaction();
            try {

                //sub balance rex of user 


                //update total_stake for stakePackage
                await this.model.StakePackage.findOneAndUpdate({ _id: stakePackage._id }, {
                    total_staked: {
                        $inc: amount
                    }
                }, { session })

                let now = new Date().getTime()
                //staking
                stake = await this.action.Stake.create({
                    staking_package: stakePackage._id,
                    user: user._id,
                    staked: amount,
                    start_time: now,
                    end_time_expected: now + stakePackage.invest_duration.duration,
                    claim_time: now + stakePackage.invest_duration.duration + stakePackage.locked_time,
                    invest: {
                        invest_full: stakePackage.invest_full,
                        invest_part: stakePackage.invest_part,
                    }
                }, { new: true, session })[0]



                await Utils.Mongo.commitWithRetry(session)
            } catch (error) {
                console.log(error)
                await session.abortTransaction();
                throw error
            } finally {
                session.endSession();
            }
            return ResponseFormat.formatResponse(200, 'OK', stake)

        } catch (error) {
            throw error
        }
    }

    //user
    unStaking = async ({ lang, stake_id, user }) => {
        try {
            let stake = await this.model.Stake.getStake({ lang, stake_id, user })
            if (stake.status != EntityConst.STAKE.STATUS.STAKING) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, "STAKE__YOUR_STAKING_IS_NOT_PROCESSING"))
            }
            let stakePackage = await this.model.StakePackage.findOne({ _id: stake.staking_package })

            let session = await mongoose.startSession();
            session.startTransaction();
            try {
                let now = new Date().getTime()
                //update stake
                stake = await this.model.Stake.findOneAndUpdate({ _id: stake._id }, {
                    status: EntityConst.STAKE.STATUS.CANCELLED,
                    invest_rate: {
                        invest_final: stakePackage.intest_part
                    },
                    end_time_reality: now,
                    claim_time: now,
                    total_reward: (now - stake.start_time) / this.ONE_YEAR * stakePackage.intest_part / 100
                }, { new: true, session })

                //update stakepackage
                let stakePackage = await this.model.StakePackage.findOneAndUpdate({ _id: stake.staking_package }, {
                    total_staked: {
                        $inc: - stake.staked
                    }
                }, {
                    new: true,
                    session
                })
                //transfer reward to user
                let txHash = null

                //create stake action
                let stakeAction = await this.model.StakeAction.create({
                    stake: stake._id,
                    tx_hash: txHash,
                    user: user._id,
                    time: new Date(),
                    action: EntityConst.STAKE.ACTION.UNSTAKING
                }, { session })[0]

                stake = await this.model.Stake.findOneAndUpdate({ _id: stake._id }, {
                    $addToSet: {
                        actions: stakeAction._id
                    }
                }, { session, new: true })

                await Utils.Mongo.commitWithRetry(session)
            } catch (error) {
                console.log(error)
                await session.abortTransaction();
                throw error
            } finally {
                session.endSession();
            }
            return ResponseFormat.formatResponse(200, 'OK', stake)

        } catch (error) {
            throw error
        }
    }

    //user
    claimStakingReward = async ({ lang, stake_id, user }) => {
        try {
            let stake = await this.model.Stake.getStake({ lang, stake_id, user })
            if (stake.status != EntityConst.STAKE.STATUS.WAITING_CLAIM_REWARD) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, "STAKE__YOUR_STAKING_IS_NOT_COMPLETED"))
            }
            let session = await mongoose.startSession();
            session.startTransaction();
            try {
                //update stake
                stake = await this.model.Stake.findOneAndUpdate({ _id: stake._id }, {
                    status: EntityConst.STAKE.STATUS.COMPLETED,
                }, { new: true, session })

                //transfer reward to user
                let txHash = null

                //create stake action
                let stakeAction = await this.model.StakeAction.create({
                    stake: stake._id,
                    tx_hash: txHash,
                    user: user._id,
                    time: new Date(),
                    action: EntityConst.STAKE.ACTION.CLAIM_REWARDS
                }, { session })[0]


                stake = await this.model.Stake.findOneAndUpdate({ _id: stake._id }, {
                    $addToSet: {
                        actions: stakeAction._id
                    }
                }, { session, new: true })

                await Utils.Mongo.commitWithRetry(session)
            } catch (error) {
                console.log(error)
                await session.abortTransaction();
                throw error
            } finally {
                session.endSession();
            }
            return ResponseFormat.formatResponse(200, 'OK', stake)

        } catch (error) {
            throw error
        }
    }

    //user 
    getMyStakePackages = async ({ lang, user, page = 1, limit = 20, status = [] }) => {
        try {
            page = Number(page)
            limit = Number(limit)
            let filters = { user: user._id }
            if (status.length > 0) {
                filters = {
                    user: user._id,
                    status: {
                        $in: status
                    }
                }
            }
            let stakes = await this.model.Stake.getModel().find(filters).lean().skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 })
            return ResponseFormat.formatResponse(200, 'OK', stakes)

        } catch (error) {
            throw error
        }
    }

    //admin
    getMyStakePackagesByAdmin = async ({ lang, user_id, page = 1, limit = 20, status = [] }) => {
        try {
            page = Number(page)
            limit = Number(limit)
            let filters = { user: user_id}
            if (status.length > 0) {
                filters = {
                    user: user._id,
                    status: {
                        $in: status
                    }
                }
            }
            let stakes = await this.model.Stake.getModel().find(filters).lean().skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 })
            return ResponseFormat.formatResponse(200, 'OK', stakes)
        } catch (error) {
            throw error
        }
    }


}

module.exports = Stake
