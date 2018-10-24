/*
 * Primary file for the API
*/

// Dependencies
const http = require('http');
const url = require('url');

// The server should respond to all requests with a string
var server = http.createServer(function(req, res){

	// Get the URL and parse it
	var parsedUrl = url.parse(req.url, true);

	// Get the path from the URL eg url = http//localhos:3000/foo, path = foo
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Send the response
	res.end('Welcome!\n');

	// Log the request path
	console.log("Request received on path: " + trimmedPath);
});

// Start the server, and have it listen at any port eg 3000
server.listen(3000, function(){
	console.log("Server is listening on port 3000");
});