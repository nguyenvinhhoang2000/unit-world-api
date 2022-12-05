const MODE = process.env.MODE

exports.getEnv = (key, def = undefined) => {
    return process.env[`${MODE}_${key}`] || def
}
