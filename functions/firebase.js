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

module.exports.createBudget = async (name, income, expenses) => {
    console.log(`Storing ${name} budget in database`)

    const monthly = income - expenses
    const weekly = (income - expenses) / 4.0
    const daily = (income - expenses) / 30.0

    const results = []

    results.add(admin.firestore.collection('budgets').doc(`${name}`).delete())

    results.add(admin.firestore.collection('budgets').doc(`${name}`).set({
        name: name,
        income: income,
        expenses: expenses,
        daily_limit: daily,
        weekly_limit: weekly,
        monthly_limit: monthly
    }))

    return Promise.all(results)
}

module.exports.getBank = async (bankId) => {
    return admin.firestore().collection('banks').doc(bankId).get()
}