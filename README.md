
# 🧠 CARING Mutual Fund Chatbot – Dialogflow + Node.js Webhook

This project simulates a smart mutual fund assistant built using **Dialogflow ES** for NLU and **Node.js** for webhook fulfillment. It helps users explore funds, view portfolios, check transaction history, and simulate investments, all via conversation.

---

## 📁 Project Structure

```
NAGP-CHATBOT_ASSIGNMENT/
│
├── /
│   ├── intents/
│   │   ├── welcome.js
│   │   ├── getMobileNumber.js
│   │   ├── transactionHistory.js
│   │   ├── portfolioValuation.js
│   │   ├── exploreFunds.js
│   │   ├── getFundDetails.js
│   │   ├── investInFund.js
│   │   └── changeMobileNumber.js
│   │
│   ├── utils/
│   │   └── contextUtils.js
│   │
│   ├── data/
│   │   ├── transactionhistorysample.json
│   │   ├── fund&categorysample.json
│   │   └── fund_details.json
│   │
│   └── index.js
│
├── package.json
└── README.md
```

---

## 🚀 Features

- 🧾 **Transaction History**: View past transactions (date filter optional).
- 📊 **Portfolio Valuation**: Check the value of your portfolio.
- 🔍 **Explore Funds**: Browse mutual funds by category.
- 📋 **Fund Details**: Get breakdown and information about a selected fund.
- 💰 **Invest in Fund**: Simulate investment in a mutual fund.
- 📱 **Change Mobile Number**: Clear and update user mobile context.
- 🔁 **Context-Aware Flow**: Automatically resumes the right intent after capturing required data (e.g. mobile number).

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/vamsivanama2222/NAGP_chatbot_assignment.git
cd NAGP-CHATBOT_ASSIGNMENT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Server

```bash
node index.js
```

Server will be available at:
```
http://localhost:3000/webhook
```

To test locally with Dialogflow, use a tunneling tool like [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Or Run the Service with Render which integrate with Message Servie plaaforms using the token like Telegram

Use the generated `https` URL as your Dialogflow Webhook URL.

---

## 🌐 Webhook Integration in Dialogflow

1. Go to your **Dialogflow Agent**.
2. Navigate to **Fulfillment** tab.
3. Enable **Webhook**, and set the URL to your local tunnel or deployed endpoint.
4. In the **Intent Settings**, enable webhook call for intents like:
   - GetMobileNumber
   - TransactionHistory
   - PortfolioValuation
   - ExploreFunds
   - InvestInFund
   - etc.

---

## 📄 Sample Data Files

- `transactionhistorysample.json`: Contains mock transaction history.
- `fund&categorysample.json`: Contains fund categories and fund lists.
- `fund_details.json`: Provides detailed breakdown per fund.

Make sure they are in the directory as required by the code(Source of Data).

---

## 🧰 Utility Functions

Inside `utils/contextUtils.js`:
- `getMobileFromContext(agent)`: Returns mobile number from context (if set).
- `getContextParam(agent, contextName, paramName)`: Safely fetch parameters from any context.

---

## 📬 Support

If you face any issues setting it up, just drop a question or raise an issue on the repo.
