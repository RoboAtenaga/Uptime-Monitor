/*
 * Server-related tasks
 */
// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers')
const helpers = require('./helpers');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

// Instantiate the server module object
var server = {};

// Instantiating http server
server.httpServer = http.createServer(function(req, res){
	server.unifiedServer(req,res);
});

// Instantiating https server
server.httpsServerOptions = {
	'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions,function(req, res){
	server.unifiedServer(req,res);
});

// All server logic for http and https servers
server.unifiedServer = function(req, res){
	// Get the URL and parse it. True makes sure the query strings are put into an object with key and value
	var parsedUrl = url.parse(req.url, true);

	// Get the path from the URL eg url = http//localhos:3000/foo, path = foo
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// Get the HTTP method
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload(usually added to the body of a non get req), if any
	var decoder = new StringDecoder('utf-8');
	// payloads that come with the request, come as a stream
	var payloadBuffer = '';
	// on the event 'data' of the request, append the new part of the stream to the buffer
	req.on('data',function(data){
		payloadBuffer += decoder.write(data);
	});
	// on the event 'end', all parts of the stream have been put into the buffer
	req.on('end',function(){
		payloadBuffer += decoder.end();

		// Choose handler request should go to
		var chosenhandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(payloadBuffer)
		};

		// Routh the request to the handler
		chosenhandler(data, function(statusCode, payload){
			// Use the status code called back by the handler, or default 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			// Use the payload called back by the handler, or default empty object
			payload = typeof(payload) == 'object' ? payload : {};

			// Conver payload returned by callback to a string
			var payloadString = JSON.stringify(payload);

			// Return the response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			// if the response is 200, print in green, else red
			if(statusCode == 200){
				debug('\x1b[32m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath +' ' + statusCode);
			}else{
				debug('\x1b[31m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath +' ' + statusCode);
			}
		});

	});
};

// Define a request router
server.router = {
	'ping' : handlers.ping,
	'users' : handlers.users,
	'tokens' : handlers.tokens,
	'checks' : handlers.checks
};

// Init server
server.init = function(){
  // Start the HTTP server, and have it listen at a port
  server.httpServer.listen(config.httpPort, function(){
		// Send to console, in blue
	  console.log('\x1b[36m%s\x1b[0m',"Http server is listening on port " + config.httpPort+" in "+config.envName+" mode");
  });

  // Start the HTTPS server, and have it listen at a port
  server.httpsServer.listen(config.httpsPort, function(){
		// Send to console, in pink
		console.log('\x1b[35m%s\x1b[0m',"Http server is listening on port " + config.httpsPort+" in "+config.envName+" mode");
	  });
};

// Export the module
module.exports = server;
