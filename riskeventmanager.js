var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

/*
{
	userKey: userKey,
	action: conquer / notconquer / selectRegion / selectCountry,
	target: country/region name,
	gameKey: gameKey, 
	timestamp: timestamp
}
*/

RiskEventManager = function(host, port) {
  this.db = new Db('tinyarm', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(err, client){this.client = client;});
};

	RiskEventManager.prototype.getCollection= function(callback) {
		this.db.collection('risk_event', function(error, events_collection) {
	    	if( error ) callback(error);
	    	else callback(null, events_collection);
	  	});
	};


	RiskEventManager.prototype.findAll = function(callback) {
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

	RiskEventManager.prototype.find = function(query, callback) {
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

	RiskEventManager.prototype.findLast = function(callback) {
		//console.log('findLastActivity: ');
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	      	events_collection.find().sort({"date":-1}).limit(1).toArray(function(error, results) {
	        	//console.log('findLastActivity: resp');
	          if( error ) callback(error);
	          else callback(null, results);
	          //this.client.close();
	        });
	      }
	    });
	};

	RiskEventManager.prototype.findById = function(id, callback) {
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

	RiskEventManager.prototype.save = function(events) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) console.log(error);
	      else {
	        if( typeof(events.length)=="undefined")
	          events = [events];
	        for( var i =0;i< events.length;i++ ) {
	          var event = events[i];
	          event.timestamp = new Date();
	        }
	        events_collection.insert(events, function() {
	          //console.log(events);
	          //this.client.close();
	        });
	      }
	    });
	};

	exports.RiskEventManager = RiskEventManager;