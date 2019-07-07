'use strict';

const moment = require('moment')
const util = require('util')

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin')
admin.initializeApp({ credential: admin.credential.applicationDefault() })

module.exports.storeBankAndAccounts = async (bankId, bankName, bankLogo, bankPimaryColor, accessToken, accounts) => {
    console.log(`Adding new bank ${bankId} and its ${accounts.length} accounts`)
    const bankRef = admin.firestore().collection('banks').doc(`${bankId}`);

    const bankInfo = {
        id: bankId,
        access_token: accessToken,
        name: bankName,
        logo: bankLogo || null,
        primary_color: bankPimaryColor || null
    }

    console.log('Storing bank info as')
    console.log(util.inspect(bankInfo))

    await bankRef.set(bankInfo);

    let accountsRef = bankRef.collection('accounts');

    const results = []
    for (const acc of accounts) {
        results.push(accountsRef.add(acc));
    }

    return Promise.all(results);
}

module.exports.removeTransactions = async (bankId, transactions) => {
    console.log(`Removing ${transactions.length} transactions from bank ${bankId}`)

    const transactionsCollection = admin.firestore().collection('banks').doc(bankId).collection('transactions');

    const results = []
    for (const tr of transactions) {
        results.push(transactionsCollection.doc(tr.transaction_id).delete())
    }

    return Promise.all(results);
}

module.exports.storeTransactions = async (bankId, transactions) => {
    console.log(`Storing transactions for bank ${bankId} in database`)
    const now = moment().unix();
    const bankRef = admin.firestore().collection('banks').doc(itemId)
    const transactionsRef = bankRef.collection('transactions');

    const results = []
    for (const tr of transactions) {
        results.push(transactionsRef.doc(tr.transaction_id).set(tr));
    }

    results.push(bankRef.update({ last_sync_timestamp: now }))

    return Promise.all(results);
}

module.exports.updateBankAccountBalances = async (bankId, account) => {
    console.log(`Storing balances in accounts for bank ${bankId} in database`)

    const accountRef = admin.firestore.collection('banks').doc(`${bankId}`).collection('accounts').doc(`${account}`)
    return accountRef.update({
        balances: account.balances
    })
}
/**
module.exports.getTransactions = async (bankId) => {
    console.log(`Querying all transactions in ${itemId}`);
    const snapshot = await admin.firestore().collection('/items').doc(itemId).collection('transactions');
    const transactions = [];
    snapshot.forEach(doc => {
        transactions.push(doc.data());
    })
    return transactions;
}
 */

module.exports.getBank = async (bankId) => {
    return admin.firestore().collection('banks').doc(bankId).get()
}

//  TODO: are these needed?
/*
module.exports.messageTotalBalance = async (bankId) => {
    console.log(`Sending message to topic Balance regarding bank ${bankId}`)

    const message = {
        data: {
            bankId: bankId
        },
        topic: 'balance'
    }

    return admin.messaging().send(message)
}

module.exports.messageNewTransactions = async (bankId) => {
    console.log(`Sending message to topic Transaction regarding bank ${bankId}`)

    const message = {
        data: {
            bankId: bankId
        },
        topic: 'transactions'
    }
}
*/