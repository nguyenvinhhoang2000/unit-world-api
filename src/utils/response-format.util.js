const formatResponse = (status = 200, msg = '', data = null, code = 200) => {
    return {
        status: status,
        body: {
            msg: msg,
            data: data,
            code: code,
        },
    }
}
const formatResponseObj = ({status = 200, msg = '', data = null, code = 200}) => {
    return {
        status: status,
        body: {
            msg: msg,
            data: data,
            code: code,
        },
    }
}
module.exports = {formatResponse, formatResponseObj}
