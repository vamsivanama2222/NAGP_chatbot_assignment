const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express().use(bodyParser.json());

const intentHandlers = require('./intents');

app.get('/', (req, res) => {
  res.send('Hello from ABC Mutual Fund Bot!');
});

app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  const intentMap = new Map();
  for (const [intent, handler] of Object.entries(intentHandlers)) {
    intentMap.set(intent, handler);
  }

  agent.handleRequest(intentMap);
});

app.listen(3000, () => console.log("🚀 Server is running on port 3000"));