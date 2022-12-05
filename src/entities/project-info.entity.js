'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const projectInfo = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
        },
        images: [
            {
                type: String,
            },
        ],
        description: {
            type: String,
        },
        general_doc: {
            //chứa string html của tông quan
            type: String,
        },
        legal_doc: {
            //chứa string html của tông quan
            type: String,
        },
        ref_doc: {
            //chứa string html của tông quan
            type: String,
        },
        ref_links: [
            {
                //chứa string html của tông quan
                type: String,
            },
        ],
        juridical: {
            //TODO TBD
            images: [
                {
                    type: String,
                },
            ],
            docs: [
                {
                    type: String,
                },
            ],
            videos: [
                {
                    type: String,
                },
            ],
        },
        more_info: {
            //TODO TBD
            type: Object,
        },
        address: {
            //tab vị trí
            video: {
                type: String,
            },
            image: {
                type: String,
            },
            full: {
                type: String,
            },
            country: {
                type: String,
            },
            city: {
                type: String,
            },
            district: {
                //quận, huyện
                type: String,
            },
            line1: {
                // đường
                type: String,
            },
            line2: {
                // số nhà, ngõ ngách
                type: String,
            },
            note: {
                //ghi chú
                type: String,
            },
            location: {
                //toạ độ vật lý
                lat: {
                    type: Number,
                },
                long: {
                    type: Number,
                },
            },
        },
    },
    {timestamps: true},
)

const ProjectInfo = mongoose.model('ProjectInfo', projectInfo)

module.exports = ProjectInfo
