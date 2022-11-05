//const dialogflow = require('dialogflow');
const dialogflow = require('@google-cloud/dialogflow');
const Request = require('request');

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
function getRes(query,sessionId) {
      // A unique identifier for the given session
      //const sessionId = uuid.v4();
      const projectId = process.env.BANKBOT_project_id;
      const LANGUAGE_CODE = 'en-US'
      
      console.log('sessionId:'+ sessionId);
      
      var privateKey =  process.env.BANKBOT_private_key;
      var clientEmail = process.env.BANKBOT_client_email;
  		
  		var config = {
  			credentials: {
  				private_key: privateKey,
  				client_email: clientEmail
  			}
  		}
  	
      // Create a new session
      const sessionClient = new dialogflow.SessionsClient(config);
      const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    
      // The text query request.
      var request = {
        session: sessionPath,
        queryInput: {
          text: {
            // The query to send to the dialogflow agent
            text: query,
            // The language used by the client (en-US)
            languageCode: LANGUAGE_CODE,
          },
        },
      };
      

      return new Promise(function(resolve, reject) {
        // executor (the producing code, "singer")
        const responses = sessionClient.detectIntent(request);
        
        resolve(responses);
       
      });
            
      
    
}


function sendTextMessageToDialogFlow(textMessage,projectId,privateKey,clientEmail,sessionId) {

  
  var config = {
  			credentials: {
  				private_key: privateKey,
  				client_email: clientEmail
  			}
  		}
  // Create a new session
  const sessionClient = new dialogflow.SessionsClient(config);
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);
  
  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: textMessage,
        // The language used by the client (en-US)
        languageCode: 'en-US',
      },
    },
  };

  // Send request and log result
  return new Promise(function(resolve, reject) {
        // executor (the producing code, "singer")
        const responses = sessionClient.detectIntent(request);
        
        resolve(responses);
       
  });
  
}

function fb_sendTextQueryToDialogFlow(sessionId,projectId,privateKey,clientEmail, handleDialogFlowResponse, event, params = {}) {
       
       var config = {
  			credentials: {
  				private_key: privateKey,
  				client_email: clientEmail
  			}
  		}

      // Create a new session
      const sessionClient = new dialogflow.SessionsClient(config);
      const sessionPath = sessionClient.sessionPath(projectId, sessionId);
      
        //fbService.sendTypingOn(sender);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: event.message.text,
                    languageCode: 'en-US',
                },
            },
            queryParams: {
                payload: {
                    data: params
                }
            }
        };
        
        sessionClient
        .detectIntent(request)
        .then(responses => {
          const result = responses[0].queryResult;
          
            handleDialogFlowResponse(event, result);
        })
        .catch(err => {
          console.error('ERROR:', err);
        });

    
        

}

function processFacebookMessage(event,sessionId) {

      const projectId = process.env.BANKBOT_project_id;
      const LANGUAGE_CODE = 'en-US'
      
      console.log('sessionId:'+ sessionId);
      console.log('Input:',event.message.text);
      
      var privateKey  = process.env.BANKBOT_private_key;
      var clientEmail = process.env.BANKBOT_client_email;
  		
  		var config = {
  			credentials: {
  				private_key: privateKey,
  				client_email: clientEmail
  			}
  		}
  	
      // Create a new session
      const sessionClient = new dialogflow.SessionsClient(config);
      const sessionPath = sessionClient.sessionPath(projectId, sessionId);
    
      // The text query request.
      var request = {
        session: sessionPath,
        queryInput: {
          text: {
            // The query to send to the dialogflow agent
            text: event.message.text,
            // The language used by the client (en-US)
            languageCode: LANGUAGE_CODE,
          },
        },
      };
      

      sessionClient
        .detectIntent(request)
        .then(responses => {
          const result = responses[0].queryResult;
          console.log('result',result.fulfillmentText);
          //return fb_sendTextMessage(event.sender.id, result.fulfillmentText);
        })
        .catch(err => {
          console.error('ERROR:', err);
        });
      
    
}



function fb_sendTextMessage (senderId, text) {
  const FACEBOOK_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  const apiUrl = encodeURI(`https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`);
   Request({
       url: apiUrl,
       method: 'POST',
       json: {
         recipient: { id: senderId },
         message: { text },
       }
   }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

               /* if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                }*/
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
   
}

function fb_sendImageMessage (senderId, imageUrl) {
  const FACEBOOK_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  const apiUrl = encodeURI(`https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`);
   Request({
       url: apiUrl,
       method: 'POST',
       json: {
         recipient: { id: senderId },
         message: { 
            
                  attachment:{
                    type:"image", 
                    payload:{
                      url:imageUrl, 
                      is_reusable:true
                    }
                  }
         },
       }
   }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

               /* if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                }*/
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
   
}


async function sendToDialogflow(projectId,sessionId,query) 
{
      
      const sessionClient = new dialogflow.SessionsClient();
      // The path to identify the agent that owns the created intent.
      const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
      );
    
      // The text query request
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: query,
            languageCode: "en-US",
          },
        },
      };
    
      try {
        const responses = await sessionClient.detectIntent(request);
        return responses[0];
      } catch (err) {
          console.log("Dialogflow error: " + err);
      }
      return false;
 }
 
 
// test the command :
//getRes('hello');
//getRes('hello').then(function(res){console.log(res)});
module.exports = {getRes,fb_sendTextQueryToDialogFlow,sendTextMessageToDialogFlow}