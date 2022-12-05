module.exports = () => {
    console.log('Register Queue.')

    require('./bsc-deposit')()
    require('./bsc-withdraw')()
    require('./p2p-fulfillment')()
    require('./swap-fulfillment')()
    require('./project-contract')()
}
