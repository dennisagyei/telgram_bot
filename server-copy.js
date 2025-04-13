// bot-webhook.js
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios')
const bodyParser = require('body-parser')

const { OpenAI } = require('openai');

// --- Configuration ---
const telegramToken = process.env.BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_SECRET_KEY;
const webhookUrl = process.env.WEBHOOK_URL; // Public URL for Telegram to call
const port = process.env.PORT || 5000; // Port to listen on
const openAiModel = "gpt-3.5-turbo"; // Or your preferred model

// Secret path segment to ensure requests come from Telegram (optional but recommended)
const secretPath = `/webhook/${telegramToken}`;
const fullWebhookUrl = `<span class="math-inline">\{webhookUrl\}</span>{secretPath}`;

// --- Basic Validation ---
if (!telegramToken || !openaiApiKey || !webhookUrl) {
    console.error("CRITICAL ERROR: Missing TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, or WEBHOOK_URL in .env file.");
    process.exit(1);
}

// --- Initialize OpenAI ---
const openai = new OpenAI({ apiKey: openaiApiKey });
console.log("OpenAI Client initialized.");

// --- Initialize Telegram Bot ---
// NOTE: We DON'T use { polling: true } for webhooks
const bot = new TelegramBot(telegramToken);
console.log("Telegram Bot instance created.");

// --- Set Webhook ---
// This tells Telegram where to send updates.
// It's often best to run this setup once, or check/set it on startup.
bot.setWebHook(fullWebhookUrl)
    .then(() => {
        console.log(`Webhook successfully set to ${fullWebhookUrl}`);
    })
    .catch((error) => {
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
app.post(secretPath, (req, res) => {
    try {
        // console.log("Received Telegram update:", JSON.stringify(req.body, null, 2)); // Verbose logging for debugging
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
    res.send(`Hello! Your Telegram bot server is running. Webhook should be at ${secretPath}`);
});

// --- OpenAI Interaction Function (with Enhanced Error Handling) ---
async function getOpenAIResponse(prompt, chatId) { // Pass chatId for context in logs
    console.log(`[Chat <span class="math-inline">\{chatId\}\] Sending prompt to OpenAI\: "</span>{prompt.substring(0, 50)}..."`);
    try {
        const completion = await openai.chat.completions.create({
            model: openAiModel,
            messages: [{ role: "user", content: prompt }],
            // Optional parameters...
        });

        if (completion.choices && completion.choices.length > 0 && completion.choices[0].message?.content) {
            const responseText = completion.choices[0].message.content.trim();
            console.log(`[Chat <span class="math-inline">\{chatId\}\] Received OpenAI response\: "</span>{responseText.substring(0, 50)}..."`);
            return responseText;
        } else {
            console.error(`[Chat ${chatId}] Unexpected OpenAI response structure:`, completion);
            return "Sorry, I received an unusual response from the AI. Please try again.";
        }

    } catch (error) {
        console.error(`[Chat ${chatId}] Error calling OpenAI API:`, error.message);
        let userMessage = "Sorry, there was an error communicating with the AI service.";
        // Check for specific OpenAI error types (requires inspecting the error object structure, which can vary)
        if (error.response) { // Axios-like error structure from OpenAI library
            console.error(`[Chat ${chatId}] OpenAI API Error Status: ${error.response.status}`);
            console.error(`[Chat ${chatId}] OpenAI API Error Data:`, error.response.data);
            if (error.response.status === 429) {
                userMessage = "The AI service is currently busy (rate limit). Please try again shortly.";
            } else if (error.response.status === 401) {
                userMessage = "There's an authentication issue with the AI service. (Admin check keys)";
                // Potentially stop the bot or alert admin here
            } else if (error.response.status >= 500) {
                userMessage = "The AI service seems to be having temporary technical difficulties. Please try again later.";
            }
        } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
             userMessage = "Sorry, I couldn't reach the AI service due to a network issue.";
        }
        // Log the detailed error for admin/debugging
        console.error(`[Chat ${chatId}] Detailed OpenAI Error:`, error);
        return userMessage; // Return user-friendly message
    }
}

// --- Telegram Message Listener (Triggered by bot.processUpdate) ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const messageId = msg.message_id; // Useful for replying

    // Simple check for text messages, ignore commands initially
    if (!userMessage || userMessage.startsWith('/')) {
         if (userMessage === '/start') {
             try {
                await bot.sendMessage(chatId, "Hello! Send me a message, and I'll reply using OpenAI.");
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

    console.log(`[Chat ${chatId}] Received message (ID <span class="math-inline">\{messageId\}\)\: "</span>{userMessage}"`);

    // Send 'typing...' action - wrap in try/catch
    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (actionError) {
        // Non-critical error, log it but continue
        console.warn(`[Chat ${chatId}] Failed to send 'typing' action:`, actionError.message);
    }

    // Get response from OpenAI
    const aiResponse = await getOpenAIResponse(userMessage, chatId); // Pass chatId for logging

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
    console.log(`Bot should be reachable at ${webhookUrl}`);
    console.log(`Telegram should be sending updates to: ${fullWebhookUrl}`);
    // Reminder for ngrok users
    if (webhookUrl.includes('ngrok.io')) {
         console.warn("REMINDER: ngrok URL is temporary! Use a permanent URL for production.");
    }
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