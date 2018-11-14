/*
 * Helpers for tasks
 *
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');

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

module.exports = helpers;
