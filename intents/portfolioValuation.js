const fs = require('fs');
const path = require('path');
const { getMobileFromContext } = require('../utils/contextUtils');

module.exports = function portfolioValuation(agent) {
  const userMobile = getMobileFromContext(agent);

  if (!userMobile) {
    agent.context.set({
      name: 'ask_mobile_number',
      lifespan: 2,
      parameters: { resume_intent: 'PortfolioEvalution' }
    });
    agent.add("Please share your mobile number to get your portfolio details.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../transactionhistorysample.json')));
  const userData = data.find(u => u.mobile === userMobile);

  if (!userData) {
    agent.add("No account found for your mobile number.");
    return;
  }

  const total = userData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  agent.add(`💼 Your total portfolio valuation is ₹${total}.`);
  agent.add(`Would you like to explore more funds, check your transaction history, or exit?`);
};
