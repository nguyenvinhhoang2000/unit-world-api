function genCode(length) {
    var result = ''
    var characters = '0123456789abcdefghijklmnopqrstvxyzQWERTYUIOPLKJHGFDSAZXCVBNM'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function genSimpleCode(length) {
    var result = ''
    var characters = '0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function genCodeForBill() {
    var result = 'B'
    var characters = 'QWERTYUIOPLKJHGFDSAZXCVBNM'
    let characters2 = '0123456789abcdefghijklmnopqrstvxyz'
    var charactersLength1 = characters.length
    var charactersLength2 = characters2.length

    for (var i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength1))
    }
    for (var i = 0; i < 7; i++) {
        result += characters2.charAt(Math.floor(Math.random() * charactersLength2))
    }
    return result
}

module.exports = {
    genCode,
    genSimpleCode,
    genCodeForBill,
}
