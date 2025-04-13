require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN; // Replace with your own bot token
const bot = new TelegramBot(token, { polling: true }); //// Create a bot that uses 'polling' to fetch new updates


// Listen for any kind of message. There are different kinds of
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userMessage  = msg.text;

    // Ignore messages without text or commands (simple check)
    if (!userMessage || userMessage.startsWith('/')) {
        // You could add handling for specific commands like /start here
        if (userMessage === '/start') {
            bot.sendMessage(chatId, "Hello! Send me a message, and I'll try to respond using OpenAI.");
        }
        return;
    }

    console.log(`Received message from chat ID ${chatId}: "${userMessage}"`);

    // Optional: Send a 'typing...' indicator to the user
    bot.sendChatAction(chatId, 'typing');
});

// --- Error Handling for Bot ---
bot.on('polling_error', (error) => {
    console.error("Telegram Polling Error:", error.code, "-", error.message);
    // Handle specific errors if needed (e.g., network issues, authorization)
});

bot.on('webhook_error', (error) => {
    console.error("Telegram Webhook Error:", error.code, "-", error.message);
});