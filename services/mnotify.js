    var Request = require("request");
    
    //mNotify.com account
    const ApiKey=process.env.MNOTIFY_KEY;
    
    
    function SendingSMS(sender,recipient_id,message){

            const reqUrl = encodeURI(`https://apps.mnotify.net/smsapi?key=${ApiKey}&to=${recipient_id}&msg=${message}&sender_id=${sender}`);
            var api_response;
            
            return new Promise(function(resolve, reject) {
              Request.get(reqUrl, { json: true }, function(error, response,body) {
                if (error) return reject(error);
                
                api_response = body;
          
                resolve(api_response);
                 //console.log('Right now its '+ JSON.stringify(response.body.main.temp)  + ' degrees' + ' with ' + JSON.stringify(response.body.weather[0].description));
              });
            });
            
    };
    
    function CheckBalance(){

            const reqUrl = encodeURI(`https://apps.mnotify.net/smsapi/balance?key=${ApiKey}`);
            var api_response;
            
            return new Promise(function(resolve, reject) {
              Request.get(reqUrl, { json: true }, function(error, response,body) {
                if (error) return reject(error);
                
                api_response = body;
          
                resolve(api_response);
                 //console.log('Right now its '+ JSON.stringify(response.body.main.temp)  + ' degrees' + ' with ' + JSON.stringify(response.body.weather[0].description));
              });
            });
            
    };
    
module.exports = {SendingSMS,CheckBalance};