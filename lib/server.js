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

		// If the request is within the public directory use to the public handler instead
	  chosenhandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenhandler;

		// Construct the data object to send to the handler
		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(payloadBuffer)
		};

		// Route the request to the handler
		try{
			chosenhandler(data, function(statusCode, payload, contentType){
				server.processHandlerResponse(res,method,trimmedPath,statusCode,payload,contentType);
			});
		}
		catch(e){
			debug(e);
			server.processHandlerResponse(res,method,trimmedPath,500,{"Error" : "An unknown error has occured"},"json");
		}
	});
};

// Process the response from the handler
server.processHandlerResponse = function(res,method,trimmedPath,statusCode,payload,contentType){
	// Determine the type of response or default to JSON
	contentType = typeof(contentType) == 'string' ? contentType : 'json';
	// Use the status code called back by the handler, or default 200
	statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
	// Return the response parts that are content-type specific
	var payloadString = '';
	if(contentType == 'json'){
		res.setHeader('Content-Type', 'application/json');
		payload = typeof(payload) == 'object'? payload : {};
		payloadString = JSON.stringify(payload);
	}

	if(contentType == 'html'){
		res.setHeader('Content-Type', 'text/html');
		payloadString = typeof(payload) == 'string'? payload : '';
	}


		 if(contentType == 'favicon'){
			 res.setHeader('Content-Type', 'image/x-icon');
			 payloadString = typeof(payload) !== 'undefined' ? payload : '';
		 }

		 if(contentType == 'plain'){
			 res.setHeader('Content-Type', 'text/plain');
			 payloadString = typeof(payload) !== 'undefined' ? payload : '';
		 }

		 if(contentType == 'css'){
			 res.setHeader('Content-Type', 'text/css');
			 payloadString = typeof(payload) !== 'undefined' ? payload : '';
		 }

		 if(contentType == 'png'){
			 res.setHeader('Content-Type', 'image/png');
			 payloadString = typeof(payload) !== 'undefined' ? payload : '';
		 }

		 if(contentType == 'jpg'){
			 res.setHeader('Content-Type', 'image/jpeg');
			 payloadString = typeof(payload) !== 'undefined' ? payload : '';
		 }

	// Return the response-parts common to all content-types
	res.writeHead(statusCode);
	res.end(payloadString);

	// if the response is 200, print in green, else red
	if(statusCode == 200){
		debug('\x1b[32m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath +' ' + statusCode);
	}else{
		debug('\x1b[31m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath +' ' + statusCode);
	}
};

// Define a request router
server.router = {
	'' : handlers.index,
	'account/create' : handlers.accountCreate,
	'account/edit' : handlers.accountEdit,
	'account/deleted' : handlers.accountDeleted,
	'session/create' : handlers.sessionCreate,
	'session/deleted' : handlers.sessionDeleted,
	'checks/all' : handlers.checksList,
	'checks/create' : handlers.checksCreate,
	'checks/edit' : handlers.checksEdit,
	'ping' : handlers.ping,
	'api/users' : handlers.users,
	'api/tokens' : handlers.tokens,
	'api/checks' : handlers.checks,
  'favicon.ico' : handlers.favicon,
  'public' : handlers.public,
	'examples/error' : handlers.exampleError
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
