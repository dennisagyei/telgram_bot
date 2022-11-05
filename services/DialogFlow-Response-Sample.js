{
  "fulfillmentText": "This is a text response",
  "fulfillmentMessages": [
    {
      "card": {
        "title": "card title",
        "subtitle": "card subtitle",
        "imageUri": "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png",
        "buttons": [
          {
            "text": "button text",
            "postback": "https://assistant.google.com/"
          }
        ]
      }
    }
  ]
  
  
  
  ///basic text message
  "message":{
    "text":"hello, world!"
  }
  
  ///
  "message":{
    "attachment":{
      "type":"image", 
      "payload":{
        "url":"https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png", 
        "is_reusable":true
      }
    }
  }