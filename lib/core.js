const NodeRsa = require('node-rsa');
const Web3 = require('web3');
const {abi: signidiceABI} = require('../artifacts/Signidice.json');
const provider = 'https://mainnet.infura.io/v3/bf28a9be07f4453bb111125224c1c9ba';
const signidiceAddr = '0xb4E05fFc2Ecae86E5d486C0498fcfBD41b1c729b';
const ROLL_MIN = 1;
const ROLL_MAX = 100;
const GAMBLE_INTENTION = 4;
const web3 = new Web3(provider);

function toBytes2 (number) {
  return web3.utils.padLeft(web3.utils.toHex(number), 2);
}

function toBytes32 (number) {
  return web3.utils.padLeft(web3.utils.toHex(number), 64);
}

function remove0x (str) {
  return str.replace(/^0x/, '');
}

function verifyRSA (rsaN, rsaE, msgHash, msgSign) {
  const rsa = new NodeRsa();
  rsa.importKey({
    n: Buffer.from(rsaN, 'hex'),
    e: parseInt(rsaE, 16)
  }, 'components-public');
  msgHash = Buffer.from(remove0x(msgHash), 'hex');
  return rsa.verify(msgHash, msgSign, 'hex', 'hex');
}
/*
const info = {
channelId, // bet
session, // bet
betMoney, // bet
betNumber, // bet
seed, // bet
rndSig, // bet
rsaN, // channel
rsaE // channel
};
*/
function getBetHash (bet) {
  const betPack = [
    {t: 'uint8', v: GAMBLE_INTENTION},
    {t: 'bytes32', v: bet.channelId},
    {t: 'uint256', v: web3.utils.toWei(bet.betMoney + '', 'ether')},
    {t: 'uint256', v: bet.session + ''},
    {t: 'bytes32', v: toBytes32(bet.seed)},
    {t: 'bytes', v: toBytes2(bet.betNumber)}
  ];
  const betHash = web3.utils.soliditySha3(...betPack);
  return betHash;
}

function checkRSASign (bet) {
  const betHash = getBetHash(bet);
  return verifyRSA(bet.rsaN, bet.rsaE, betHash, bet.rndSig);
}

async function getRndNumber (rsaSign) {
  const signidiceContract = new web3.eth.Contract(signidiceABI, signidiceAddr);
  const res = await signidiceContract.methods.generateLuck(rsaSign, ROLL_MIN, ROLL_MAX).call();
  const rndNumber = web3.utils.hexToNumber(res);
  return rndNumber;
}

module.exports = {
  getBetHash,
  checkRSASign,
  getRndNumber
};

if (typeof window !== 'undefined') {
  window.getRndNumber = getRndNumber;
  window.checkRSASign = checkRSASign;
}
