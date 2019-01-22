/*
 * Primary file for the API
*/

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

// Declare the append
var app = {};

// Init the app
app.init = function(){
	// Start the server and workers
	server.init();
	workers.init();

	// Start the CLI last, so that the logs from the server etc will happen 1st
	setTimeout(function(){
		cli.init();
	},50);
};

// Execute the app
app.init();

// Export the app
module.exports = app;
