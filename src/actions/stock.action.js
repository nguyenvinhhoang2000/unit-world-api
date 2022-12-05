const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {Lang, EntityConst} = CONSTANTS
const {RestError} = require('../utils')

class StockAction {
    constructor(opts) {
        this.model = opts.model
    }

    createStock = async ({project_id, symbol, total_supply, ido_price, lang}) => {
        try {
            let stock = await this.model.Stock.createOne({
                project: project_id,
                symbol: symbol,
                total_supply,
                ido_price,
                circulating_supply: 0,
            })
            //update project
            await this.model.Project.findOneAndUpdate({_id: project_id}, {stock_info: stock._id})

            return stock
        } catch (error) {
            throw error
        }
    }

    updateStock = async ({lang, stock_id, total_supply, ido_price}) => {
        try {
            let stock = await this.model.Stock.findOneAndUpdate(
                {_id: stock_id},
                {
                    total_supply,
                    circulating_supply: 0,
                    ido_price,
                },
            )
            return stock
        } catch (error) {
            throw error
        }
    }

    // getProject = async ({ lang, project_id }) => {
    //     try {
    //         let project = await this.model.Project.findOne({ _id: project_id }, {}, 'stock_info')
    //         if (!project) {
    //             throw RestError.NewNotFoundError(Lang.getLang(lang, 'PROJECT__NOT_EXIST'))
    //         }
    //         return project
    //     } catch (error) {
    //         throw error
    //     }
    // }
}

module.exports = StockAction
