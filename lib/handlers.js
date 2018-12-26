/*
 * Request handlers
 *
*/

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users handler:- figure out the method the user is requesting
handlers.users = function(data, callback){
	var methods = ['post', 'get','put', 'delete'];
  // Check if the method of the data exists
  if(methods.indexOf(data.method) >= 0){
    handlers._users[data.method](data, callback);
  }else{
    callback(405); // method not allowed
  }
}

// Container for the users submethods
handlers._users = {};

// Users - post : Create new user
// Required data: firstName, lastName, phoneNo, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
  // Make sure all required data are provided in payload
  var firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phoneNo = typeof(data.payload.phoneNo) == "string" && data.payload.phoneNo.trim().length == 10 ? data.payload.phoneNo.trim() : false;
  var password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == "boolean" && data.payload.tosAgreement == true  ? true : false;

  if(firstName && lastName && phoneNo && password && tosAgreement){
    /*
     * Make sure that the user doesn't already exists by
     * reading the file with the phoneNo as it's name
     * if err, then file doesn't exist.
    */
    _data.read("users", phoneNo, function(err, data){
      if(err){
        // Hash the password using crypto
        var hashedPassword = helpers.hash(password);
        if(hashedPassword){
          // User object
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phoneNo' : phoneNo,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : tosAgreement
          };

          // Store the User by creating a file for that user
          _data.create("users",phoneNo,userObject,function(err){
            if(!err){
              callback(200);
            }else{
              console.log(err);
              callback(500,{'Error' : 'Could not create new user'})
            }
          });
        }else{
          callback(500,{'Error' : 'Could not hash the user\'s password'});
        }

      }else{
        // User already exists
        callback(400, {"Error" : "A user with that phone number already exists"});
      }
    })
  }else{
    callback(400, {'Error' : "Missing required field(s)"});
  }
};

// Users - get: get user's object
// Required data: phoneNo
// Optional data: none
handlers._users.get = function(data, callback){
  // Check that the phoneNo is valid note that phoneNo is in queryStringObject of data
  var phoneNo = typeof(data.queryStringObject.phoneNo) == "string" && data.queryStringObject.phoneNo.trim().length == 10 ? data.queryStringObject.phoneNo.trim() : false;
  if(phoneNo){
		// Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,phoneNo,function(tokenIsValid){
    	if(tokenIsValid){
				// Lookup the user
	    	_data.read("users",phoneNo,function(err,userData){
	      		if(!err && userData){
	        		// Delete hashed password before returning info
	        		delete userData.hashedPassword;
	        		callback(200, userData);
	      		}else{
	        		callback(404,{"Error" : "User not found."});
	      		}
	    		});
				}else {
        	callback(403,{"Error" : "Missing required token in header, or token is invalid."})
    		}
			});
  }else{
    callback(400, {"Error" : "Missing required field"});
  }
};

// Users - put: Update their object/file
// Required data: phoneNo
// Optional data: firstName, lastName, password (at least 1 must be specified)
handlers._users.put = function(data,callback){
  // Check for required field
  var phoneNo = typeof(data.payload.phoneNo) == 'string' && data.payload.phoneNo.trim().length == 10 ? data.payload.phoneNo.trim() : false;
  // Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if phone is invalid
  if(phoneNo){
    // Error if nothing is sent to update
    if(firstName || lastName || password){
			// Get token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token,phoneNo,function(tokenIsValid){
        if(tokenIsValid){

          // Lookup the user
          _data.read('users',phoneNo,function(err,userData){
            if(!err && userData){
              // Update the fields if necessary
              if(firstName){
                userData.firstName = firstName;
              }
              if(lastName){
                userData.lastName = lastName;
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users',phoneNo,userData,function(err){
                if(!err){
                  callback(200);
                } else {
                  callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            } else {
              callback(400,{'Error' : 'Specified user does not exist.'});
            }
          });
        } else {
          callback(403,{"Error" : "Missing required token in header, or token is invalid."});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }

};

// Users - delete: delete user's object/file
// Required data: phone
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  var phoneNo = typeof(data.queryStringObject.phoneNo) == 'string' && data.queryStringObject.phoneNo.trim().length == 10 ? data.queryStringObject.phoneNo.trim() : false;
  if(phoneNo){
		// Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,phoneNo,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',phoneNo,function(err,data){
          if(!err && data){
            _data.delete('users',phoneNo,function(err){
              if(!err){
                callback(200);
              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Tokens will be used to authenticate users
handlers.tokens = function(data, callback){
	var methods = ['post', 'get','put', 'delete'];
  // Check if the method of the data exists
  if(methods.indexOf(data.method) >= 0){
    handlers._tokens[data.method](data, callback);
  }else{
    callback(405); // method not allowed
  }
};

// Container for the tokens submethods
handlers._tokens = {};

// Tokens - post: create new token
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback){
	var phoneNo = typeof(data.payload.phoneNo) == "string" && data.payload.phoneNo.trim().length == 10 ? data.payload.phoneNo.trim() : false;
  var password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if(phoneNo && password){
		// Lookup the user that matches the phoneNo
		_data.read("users",phoneNo,function(err,userData){
			if(!err && userData){
				// Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
					// Create a new token with a random name. Set an expiration date 1 hour in the future.
					var tokenId = helpers.createRandomString(20);
					var expiryTime = Date.now() + 1000 * 60 * 60; // 1 hour
					var tokenObject = {
						"phoneNo" : phoneNo,
						"id" : tokenId,
						"expires" : expiryTime
					};

					// Store the token by creating a file with the tokenId as name
					_data.create("tokens", tokenId, tokenObject, function(err){
						if(!err){
							callback(200,tokenObject);
						}else{
							callback(500, {"Error" : "Couldn't create a new token."});
						}
					});
				}else{
					callback(400, {"Error" : "Password didn't match user's password."});
				}
			}else{
				callback(404,{"Error" : "User not found."});
			}
		});
	}else{
		callback(400, {"Error" : "Missing required fields."});
	}
};

// Tokens - get: get token
// Required data: id
// Optional data: none
handlers._tokens.get = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

// Tokens - put: update token
// Required data: id, extend (extends the expires field by 1 hour)
// Optional data: none
handlers._tokens.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the existing token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens',id,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token\'s expiration.'});
            }
          });
        } else {
          callback(400,{"Error" : "The token has already expired, and cannot be extended."});
        }
      } else {
        callback(400,{'Error' : 'Specified user does not exist.'});
      }
    });
  } else {
    callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
  }
};

// Tokens - delete: delete token
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Delete the token
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id,phone,callback){
  // Lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
      if(tokenData.phoneNo == phone && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._checks[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks  = {};

// Checks - post: Post checks, max 5 per user
// Required data: protocol,url,method,successCodes,timeoutSeconds
// Optional data: none
handlers._checks.post = function(data,callback){
  // Validate inputs
  var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  if(protocol && url && method && successCodes && timeoutSeconds){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Lookup the user phone by reading the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users',userPhone,function(err,userData){
          if(!err && userData){
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify that user has less than the number of max-checks per user
            if(userChecks.length < config.maxChecks){
              // Create random id for check
              var checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              var checkObject = {
                'id' : checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method' : method,
                'successCodes' : successCodes,
                'timeoutSeconds' : timeoutSeconds
              };

              // Save the object
              _data.create('checks',checkId,checkObject,function(err){
                if(!err){
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users',userPhone,userData,function(err){
                    if(!err){
                      // Return the data about the new check
                      callback(200,checkObject);
                    } else {
                      callback(500,{'Error' : 'Could not update the user with the new check.'});
                    }
                  });
                } else {
                  callback(500,{'Error' : 'Could not create the new check'});
                }
              });



            } else {
              callback(400,{'Error' : 'The user already has the maximum number of checks ('+config.maxChecks+').'})
            }


          } else {
            callback(403);
          }
        });


      } else {
        callback(403);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
  }
};

// Ping handler:- to check is the app is alive or not
handlers.ping = function(data, callback){
	callback(200);
};

// Not found handler
handlers.notFound = function(data, callback){
	callback(404);
};

// Export the module
module.exports = handlers;
