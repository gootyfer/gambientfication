var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

/*
{
	groupKey: ariadne,
	gameData: {
		continent: {
			code: code,
			name: name,
			area: area,
			regions: [{
				code: code,
				name: name,
				countries: 
					[{
						code: code,
						name: name,
						area: area
				 	}]
			}]
		},
		users: [
			{
			key: key,
			googlePlusImage: url,
			googlePlusDisplayName: name,
			user: email,
			googlePlusId: googlePlusId,
			read: number,
	        skimmed: number,
	        suggested: number,
	        points: number,
	        conquered: area,
	        color: color,
	        id: id
			}
		],
		conquered_countries: [{
						code: code,
						name: name,
						area: area
				 	}],
		arr_data : [['Country', 'Conqueror']],
		gameOver: false,
		endDate: date
	},
	timestamp: timestamp
}
*/

RiskGameManager = function(host, port) {
  this.db = new Db('tinyarm', new Server(host, port, {auto_reconnect: true}, {}));
  this.db.open(function(err, client){this.client = client;});
};

	RiskGameManager.prototype.getCollection= function(callback) {
		this.db.collection('risk_game', function(error, events_collection) {
	    	if( error ) callback(error);
	    	else callback(null, events_collection);
	  	});
	};


	RiskGameManager.prototype.findAll = function(callback) {
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

	RiskGameManager.prototype.find = function(query, callback) {
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

	RiskGameManager.prototype.findLast = function(group, callback) {
		//console.log('findLastActivity: ');
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	      	events_collection.find({"group":group}).sort({"timestamp":-1}).limit(1).toArray(function(error, results) {
	        	//console.log('findLastActivity: resp');
	          if( error ) callback(error);
	          else callback(null, results);
	          //this.client.close();
	        });
	      }
	    });
	};

	RiskGameManager.prototype.findById = function(id, callback) {
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

	RiskGameManager.prototype.save = function(events, callback) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	        if( typeof(events.length)=="undefined")
	          events = [events];
	        for( var i =0;i< events.length;i++ ) {
	          var event = events[i];
	          event.timestamp = new Date();
	        }
	        events_collection.insert(events, function(error, objects) {
	          callback(error, objects[0]);
	          //this.client.close();
	        });
	      }
	    });
	};

	RiskGameManager.prototype.update = function(id, game, callback) {
	    this.getCollection(function(error, events_collection) {
	      if( error ) callback(error);
	      else {
	        events_collection.update(
	        	{_id: id}, 
	        	{"$set": {"gameData": game}}, 
	        	function(error, updated_game) {
	        		callback(null, updated_game);
	          		//this.client.close();
	        });
	      }
	    });
	};

	exports.RiskGameManager = RiskGameManager;