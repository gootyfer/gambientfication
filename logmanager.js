var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

/*
{
	userKey: userKey,
	path: path,
	timestamp: timestamp
}
*/

LogManager = function(host, port) {
  this.db = new Db('tinyarm', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(err, client){this.client = client;});
};

	LogManager.prototype.getCollection= function(callback) {
		this.db.collection('log', function(error, events_collection) {
	    	if( error ) callback(error);
	    	else callback(null, events_collection);
	  	});
	};


	LogManager.prototype.findAll = function(callback) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	        events_collection.find().toArray(function(error, results) {
	          if( error ) callback(error);
	          else callback(null, results);
	          //this.client.close();
	        });
	      }
	    });
	};

	LogManager.prototype.find = function(query, callback) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	        events_collection.find(query).toArray(function(error, results) {
	          if( error ) callback(error);
	          else callback(null, results);
	          //this.client.close();
	        });
	      }
	    });
	};

	LogManager.prototype.findLast = function(callback) {
		//console.log('findLastActivity: ');
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	      	events_collection.find().sort({"timestamp":-1}).limit(1).toArray(function(error, results) {
	        	//console.log('findLastActivity: resp');
	          if( error ) callback(error);
	          else callback(null, results);
	          //this.client.close();
	        });
	      }
	    });
	};

	LogManager.prototype.findById = function(id, callback) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	        events_collection.findOne(
	        	{_id: events_collection.db.bson_serializer.ObjectID.createFromHexString(id)}
	        	, function(error, result) {
	          if( error ) callback(error);
	          else callback(null, result);
	          //this.client.close();
	        });
	      }
	    });
	};

	LogManager.prototype.save = function(events, callback) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	        if( typeof(events.length)=="undefined")
	          events = [events];
	        for( var i =0;i< events.length;i++ ) {
	          var event = events[i];
	          event.timestamp = new Date();
	        }
	        events_collection.insert(events, function() {
	          callback(null, events);
	          //this.client.close();
	        });
	      }
	    });
	};

	exports.LogManager = LogManager;