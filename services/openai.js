const { Configuration, OpenAIApi } = require("openai");

require('dotenv').config()

const configuration = new Configuration({
    organization: "org-LFZTSLsuaN7l9YgCLmhwSCHI",
    apiKey: process.env.OPENAI_SECRET_KEY,
});
const openai = new OpenAIApi(configuration);

async function getRes(query) {

    const completion = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: query,
            max_tokens: 60,
            temperature: 0.3,
            top_p: 0.3,
            presence_penalty: 0,
            frequency_penalty: 0.5,
    });

    return completion.data.choices[0].text;
}



async function getAiRes(input_query) {
    try {
      const response = await fetch(process.env.END_POINT,{ ask : input_query });
      if (!response.ok) {
        throw new Error("Network response was not OK");
      }
      
      return response

    } catch (error) {
      console.error("There has been a problem with your fetch operation:", error);
    }
  }
//getRes('How hot is the sun?');
module.exports = {getRes, getAiRes}
