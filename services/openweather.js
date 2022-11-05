    var Request = require("request");
    
    //OpenWeatherKey Details
    const OpenWeatherKey=process.env.OPEN_WEATHER_KEY;

        
    function getWeather(city){
            var api_url='https://samples.openweathermap.org/data/2.5/weather?q=London,uk&appid=b6907d289e10d714a6e88b30761fae22';
            const reqUrl = encodeURI(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OpenWeatherKey}`);
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


module.exports  = {getWeather};  