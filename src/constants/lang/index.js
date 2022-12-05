let en = require('./en.json')
let vn = require('./vn.json')
const getLang = (lang, label) => {
    switch (lang) {
        case 'en':
            lang = en
            break
        case 'vn':
            lang = vn
            break
        default:
            break
    }

    return lang[label] ? lang[label] : 'No content'
}

module.exports = {getLang}
