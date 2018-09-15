"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebaseHelper = require("firebase-functions-helper");
const express = require("express");
const bodyParser = require("body-parser");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const app = express();
const main = express();
const messagesCollection = 'messages';
main.use('/api/v1', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));
// webApi is your functions name, and you will pass main as 
// a parameter
exports.webApi = functions.https.onRequest(main);
// View all test messages
app.get('/messages', (req, res) => {
    firebaseHelper.firestore
        .backup(db, messagesCollection)
        .then(data => res.status(200).send(data));
});
//# sourceMappingURL=index.js.map