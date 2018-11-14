/*
 * Library for storing and editing data
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module (to be expoerted)
var lib = {};

// Base directory of the data folder
lib.dataDir = path.join(__dirname,'/../.data/');

// Create and write data to a new file
// dir = dir we want to put file in, data = info to be written
lib.create = function(dir,filename,data,callback){
	var fullFilePath = lib.dataDir+dir+'/'+filename+'.json';
	// Open the file for writing "wx" sends an err if file already exists
	fs.open(fullFilePath,'wx',function(err, fileDescriptor){
		if(!err && fileDescriptor){
			// Convert data to string
			var dataString = JSON.stringify(data);

			// Write to file and close it
			fs.writeFile(fileDescriptor, dataString, function(err){
				if(!err){
					fs.close(fileDescriptor, function(err){
						if(!err){
							// call back false error, i.e no error
							callback(false);
						}else {
							callback('Error closing file');
						}
					});
				}else {
					callback('Error writing to file');
				}
			});
		}else{
			callback('Could not create new file, it may already exist');
		}
	});
};

// Read data from a file
lib.read = function(dir,filename,callback){
	var fullFilePath = lib.dataDir+dir+'/'+filename+'.json';
	fs.readFile(fullFilePath,'utf8',function(err, data){
		if(!err && data){
			var parsedData = helpers.parseJsonToObject(data);
			callback(false,parsedData);
		}else{
			callback(err,data);
		}
	});
};

// Overwriting data in an existing file
lib.update = function(dir,filename,data,callback){
	var fullFilePath = lib.dataDir+dir+'/'+filename+'.json';
	// Open the file for writing, "r+" sends an err if file doesn't exist yet
	fs.open(fullFilePath,'r+',function(err, fileDescriptor){
		if(!err && fileDescriptor){
			// Convert data to string
			var dataString = JSON.stringify(data);

			// Truncate the contents of the file before writing to it
			fs.truncate(fileDescriptor, function(err){
				if(!err){
					// Write to file and close it
			    fs.writeFile(fileDescriptor, dataString, function(err){
					if(!err){
						fs.close(fileDescriptor, function(err){
							if(!err){
								// call back false error, i.e no error
								callback(false);
							}else {
								callback('Error closing existing file');
							}
						});
					}else {
						callback('Error overwriting data in file');
					}
				});
				}else {
					callback("Error truncating file");
				}
			});
		}else {
			callback("Couldn not open the file, it may not exist yet");
		}
	});
};

// Delete a file
lib.delete = function(dir,filename,callback){
	var fullFilePath = lib.dataDir+dir+'/'+filename+'.json';
	// Unlink the file, removes it from the dir
	fs.unlink(fullFilePath,function(err){
		if(!err){
			callback(false);
		}else {
			callback('Error deleting file');
		}
	});
};

// Append to a file
lib.append = function(dir,filename,data,callback){
	var fullFilePath = lib.dataDir+dir+'/'+filename+'.json';
	var dataString = require(fullFilePath);
	for(key in data) {
		dataString[key] = data[key];
  }
	fs.writeFile(fullFilePath, JSON.stringify(dataString), function(err){
		if(!err){
					// call back false error, i.e no error
					callback(false);
		}else {
			callback('Error appending to file');
		}
	});
};
// Export the module
module.exports = lib;
