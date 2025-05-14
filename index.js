const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const fs = require('fs').promises;
const path = require('path');

// Utility Functions
const validateMobileNumber = (mobile) => {
  if (mobile == null) return null;
  const mobileStr = String(mobile); // Convert to string to ensure replace works
  const digitsOnly = mobileStr.replace(/\D/g, '');
  return /^\d{10}$/.test(digitsOnly) ? digitsOnly : null;
};

const dataCache = new Map();
const readJsonFile = async (filename) => {
  if (dataCache.has(filename)) return dataCache.get(filename);
  try {
    const filePath = path.join(__dirname, filename);
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    dataCache.set(filename, parsed);
    return parsed;
  } catch (error) {
    throw new Error(`Failed to read ${filename}: ${error.message}`);
  }
};

// Common Response Helper
const respondWith = (agent, message, followUp = 'What would you like to do next? (e.g., portfolio, transactions, explore funds, exit)') => {
  agent.add(message);
  if (followUp) agent.add(followUp);
};

// Mobile Number Middleware
const requireMobile = (agent, resumeIntent, extraParams = {}) => {
  const mobile = validateMobileNumber(agent.context.get('got_mobile')?.parameters?.mobile);
  if (!mobile) {
    agent.context.set({
      name: 'ask_mobile_number',
      lifespan: 2,
      parameters: { resume_intent: resumeIntent, ...extraParams }
    });
    respondWith(agent, 'Please share your mobile number to continue.', null);
    return false;
  }
  return mobile;
};

// Intent Handlers
const intentHandlers = {
  WelcomeMessage: (agent) => {
    respondWith(
      agent,
      'Hi, welcome to CARING Mutual Fund Services. What service would you like to use ? \n - Portfolio Valuation \n - Explore Funds \n - Transaction History',
      null
    );
  },

  GetMobileNumber: (agent) => {
    const mobile = validateMobileNumber(agent.parameters['mobile']);
    if (!mobile) {
      respondWith(agent, 'Please enter a valid 10-digit mobile number.', null);
      return;
    }
    agent.context.set({
      name: 'got_mobile',
      lifespan: 5,
      parameters: { mobile }
    });
  },

  TransactionHistory: async (agent) => {
    const datePeriod = agent.parameters['date-period'];
    const mobile = requireMobile(agent, 'TransactionHistory', { 'date-period': datePeriod });
    if (!mobile) return;
    if (!datePeriod?.startDate || !datePeriod?.endDate) {
      respondWith(agent, 'Please provide comma(,) Separated Valid date range With format (2025-04-10) ', null);
      return;
    }

    try {
      const data = await readJsonFile('transactionhistorysample.json');
      const userData = data.find(u => u.mobile === mobile);
      if (!userData) {
        respondWith(agent, 'No account found for this mobile number.');
        return;
      }

      const startDate = new Date(datePeriod.startDate);
      const endDate = new Date(datePeriod.endDate);
      const filtered = userData.transactions.filter(tx => {
      const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });

      if (filtered.length === 0) {
        respondWith(agent, 'No transactions found in the given date range.');
      } else {
        let response = 'Your transactions:\n';
        filtered.forEach(tx => {
          response += `• ${tx.date}: ₹${tx.amount} - ${tx.fund_name}\n`;
        });
        respondWith(agent, response);
      }
    } catch (error) {
      console.error('Transaction History Error:', error);
      respondWith(agent, 'Error retrieving transactions. Please try again.');
    }
  },

  PortfolioEvalution: async (agent) => {
    const mobile = requireMobile(agent, 'PortfolioEvalution');
    if (!mobile) return;

    try {
      const data = await readJsonFile('transactionhistorysample.json');
      const userData = data.find(u => u.mobile === mobile);
      if (!userData) {
        respondWith(agent, 'No account found for your mobile number.');
        return;
      }

      const total = userData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      respondWith(agent, `💼 Your portfolio valuation: ₹${total}.`);
    } catch (error) {
      console.error('Portfolio Valuation Error:', error);
      respondWith(agent, 'Error retrieving portfolio. Please try again.');
    }
  },

  ExploreFunds: async (agent) => {
    const type = agent.parameters['fund-category']?.toLowerCase();
    const mobile = requireMobile(agent, 'ExploreFunds', { fund_category: type });
    if (!mobile) return;

    try {
      const data = await readJsonFile('fund&categorysample.json');
      const match = data.find(f => f.category.toLowerCase() === type);
      if (!match) {
        respondWith(agent, `No details found for category "${type}". Try another category.`);
        return;
      }

      let response = `Available ${type} funds:\n`;
      match.funds.forEach(f => {
        response += `• ${f.fund_name} (ID: ${f.fund_id})\n`;
      });
      respondWith(agent, response, 'Want details on any fund or to invest?');
    } catch (error) {
      console.error('Explore Funds Error:', error);
      respondWith(agent, 'Error retrieving funds. Please try again.');
    }
  },

  FundDetails: async (agent) => {
    const fundName = agent.parameters['fund-name']?.toLowerCase();
    try {
      const data = await readJsonFile('fund_details.json');
      const fund = data.find(f => f.fund_name.toLowerCase() === fundName);
      if (!fund) {
        respondWith(agent, `No details found for fund: ${fundName}`);
        return;
      }

      let response = `📊 *${fund.fund_name}* Breakdown:\n`;
      for (const [k, v] of Object.entries(fund.breakdown)) {
        response += `• ${k}: ${v}%\n`;
      }
      response += `\n🔗 More info: ${fund.details_link}`;
      respondWith(agent, response);
    } catch (error) {
      console.error('Fund Details Error:', error);
      respondWith(agent, 'Error retrieving fund details. Please try again.');
    }
  },

  InvestInFund: async (agent) => {
    const mobile = requireMobile(agent, 'InvestInFund', {
      'fund-name': agent.parameters['fund-name'],
      amount: agent.parameters['amount']
    });
    if (!mobile) return;

    const amount = agent.parameters['amount'];
    const fundRaw = agent.parameters['fund-name'];
    const fundName = Array.isArray(fundRaw) ? fundRaw[0] : fundRaw;
    const normalizedFund = fundName?.trim()?.toLowerCase();

    if (!normalizedFund || !amount) {
      respondWith(agent, 'Please specify both fund name and investment amount.');
      return;
    }

    if (amount > 50000) {
      respondWith(agent, 'Investments above ₹50,000 require verification. Contact support.');
      return;
    }

    try {
      const data = await readJsonFile('fund_details.json');
      const matched = data.find(f => f.fund_name.toLowerCase() === normalizedFund);
      if (!matched) {
        respondWith(agent, `No fund found with name "${fundName}".`);
        return;
      }

      respondWith(agent, `✅ Invested ₹${amount} in ${matched.fund_name}.`);
    } catch (error) {
      console.error('Invest In Fund Error:', error);
      respondWith(agent, 'Error processing investment. Please try again.');
    }
  },

  SwitchAccount: (agent) => {
    agent.context.set({ name: 'got_mobile', lifespan: 0 });
    agent.context.set({ name: 'ask_mobile_number', lifespan: 2 });
    respondWith(agent, 'Please provide your new mobile number.', null);
  }
};

// Express App Setup
const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send('Hello from Talent Mutual Fund Bot!');
});

app.post('/webhook', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  //list all handlers
  const intentMap = new Map(Object.entries(intentHandlers));
  //Errro handling
  agent.handleRequest(intentMap).catch(error => {
    console.error('Webhook Error:', error);
    respondWith(agent, 'Sorry, something went wrong. Please try again later.', null);
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));