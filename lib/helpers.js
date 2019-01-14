/*
 * Helpers for tasks
 *
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

// Container for all Helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(password){
  if(typeof(password) == 'string' && password.length > 0){
    var hashedPassword = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
    return hashedPassword;
  }else{
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(buffer){
  try{
    var obj = JSON.parse(buffer);
    return obj;
  }catch(e){
    return {};
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 0; i < strLength; i++) {
        // Get a random character from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Send SMS messages using Twilio(a cloud communications platform as a service)
helpers.sendTwilioSms = function(phoneNo,msg,callback){
  // validate the parameters
  countryCode = typeof(countryCode) == 'string' && countryCode.trim().length == 3 ? countryCode.trim() : false;
  phoneNo = typeof(phoneNo) == 'string' && phoneNo.trim().length == 10 ? phoneNo.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim() : false;
  if(phoneNo && msg){
    // Configure the request payload to be sent to Twilio via Post
    var payload = {
      'From' : config.twilio.fromPhoneNo,
      'To' : '+84' + phoneNo,
      'Body' : msg
    };

    // Stringify the payload with queryString so it's more form-like
    var payloadString = querystring.stringify(payload);

    // Configure request details
    var requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/'+ config.twilio.accountSid + '/Messages.json',
      'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(payloadString)
      }
    };

    // Instantiate a request object
    var req = https.request(requestDetails, function(res){
      // Grab the status of the sent request
      var status = res.statusCode;
      // callback successfully if request went through
      if(status == 200 || status == 201){
        // no error, callback false
        callback(false);
      }else{
        callback('Status code returned is '+ status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(err){
      callback(err);
    });

    // Add the payload
    req.write(payloadString);

    // End(send) the request
    req.end();
  }else{
    callback('Invalid or missing parameters.');
  }
};

module.exports = helpers;
