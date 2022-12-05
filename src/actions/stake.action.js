const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { Lang, EntityConst } = CONSTANTS
const { RestError } = require('../utils')
const Queue = require('../services/queue')
const { QUEUE_NAME } = require('../constants/job.constant')

class StakeAction {
    constructor(opts) {
        this.model = opts.model
    }

    checkAvailableUpdate = async ({lang, package_id}) => {
        try {
            let stakePackage = await this.model.StakePackage.findOne({_id: package_id})
            if(!stakePackage){
                throw RestError.NewNotFoundError(Lang.getLang(lang, "STAKE_PACKAGE__NOT_EXIST"))
            }
            if(!(stakePackage.total_staked == 0 && stakePackage.is_public == true)){
                throw RestError.NewNotFoundError(Lang.getLang(lang, "STAKE_PACKAGE__CANT_UPDATE_PACKAGE"))
            }
            return stakePackage
        } catch (error) {
            throw error
        }
    }

    getStake = async ({lang, stake_id, user}) => {
        try {
            let stake = await this.model.Stake.findOne({_id: stake_id, user: user._id})
            if(!stake) throw RestError.NewNotFoundError(Lang.getLang(lang, "STAKE__NOT_EXIST"))
        } catch (error) {
            throw error
        }
    }
}

module.exports = StakeAction
