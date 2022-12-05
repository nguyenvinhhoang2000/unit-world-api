module.exports = () => {
    console.log('Register Worker.')

    require('./scan-deposit')()
    require('./referral-reward')()
    require('./confirm-ido')()
    require('./sync-project-detail')()
    require('./confirm-offer')()
    require('./confirm-exchange')()
    require('./confirm-claim')()
    require('./confirm-swap')()
}
