const express = require('express')
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
const multer = require('multer')

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {joiValidate} = require('../middleware/json-validate')
const {BankAccountSchema} = require('../middleware/validate/wallet.schema')
const {apiHandler} = require('../middleware/handler')
const {mustKyc, validateTfa} = require('../middleware/kyc')
const {roleAuthorize, ROLES, adminAccountingView} = require('../middleware/role-authenticate')

class Wallet {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        // general
        this.router.get('/get', 
            jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate, 
            adminAccountingView,
            apiHandler(this.ctrl.Wallet.get))

        // general
        this.router.put('/search-history', 
            jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate, 
            adminAccountingView,
            apiHandler(this.ctrl.Wallet.getDepositWithdrawSwap))

        // general
        this.router.post('/get-stock', 
            jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate, 
            adminAccountingView,
            apiHandler(this.ctrl.Wallet.getStock))


        // withdraw
        this.router.post(
            '/withdraw',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            mustKyc,
            apiHandler(this.ctrl.Wallet.withdraw),
        )
        this.router.get(
            '/withdraw',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminAccountingView,
            apiHandler(this.ctrl.Wallet.getWithdraw),
        )
        this.router.post(
            '/verify-withdraw',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Wallet.verifyWithdraw),
        )
        this.router.post(
            '/cancel-withdraw',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Wallet.cancelWithdraw),
        )
        this.router.get(
            '/bank-account',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminAccountingView,
            apiHandler(this.ctrl.Wallet.getBankAccount),
        )
        this.router.post(
            '/bank-account',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            joiValidate(BankAccountSchema),
            apiHandler(this.ctrl.Wallet.addBankAccount),
        )

        this.router.delete(
            '/bank-account',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Wallet.removeBankAccount),
        )

        // deposit
        this.router.get(
            '/request-deposit',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Wallet.requestDeposit),
        )
        this.router.post(
            '/cancel-deposit',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Wallet.cancelDeposit),
        )
        this.router.get(
            '/deposit',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminAccountingView,
            apiHandler(this.ctrl.Wallet.getDeposit),
        )

        this.router.put(
            '/mark-deposit',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            multer({limits: {fieldSize: 3 * 1024 * 1024}}).single('file'),
            apiHandler(this.ctrl.Wallet.markDeposit),
        )

        // admin role
        this.router.get(
            '/admin-list-withdrawal',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            apiHandler(this.ctrl.Wallet.getWithdraw),
        )

        this.router.post(
            '/admin-mark-deposit',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            apiHandler(this.ctrl.Wallet.adminMarkDeposit),
        )

        this.router.put(
            '/admin-mark-withdrawal-upload',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            multer({limits: {fieldSize: 3 * 1024 * 1024}}).single('file'),
            apiHandler(this.ctrl.Wallet.adminMarkWithdrawUpload),
        )

        this.router.post(
            '/admin-mark-withdrawal',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            apiHandler(this.ctrl.Wallet.adminMarkWithdraw),
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Wallet
