'use strict';

const functions = require('firebase-functions');
const plaidLink = require('./plaidLink');
const firebase = require('./firebase');
const util = require('util')

exports.addBank = functions.https.onCall(async (data, context) => {
    console.info("Received request to add bank item with ");
    console.info(data);
    const publicToken = data.public_token;
    const institutionId = data.institution_id;

    await plaidLink.addBankAndAccounts(publicToken, institutionId);

    return {
        status: "OK"
    }
});

exports.pullAccountTransactions = functions.https.onRequest(async (req, res) => {
    console.log("Received web hook push")
    console.log(util.inspect(req.body))

    if (req.body.webhook_type === 'TRANSACTIONS') {
        switch (req.body.webhook_code) {
            case "INITIAL_UPDATE":
                await plaidLink.pullNewTransactions(req.body.item_id)
                break;
            //case "HISTORICAL_UPDATE":
            //                break;
            case "DEFAULT_UPDATE":
                break;
            case "TRANSACTIONS_REMOVED":
                // Is this needed ot Default updated will fire?
                // const pendingToPosted = data.pending_transaction_id;
                // if (pendingToPosted != null) {
                // 
                //}
                firebase.removeTransactions(req.body.item_id, req.body.removed_transactions);
                break;
        }
    }

    res.status(200).send();
})