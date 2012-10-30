//Used modules
var http = require('http');
var path = require('path');
var fs = require('fs');
var express = require('express');
var querystring = require("querystring");
var url = require("url")
var ActivityManager = require('./activitymanager').ActivityManager;
var LogManager = require('./logmanager').LogManager;
var getNewRiskData = require('./risk_server').getData;
var newRiskEvent = require('./risk_server').newEvent;

//Express init
var app = express();

//Database connections
var activityManager = new ActivityManager('localhost', 27017);
var logManager = new LogManager('localhost', 27017);

//Use express config
app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
});

/*
 * HTTP server init
 */
var serve_http = function(request, response){
//console.log('requester IP:'+request.connection.remoteAddress);
//console.log('requesting file:'+request.url);


	var filePath = '.' + request.url;
	if(filePath.indexOf('?')!=-1) filePath = filePath.substr(0,filePath.indexOf('?'));
	if (filePath.substr(-1)==('/')) filePath += 'index.html';
	
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.gif':
            contentType = 'imge/gif';
            break;
        case '.jpg':
            contentType = 'image/jpeg';
            break;
        case '.ico':
        	contentType = 'image/x-icon';
        	break;
		case '.svg':
        	contentType = 'image/svg+xml';
        	break;
		case '.swf':
			contentType = 'application/x-shockwave-flash';
			break;
		case '.ogg':
			contentType = 'application/ogg';
			break;
		case '.json':
			contentType = 'application/json';
			break;
			
    }
    
    fs.exists(filePath, function(exists) {
    	if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }  else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        } else {
            response.writeHead(404);
            response.end();
        }
    });
};

var processNotification = function(request, response){
	//Parse parameters
	var record = querystring.parse(url.parse(request.url).query);
	record.date = new Date(parseInt(record.date));
	//console.log(JSON.stringify(record));
	//response.writeHead(200);
    //response.end();
	//Save to database
	activityManager.find(record, function(error, results){
		if(results.length==0){
			activityManager.save(record, function(error, events){
				if(error){
					console.log(error);
					response.writeHead(500);
		            response.end();
		            return;
				}
				console.log("SAVED "+JSON.stringify(record));
				response.writeHead(200);
		    	response.end();
				newRiskEvent(record.userKey, record.action);
			});
		}else{
			console.log("NOT SAVED "+JSON.stringify(record));
			response.writeHead(400);
            response.end();
		}
	});
}

//OR query tinyarm data (1 requests/10 mins = 6/h = 144/día)

var queryTinyArm = function(){
	activityManager.findLast(function(error, results){
		if(error){
			console.log(error);
			return;
		}

		var lastActivityDate = results[0].date;
		console.log('lastActivityDate: ' + lastActivityDate);
		var from = new Date (Date.parse(lastActivityDate));
	    from = from.toISOString().substring(0,10);
	    var server = '4.atinyarm.appspot.com';
	    var path = '/api/activities?from='+from+'&page=all';
	    //console.log("path:"+path);
	    var options = {
		  host: server,
		  path: path
		};
	    var req = http.request(options, function(res) {
	    	var textResponse = "";
	    	res.on('data', function (chunk) {
	    		textResponse += chunk.toString();
				//console.log('BODY: ' + chunk);
			});
			res.on('end', function(){
				//console.log('RESPONSE: ' + textResponse);
				var response, activities;
				try{
					response = JSON.parse(textResponse);
					activities = response.items;
				}catch(error){
					console.log(error);
					return;
				}

				activities.forEach(function(activity){
					var record = {};
					record.action = activity.verb;
					record.userKey = activity.actor.id;
					record.paperKey = activity.object.id;
					record.date = new Date (Date.parse(activity.published));
					if(activity.target && activity.target.id) record.targetKey = activity.target.id;
					activityManager.find(record, function(error, results){
						if(results.length==0){
							activityManager.save(record, function(error, events){
								if(error){
									console.log(error);
								}
								console.log("SAVED "+JSON.stringify(record));
								newRiskEvent(record.userKey, record.action);
							});
						}else{
							//console.log("NOT SAVED "+JSON.stringify(record));
						}
					});
					
				});
			});
	    });
		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});
		req.end();
	});
}

var getData = function(request, response){
	//Parse parameters
	var params = querystring.parse(url.parse(request.url).query);
	if(!params["userKey"]){
		response.writeHead(404);
        response.end();
	}else{
		//Query database
		var dateQuery;
		if(params["from"]){
			dateQuery = {};
			//console.log(params["from"]);
			var start = new Date(parseInt(params["from"]));
			//console.log(start);
			dateQuery["$gte"] = start;
		}
		if(params["until"]){
			if(!dateQuery) dateQuery = {};
			var end = new Date(parseInt(params["until"]));
			dateQuery["$lt"] = end;
		}

		var query = {"userKey":params["userKey"]};
		if(dateQuery){
			query["date"] = dateQuery;
		}
		//console.log(query);
		activityManager.find(query, function(error, results){
			if(error){
				response.writeHead(500);
                response.end();
                console.log("error in request");
                return;
			}
			//console.log(results);
			response.writeHead(200, { 'Content-Type': 'application/json' });
	        response.end(JSON.stringify(results), 'utf-8');
		});
	}
}

var getRiskData = function(request, response, group){
	//Use server Risk and be able to return state: users, countries, init
	//Load new Game in the first request
	getNewRiskData(group, function(error, results){
		if(error){
				response.writeHead(500);
                response.end();
                console.log("error in request");
                return;
			}
			//console.log(results);
			response.writeHead(200, { 'Content-Type': 'application/json' });
	        response.end(JSON.stringify(results.gameData), 'utf-8');
	});
}

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}

var getChordData = function(request, response){
	var my_url = url.parse(request.url);
	var params = querystring.parse(my_url.query);
	var users = require('./data/'+params['group']+'.json');
	var userKeys = [];
	users.forEach(function(user){
		userKeys.push(user.key);
	});
	var query = {"action":"suggested", "userKey":{"$in":userKeys}, "targetKey":{"$in":userKeys}};
	activityManager.find(query, function(error, suggestedActions){
		if(error){
			response.writeHead(500);
            response.end();
            console.log("error in request");
            return;
		}
		var suggested = zeros([userKeys.length, userKeys.length]);
		var accepted = zeros([userKeys.length, userKeys.length]);
		var suggestionsChecked = 0;
		suggestedActions.forEach(function(suggestion){
			var origin = userKeys.indexOf(suggestion.userKey);
			var target = userKeys.indexOf(suggestion.targetKey);
			suggested[origin][target] += 1;
			var query = {"action":{"$in":["read","skimmed"]}, userKey: suggestion.targetKey, paperKey: suggestion.paperKey};
			activityManager.find(query, function(error, acceptedSuggestion){
				if(acceptedSuggestion.length>0){
					var origin = userKeys.indexOf(suggestion.userKey);
					var target = userKeys.indexOf(suggestion.targetKey);
					accepted[target][origin] += 1;
					//accepted.push(acceptedSuggestion[0]);
				}
				suggestionsChecked++;
				if(suggestionsChecked==suggestedActions.length){
					response.writeHead(200, { 'Content-Type': 'application/json' });
        			response.end(JSON.stringify({"suggested":suggested, "accepted":accepted}), 'utf-8');
				}
			});
		});
	});
}



//Router
app.get('/*.html', function (request, response) {
	var my_url = url.parse(request.url);
	var params = querystring.parse(my_url.query);

	var record = {
		"userKey": params['userKey'], 
		"path": my_url.pathname
	};
	logManager.save(record, function(error, events){
		if(error){
			console.log(error);
		}
	});
	//console.log("Page: "+request.url);
	//queryTinyArm();
	serve_http(request, response);
});
app.get('/*.css', function (request, response) {
	serve_http(request, response);
});
app.get('/*.js', function (request, response) {
	serve_http(request, response);
});
app.get('/*.json', function (request, response) {
	serve_http(request, response);
	//console.log("JSON: "+request.url);
});
app.get('/*.png', function (request, response) {
	serve_http(request, response);
});
app.get('/notification', function (request, response) {
	processNotification(request, response);
});
app.get('/api/activities', function (request, response) {
	getData(request, response);
	//console.log("API: "+request.url);
});
app.get('/risk', function (request, response) {
	var my_url = url.parse(request.url);
	var params = querystring.parse(my_url.query); 
	getRiskData(request, response, params['group']);
});
app.get('/chord', function (request, response) {
	getChordData(request, response);
});
//Check every 10 minutes
//setTimeout(queryTinyArm, 2000);
//setInterval(queryTinyArm, 10*60*1000);
//Launch app
app.listen(80);
console.log('Server running...');
console.log(new Date());