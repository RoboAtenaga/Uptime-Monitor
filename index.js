/*
 * Primary file for the API
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiating http server
var httpServer = http.createServer(function(req, res){
	unifiedServer(req,res);
});

// Start the http server, and have it listen at a port
httpServer.listen(config.httpPort, function(){
	console.log("Http server is listening on port " + config.httpPort+" in "+config.envName+" mode");
});

// Instantiating https server
var httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert' : fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions,function(req, res){
	unifiedServer(req,res);
});

// Start the https server, and have it listen at a port
httpsServer.listen(config.httpsPort, function(){
	console.log("Https server is listening on port " + config.httpsPort+" in "+config.envName+" mode");
});

// All server logic for http and https servers
var unifiedServer = function(req, res){
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
		var chosenhandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : payloadBuffer
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

			// Log the request path
		    console.log("Returning this response: ",statusCode, payloadString);
		});

	});
};

// Define the handlers
var handlers = {};

// Ping handler:- to check is the app is alive or not
handlers.ping = function(data, callback){
	callback(200);
}

// Not found handler
handlers.notFound = function(data, callback){
	callback(404);
};

// Define a request router
var router = {
	'ping' : handlers.ping
};
