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
    var bankTotalBalance = 0.0

    const results = []
    for (const acc of accounts) {
        acc.balance = acc.balances.current
        results.push(accountsRef.add(acc));
        bankTotalBalance += acc.balances.current
    }

    results.push(this.updateBankTotalBalance(bankId, bankTotalBalance))

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

module.exports.updateBankTotalBalance = async (bankId, balance) => {
    console.log(`Updating total bank ${bankId} balance to ${balance}`)
    const balanceRef = admin.firestore().collection('banks').doc(`${bankId}`)

    return balanceRef.update({
        totalBalance: balance
    })
}

module.exports.updateAccountBalance = async (bankId, accountId, accountType, balance) => {
    console.log(`Updating account ${accountId} (bank ${bankId}) balance to ${balance}`)

    if (accountType === 'loan' || accountType === 'credit') {
        balance = -balance
    }
    const accountRef = admin.firestore().collection('banks').doc(`${bankId}`).collection('accounts').doc(`${accountId}`)
    return accountRef.update({
        balance: balance
    })
}