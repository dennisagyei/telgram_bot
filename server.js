// bot-webhook.js
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios')
const bodyParser = require('body-parser')

const { OpenAI } = require('openai');

// --- Configuration ---

const { BOT_TOKEN, SERVER_URL } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`
const URI = `/webhook/${BOT_TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI

const telegramToken = process.env.BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_SECRET_KEY;
const port = process.env.PORT || 5000; // Port to listen on
const openAiModel = "gpt-3.5-turbo"; // Or your preferred model


// Secret path segment to ensure requests come from Telegram (optional but recommended)
const secretPath = `/webhook/${telegramToken}`;
const fullWEBHOOK_URL = WEBHOOK_URL;

// --- Basic Validation ---
if (!telegramToken || !WEBHOOK_URL) {
    console.error("CRITICAL ERROR: Missing TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, or WEBHOOK_URL in .env file.");
    process.exit(1);
}

// --- Initialize OpenAI ---
// --- OpenAI Interaction Function ---
async function getOpenAIResponse(prompt) {
  console.log(`Sending prompt to LLM: "${prompt.substring(0, 50)}..."`);
  try {
      
        const openai_reply = await axios.get('https://ipro-api-gateway-production.up.railway.app/api/ai-service/integration/telegram', {
          params: { ask : prompt } 
        });

        //DEBUG console.log('openai_reply-',openai_reply)
        return openai_reply.data;

  } catch (error) {
      console.error("Error calling OpenAI API:", error.message);
      // Log more details if available (e.g., rate limits, auth errors)
      if (error.response) {
          console.error("OpenAI API Error Status:", error.response.status);
          console.error("OpenAI API Error Data:", error.response.data);
      }
      return "Sorry, there was an error communicating with the AI.";
  }
}



// --- Initialize Telegram Bot ---
// NOTE: We DON'T use { polling: true } for webhooks
const bot = new TelegramBot(telegramToken);
console.log("Telegram Bot instance created.");

// --- Set Webhook ---
// This tells Telegram where to send updates.
// It's often best to run this setup once, or check/set it on startup.
bot.setWebHook(fullWEBHOOK_URL)
    .then(() => {
        console.log(`Webhook successfully set to ${fullWEBHOOK_URL}`);
    })
    .catch((error) => {
        //console.log(`Webhook unsuccessfully set to ${fullWEBHOOK_URL}`);
        console.error("Error setting Telegram webhook:", error.message);
        console.error("Ensure the WEBHOOK_URL is correct, publicly accessible via HTTPS, and the bot token is valid.");
        // Decide if you want to exit if webhook setup fails
        // process.exit(1);
    });

// --- Initialize Express App ---
const app = express();

// Middleware to parse JSON request bodies (essential for webhooks)
app.use(express.json());

// --- Webhook Endpoint ---
// This is the endpoint Telegram will POST updates to.
app.post(URI, async (req, res) => {
    try {
        //console.log("Received Telegram update:", JSON.stringify(req.body, null, 2)); // Verbose logging for debugging
        // Process the update using the node-telegram-bot-api library
        // This will trigger the 'message', 'callback_query', etc., events below
        bot.processUpdate(req.body);
        // Send an immediate 200 OK response back to Telegram
        // to acknowledge receipt of the update. Do actual processing async.
        res.sendStatus(200);
    } catch (error) {
        console.error("Error processing incoming Telegram update:", error.message);
        res.sendStatus(500); // Internal Server Error
    }
});

// --- Health Check Endpoint (Optional but useful) ---
app.get('/', (req, res) => {
    res.send(`Hello! Your Telegram bot server is running.`);
});


// --- Telegram Message Listener (Triggered by bot.processUpdate) ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const messageId = msg.message_id; // Useful for replying

    // Simple check for text messages, ignore commands initially
    if (!userMessage || userMessage.startsWith('/')) {
         if (userMessage === '/start') {
             try {
                await bot.sendMessage(chatId, "Hello! Send me a real message, and I'll reply.");
             } catch (sendError) {
                 console.error(`[Chat ${chatId}] Failed to send /start response:`, sendError.message);
             }
         } else if (userMessage?.startsWith('/')) {
             try {
                 await bot.sendMessage(chatId, "Sorry, I don't understand that command yet.");
             } catch (sendError) {
                  console.error(`[Chat ${chatId}] Failed to send command unknown response:`, sendError.message);
             }
         }
         // Do nothing for non-text messages for now
        return;
    }

    //console.log(`[Chat ${chatId}] Received message (ID <span class="math-inline">\{messageId\}\)\: "</span>${userMessage}"`);

    // Send 'typing...' action - wrap in try/catch
    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (actionError) {
        // Non-critical error, log it but continue
        console.warn(`[Chat ${chatId}] Failed to send 'typing' action:`, actionError.message);
    }

    // Get response from OpenAI
    const aiResponse = await getOpenAIResponse(userMessage); // Pass chatId for logging

    // Send the AI response back - wrap in try/catch
    try {
        // Optionally reply to the specific message: reply_to_message_id: messageId
        await bot.sendMessage(chatId, aiResponse);
        console.log(`[Chat ${chatId}] Sent AI response.`);
    } catch (sendError) {
        console.error(`[Chat ${chatId}] Error sending AI response via Telegram:`, sendError.message);
        // Check for specific Telegram errors (e.g., blocked by user, chat not found)
        if (sendError.response && sendError.response.body) {
             console.error(`[Chat ${chatId}] Telegram API Error Body:`, sendError.response.body);
             // Potentially notify user of send failure if possible, though unlikely if the bot is blocked
        }
    }
});

// --- General Bot Error Listeners ---
bot.on('webhook_error', (error) => {
    console.error("Telegram Webhook Error:", error.code, "-", error.message);
    // E.g., connection problems between Telegram and your server
});

bot.on('error', (error) => {
    // Catch more general library errors
    console.error("General node-telegram-bot-api Error:", error);
});

// --- Start Express Server ---
app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
    //console.log(`Bot should be reachable at ${WEBHOOK_URL}`);
    //console.log(`Telegram should be sending updates to: ${fullWEBHOOK_URL}`);
});

// Optional: Graceful shutdown handling
process.on('SIGINT', () => {
  console.log("SIGINT received. Shutting down gracefully...");
  // You might want to remove the webhook before shutting down
  // bot.deleteWebHook().then(() => {
  //   console.log("Webhook removed.");
  //   process.exit(0);
  // }).catch(err => {
  //   console.error("Error removing webhook during shutdown:", err);
  //   process.exit(1);
  // });
  // For simplicity now, just exit:
  process.exit(0);
});
process.on('SIGTERM', () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    process.exit(0);
});