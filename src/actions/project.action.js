const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { Lang, EntityConst } = CONSTANTS
const { RestError } = require('../utils')
const Queue = require('../services/queue')
const { QUEUE_NAME } = require('../constants/job.constant')

class ProjectAction {
    constructor(opts) {
        this.model = opts.model
    }

    genNoProject = async () => {
        try {
            let no
            let check
            while (true) {
                no = Utils.Common.genNo()
                check = await this.model.Project.findOne({ no: no })
                if (!check) {
                    return no
                }
            }
        } catch (error) {
            throw error
        }
    }

    validateTimeConfig = async ({ time_config, lang }) => {
        try {
            if (new Date(time_config.open) >= new Date(time_config.close)) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'PROJECT__TIME_INCORRECT'))
            }
            return
        } catch (error) {
            throw error
        }
    }

    validateAvatar = async ({ no, file, lang, fileSize }) => {
        try {
            // if (fileSize > 10 * 1024 * 1024) { // 10MB
            //     throw RestError.NewInvalidInputError(Lang.getLang(lang, 'PROJECT__AVATAR_TOO_LARGE'))
            // }
            //upload s3
            let avatar = await Utils.S3.uploadProject(file, 'avatar', 'avatars', no)
            return avatar
        } catch (error) {
            throw error
        }
    }

    validateStockInfo = async ({ stock_info, lang }) => {
        try {
            if (stock_info.total_supply < stock_info.circulating_supply) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'PROJECT__STOCK_INFO_INCORRECT'))
            }
            return
        } catch (error) {
            throw error
        }
    }

    createProject = async ({
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
        add_info,
        general_doc,
        legal_doc,
        ref_doc,
        ref_links,
        more_info,
        lang,
    }) => {
        try {
            add_info = Object.assign(
                {
                    video: '',
                    image: '',
                    country: 'vn',
                    city: '',
                    district: '',
                    line1: '',
                    line2: '',
                    note: '',
                    location: {
                        //toạ độ vật lý
                        lat: 0,
                        long: 0,
                    },
                },
                add_info,
            )

            let project = await this.model.Project.createOne({
                name,
                no,
                avatar,
                time_config,
                expected_interest_rate,
                short_description,
                classification,
                type,
            })
            console.log(project)
            stock_info = {
                ...stock_info,
                circulating_supply: 0,
            }
            //create stock
            let stock = await this.model.Stock.createOne({
                symbol: no,
                project: project._id,
                ...stock_info,
            })
            console.log(stock)

            //create project info
            const projectInfo = {
                address: add_info,
                project: project._id,
                images,
                description: '',
                general_doc,
                legal_doc,
                ref_doc,
                ref_links,
                more_info,
                // address: add_info
            }
            let info = await this.model.ProjectInfo.createOne(projectInfo)
            console.log(info)

            //update project
            project = await this.model.Project.findOneAndUpdate(
                { _id: project._id },
                {
                    stock_info: stock._id,
                    project_info: info._id,
                },
            )
            console.log(project)
            project = await this.getProject({ lang, project_id: project._id })

            return project
        } catch (error) {
            throw error
        }
    }

    updateProject = async ({
        project_id,
        name,
        avatar,
        classification,
        type,
        short_description,
        time_config,
        expected_interest_rate
    }) => {
        try {
            let project = await this.model.Project.findOne({ _id: project_id })

            project = await this.model.Project.findOneAndUpdate({ _id: project_id }, {
                name: name ? name : project.name,
                avatar: avatar ? avatar : project.avatar,
                time_config: time_config ? time_config : project.time_config,
                expected_interest_rate: expected_interest_rate ? expected_interest_rate : project.expected_interest_rate,
                short_description: short_description ? short_description : project.short_description,
                classification: classification ? classification : project.classification,
                type: type ? type : project.type
            })
            return project
        } catch (error) {
            throw error
        }
    }

    updateProjectInfo = async ({ lang, address, project_id, description, general_doc, legal_doc, ref_doc, ref_links, more_info, images }) => {
        try {
            let projectInfo = await this.model.ProjectInfo.findOneAndUpdate({ project: project_id }, {
                description, general_doc, legal_doc, ref_doc, ref_links, more_info, address, images
            })
            return projectInfo
        } catch (error) {
            throw error
        }
    }

    deployProject = async ({ project_id, lang }) => {
        try {
            let project = await this.model.Project.findOne({
                _id: project_id,
                status: EntityConst.PROJECT.STATUS.WAITING,
                is_deployed: {
                    $ne: true,
                },
            })
            if (!project) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'PROJECT__DEPLOYED'))
            }
            // add to queue
            await Queue.add(QUEUE_NAME.CONTRACT_CREATE_PROJECT, { project_id: project._id })
            return project
        } catch (error) {
            throw error
        }
    }

    getProject = async ({ lang, project_id }) => {
        try {
            console.log(lang, project_id)
            let project = await this.model.Project.findOne(
                {
                    _id: project_id,
                    is_deleted: {
                        $ne: true,
                    },
                },
                {},
                [
                    {
                        path: 'stock_info',
                    },
                    {
                        path: 'project_info',
                    },
                ],
            )
            if (!project) {
                console.log(`sadfasfa`)
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'PROJECT__NOT_EXIST'))
            }
            return project.toObject()
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    checkDeleteAvailable = async ({ lang, project }) => {
        try {
            if (project.time_config.open <= new Date() || project.status != EntityConst.PROJECT.STATUS.WAITING) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'PROJECT__CANT_DELETE'))
            }
            return project
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    checkUpdateAvailable = async ({ lang, project }) => {
        try {
            if (project.status != EntityConst.PROJECT.STATUS.WAITING) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'PROJECT__CANT_UPDATE'))
            }
            return project
        } catch (error) {
            console.log(error)
            throw error
        }
    }
}

module.exports = ProjectAction
