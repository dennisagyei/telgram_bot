require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')


var OpenAi = require('./services/openai');
const { response } = require('express');

const { BOT_TOKEN, SERVER_URL } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`
const URI = `/webhook/${BOT_TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI

const app = express()
app.use(bodyParser.json())

const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
    console.log(res.data)
}

app.post(URI, async (req, res) => {
    //console.log(req.body)

    const chatId = req.body.message.chat.id
    const text = req.body.message.text

    var openai_reply = await OpenAi.getRes(text)

    //console.log('Response',openai_reply)

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: openai_reply
    })
    return res.send()
})

app.listen(process.env.PORT || 5000, async () => {
    console.log('🚀 app running on port', process.env.PORT || 5000)
    await init()
})