const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {Lang, EntityConst} = CONSTANTS
const {RestError} = require('../utils')

class RankAction {
    constructor(opts) {
        this.model = opts.model
    }

    createRank = async ({ 
        name,
        no,
        description,
        status,
        config,
        discount,
        limit,
        lang,
    }) => {
        try {
            let rank = await this.model.Rank.createOne({
                name,
                no,
                description,
                status,
                config,
                discount,
                limit,
            })
            return rank
        } catch (error) {
            throw error
        }
    }

    updateRank = async ({
        rank_id,
        name,
        no,
        description,
        status,
        config,
        discount,
        limit,
        lang,
    }) => {
        try {
            let rank = await this.model.Rank.findOneAndUpdate(
                {_id: rank_id},
                {
                    name,
                    no,
                    description,
                    status,
                    config,
                    discount,
                    limit,
                },
            )
            return rank
        } catch (error) {
            throw error
        }
    }
}

module.exports = RankAction
