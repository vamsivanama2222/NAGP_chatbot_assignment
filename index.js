import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { WebhookClient } from 'dialogflow-fulfillment';

const app = express().use(bodyParser.json());
const PORT = 3000;
const DATA_FILES = {
  transactions: 'transactionhistorysample.json',
  funds: 'fund&categorysample.json',
  fundDetails: 'fund_details.json',
};
const dataCache = new Map();

// Utility Functions
const loadData = async (fileKey) => {
  if (!dataCache.has(fileKey)) {
    try {
      const data = await fs.readFile(path.join(__dirname, DATA_FILES[fileKey]), 'utf8');
      dataCache.set(fileKey, JSON.parse(data));
    } catch (error) {
      console.error(`Error loading ${fileKey}:`, error);
      throw new Error(`Failed to load ${fileKey} data`);
    }
  }
  return dataCache.get(fileKey);
};

const requireMobile = (agent, resumeIntent, extraParams = {}) => {
  agent.context.set({
    name: 'ask_mobile_number',
    lifespan: 2,
    parameters: { resumeIntent, ...extraParams },
  });
  agent.add('Please provide your mobile number to continue.');
  return false;
};

const validateMobile = (agent, mobile) => {
  const digitsOnly = mobile?.replace(/\D/g, '') || '';
  if (!/^\d{10}$/.test(digitsOnly)) {
    agent.add('Please enter a valid 10-digit mobile number.');
    return null;
  }
  agent.context.set({
    name: 'got_mobile',
    lifespan: 5,
    parameters: { mobile: digitsOnly },
  });
  return digitsOnly;
};

const getUserData = (mobile, data) => data.find((user) => user.mobile === mobile) || null;

// Intent Handlers
const welcome = (agent) => {
  agent.add('Hi, welcome to ABC Mutual Fund Services. What service would you like to use?');
  agent.add('Suggestions: Portfolio Valuation, Explore Funds, Transaction History');
};

const getMobileNumber = async (agent) => {
  const mobile = validateMobile(agent, agent.parameters.mobile);
  if (!mobile) return;

  const askContext = agent.context.get('ask_mobile_number') || {};
  const { resumeIntent, ...params } = askContext.parameters || {};

  if (resumeIntent) {
    Object.assign(agent.parameters, params);
    return intentMap[resumeIntent]?.(agent);
  }

  agent.add(`Mobile number saved: ${mobile}. How can I help you next?`);
};

const transactionHistory = async (agent) => {
  const mobile = validateMobile(agent, agent.context.get('got_mobile')?.parameters?.mobile);
  if (!mobile) {
    return requireMobile(agent, 'TransactionHistory', { datePeriod: agent.parameters['date-period'] });
  }

  const { startDate, endDate } = agent.parameters['date-period'] || {};
  if (!startDate || !endDate) {
    agent.add('Please provide the date range for transactions.');
    return;
  }

  try {
    const data = await loadData('transactions');
    const userData = getUserData(mobile, data);
    if (!userData) {
      agent.add('No account found for this mobile number.');
      return;
    }

    const filtered = userData.transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= new Date(startDate) && txDate <= new Date(endDate);
    });

    if (!filtered.length) {
      agent.add('No transactions found in the given date range.');
      return;
    }

    agent.add('Your transactions:\n' + filtered.map((tx) =>
      `• ${tx.date}: ₹${tx.amount} - ${tx.fund_name}`,
    ).join('\n'));
    agent.add('Would you like to invest more, explore funds, or exit?');
  } catch (error) {
    agent.add('Sorry, there was an error fetching your transactions.');
    console.error('TransactionHistory error:', error);
  }
};

const portfolioValuation = async (agent) => {
  const mobile = validateMobile(agent, agent.context.get('got_mobile')?.parameters?.mobile);
  if (!mobile) return requireMobile(agent, 'PortfolioValuation');

  try {
    const data = await loadData('transactions');
    const userData = getUserData(mobile, data);
    if (!userData) {
      agent.add('No account found for this mobile number.');
      return;
    }

    const total = userData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    agent.add(`💼 Portfolio valuation: ₹${total}`);
    agent.add('Explore more funds, check transactions, or exit?');
  } catch (error) {
    agent.add('Sorry, there was an error fetching your portfolio.');
    console.error('PortfolioValuation error:', error);
  }
};

const exploreFunds = async (agent) => {
  const mobile = validateMobile(agent, agent.context.get('got_mobile')?.parameters?.mobile);
  if (!mobile) {
    return requireMobile(agent, 'ExploreFunds', { fundCategory: agent.parameters['fund-category'] });
  }

  const type = agent.parameters['fund-category']?.toLowerCase();
  try {
    const data = await loadData('funds');
    const match = data.find((fund) => fund.category.toLowerCase() === type);

    if (!match) {
      agent.add(`No details found for category "${type}". Try another category.`);
      return;
    }

    agent.add(`${type} funds:\n` + match.funds.map((fund) =>
      `• ${fund.fund_name} (ID: ${fund.fund_id})`,
    ).join('\n'));
    agent.add('Want details on any fund or to invest?');
  } catch (error) {
    agent.add('Sorry, there was an error fetching fund details.');
    console.error('ExploreFunds error:', error);
  }
};

const getFundDetails = async (agent) => {
  const fundName = agent.parameters['fund-name']?.toLowerCase();
  try {
    const data = await loadData('fundDetails');
    const fund = data.find((f) => f.fund_name.toLowerCase() === fundName);

    if (!fund) {
      agent.add(`No details found for fund: ${fundName}`);
      return;
    }

    agent.add(`📊 *${fund.fund_name}* Breakdown:\n` +
      Object.entries(fund.breakdown).map(([key, value]) => `• ${key}: ${value}%`).join('\n') +
      `\n🔗 More info: ${fund.details_link}`);
  } catch (error) {
    agent.add('Sorry, there was an error fetching fund details.');
    console.error('GetFundDetails error:', error);
  }
};

const investInFund = async (agent) => {
  const mobile = validateMobile(agent, agent.context.get('got_mobile')?.parameters?.mobile);
  if (!mobile) {
    return requireMobile(agent, 'InvestInFund', {
      fundName: agent.parameters['fund-name'],
      amount: agent.parameters.amount,
    });
  }

  const amount = agent.parameters.amount;
  const fundName = (Array.isArray(agent.parameters['fund-name'])
    ? agent.parameters['fund-name'][0]
    : agent.parameters['fund-name']
  )?.toLowerCase();

  if (!fundName || !amount) {
    agent.add('Please specify fund name and amount to invest.');
    return;
  }

  if (amount > 50000) {
    agent.add('Investments above ₹50,000 require verification. Contact support.');
    return;
  }

  try {
    const data = await loadData('fundDetails');
    const matched = data.find((fund) => fund.fund_name.toLowerCase() === fundName);

    if (!matched) {
      agent.add(`No fund found with name "${fundName}".`);
      return;
    }

    agent.add(`✅ Invested ₹${amount} in ${matched.fund_name}.`);
    agent.add('Check portfolio, explore funds, or say "no" to exit.');
  } catch (error) {
    agent.add('Sorry, there was an error processing your investment.');
    console.error('InvestInFund error:', error);
  }
};

const changeMobileNumber = (agent) => {
  agent.context.set({ name: 'got_mobile', lifespan: 0 });
  agent.context.set({ name: 'ask_mobile_number', lifespan: 2 });
  agent.add('Please provide your new mobile number.');
};

// Intent Map
const intentMap = {
  WelcomeIntent: welcome,
  GetMobileNumber: getMobileNumber,
  TransactionHistory: transactionHistory,
  PortfolioValuation: portfolioValuation,
  ExploreFunds: exploreFunds,
  GetFundDetails: getFundDetails,
  InvestInFund: investInFund,
  ChangeMobileNumber: changeMobileNumber,
};

// Routes
app.get('/', (req, res) => res.send('Hello from NAGP Test Mutual Fund Bot!'));
app.post('/webhook', (req, res) => new WebhookClient({ request: req, response: res }).handleRequest(intentMap));

// Start Server
const startServer = async () => {
  try {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();