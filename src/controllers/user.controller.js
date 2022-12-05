const speakeasy = require('speakeasy')
const fetch = require('node-fetch')
const Web3 = require('web3')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { Lang, EntityConst } = CONSTANTS
const { RestError, ResponseFormat } = require('../utils')

const { uploadAvatar } = require('../utils/s3.util')
const { verifyUserByUid } = require('../utils/firebase.util');
const { getPagination } = require('../utils/common.util')
const { CONTACT_US } = require('../constants/entity.constant')
const { startSession } = require('mongoose')

class User {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    // loginWithOtp = async ({ phone, uid, lang }) => {
    //     try {
    //         let member = await this.model.Member.findOne({ phone: phone });
    //         if (!member) {
    //             throw RestError.NewNotAcceptableError(
    //                 Lang.getLang(lang, "MEMBER_NOT_EXIST")
    //             );
    //         }
    //         //check otp from firebase
    //         const checkOTP = await Firebase.verifyUserByUid(uid);
    //         if (checkOTP && checkOTP.uid === uid) {
    //             let token = Utils.Token.createMemberAccessToken(member.uuid);
    //             let refreshToken = Utils.Token.createRefreshToken(member.uuid);
    //             await Utils.Redis.saveRefreshToken(member.uuid, refreshToken);

    //             return ResponseFormat.formatResponse(
    //                 200,
    //                 Lang.getLang(lang, "LOGIN_SUCCESSFULLY"),
    //                 {
    //                     token: token,
    //                     refreshToken: refreshToken,
    //                     uuid: member.uuid,
    //                     _id: member._id

    //                 }
    //             );
    //         } else {
    //             throw RestError.NewNotAcceptableError(
    //                 Lang.getLang(lang, "LOGIN_WITH_OTP_FAILED")
    //             );
    //         }
    //     } catch (error) {
    //         throw error;
    //     }
    // };

    // signUpWithPhone = async ({
    //     phone,
    //     uid,
    //     fullName,
    //     dob = new Date(0),
    //     lang,
    //     gender = "N",
    // }) => {
    //     try {
    //         //check phone
    //         let member = await this.model.Member.findOne({ phone: phone });
    //         if (member) {
    //             throw RestError.NewBadRequestError(Lang.getLang(lang, "PHONE_EXISTED"));
    //         }

    //         //check otp from firebase
    //         const checkOTP = await Firebase.verifyUserByUid(uid);
    //         if (checkOTP && checkOTP.uid === uid) {

    //             //create member
    //             member = await this.model.Member.createOne({
    //                 uuid: Uuid(),
    //                 phone: phone,
    //                 fullName: fullName,
    //                 dob: new Date(dob),
    //                 gender: gender,
    //                 status: CONSTANTS.Entity.MEMBER.STATUS.COMPLETED

    //             });
    //             let token = Utils.Token.createMemberAccessToken(member.uuid);
    //             let refreshToken = Utils.Token.createRefreshToken(member.uuid);
    //             await Utils.Redis.saveRefreshToken(member.uuid, refreshToken);
    //             return ResponseFormat.formatResponse(
    //                 200,
    //                 Lang.getLang(lang, "REGISTER_SUCCESSFLLY"),
    //                 {
    //                     token: token,
    //                     refreshToken: refreshToken,
    //                     uuid: member.uuid
    //                 }
    //             );
    //         } else {
    //             throw RestError.NewNotAcceptableError(
    //                 Lang.getLang(lang, "CHECK_OTP_FAILED")
    //             );
    //         }
    //     } catch (error) {
    //         throw error;
    //     }
    // };

    login = async ({ lang, username, password, re_captcha, remoteAddress, tfa_code }) => {
        try {
            //Check account
            if (username.indexOf('@') > 0) {
                username = username.toLowerCase()
                username = this._getRealEmail(username.toLowerCase())
            }
            let userCheck = await this.model.User.findOne({
                $or: [{ email: username }, { username: username }],
            })

            if (!userCheck) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'USER__USER_IS_NOT_EXIST'), 1001)
            }

            if (!Object.values(EntityConst.USER.ROLES).includes(userCheck.role)) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'USER__PERMISSION_DENIED'), 1002)
            }

            if (userCheck.status === EntityConst.USER.STATUS.BLOCKED) {
                throw RestError.NewForbiddenError(Lang.getLang(lang, 'USER__BLOCKED'), 1003)
            }
            if (userCheck.status === EntityConst.USER.STATUS.WAITING_VERIFICATION) {
                throw RestError.NewNotAcceptableError(Lang.getLang(lang, 'USER__WAITING_VERIFICATION'), 1004)
            }

            //Check TFA
            let tfa = await this.model.Tfa.findOne({ user: userCheck._id })
            let activeTfa = false
            //If user  enable tfa
            if (tfa && tfa.status === CONSTANTS.EntityConst.TFA.ACTIVE) {
                activeTfa = true
                if (tfa_code) {
                    const check = speakeasy.totp.verify({
                        secret: tfa.secret,
                        encoding: 'base32',
                        token: tfa_code,
                        window: 0,
                    })
                    console.log(`2fa===> `, check)

                    //input token expires
                    if (!check) {
                        throw RestError.NewNotAcceptableError('The 2Fa code is incorrect!', 1005)
                    }
                } else {
                    return ResponseFormat.formatResponse(200, 'You must enter your 2FA code!', null, 202)
                }
            } else {
                //check re_captcha
                if (process.env.MODE == 'MAINNET') {
                    if (!re_captcha || !(await this._checkre_captcha(re_captcha, remoteAddress))) {
                        throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__RECAPCHA_INCORRECT'), 1007)
                    }
                }
            }
            //Check password
            const passwordHash = Utils.Encrypt.encryptPassword(
                userCheck.password_salt,
                password,
                userCheck.password_alg,
            )

            //check password
            if (!(userCheck.password == passwordHash)) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__PASSWORD_INCORRECT'), 1008)
            }

            //create token
            const token = Utils.Token.createAccessToken(userCheck._id)
            let refresh_token = Utils.Token.createRefreshToken(userCheck._id)
            let refresh = await Utils.Redis.saveRefreshToken(userCheck._id, refresh_token)
            console.log(`refresh = `, refresh)
            return ResponseFormat.formatResponse(
                200,
                'Login Successfully',
                {
                    token: token,
                    user_id: userCheck._id,
                    refresh_token,
                    role: userCheck.role,
                    tfa: activeTfa,
                },
                200,
            )
        } catch (error) {
            throw error
        }
    }

    _checkre_captcha = async (re_captchaCode, remoteAddress) => {
        try {
            const secret_key = process.env[`${process.env.MODE}_GG_RE_CAPTCHA_SECRET_KEY`]
            // console.log(`secret_key = `, secret_key)
            const url = `https://www.google.com/re_captcha/api/siteverify`

            let checkre_captcha = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
                body: `secret=${secret_key}&response=${re_captchaCode}&remoteip=${remoteAddress}`,
            })
            checkre_captcha = await checkre_captcha.json()

            console.log(checkre_captcha)
            if (checkre_captcha && checkre_captcha.success) {
                return true
            }
            return false
        } catch (err) {
            console.log(err)
            return false
        }
    }

    _getRealEmail = (email) => {
        if (!email) return
        let emails = email.split('@')
        if (emails.length != 2) return
        let right = emails[0]
        let domain = emails[1]
        if (domain != 'gmail.com') return email
        email = right.replace(/\./g, '')
        emails = email.split('+')
        if (emails.length == 1) return `${email}@${domain}`
        return `${emails[0]}@${domain}`
    }

    register = async ({
        username,
        name,
        password,
        confirm_password,
        email,
        country,
        dob,
        lang,
        subscribe,
        re_captcha,
        remoteAddress,
        referrer,
    }) => {
        let session = null

        try {
            if (process.env.MODE == 'MAINNET') {
                if (!re_captcha || !(await this._checkre_captcha(re_captcha, remoteAddress))) {
                    throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__RECAPCHA_INCORRECT'), 2)
                }
            }
            email = this._getRealEmail(email.toLowerCase())

            //check email
            let user = await this.model.User.findOne({
                email: email,
            })
            if (user != null) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__EMAIL_IN_USE'), 4)
            }

            //check username
            user = await this.model.User.findOne({
                username: username,
            })
            if (user != null) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__USERNAME_IN_USE'), 5)
            }

            if(new Date(dob) >= new Date()) {
                throw RestError.NewInvalidInputError("DOB must be less than current time", 10)
            }
            
            //
            const passwordData = Utils.Encrypt.generatePassword(password)

            if (password !== confirm_password) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__CONFIRM_PASSWORD_INVALID'), 6)
            }
            let sub = {}
            if (subscribe) {
                sub = {
                    notification_tournament: true,
                    notification_nextmatch: true,
                    notification_news: true,
                }
            }

            session = await startSession()
            session.startTransaction({
                readConcern: {level: 'majority'},
                writeConcern: {w: 'majority'},
            })

            console.log(`name = `, name)
            user = await this.model.User.getModel().create([{
                email,
                username: username,
                name,
                password: passwordData.hash,
                password_salt: passwordData.salt,
                password_alg: passwordData.alg,
                country,
                birthday: dob,
                status: CONSTANTS.EntityConst.USER.STATUS.WAITING_VERIFICATION,
                ...sub,
            }], {session})
            if(!user || user.length ==0) throw RestError.NewInternalServerError('Cannot create new user')
            user = user[0]
            console.log(`user`, user)

            // Update referral
            const referral = await this.action.Referral.generateCode(user['_id'], referrer, session)
            console.log({ referral })

            await this.model.User.findOneAndUpdate({ _id: user._id }, { referral: referral[0]._id }, {session})
            await session.commitTransaction()

            const numberVerify = Utils.Math.generateCheckNumber()
            console.log(`verify number: ${numberVerify}`)
            console.log('userId', user['_id'])
            //save token to redis
            Utils.Redis.saveNumberVerify(user['_id'], numberVerify)

            //send email
            Utils.Email.sendEmail(email, numberVerify)

            return ResponseFormat.formatResponse(200, 'OK', { user_id: user._id })
        } catch (error) {
            session && await session.abortTransaction();
            throw error
        } finally {
            session && await session.endSession();
        }
    }

    resendVerifyEmail = async ({ email, lang, re_captcha, remoteAddress }) => {
        try {
            if (process.env.MODE == 'MAINNET') {
                if (!re_captcha || !(await this._checkre_captcha(re_captcha, remoteAddress))) {
                    throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__RECAPCHA_INCORRECT'), 2)
                }
            }
            if (email.indexOf('@') > 0) {
                email = email.toLowerCase()
                email = this._getRealEmail(email.toLowerCase())
            }
            let user = await this.model.User.findOne({
                $or: [{ email: email }, { username: email }],
            })

            if (!user) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'USER__USER_IS_NOT_EXIST'), 1001)
            }

            if (user.status != CONSTANTS.EntityConst.USER.STATUS.WAITING_VERIFICATION) {
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'USER__USER_VERIFIED'))
            }

            //Create verify token
            const numberVerify = Utils.Math.generateCheckNumber()
            console.log(`ReSend Verify Number account ${user['_id']} ==> ${numberVerify}`)

            Utils.Redis.saveNumberVerify(user['_id'], numberVerify)

            //sendMail
            Utils.Email.sendEmail(user.email, numberVerify)

            return ResponseFormat.formatResponse(200, Lang.getLang(lang, 'USER__RESEND_VERIFY_EMAIL_OK'), {
                user_id: user._id,
            })
        } catch (error) {
            // console.log(error)
            throw error
        }
    }

    verifyUser = async ({ email, user_id, number_verify, re_captcha, remoteAddress, lang }) => {
        try {
            if (process.env.MODE == 'MAINNET') {
                if (!re_captcha || !(await this._checkre_captcha(re_captcha, remoteAddress))) {
                    throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__RECAPCHA_INCORRECT'), 2)
                }
            }
            const numberCheck = await Utils.Redis.getNumberVerify(user_id)

            //Check token
            if (!numberCheck) {
                console.log('The verification number is expired')
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'USER__VERIFICATION_NUMBER_EXPIRED'))
            }
            if (numberCheck != number_verify) {
                console.log('The verify number token incorrect')
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'USER__VERIFICATION_NUMBER_INCORRECT'), 2)
            }
            if (email.indexOf('@') > 0) {
                email = email.toLowerCase()
                email = this._getRealEmail(email.toLowerCase())
            }

            //update user
            let user = await this.model.User.findOneAndUpdate(
                {
                    _id: user_id,
                    $or: [
                        {email: email},
                        {username: email}
                    ],
                    email: email,
                },
                { status: CONSTANTS.EntityConst.USER.STATUS.COMPLETED },
            )
            if (!user) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'USER__USER_IS_NOT_EXIST'))
            }


            await this.model.Kyc.createOne({
                user: user._id,
                status: CONSTANTS.EntityConst.KYC.STATUS.PENDING,
                lastest_update: Date.now(),
            })
            // // Confirm referral reward for registration
            // const referralConfirmed = await this.action.Referral.confirmReward(user_id)
            // console.log({referralConfirmed})

            return ResponseFormat.formatResponse(200, 'OK', { user_id: user._id })
        } catch (error) {
            // console.log(error)
            throw error
        }
    }

    newAccessToken = async ({ lang, user_id, refresh_token, old_access_token }) => {
        try {
            if (!user_id || !refresh_token || !old_access_token) {
                throw RestError.NewRefreshTokenExpired('Invalid input')
            }
            let refreshTokenCheck = await Utils.Redis.getRefreshToken(user_id, refresh_token)
            console.log(`refresh_token = `, refresh_token)
            console.log(`refreshTokenCheck = `, refreshTokenCheck)
            if (!refreshTokenCheck || refreshTokenCheck != refresh_token) {
                throw RestError.NewRefreshTokenExpired(Lang.getLang(lang, 'USER__REFRESH_TOKEN_EXPIRED'))
            }

            await Utils.Redis.saveRefreshToken(user_id, refresh_token)

            const token = Utils.Token.createAccessToken(user_id)

            return ResponseFormat.formatResponse(200, 'Success', { token, user_id, refresh_token: refresh_token })
        } catch (error) {
            // console.log(error)
            throw error
        }
    }

    logoutAll = async ({ user_id, token }) => {
        try {
            Utils.Redis.saveDataBlacklistTokens(token, user_id)

            //remove refresh token
            Utils.Redis.removeRefreshToken(user_id)

            return ResponseFormat.formatResponse(200, 'Logout successfully', {})
        } catch (error) {
            throw error
        }
    }

    logout = async ({ user_id, token }) => {
        try {
            Utils.Redis.saveDataBlacklistTokens(token, user_id)

            return ResponseFormat.formatResponse(200, 'OK', {})
        } catch (error) {
            throw error
        }
    }

    forgotPassword = async ({ email, lang, re_captcha, remoteAddress }) => {
        try {
            if (process.env.MODE == 'MAINNET') {
                if (!re_captcha || !(await this._checkre_captcha(re_captcha, remoteAddress))) {
                    throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__RECAPCHA_INCORRECT'), 2)
                }
            }
            if (email.indexOf('@') > 0) {
                email = email.toLowerCase()
                email = this._getRealEmail(email.toLowerCase())
            }
            let user = await this.model.User.findOne({
                $or: [{ email: email }, { username: email }],
            })

            if (!user) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'USER__USER_IS_NOT_EXIST'))
            }

            if (user.status != EntityConst.USER.STATUS.COMPLETED) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'USER_IS_NOT_ACTIVE'))
            }

            //Create Token
            const numberVerify = Utils.Math.generateCheckNumber()

            console.log(`VerifyNumber user ${user['_id']} ==> ${numberVerify}`)

            Utils.Redis.saveNumberVerify(user['_id'], numberVerify)

            //sendMail
            Utils.Email.sendEmail(user.email, numberVerify, 2)

            return ResponseFormat.formatResponse(200, 'OK', { user_id: user['_id'] })
        } catch (error) {
            throw error
        }
    }

    confirmForgotPassword = async ({ user_id, number_verify, password, confirm_password, lang }) => {
        try {
            const user = await this.model.User.findOne({ _id: user_id })

            //check user
            if (!user) {
                throw RestError.NewNotFoundError(Lang.getLang(lang, 'USER__USER_IS_NOT_EXIST'))
            }
            let numberCheck = await Utils.Redis.getNumberVerify(user_id)
            if (!numberCheck) {
                console.log('The verification number is expired')
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'USER__VERIFICATION_NUMBER_EXPIRED'))
            }
            if (numberCheck != number_verify) {
                console.log('The verify number token incorrect')
                throw RestError.NewBadRequestError(Lang.getLang(lang, 'USER__VERIFICATION_NUMBER_INCORRECT'), 2)
            }

            const passwordData = Utils.Encrypt.generatePassword(password)
            if (password !== confirm_password) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__CONFIRM_PASSWORD_INVALID'), 6)
            }
            await this.model.User.findOneAndUpdate(
                { _id: user_id },
                {
                    password: passwordData.hash,
                    password_salt: passwordData.salt,
                    password_alg: passwordData.alg,
                },
            )
            await Utils.Redis.removeNumberVerify(user_id)

            return ResponseFormat.formatResponse(200, 'OK', { _id: user_id })
        } catch (error) {
            throw error
        }
    }

    uploadAvatar = async ({ req }) => {
        try {
            // console.log(req.file)
            let data = await uploadAvatar(req.file, req.body.file_name, 'avatars', req.user._id)
            console.log(`data = `, data)
            //update user
            if (data) {
                await this.model.User.findOneAndUpdate({ _id: req.user._id }, { avatar: data })
            }
            return ResponseFormat.formatResponseObj({
                msg: 'OK',
                data: data,
            })
        } catch (error) {
            throw error
        }
    }

    getProfile = async ({ user, lang }) => {
        try {
            let tfa = await this.model.Tfa.findOne({ user: user._id })
            if (tfa) {
                tfa = tfa.status
            } else {
                tfa = null
            }
            return ResponseFormat.formatResponse(200, 'OK', {
                user_id: user._id,
                name: user.name,
                avatar: user.avatar,
                username: user.username,
                email: user.email,
                birthday: user.birthday,
                phone: user.phone,
                gender: user.gender,
                wallet: user.wallet,
                role: user.role,
                country: user.country,
                add_info: user.add_info,
                notification_tournament: user.notification_tournament,
                notification_nextmatch: user.notification_nextmatch,
                notification_news: user.notification_news,
                tfa: tfa,
            })
        } catch (error) {
            throw error
        }
    }

    changePassword = async ({ user, new_password, confirm_new_password, old_password, lang }) => {
        try {
            const passwordHash = Utils.Encrypt.encryptPassword(user.password_salt, old_password, user.password_alg)

            if (passwordHash != user.password) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__PASSWORD_INCORRECT'))
            }

            const newPasswordHash = Utils.Encrypt.encryptPassword(user.password_salt, new_password, user.password_alg)
            if (newPasswordHash == user.password) {
                throw RestError.NewInvalidInputError(Lang.getLang(lang, 'USER__NEWPASSWORD_INCORRECT'))
            }

            //update DB
            await this.model.User.findOneAndUpdate(
                { _id: user._id },
                {
                    password: newPasswordHash,
                },
            )

            return ResponseFormat.formatResponse(200, 'OK', {})
        } catch (error) {
            throw error
        }
    }

    updateInfo = async ({ user, name, country, birthday, lang }) => {
        try {
            //update DB
            await this.model.User.findOneAndUpdate(
                { _id: user._id },
                {
                    name,
                    country,
                    birthday,
                },
            )
            return ResponseFormat.formatResponse(200, 'OK', {})
        } catch (error) {
            throw error
        }
    }

    searchUser = async ({ key_search, lang }) => {
        try {
            let data = await this.model.User.findMany(
                {
                    username: { $regex: key_search, $options: 'i' },
                },
                1,
                20,
                { username: 1 },
                {},
                '',
                'username avatar _id',
            )
            return ResponseFormat.formatResponse(200, 'OK', data)
        } catch (error) {
            throw error
        }
    }

    getListUsers = async ({ lang, page, limit, filter, sort, key_search }) => {
        const pagination = getPagination(page, limit)
        const kycFilter = {}

        filter && Object.keys(filter).map(key => {
            if(key.startsWith(`kyc.`)) {
                kycFilter[key.replace('kyc.', '')] = filter[key]
                delete filter[key]
            }
        })

        if (key_search) {
            filter = Object.assign(filter || {}, {
                $or: [
                    {username: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {email: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {phone: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {name: { $regex: `.*${key_search}.*`, $options: 'i' }},
                ]
            })
        }

        sort = Object.assign({ "updatedAt": -1 }, sort)

        let users = await this.model.User.getModel().aggregate([{
                $lookup: {
                    from: "kycs",
                    localField: "_id",
                    foreignField: "user",
                    let: { email: "$email", status: "$status" },
                    pipeline: [ {
                            $match: kycFilter
                        }, {
                            $project: { status:1 }
                        }
                    ],
                    as: "kyc"
                },
            }, {
                $lookup: {
                    from: "referrals",
                    localField: "_id",
                    foreignField: "user",
                    pipeline: [ {
                            $project: { code:1 }
                        }
                    ],
                    as: "referral"
                },
            }, {
                $match: {
                    $and: [ {kyc: { $ne: null }}, { kyc: { $ne: []} } ],
                    ...filter
                }
            }, {
                $project: { username:1, email:1, phone:1, kyc:1, referral:1, createdAt:1, updatedAt:1, status: 1}
            },
            { $sort: sort },
            { $skip: pagination.skip },
            { $limit: pagination.limit }
         ])

         const total = await this.model.User.getModel().aggregate([{
                $lookup: {
                    from: "kycs",
                    localField: "_id",
                    foreignField: "user",
                    let: { email: "$email", status: "$status" },
                    pipeline: [ {
                            $match: {
                                status: CONSTANTS.EntityConst.KYC.STATUS.COMPLETED
                            }
                        }, {
                            $project: { status:1 }
                        }
                    ],
                    as: "kyc"
                },
            }, {
                $match: {
                    $and: [ {kyc: { $ne: null }}, { kyc: { $ne: []} } ],
                    ...filter
                }
            }, {
               $count: "total"
            }
        ])

        users.map(u => {
            u.referral = Array.isArray(u.referral) && u.referral.pop()
            u.kyc = Array.isArray(u.kyc) && u.kyc.pop()
         })
         return ResponseFormat.formatResponse(200, 'OK', {
            total: total && total.length > 0 && total[0].total,
            users: users
        })

        // users = await this.model.User.findMany({}, page, limit, { createdAt: -1 }, {}, [{
        //     path: 'kyc',
        //     select: "status"
        // }, {
        //     path: 'referral',
        //     select: "code"
        // }], "username email phone kyc referral createdAt")
        // let total1 = await this.model.User.total({})
        // return ResponseFormat.formatResponse(200, 'OK', {
        //     users: users,
        //     total: total
        // })
    }

    getUserDetails = async ({ lang, user_id }) => {
        try {
            let user = await this.model.User.findOne({ _id: user_id }, {}, [{
                path: 'kyc',
            }, {
                path: 'referral',
            }])
            let tfa = await this.model.Tfa.findOne({ user: user._id })
            if (tfa) {
                tfa = tfa.status
            } else {
                tfa = null
            }
            return ResponseFormat.formatResponse(200, 'OK', {
                user_id: user._id,
                name: user.name,
                avatar: user.avatar,
                username: user.username,
                email: user.email,
                birthday: user.birthday,
                phone: user.phone,
                gender: user.gender,
                wallet: user.wallet,
                role: user.role,
                country: user.country,
                add_info: user.add_info,
                tfa: tfa,
                kyc: user.kyc,
                referral: user.referral,
                status: user.status
            })
        } catch (error) {
            throw error
        }
    }

    requestRegisterPhone = async ({ lang, user, phone }) => {
        try {
            console.log(`_id = ${user._id}, phone = ${phone}`)

            //check
            const regexPhone = new RegExp(
                /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
            );

            if (!regexPhone.test(phone)) {
                throw RestError.NewInvalidInputError('Invalid phone number', 1)
            }
            let checkUser = await this.model.User.findOne({ phone, phone_verified: true })
            if (checkUser) {
                throw RestError.NewInvalidInputError('Phone number is in use. Please try with another', 2)
            }

            await this.model.User.findOneAndUpdate({ _id: user._id }, { phone: phone })
            return ResponseFormat.formatResponse(200, 'OK', {})

        } catch (err) {
            console.log('', err.message)
            throw err
        }
    }

    submitPhoneVerified = async ({ lang, user, phone, uid }) => {
        try {

            const phoneNumber = `${phone}`;

            user = await this.model.User.findOne({ phone: phoneNumber, _id: user._id })
            if (!user) {
                throw RestError.NewInvalidInputError(`This phone number hasn't been registered before`, 1)
            }
            if (user.phone !== phoneNumber) {
                throw RestError.NewInvalidInputError(`Your registered another phone number before`, 2)
            }
            const data = await verifyUserByUid(uid);
            if (data && data.uid === uid) {
                await this.model.User.findOneAndUpdate({ _id: user._id }, { phone_verified: true })

                return ResponseFormat.formatResponse(200, 'Verify phone number successfully', {})
            } else {
                throw RestError.NewInvalidInputError(`Your credential is incorrect`, 3)
            }
        } catch (err) {
            throw err
        }
    }

    requestContact = async ({userId, name, email, phones, message, address}) => {
        let user = null

        if(userId) {
            user = await this.model.User.findOne({ _id: userId })
            if(user) {
                if(!name) name = user.name
                if(!email) email = user.email
                if(!phones) phones = [user.phone]
                if(!address) address = user.add_info && user.add_info.province
            }
        }

        if(!message || !name || !email || !phones || phones.length === 0) throw RestError.NewBadRequestError(`Please fulfill all fields`)

        const no = Utils.GenCode.genCode(7)
        const request = await this.model.ContactUs.createOne({
            user: user ? user._id: null, no,
            name, email, phones, message, address,
            status: CONTACT_US.STATUS.PENDING
         })

         return ResponseFormat.formatResponse(200, 'Added contact request successfully', request)
    }

    getRequestContact = async ({key_search, requestId, page, size, filter, sort}) => {
        if(requestId) {
            const request = await this.model.ContactUs.getModel().findOne({
                _id: requestId
             })

            if(!request) {
                throw RestError.NewNotFoundError(`Cannot found the request ${requestId}`)
            }
            return ResponseFormat.formatResponseObj({
                data: request
            })
        }


        if (key_search) {
            filter = {
                ...filter,
                $or: [
                    {name: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {email: { $regex: `.*${key_search}.*`, $options: 'i' }},
                    {phones: {$elemMatch: { $regex: `.*${key_search}.*`, $options: 'i' }}}
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
        const requests = await this.model.ContactUs.getModel().find({
            ...filter
         }).sort(sort).skip(pagination.skip).limit(pagination.limit).lean()

        const total = await this.model.ContactUs.getModel().count({
            ...filter
         })

        return ResponseFormat.formatResponseObj({
            data: {
                total,
                requests
            }
        })
    }

    updateRequestContact = async ({requestId, phone, updatedMessage, status, address}) => {
        const request = await this.model.ContactUs.getModel().findOne({
            _id: requestId
         })

        if(!request) {
            throw RestError.NewNotFoundError(`Cannot found the request ${requestId}`)
        }

        if(phone && (!request.phones || !request.phones.includes(phone))) {
            request.phones = [phone, ...(request.phones || [])]
        }

        if(updatedMessage) {
            request.message = updatedMessage
        }

        if(address) {
            request.address = address
        }

        if(status) {
            request.status = status
        }

        const updatedRequest = await request.save({new: true})
        return ResponseFormat.formatResponseObj({
            data: updatedRequest
        })
    }
}

module.exports = User
