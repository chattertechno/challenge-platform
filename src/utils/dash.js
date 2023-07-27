import { Client } from 'dash'
const CryptoJS = require('crypto-js')
import jwt_decode from 'jwt-decode'

export const adminMnemonic =
  'garden worry either voyage muffin arrest donate unable pumpkin book thing faculty'
export const adminrecipientAddress = 'yS2izkG4dVHNd9LZpPxWZG11zcpMd76mxX'
export const secretKey = 'goalPlatform22'

export async function getDashAccount() {
  const client = new Client({
    network: 'testnet',
    wallet: {
      offlineMode: true,
    },
  })

  const account = await client.wallet.getAccount()

  return {
    address: account.getUnusedAddress().address,
    balance: {
      confirmed: account.getConfirmedBalance(),
      total: account.getTotalBalance(),
    },
    mnemonic: client.wallet.exportWallet(),
  }
}

export async function encryptMnemonic(mnemonic, secretKey) {
  return new Promise((resolve, reject) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(mnemonic, secretKey)
      resolve(encrypted.toString())
    } catch (error) {
      reject(error)
    }
  })
}

export async function sendFundsToEscrow(mnemonic, betAmount) {
  const clientOpts = {
    network: 'testnet',
    wallet: {
      mnemonic: mnemonic,
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 863227, // only sync from early-2022
      },
    },
  }

  const client = new Client(clientOpts)
  const account = await client.wallet.getAccount()
  const totalBalance = await account.getTotalBalance()
  const utxos = await account.getUTXOS()
  const sendFunds = async () => {
    if (totalBalance < betAmount * 100000000 || !utxos?.length)
      return 'Charge your account!'
    else {
      const transaction = account.createTransaction({
        recipient: adminrecipientAddress, // Testnet2 faucet
        satoshis: betAmount * 100000000, // Convert the amount to satoshis
      })
      return account.broadcastTransaction(transaction)
    }
  }

  try {
    const result = await sendFunds() // Wait for the result of the transaction broadcast
    return result // Return the transaction broadcast result
  } catch (error) {
    console.error('Something went wrong:\n', error)
    throw error // Rethrow the error in case the caller wants to handle it
  } finally {
    client.disconnect() // Disconnect the client after sending the funds
  }
}

export async function getMyFunds(mnemonic) {
  const clientOpts = {
    network: 'testnet',
    wallet: {
      mnemonic: mnemonic,
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 863227, // only sync from early-2022
      },
    },
  }

  const client = new Client(clientOpts)
  const account = await client.wallet.getAccount()
  const totalBalance = await account.getTotalBalance()
  console.log(totalBalance)
  client.disconnect()
  return totalBalance
}

export async function sendFundsToChallengeWinners(element) {
  const clientOpts = {
    network: 'testnet',
    wallet: {
      mnemonic: adminMnemonic,
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 863227, // only sync from early-2022
      },
    },
  }

  const client = new Client(clientOpts)
  const account = await client.wallet.getAccount()
  const utxos = await account.getUTXOS()

  try {
    // Calculate the total amount needed for all payments

    // Check if the wallet balance is sufficient for all payments
    const balance = await account.getTotalBalance()
    if (balance < element?.amount * 100000000 || !utxos?.length) {
      return 'Charge your account!'
    }

    // Create a transaction for each user
    const transaction = account.createTransaction({
      recipient: element?.identity,
      satoshis: element?.amount * 100000000,
    })

    try {
      const transactionId = await account.broadcastTransaction(transaction)

      return {
        transactionId,
        challengeId: element?.challenge_id,
      }
    } catch (error) {
      console.error('Error broadcasting transaction:', error)
      throw error // Rethrow the error if needed
    }
  } catch (error) {
    console.error('Something went wrong:', error)
    throw error // Rethrow the error in case the caller wants to handle it
  } finally {
    client.disconnect() // Disconnect the client after sending the funds
  }
}

export async function jwtDecode(token) {
  var decoded = jwt_decode(token)
  return decoded
}
export async function decryptMnemonic(encryptedMnemonic, secretKey) {
  return new Promise((resolve, reject) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, secretKey)
      const mnemonic = decrypted.toString(CryptoJS.enc.Utf8)
      resolve(mnemonic)
    } catch (error) {
      reject(error)
    }
  })
}

export const registerIdentity = async (mnemonic) => {
  const client = new Client({
    network: 'testnet',
    wallet: {
      mnemonic: mnemonic,
      unsafeOptions: {
        skipSynchronizationBeforeHeight: 650000,
      },
    },
  })
  const account = await client.getWalletAccount()
  const identities = account.identities.getIdentityIds()
  let identity = (identities || [null])[0]
  if (!identity) {
    identity = await client.platform.identities
      .register()
      .then((d) => d.toJSON())
    identity = (identity || {}).id
  }
  return identity
}

export const createDashEscrow = async () => {
  const clientOpts = {
    network: 'testnet',
    wallet: {
      mnemonic: null,
      offlineMode: true,
    },
  }
  const client = new Client(clientOpts)

  const account = await client.getWalletAccount()
  const mnemonic = client.wallet.exportWallet()
  const address = account.getUnusedAddress()

  return {
    mnemonic,
    address,
  }
}
