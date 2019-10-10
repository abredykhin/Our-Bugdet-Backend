'use strict';

import plaid = require('plaid')
import firebase = require('./firebase')
import util = require('util')
import moment = require('moment')

const PLAID_ENV = plaid.environments.sandbox // TODO: change to prod
const PLAID_CLIENT_ID = "5cfea7d083a3230012cc3b9d"
const PLAID_PUBLIC_KEY = "c97bb2a089e4c7935133a0c96043ef"
const PLAID_SECRET = "b9376414937a1160da8e954f6307c8" // sandbox
//const PLAID_SECRET = "6364bf5effaef128107827bb389c67" // dev

const plaidClient = new plaid.Client(
    PLAID_CLIENT_ID,
    PLAID_SECRET,
    PLAID_PUBLIC_KEY,
    plaid.environments[PLAID_ENV]
);

export async function addBankAndAccounts(publicToken: string, institutionId: string) {
    console.log(`Adding new bank and its accounts`)
    const bankAccess = await plaidClient.exchangePublicToken(publicToken);
    const bankAccessToken = bankAccess.access_token;
    const bankId = bankAccess.item_id;

    console.log(`Querying info about institution ${institutionId}`)
    const bankInfo = await plaidClient.getInstitutionById(institutionId)
    console.log(util.inspect(bankInfo))

    const accounts = await plaidClient.getAccounts(bankAccessToken);
    console.info("Success getting accounts from Plaid");
    console.log(util.inspect(accounts))
    return firebase.storeBankAndAccounts(bankId, bankInfo.institution.name, bankInfo.institution.logo,
        bankInfo.institution.primary_color, bankAccessToken, accounts.accounts);
}

export async function pullNewTransactions(bankId: string) {
    console.log(`Pulling transactions for bank ${bankId}`)
    const bankRef = await firebase.getBank(bankId)
    const bank = bankRef.data()
    console.log("Bank info")
    console.log(util.inspect(bank))
    const now = moment().format('YYYY-MM-DD')

    let lastSyncTimestamp = null;
    if (bank && bank && bank.lastSyncTimestamp) {
        lastSyncTimestamp = bank.lastSyncTimestamp
    } else {
        lastSyncTimestamp = moment().subtract(30, 'days')
    }
    const startDate = lastSyncTimestamp.format('YYYY-MM-DD')

    console.info(`Pulling new transactions for bank ${bank} since ${lastSyncTimestamp}`)

    const response = await plaidClient.getTransactions(bank.access_token, startDate, now, { count: 250, offset: 0 })
    const transactions = response.transactions;
    console.log(util.inspect(response))
    console.log(`Found ${transactions.length} transactions`);

    const results = []
    results.push(firebase.storeTransactions(bank.id, transactions))
    results.push(this.updateBankBalances(bankId, bank.access_token))
    return Promise.all(results)
}

export async function updateBankBalances(bankId: string, accessToken: string) {
    const results = []

    const bankBalances = await plaidClient.getBalance(accessToken);
    for (const account of bankBalances.accounts) {
        results.push(firebase.updateBankAccountBalances(bankId, account))
    }

    results.push(firebase.updateBankTotalBalance(bankId, totalBankBalance))
    return Promise.all(results)
}