//import { createClient } from '@supabase/supabase-js'
const { createClient } = require('@supabase/supabase-js')


const supabaseClient = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY)


async function getChatData() {
    
    try {
        let { data: telegram_bot_chats, error } = await supabaseClient
            .from("telegram_bot_chats")
            .select("*")
            .order("id", { ascending: false });
                
           return telegram_bot_chats;

        if (error) throw error;
      } catch (error) {
        console.error(error.error_description || error.message);
      }
};


async function addChatData(newChatOBJ) {
    
    try {
        //INSERT A ROW
        const { data, error } = await supabaseClient
        .from('telegram_bot_chats')
        .insert(newChatOBJ)

        if (error) throw error;
      } catch (error) {
        console.error(error.error_description || error.message);
      }
};



module.exports = { supabaseClient ,getChatData, addChatData};