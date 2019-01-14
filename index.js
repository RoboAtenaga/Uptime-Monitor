/*
 * Primary file for the API
*/

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the append
var app = {};

// Init the app
app.init = function(){
	// Start the server and workers
	server.init();
	workers.init();
};

// Execute the app
app.init();

// Export the app
module.exports = app;
