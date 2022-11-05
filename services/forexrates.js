    var Request = require("request");
    
    //https://free.currencyconverterapi.com/api/v6/currencies
        
    function getRate(source,destination){
           
            const reqUrl = encodeURI(`https://free.currencyconverterapi.com/api/v6/convert?q=${source}_${destination}&compact=ultra`);
            
            var api_response;
            
            return new Promise(function(resolve, reject) {
              Request.get(reqUrl, { json: true }, function(error, response,body) {
                if (error) return reject(error);
                
                api_response = body;
          
                resolve(api_response);
              });
            });
            
    };


module.exports  = {getRate};  