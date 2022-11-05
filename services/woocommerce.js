     //ipro.com.gh WooCommerce Key details
        // ref : http://woocommerce.github.io/woocommerce-rest-api-docs/#
        // ref : https://www.npmjs.com/package/woocommerce-api
        
    var Request = require("request");
    
    var WooCommerceAPI = require('woocommerce-api');
 
    var WooCommerce = new WooCommerceAPI({
      url: 'https://ipro.com.gh/index.php',
      consumerKey: process.env.WooCommerceConsumerkey,
      consumerSecret: process.env.WooCommerceConsumersecret,
      //wpAPI: true,
      version: 'v3'
    });
    

        
        //https://ipro.com.gh/index.php?wc-api-version=v3&wc-api-route=/products&filter[q]=coke
        
        //View List of Product Categories
        //GET /wc-api/v3/products/categories
        
        //View List of Product Tags
        //GET /wc-api/v3/products/tags
        
        async function getProductCategories(){
          WooCommerce.get("products/categories")
          .then((response) => {
            return response.data;
          })
          .catch((error) => {
            console.log(error.response.data);
          });
        };
        
        function getFeaturedProducts(){
          
            // Send request and log result
            return new Promise(function(resolve, reject) {
                  // executor (the producing code, "singer")
                  const responses = WooCommerce.getAsync('products');
                  
                  
                 
                 if (responses) {
                    resolve(responses);;
                  }
                  else {
                    reject(Error("getFeaturedProducts Error"));
                  }
    
              });
                        

        }
        
        
        function search_products(q_product){
          
          const api_url = encodeURI(`https://ipro.com.gh/index.php?wc-api-version=v3&wc-api-route=/products&filter[q]=${q_product}`);
            
            var api_response;
            
            return new Promise(function(resolve, reject) {
              Request.get(api_url, { json: true }, function(error, response,body) {
                if (error) return reject(error);
                
                api_response = body;
          
                resolve(api_response);
                
                console.log('Reponse received', api_response.products.length);
                
              }).auth(process.env.WooCommerceConsumerkey, process.env.WooCommerceConsumersecret, false);
            });
        };
        
        function productsCategories(){
          
          const api_url = encodeURI(`https://ipro.com.gh/index.php?wc-api-version=v3&wc-api-route=/products/categories`);
            
            var api_response;
            
            return new Promise(function(resolve, reject) {
              Request.get(api_url, { json: true }, function(error, response,body) {
                if (error) return reject(error);
                
                api_response = body;
          
                resolve(api_response);
                
                console.log('Reponse received', api_response.product_categories);
                
              }).auth(process.env.WooCommerceConsumerkey, process.env.WooCommerceConsumersecret, false);
            });
        };
// test the command :
getFeaturedProducts();
module.exports = {getFeaturedProducts};