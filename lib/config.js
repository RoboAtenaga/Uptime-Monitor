/*
 * Create and export configuration variables
*/

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'envName' : 'staging',
	'hashingSecret' : 'thisIsASecret',
	'maxChecks' : 5,
	'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhoneNo' : '+15005550006'
  },
  'templateGlobals' : {
    'appName' : 'UptimeMonitor',
    'companyName' : 'Henates Ventures.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  }
};

// Production environment
environments.production = {
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'envName' : 'production',
	'hashingSecret' : 'thisIsAlsoASecret',
	'maxChecks' : 5,
	'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhoneNo' : '+15005550006'
  },
  'templateGlobals' : {
    'appName' : 'UptimeMonitor',
    'companyName' : 'Henates Ventures.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:5000/'
  }
};

// Check which env was passed into the command-line arg
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the currentEnv is in the environments, if not, default to staging
var envToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

// Export the environment
module.exports = envToExport;
