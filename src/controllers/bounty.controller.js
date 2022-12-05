const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {RestError, ResponseFormat} = require('../utils')
const { getPagination } = require('../utils/common.util')

class Bounty {
    constructor(opts) {
        this.model = opts.model
    }

    getProgram = async ({user, key_search, filter, sort, page, size}) => {
        try {
            const pagination = getPagination(page, size)
            filter = Object.assign({}, filter || {})

            if (key_search) {
                filter = {
                    ...filter,
                    $or: [
                        { "action": { $regex: `.*${key_search}.*`, $options: 'i' } },
                        { "content": { $regex: `.*${key_search}.*`, $options: 'i' } }
                    ]
                }
            }

            sort = Object.assign({}, sort || {})

            const programs = await this.model.Bounty.getModel().find(filter)
                    .sort(sort)
                    .limit(pagination.limit).skip(pagination.skip).lean()


            if(user.role === CONSTANTS.EntityConst.USER.ROLES.USER) {
                for(const program of programs) {
                    const found = await this.model.BountyCompletion.getModel().findOne({
                        bounty: program._id,
                        user: user._id
                    }).lean()
                    if(!found) {
                        program.available_status = "OK"
                    } else {
                        program.available_status = found.status
                        program.completion = found
                    }
                }
            }

            const total = await this.model.Bounty.getModel().count(filter)

            return ResponseFormat.formatResponseObj({ data: {
                total,
                programs
            } })
        } catch (error) {
            throw error
        }
    }

    adminCreateProgram = async ({user, action, platform, content, rexReward}) => {
        try {
            const program = await this.model.Bounty.createOne({
                action, platform, content, rexReward
            })
            return ResponseFormat.formatResponseObj({ data: program })
        } catch (error) {
            throw error
        }
    }

    adminUpdateProgram = async ({user, programId, action, platform, content, status, rexReward}) => {
        try {
            const program = await this.model.Bounty.findOne({
                _id: programId
            })
            if(!program) throw RestError.NewNotFoundError(`Cannot found program id = ${programId}`)

            action && (program.action = action)
            content && (program.content = content)
            status && (program.status = status)
            platform && (program.platform = platform)
            rexReward && (program.rexReward = rexReward)

            const rst = await program.save({new: true})
            return ResponseFormat.formatResponseObj({ data: rst })
        } catch (error) {
            throw error
        }
    }

    newProgramCompletion = async ({user, programId, reference}) => {
        if(!reference) throw RestError.NewBadRequestError(`Must provide reference link`)
        try {
            const program = await this.model.Bounty.findOne({
                _id: programId
            })
            if(!program) throw RestError.NewNotFoundError(`Cannot found program id = ${programId}`)

            const found = await this.model.BountyCompletion.getModel().findOne({
                bounty: program._id,
                user: user._id
            }).lean()
            if(found && ![
                    CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REJECTED,
                ].includes(found.status)) {
                throw RestError.NewNotFoundError(`This program was already activated`)
            }

            const completionData = {
                user: user._id,
                username: user.username,
                bounty: program._id,
                action: program.action,
                platform: program.platform,
                reference,
                status: CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.PENDING
            }

            const completion = await this.model.BountyCompletion.createOne(completionData)
            return ResponseFormat.formatResponseObj({ data: completion })
        } catch (error) {
            throw error
        }
    }

    getProgramCompletion = async ({user, filter, sort, page, size, key_search}) => {
        try {
            filter = Object.assign({}, filter || {})
            if(user.role == CONSTANTS.EntityConst.USER.ROLES.USER) {
                filter.user = user._id
            }

            if (key_search) {
                filter = {
                    ...filter,
                    $or: [
                        {username: { $regex: `.*${key_search}.*`, $options: 'i' }},
                        {action: { $regex: `.*${key_search}.*`, $options: 'i' }},
                        {platform: { $regex: `.*${key_search}.*`, $options: 'i' }}
                    ]
                }
            }
    
            // parse time
            if(filter && (filter.createdAt || filter.updatedAt)){
                for(const operator of ["$gt", "$lt", "$gte", "$lte"]) {
                    if(filter.createdAt && filter.createdAt[operator]) {
                        filter.createdAt[operator] = new Date(filter.createdAt[operator])
                    }
                    if(filter.updatedAt && filter.updatedAt[operator]) {
                        filter.updatedAt[operator] = new Date(filter.updatedAt[operator])
                    }
                }
            } else if(filter && filter["$and"]) {
                for(const time of filter["$and"]) {
                    for(const operator of ["$gt", "$lt", "$gte", "$lte"]) {
                        if(time.createdAt && time.createdAt[operator]) {
                            time.createdAt[operator] = new Date(time.createdAt[operator])
                        }
                        if(time.updatedAt && time.updatedAt[operator]) {
                            time.updatedAt[operator] = new Date(time.updatedAt[operator])
                        }
                    }
                }
            }
    
            const pagination = getPagination(page, size)
            sort = Object.assign({ updatedAt: -1 }, sort || {})

            console.log({filter})
            const completions = await this.model.BountyCompletion.getModel().find(filter)
                    .sort(sort)
                    .populate('user', 'role email username name country birthday status avatar gender phone add_info').populate('bounty')
                    .limit(pagination.limit).skip(pagination.skip).lean()

            const total = await this.model.BountyCompletion.getModel().count(filter)

            return ResponseFormat.formatResponseObj({ data: {
                total: total,
                completions
            } })
        } catch (error) {
            throw error
        }
    }


    getProgramCompletionDetail = async ({user, id}) => {
        try {
            const data = await this.model.BountyCompletion.getModel().findOne({_id: id, user: user._id})
                .populate('user', 'role email username name country birthday status avatar gender phone add_info').populate('bounty')
            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    adminConfirmProgramCompletion = async ({user, completionId, status, note}) => {
        try {
            const completion = await this.model.BountyCompletion.findOne({
                _id: completionId
            })
            if(!completion) throw RestError.NewNotFoundError(`Cannot found completion id = ${completionId}`)
            completion.status = status
            if(note) completion.note = note

            const rst = await completion.save({new: true})
            return ResponseFormat.formatResponseObj({ data: rst })
        } catch (error) {
            throw error
        }
    }

    requesProgramCompletionReward = async ({user, completionId}) => {
        try {
            const completion = await this.model.BountyCompletion.findOne({
                _id: completionId,
                user: user._id
            })
            if(!completion) throw RestError.NewNotFoundError(`Cannot found completion id = ${completionId}`)
            if(completion.status !== CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.COMPLETED) {
                throw RestError.NewNotFoundError(`Only request if program status is completion`)
            }
            completion.status = CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REQUEST_REWARD

            const rst = await completion.save({new: true})
            return ResponseFormat.formatResponseObj({ data: rst })
        } catch (error) {
            throw error
        }
    }
}

module.exports = Bounty
