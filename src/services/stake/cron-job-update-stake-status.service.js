require("dotenv").config()
const { EntityConst } = require('../../constants');
const container = require('../../configs/dependencies/container');
const model = container.resolve('model')
const ONE_YEAR = 31536000000

const _getstakes = async () => {
    try {
        let now = new Date().getTime()
        let stakes = await model.Stake.findMany({
            status: EntityConst.STAKE.STATUS.STAKING,
            end_time_expected: {
                $gte: now
            }
        }, 1, 100)
        return stakes
    } catch (error) {
        console.log(error)
        return null
    }
}

const _processStakeStatus = async (stakes) => {
    try {
        for (let i = 0; i < stakes.length; i++) {
            let stake = stakes[i]
            try {
                let package = await model.StakePackage.findOne({ _id: stake.staking_package })
                //update stake
                stake = await model.Stake.findOneAndUpdate({ _id: stake._id }, {
                    status: EntityConst.STAKE.STATUS.WAITING_CLAIM_REWARD,
                    invest_rate: {
                        invest_final: package.intest_full
                    },
                    end_time_reality: stake.end_time_expected,
                    claim_time: stake.end_time_expected + package.locked_time,
                    total_reward: (stake.end_time_expected - stake.start_time) / ONE_YEAR * package.intest_full / 100
                }, { new: true })

                //update stakepackage
                await model.StakePackage.findOneAndUpdate({ _id: stake.staking_package }, {
                    total_staked: {
                        $inc: - stake.staked
                    }
                }, {
                    new: true,
                })

                //create stake action
                let stakeAction = await model.StakeAction.createOne({
                    stake: stake._id,
                    tx_hash: null,
                    user: user._id,
                    time: new Date(),
                    action: EntityConst.STAKE.ACTION.WAITING_CLAIM_REWARD
                })

                stake = await model.Stake.findOneAndUpdate({ _id: stake._id }, {
                    $addToSet: {
                        actions: stakeAction._id
                    }
                }, { session, new: true })

            } catch (error) {
                throw error
            }
        }

    } catch (error) {
        console.log(error)
    }
}

const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const runService = async () => {
    try {
        let stakes = await _getstakes()
        if (!stakes || stakes.length == 0) {
            await sleep(3000)
        } else {
            await _processStakeStatus(stakes)
        }

        runService()
    } catch (error) {
        console.log(error)
        await sleep(30000)
        runService()
    }
}
console.log(`start update-stake-status`)
// runService()

module.exports = {
    runService
}