//remove dotenv config.config()
const {createContainer, asClass, asValue, InjectionMode} = require('awilix')

//model
const ModelRepository = require('../../models')

//controllers
const ControllerRepository = require('../../controllers')

//actions
const ActionRepository = require('../../actions')

//routers
const RouterRepository = require('../../routes')

//routers
const ConnectionRepository = require('../../connections')

//services

const container = createContainer({
    injectionMode: InjectionMode.PROXY,
})

container.register({
    router: asClass(RouterRepository),
    model: asClass(ModelRepository),
    ctrl: asClass(ControllerRepository),
    action: asClass(ActionRepository),
    connect: asClass(ConnectionRepository),
})

module.exports = container
