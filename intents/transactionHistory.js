const fs = require('fs');
const path = require('path');
const { getMobileFromContext } = require('../utils/contextUtils');

module.exports = function transactionHistory(agent) {
  const datePeriod = agent.parameters['date-period'];
  const userMobile = getMobileFromContext(agent);

  if (!userMobile) {
    agent.context.set({
      name: 'ask_mobile_number',
      lifespan: 2,
      parameters: {
        resume_intent: 'TransactionHistory',
        'date-period': datePeriod
      }
    });
    agent.add("Could you please share your mobile number to continue?");
    return;
  }

  if (!datePeriod?.startDate || !datePeriod?.endDate) {
    agent.add("Please provide the date range for the transactions.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../transactionhistorysample.json')));
  const userData = data.find(u => u.mobile === userMobile);

  if (!userData) {
    agent.add("No account found for this mobile number.");
    return;
  }

  const startDate = new Date(datePeriod.startDate);
  const endDate = new Date(datePeriod.endDate);
  const filtered = userData.transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });

  if (filtered.length === 0) {
    agent.add("No transactions found in the given date range.");
  } else {
    let response = `Here are your transactions:\n`;
    filtered.forEach(tx => {
      response += `• ${tx.date}: ₹${tx.amount} - ${tx.fund_name}\n`;
    });
    agent.add(response);
    agent.add("Would you like to invest more in one of these, explore other funds, or exit?");
  }
};
