// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();


 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  // tslint:disable-next-line:no-shadowed-variable
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  // tslint:disable-next-line:no-shadowed-variable
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

// tslint:disable-next-line:no-shadowed-variable
function readFromDb (agent) {
  // Get the database collection 'dialogflow' and document 'agent'
  const dialogflowAgentDoc = db.collection('dialogflow').doc('agent');
  agent.add('So far so good');
  // Get the value of 'entry' in the document and send it to the user
  return dialogflowAgentDoc.get()
    .then(doc => {
      if (!doc.exists) {
        agent.add('No data found in the database!');
      } else {
        agent.add(doc.data().entry);
      }
      return Promise.resolve('Read complete');
    }).catch(() => {
      agent.add('Error reading entry from the Firestore database.');
      agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
    });
}

// tslint:disable-next-line:no-shadowed-variable
function writeToDb (agent) {
  // Get parameter from Dialogflow with the string to add to the database
  const databaseEntry = agent.parameters.databaseEntry;

  // Get the database collection 'dialogflow' and document 'agent' and store
  // the document  {entry: "<value of database entry>"} in the 'agent' document
  const dialogflowAgentRef = db.collection('dialogflow').doc('agent');
  return db.runTransaction(t => {
    t.set(dialogflowAgentRef, {entry: databaseEntry});
    return Promise.resolve('Write complete');
  }).then(doc => {
    agent.add(`Wrote "${databaseEntry}" to the Firestore database.`);
  }).catch(err => {
    console.log(`Error writing to Firestore: ${err}`);
    agent.add(`Failed to write "${databaseEntry}" to the Firestore database.`);
  });
}

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // tslint:disable-next-line:no-shadowed-variable
  function yourFunctionHandler(agent) {
    agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    agent.add(new Card({
         title: `Title: this is a card title`,
         imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
         text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
         buttonText: 'This is a button',
         buttonUrl: 'https://assistant.google.com/'
       })
     );
     agent.add(new Suggestion(`Quick Reply`));
     agent.add(new Suggestion(`Suggestion`));
     agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
   }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  const intentMap = new Map();
  // intentMap.set('Default Welcome Intent', welcome);
  // intentMap.set('Default Fallback Intent', fallback);
     intentMap.set('get me some data', readFromDb);
     intentMap.set('save me some data', writeToDb);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
