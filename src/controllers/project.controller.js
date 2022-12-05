const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { Lang, EntityConst } = CONSTANTS
const { RestError, ResponseFormat } = require('../utils')
const S3 = require('../utils/s3.util')
const Promise = require('bluebird')
const ROLES = EntityConst.USER.ROLES

class Project {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    getProjectTypes = async ({ user }) => {
        try {
            let data = await this.model.Project.getModel().find().distinct('classification')

            let statusTypes = Object.values(CONSTANTS.EntityConst.PROJECT.STATUS)
            if (user.role !== ROLES.ADMIN) {
                statusTypes = statusTypes.filter((s) => s != CONSTANTS.EntityConst.PROJECT.STATUS.WAITING)
            }

            return ResponseFormat.formatResponse(200, 'OK', {
                classification: data,
                status: statusTypes,
            })
        } catch (error) {
            throw error
        }
    }

    get = async ({ key_search, page = 1, limit = 20, sort_by, status, classification, type }) => {
        try {
            let filter = { is_deleted: false }
            limit = Number(limit)
            const skip = (Number(page) - 1) * limit

            if (status === CONSTANTS.EntityConst.PROJECT.STATUS.WAITING)
                throw RestError.NewBadRequestError('Incorrect status')

            if (Object.values(CONSTANTS.EntityConst.PROJECT.STATUS).includes(status)) {
                filter = {
                    status,
                }
            } else {
                filter = {
                    status: { $ne: CONSTANTS.EntityConst.PROJECT.STATUS.WAITING },
                }
            }

            if (classification) {
                filter['classification'] = classification
            }

            if (type) {
                filter['type'] = type
            }

            if (key_search) {
                filter = {
                    ...filter,
                    name: { $regex: `.*${key_search}.*`, $options: 'i' },
                }
            }
            const total = await this.model.Project.getModel().count({
                ...filter,
            })
            let data = await this.model.Project.getModel()
                .find({
                    ...filter,
                })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 })
                .populate('project_info', 'address images description')
                .populate('stock_info')

            // get number of investor
            data = await Promise.map(data, async (project) => {
                if (Date.now() > new Date(project.time_config.close).getTime() &&
                    project.status == CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING) {
                    project.status = CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED
                    await project.save()
                }

                const orders = await this.model.Order.getModel()
                    .find({
                        project: project._id,
                        symbol: project.no,
                        type: 'B',
                        status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
                    })
                    .select('owner market status')
                    .populate('market', 'market')
                    .lean()

                if (!orders) return
                const owners = new Set()
                orders.map((order) => {
                    if (!order.market || order.market.market != CONSTANTS.Market.MARKET.IDO) return
                    owners.add(order.owner.toString())
                })

                return Object.assign(project.toObject(), {
                    investors: [...owners]
                })
            })

            return ResponseFormat.formatResponse(200, 'OK', { total, projects: data })
        } catch (error) {
            throw error
        }
    }

    getByAdmin = async ({ key_search, page = 1, limit = 20, sort_by, status, classification, type }) => {
        try {
            let filter = { is_deleted: false }
            limit = Number(limit)
            const skip = (Number(page) - 1) * limit

            if (classification) {
                filter['classification'] = classification
            }

            if (type) {
                filter['type'] = type
            }

            if (key_search) {
                filter = {
                    ...filter,
                    name: { $regex: `.*${key_search}.*`, $options: 'i' },
                }
            }
            const total = await this.model.Project.getModel().count({
                ...filter,
            })
            let data = await this.model.Project.getModel()
                .find({
                    ...filter,
                })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 })
                .populate('project_info', 'address images description')
                .populate('stock_info')

            // get number of investor
            data = await Promise.map(data, async (project) => {
                if (Date.now() > new Date(project.time_config.close).getTime() &&
                    project.status == CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING) {
                    project.status = CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED
                    await project.save()
                }

                const orders = await this.model.Order.getModel()
                    .find({
                        project: project._id,
                        symbol: project.no,
                        type: 'B',
                        status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
                    })
                    .select('owner market status')
                    .populate('market', 'market')
                    .lean()

                if (!orders) return
                const owners = new Set()
                orders.map((order) => {
                    if (!order.market || order.market.market != CONSTANTS.Market.MARKET.IDO) return
                    owners.add(order.owner.toString())
                })

                return Object.assign(project.toObject(), {
                    investors: [...owners]
                })
            })

            return ResponseFormat.formatResponse(200, 'OK', { total, projects: data })
        } catch (error) {
            throw error
        }
    }

    uploadProjectDoc = async ({ file, no, type, name }) => {
        const { Location: location, Bucket, Key } = await S3.uploadProjectPublic(file, no, type, name)
        return ResponseFormat.formatResponse(200, location)
    }

    create = async ({
        name,
        no,
        avatar,
        images,
        classification,
        type,
        short_description,
        time_config,
        expected_interest_rate,
        stock_info,
        address,
        general_doc,
        legal_doc,
        ref_doc,
        ref_links,
        more_info,
        lang,
    }) => {
        try {
            time_config = {
                open: new Date(time_config.open),
                close: new Date(time_config.close),
                invest_duration: new Date(time_config.invest_duration),
            }
            //validate
            await this.action.Project.validateTimeConfig({ lang, time_config })
            // await this.action.Project.validateStockInfo({ lang, stock_info })
            if (!no) no = await this.action.Project.genNoProject()
            // avatar = await this.action.Project.validateAvatar({ no, avatar, lang, fileSize })

            //create project
            console.log(`[ProjectController] Deploy new project ${name}`)
            let project = await this.action.Project.createProject({
                name,
                avatar,
                images,
                classification,
                type,
                short_description,
                no,
                time_config,
                expected_interest_rate,
                stock_info,
                add_info: address,
                general_doc,
                legal_doc,
                ref_doc,
                ref_links,
                more_info,
                lang,
            })

            return ResponseFormat.formatResponse(200, 'OK', project)
        } catch (error) {
            throw error
        }
    }

    deployProject = async ({ lang, project_id }) => {
        try {
            await this.action.Project.getProject({ lang, project_id })
            await this.action.Project.deployProject({ lang, project_id })
            return ResponseFormat.formatResponse(200, 'Added to queue')
        } catch (error) {
            throw error
        }
    }

    editOverview = async ({
        project_id,
        name,
        avatar,
        images,
        classification,
        type,
        short_description,
        time_config,
        expected_interest_rate,
        stock_info,
        address,
        general_doc,
        description,
        legal_doc,
        ref_doc,
        ref_links,
        more_info,
        lang
    }) => {
        try {
            let project = await this.action.Project.getProject({ lang, project_id })

            //check name
            await this.action.Project.checkUpdateAvailable({ project, lang })
            time_config = {
                open: new Date(time_config.open),
                close: new Date(time_config.close),
                invest_duration: new Date(time_config.invest_duration),
            }
            //validate
            await this.action.Project.validateTimeConfig({ lang, time_config })

            //update project
            project = await this.action.Project.updateProject({
                project_id,
                name,
                avatar,
                classification,
                type,
                short_description,
                time_config,
                expected_interest_rate
            })


            if (!project.stock_info) {
                //create stock and update to project
                await this.action.Stock.createStock({ lang, project_id, symbol: project.no, total_supply: stock_info.total_supply, ido_price: stock_info.ido_price })
            } else {
                await this.action.Stock.updateStock({ lang, stock_id: project.stock_info._id, total_supply: stock_info.total_supply, ido_price: stock_info.ido_price })
            }
            

            // updateProjectInfo
            let projectInfo = await this.action.Project.updateProjectInfo({ lang, images, address, project_id, description, general_doc, legal_doc, ref_doc, ref_links, more_info })
            
            return ResponseFormat.formatResponse(200, 'OK', {
                project,
                projectInfo
            })
        } catch (error) {
            throw error
        }
    }

    editStockInfo = async ({ lang, project_id, total_supply, ido_price }) => {
        try {
            let project = await this.action.Project.getProject({ lang, project_id })
            await this.action.Project.checkUpdateAvailable({ project, lang })

            //
            if (project.is_deployed) {
                //TODO call contract
            }
            // console.log(project)
            if (!project.stock_info) {
                //create stock and update to project
                await this.action.Stock.createStock({ lang, project_id, symbol: project.no, total_supply, ido_price })
            } else {
                await this.action.Stock.updateStock({ lang, stock_id: project.stock_info._id, total_supply, ido_price })
            }
            project = await this.action.Project.getProject({ lang, project_id })
            return ResponseFormat.formatResponse(200, 'OK', project)
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    updateProjectInfo = async ({ lang, address, project_id, description, general_doc, legal_doc, ref_doc, ref_links, more_info }) => {
        try {
            let project = await this.action.Project.getProject({ lang, project_id })
            await this.action.Project.checkUpdateAvailable({ project, lang })

            let projectInfo = await this.action.Project.updateProjectInfo({ lang, address, project_id, description, general_doc, legal_doc, ref_doc, ref_links, more_info })
            return ResponseFormat.formatResponse(200, 'OK', projectInfo)
        } catch (error) {
            throw error
        }
    }

    updateAvatar = async (req) => {
        try {
            const { lang } = req.headers
            const { project_id } = req.body
            const fileSize = parseInt(req.headers['content-length'])

            let project = await this.action.Project.getProject({ lang, project_id })
            // console.log(file, project.no, fileSize, project_id)
            let avatar = await this.action.Project.validateAvatar({ no: project.no, file: req.file, lang, fileSize })
            await this.model.Project.findOneAndUpdate({ _id: project_id }, { avatar: avatar })
            project = await this.action.Project.getProject({ lang, project_id })
            return ResponseFormat.formatResponse(200, 'OK', project)
        } catch (error) {
            throw error
        }
    }

    detail = async ({ project_id, lang }) => {
        try {
            let project = await this.action.Project.getProject({ lang, project_id })

            const orders = await this.model.Order.getModel()
                .find({
                    project: project._id,
                    symbol: project.no,
                    type: 'B',
                    status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
                })
                .select('owner market status')
                .populate('market', 'market')
                .lean()

            if (!orders) return
            const owners = new Set()
            orders.map((order) => {
                if (!order.market || order.market.market != CONSTANTS.Market.MARKET.IDO) return
                owners.add(order.owner.toString())
            })
            project.investors = [...owners]

            //console.log({project})
            return ResponseFormat.formatResponse(200, 'OK', project)
        } catch (error) {
            throw error
        }
    }

    deleteProject = async ({ project_id, lang }) => {
        try {
            let project = await this.action.Project.getProject({ lang, project_id })
            //check delete available
            await this.action.Project.checkDeleteAvailable({ project, lang })

            if (project.msg) {
                //tx đã tồn tại -> gọi lên contract để delete project
                //TODO: call contract
            }
            //xoá ở local
            if (true) {
                await this.model.Project.findOneAndUpdate({ _id: project_id }, { is_deleted: true })
            }

            return ResponseFormat.formatResponse(200, 'Deleted')
        } catch (error) {
            throw error
        }
    }

}

module.exports = Project
