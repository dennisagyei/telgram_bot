require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const apiKey = process.env.CHAT_KEY

var OpenAi = require('./services/openai');
const supabaseDB = require('./services/supabase.js')
const { response } = require('express');

const { BOT_TOKEN, SERVER_URL } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`
const URI = `/webhook/${BOT_TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI

const app = express()
app.use(bodyParser.json())


supabaseDB.getChatData().then(function(result) {
  console.log(result);
});

const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
    console.log(res.data)
}

app.get("/", function (req, res) {
    res.send("Telegram Bot Api is live...");
    console.log("TelegramBot App Started");
  });
app.post(URI, async (req, res) => {
    
  
    console.log('BOT_message',req.body.message)

    const chatId = req.body.message.chat.id
    const text = req.body.message.text

    //var openai_reply = await OpenAi.getRes(text)

    

    const openai_reply = await axios.get('https://ipro-api-gateway-production.up.railway.app/api/ai-service/integration/telegram', {
      params: { ask : text } 
    });
   //console.log('Ai Response',openai_reply.data)

   //LOG IT !!!!!!!!!!!!!!!!1
   supabaseDB.addChatData({sender_id:chatId,message:text , response: openai_reply.data.text }).then(function(result) {
    console.log(result);
   });

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: openai_reply.data.text
    }).catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
        console.log(error.config);
      });
      
    return res.send()
})

app.listen(process.env.PORT || 5000, async () => {
    console.log('🚀 app running on port', process.env.PORT || 5000)
    await init()
})