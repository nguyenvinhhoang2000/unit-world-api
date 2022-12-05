function generateCheckNumber() {
    return Math.floor(100000 + Math.random() * 900000)
}

function randomInt(max) {
    return Math.floor(Math.random() * max)
}

module.exports = {
    generateCheckNumber,
    randomInt,
}
