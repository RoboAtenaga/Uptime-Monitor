/*
 * Create and export configuration variables
*/

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
	'port' : 3000,
	'envName' : 'staging'
};

// Production environment
environments.production = {
	'port' : 9000,
	'envName' : 'production'
};

// Check which env was passed into the command-line arg
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the currentEnv is in the environments, if not, default to staging
var envToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

// Export the environment
module.exports = envToExport;