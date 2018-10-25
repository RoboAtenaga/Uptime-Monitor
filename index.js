/*
 * Primary file for the API
*/

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all requests with a string
var server = http.createServer(function(req, res){

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

			// Send the response
	    res.end('Welcome!\n');

		// Log the request path
		console.log("Request received with this payload: ",payloadBuffer);
	});

});

// Start the server, and have it listen at any port eg 3000
server.listen(3000, function(){
	console.log("Server is listening on port 3000");
});