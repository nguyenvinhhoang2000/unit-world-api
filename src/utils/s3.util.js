const multer = require('multer')
const AWS = require('aws-sdk')
const fs = require('fs')

AWS.config.update({region: 'ap-southeast-1'})
const s3 = new AWS.S3({
    accessKeyId: process.env[`${process.env.MODE}_S3_ACCESS_KEY_ID`],
    secretAccessKey: process.env[`${process.env.MODE}_S3_SECRET_KEY`],
})
const BUCKET = process.env[`${process.env.MODE}_S3_BUCKET`]

const uploadAvatar = async (file, fileName, path, user_id) => {
    try {
        const paths_with_sub_folders = ['avatars', 'images', 'logo', 'icons']

        let type = 'image/jpeg'
        let filename
        if (file.mimetype == 'image/png') {
            type = 'image/png'
            if (paths_with_sub_folders.includes(path)) {
                filename = `users/${user_id}/${path}/${fileName}.png`

                console.log(filename)
            } else {
                throw new Error('Path incorrect')
            }
        } else {
            if (paths_with_sub_folders.includes(path)) {
                filename = `users/${user_id}/${path}/${fileName}.jpeg`

                console.log(filename)
            } else {
                throw new Error('Path incorrect')
            }
        }

        const params = {
            Bucket: process.env[`${process.env.MODE}_S3_BUCKET`], // pass your bucket name
            Key: 'uploads/' + filename,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: type,
        }
        let result = await new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    console.log(`err = `, err)
                    reject(err)
                }
                resolve(data.Location)
            })
        })

        return result
    } catch (error) {
        throw error
    }
}

const uploadProject = async (file, fileName, path, no) => {
    try {
        console.log(file, fileName, path, no)
        const paths_with_sub_folders = ['avatars']

        let type = 'image/jpeg'
        let filename
        if (file.mimetype == 'image/png') {
            type = 'image/png'
            if (paths_with_sub_folders.includes(path)) {
                filename = `project/${no}/${path}/${fileName}.png`

                console.log(filename)
            } else {
                throw new Error('Path incorrect')
            }
        } else {
            if (paths_with_sub_folders.includes(path)) {
                filename = `project/${no}/${path}/${fileName}.jpeg`

                console.log(filename)
            } else {
                throw new Error('Path incorrect')
            }
        }

        const params = {
            Bucket: process.env[`${process.env.MODE}_S3_BUCKET`], // pass your bucket name
            Key: 'uploads/' + filename,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: type,
        }
        let result = await new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    console.log(`err = `, err)
                    reject(err)
                }
                resolve(data.Location)
            })
        })

        return result
    } catch (error) {
        throw error
    }
}

const uploadImagePublic = async (file, fileName, path, user_id) => {
    try {
        const paths_with_sub_folders = ['avatars', 'images', 'logo', 'icons', 'kyc', 'project', 'wallet', 'withdrawal', 'p2p']
        let type = 'image/jpeg'
        let filename
        if (file.mimetype == 'image/png') {
            type = 'image/png'
            if (paths_with_sub_folders.includes(path)) {
                filename = `${user_id}/${path}/${fileName}.png`

                console.log(filename)
            } else {
                throw new Error('Path incorrect')
            }
        } else {
            if (paths_with_sub_folders.includes(path)) {
                filename = `${user_id}/${path}/${fileName}.jpeg`

                console.log(filename)
            } else {
                throw new Error('Path incorrect')
            }
        }

        const bucket = BUCKET
        const params = {
            Bucket: bucket,
            Key: filename,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: type,
        }
        let result = await new Promise((resolve, reject) => {
            console.log(params)
            s3.upload(params, (err, data) => {
                if (err) reject(err)
                console.log(data)
                resolve(data)
            })
        })

        return {Location: result.Location, Key: filename, Bucket: bucket}
    } catch (error) {
        throw error
    }
}

const uploadProjectPublic = async (file, no, path, fileName) => {
    console.log(file)
    try {
        let type = 'image/jpeg'
        const paths_with_sub_folders = ['legal-doc', 'ref-doc', 'gen-doc', 'avatar']

        let filename
        if (file.mimetype == 'image/png') {
            type = 'image/png'
            if (paths_with_sub_folders.includes(path)) {
                filename = `project/${no}/${path}/${fileName}.png`

                console.log(filename)
            } else {
                throw new Error('doc type incorrect:' + path)
            }
        } else if(['image/jpg', 'image/jpeg'].includes(file.mimetype)) {
            if (paths_with_sub_folders.includes(path)) {
                filename = `project/${no}/${path}/${fileName}.jpeg`

                console.log(filename)
            } else {
                throw new Error('doc type incorrect:' + path)
            }
        }else{
            if (paths_with_sub_folders.includes(path)) {
                filename = `project/${no}/${path}/${fileName}_${file.originalname}`
                type = file.mimetype
                console.log(filename)
            } else {
                throw new Error('doc type incorrect:' + path)
            }
        }

        const bucket = BUCKET
        const params = {
            Bucket: bucket,
            Key: filename,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: type,
        }
        let result = await new Promise((resolve, reject) => {
            console.log(params)
            s3.upload(params, (err, data) => {
                if (err) reject(err)
                console.log(data)
                resolve(data)
            })
        })

        return {Location: result.Location, Key: filename, Bucket: bucket}
    } catch (error) {
        throw error
    }
}

const getImageBase64 = async (Key) => {
    const data = await s3
        .getObject({
            Bucket: BUCKET,
            Key,
        })
        .promise()

    const buf = Buffer.from(data.Body)
    const base64 = buf.toString('base64')
    return base64
}

module.exports = {
    uploadAvatar,
    uploadImagePublic,
    uploadProject,
    getImageBase64,
    uploadProjectPublic,
}
