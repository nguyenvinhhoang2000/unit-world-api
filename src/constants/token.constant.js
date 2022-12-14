//remove dotenv config.config()
const BigNumber = require('bignumber.js');
const ethers = require('ethers')

const BSC_TOKEN = {
    MAINNET: {
        BNB: '0x0000000000000000000000000000000000000000',
        USDT: '0x55d398326f99059fF775485246999027B3197955',
        ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        BTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        BCH: '0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf',
        DOT: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
        FIL: '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153',
        SNX: '0x9Ac983826058b8a9C7Aa1C9171441191232E8404',
        LTC: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94',
        ATOM: '0x0Eb3a705fc54725037CC9e008bDede697f62F335',
        ONT: '0xFd7B3A77848f1C2D67E05E54d78d174a0C850335',
        ADA: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
        DAI: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
        EOS: '0x56b6fB708fC5732DEC1Afc8D8556423A2EDcCbD6',
        BAND: '0xAD6cAEb32CD2c308980a548bD0Bc5AA4306c6c18',
        XRP: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
        XTZ: '0x16939ef78684453bfDFb47825F8a5F714f12623a',
        BAT: '0x101d82428437127bF1608F699CD651e6Abf9766E',
        LINK: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
        UNI: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1',
        YFII: '0x7F70642d88cf1C4a3a7abb072B53B929b653edA5',
        YFI: '0x88f1A5ae2A3BF98AEAF342D26B30a79438c9142e',
        BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        NEAR: '0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63',
        ZEC: '0x1Ba42e5193dfA8B03D15dd1B86a3113bbBEF8Eeb',
        COMP: '0x52CE071Bd9b1C4B00A0b92D298c512478CaD67e8',
        MKR: '0x5f0Da599BB2ccCfcf6Fdfd7D81743B6020864350',
        TCT: '0xCA0a9Df6a8cAD800046C1DDc5755810718b65C44',
        IOTX: '0x9678E42ceBEb63F23197D726B29b1CB20d0064E5',
        BEL: '0x8443f091997f06a61670B735ED92734F5628692F',
        ELF: '0xa3f020a5C92e15be13CAF0Ee5C95cF79585EeCC9',
        PAX: '0xb7F8Cd00C5A06c0537E2aBfF0b58033d02e5E094',
        USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        INJ: '0xa2B726B1145A4773F68593CF171187d8EBe4d495',
        SXP: '0x47BEAd2563dCBf3bF2c9407fEa4dC236fAbA485A',
        ETC: '0x3d6545b08693daE087E957cb1180ee38B9e3c25E',
    },
    TESTNET: {
        BNB: '0x0000000000000000000000000000000000000000',
        USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
        ETH: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378',
        BTC: '0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8',
        USDR: '0x4f25af93d98843cbd6b0b12407defef4c7df53fa',
    },
}

const TOKEN_UNIT = {
    WEI: 10 ** 18,
    GWEI: 10 ** 9,
    SATOSHI: 10 ** 8,
    MAX_APPROVAL: ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), 18)
}

const NETWORK = {
    BSC: 'BSC',
    ETH: 'ETH',
}

const TOKEN = {
    USDT: 'USDT',
    ETH: 'ETH',
    USDR: 'USDR',
    REX: 'REX',
    BNB: 'BNB',
    VND: 'VND',
    STOCK: 'STOCK'
}

module.exports = {
    BSC_TOKEN,
    TOKEN,
    TOKEN_UNIT,
    NETWORK,
}
