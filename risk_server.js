var RiskGameManager = require('./riskgamemanager').RiskGameManager;
var RiskEventManager = require('./riskeventmanager').RiskEventManager;
var ActivityManager = require('./activitymanager').ActivityManager;

//Database connections
var gameManager = new RiskGameManager('localhost', 27017);
var eventManager = new RiskEventManager('localhost', 27017);
var activityManager = new ActivityManager('localhost', 27017);

//Constant data
var pointsPower = 500000;

getData = function(callback) {
  gameManager.findLast(function(error, results){
    if(error){
      callback(error);
    }else{
      if(results.length>0){
        var endDate = results[0].gameData.endDate;
        console.log("end date:"+endDate);
        //console.log("end date:"+(typeof endDate));
        //endDate = new Date(endDate);
        if(new Date() > endDate){//New game
          console.log("Creating NEW GAME...");
          newGame(function(data){
            callback(null, data);
          });
        }else{
          var gameOverDate = new Date(endDate.getTime());
          gameOverDate.setDate(gameOverDate.getDate()-1);
          if(new Date() >  gameOverDate){
            results[0].gameData.gameOver = true;
            gameOver();
            console.log("GAME OVER: "+(new Date())+" (today) is higher than (previous day to end of game) "+gameOverDate);
          }
          callback(null, results[0]);
        }
      }else{ //First game for the group
        newGame(function(data){
          loadInitialState(data, function(){
            callback(null, data);
          });
        });
      }
    }
  });
}

function shuffle (o){
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

function newGame(callback){
  var game = {};
  //Load constant data
  game.users = require('./data/users.json');
  continents = require('./data/continents.json').continents;

  //TODO: Randomly choose a new game
  //var gameNumber = Math.floor(5*Math.random());
  var gameNumber = 0;
  game.continent = continents[gameNumber];

  //Shuffle regions and users
  shuffle(game.continent.regions);
  shuffle(game.users);

  //Save game to create an id
  gameManager.save({groupKey: "ariadne", gameData: game}, function(error, object){
    game = object.gameData;
    //Assign regions to users
    for(var i=0; i<game.users.length; i++){
      var index = i % game.continent.regions.length;
      game.users[i].region = index;
      //Save event
      var event = {
        userKey: game.users[i].key,
        action: 'selectRegion',
        target: game.continent.regions[index].name,
        gameKey: object._id
      };
      eventManager.save(event);
      console.log(i+" assigned region "+game.continent.regions[index].name);

      var userIds = [1, 2, 3, 4, 5, 6, 7, 8];
      var colors = ['#d81820', '#369546', '#3278a9', '#e9b926', '#6e5e3c', '#c8148e', '#6c6e70', '#231f20'];

      //Init variables
      game.users[i].read = 0;
      game.users[i].skimmed = 0;
      game.users[i].suggested = 0;
      game.users[i].points = 0;
      game.users[i].conquered = 0;
      game.users[i].color = colors[i];
      game.users[i].id = userIds[i];

      game.conquered_countries = {};
      game.arr_data = [['Country','Conqueror']];

      game.gameOver = false;
      //Assing first country to user
      if(!assignNewCountryToUser(object, i)){
        game.gameOver = true;
        //game.endDate = new Date();
        gameOver();
        console.log("No free countries: end of game"); 
      }
    }
    var now = new Date();
    game.endDate = new Date (now.getFullYear(), now.getMonth()+1, 0);
    //Update game data
    gameManager.update(object._id, object.game, function(){
      callback(object);
    });
  });
}

function loadInitialState(object, callback){
  var game = object.gameData;
  var now = new Date();
  var from = new Date (now.getFullYear(), now.getMonth(), 1);
  var usersUpdated = 0;

  game.users.forEach(function(user){
    var query = {"userKey":user.key, "date": {"$gte": from}};
    console.log(query);
    activityManager.find(query, function(error, results){
      if(error){
        console.log(error);
        callback();
      }else{
        results.forEach(function(activity){
            switch(activity.action){
                case 'read':
                    user.read +=1;
                    user.points +=pointsPower;
                    conquer(object, game.users.indexOf(user));
                    break;
                case 'skimmed':
                    user.skimmed +=1;
                    user.points +=(0.5*pointsPower);
                    conquer(object, game.users.indexOf(user));
                    break;
                case 'suggested':
                    user.suggested +=1;
                    user.points +=pointsPower;
                    conquer(object, game.users.indexOf(user));
                    break;
            }
        });
        usersUpdated++;
        if(usersUpdated==game.users.length){
            //Update game
            gameManager.update(object._id, game, function(){
              callback();
            });
        }
      }
    });
  });
}

function gameOver(){
  //TODO: Log final info
  //TODO: setTimeout en 24h
}

//Try to conquer current country
function conquer(object, userId){
  var game = object.gameData;
  var regionToConquer = game.continent.regions[game.users[userId].region];
  if(!game.conquered_countries[regionToConquer.code]){
    game.conquered_countries[regionToConquer.code] = [];
  }
  if(game.users[userId].country && game.conquered_countries[regionToConquer.code].indexOf(game.users[userId].country) == -1){
    for(var i=0; i<regionToConquer.countries.length;i++){
      if(regionToConquer.countries[i].code == game.users[userId].country){
        break;
      }
    }
    var countryToConquer = regionToConquer.countries[i];
    if(game.users[userId].points > countryToConquer.area){//CONQUER
      
      //Update user variables
      game.users[userId].points -= new Number(countryToConquer.area);
      game.users[userId].conquered += new Number (countryToConquer.area);
      
      //Remove country from list
      regionToConquer.countries.splice(regionToConquer.countries.indexOf(countryToConquer),1);
      //Add country to conquered
      game.conquered_countries[regionToConquer.code].push(countryToConquer.code);
      //Add data to display array
      game.arr_data.push([countryToConquer.code, game.users[userId].id]);
      //Save event
      var event = {
        userKey: game.users[userId].key,
        action: 'conquer',
        target: countryToConquer.name,
        gameKey: object._id
      };
      eventManager.save(event);
      console.log(userId+" conquered country "+countryToConquer.name);

      //If reserved by other player, change his/her reservation
      for(var i=0; i<game.users.length;i++){
        if(game.users[i].country && game.users[i].country == countryToConquer.code){
          if(!assignNewCountryToUser(object, i)){
            console.log("GAME OVER: no more countries");
            game.gameOver=true;
            //game.endDate = new Date();
            gameOver();
            return;
          }
        }
      }
      //Try other conquer
      //if(recur) conquer(game, userId);
    }else{
      var event = {
        userKey: game.users[userId].key,
        action: 'notconquer',
        target: countryToConquer.name,
        gameKey: object._id
      };
      eventManager.save(event);
      console.log(userId+" NOT conquered country "+game.users[userId].country);
    }
  }
}

 //Find next country
function assignNewCountryToUser(object, userId){
  var game = object.gameData;
  var found = false;
  var countries_in_region = game.continent.regions[game.users[userId].region].countries;
  var number_of_countries_left = countries_in_region.length;
  if(number_of_countries_left >0){
    found = true;
    var randomIndex = Math.floor((number_of_countries_left-1)*Math.random());
    game.users[userId].country = countries_in_region[randomIndex].code;
    //Save user data
    var event = {
      userKey: game.users[userId].key,
      action: 'selectCountry',
      target: countries_in_region[randomIndex].name,
      gameKey: object._id
    };
    eventManager.save(event);
    console.log(userId+" reserved country "+countries_in_region[randomIndex].name);
  }
  if(!found){
    if(assignNewRegionToUser(object, userId)) return assignNewCountryToUser(object, userId);
    console.log("Impossible to assign new country to the user");//Game over
    return false;
  }
  return true;
}

//Find next region
function assignNewRegionToUser(object, userId){
  var game = object.gameData;
  var regionId = game.users[userId].region;
  //var index = continent.regions.indexOf(region);
  var num_regions = game.continent.regions.length;

  for(var i=1; i<num_regions; i++){
    var new_index = (regionId+i)%num_regions;
    //console.log(userId+" is going to change to region "+game.continent.regions[new_index].code);
    if(game.continent.regions[new_index].countries.length>0){
      game.users[userId].region = new_index;
      //Log user data
      var event = {
        userKey: game.users[userId].key,
        action: 'selectRegion',
        target: game.continent.regions[new_index].name,
        gameKey: object._id
      };
      eventManager.save(event);
      console.log(userId+" assigned region "+game.continent.regions[new_index].code);
      return true;
    }
  }
  return false;
}

newEvent = function(userKey, eventType){
  //Load game data
  getData(function(error, object){
    if(error){
      console.log(error);
      return;
    }
    var game = object.gameData;
    var found = false;
    for(var i=0; i<game.users.length; i++){
      if(game.users[i].key == userKey){
        userId = i;
        found = true;
        break;
      }
    }
    if(found && !game.endOfGame){
      switch(eventType){
        case 'read':
            game.users[userId].read +=1;
            game.users[userId].points +=pointsPower;
            break;
        case 'skimmed':
            game.users[userId].skimmed +=1;
            game.users[userId].points +=(0.5*pointsPower);
            break;
        case 'suggested':
            game.users[userId].suggested +=1;
            game.users[userId].points +=pointsPower;
            break;
        case 'toRead':
            return;
      }
      conquer(object, userId);
      //Update game
      gameManager.update(object._id, game, function(){});
    }
  });
}

exports.getData = getData;
exports.newEvent = newEvent;