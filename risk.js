//Constant data
var chart;
var options = {
  colorAxis: {
    values: [1, 2, 3, 4, 5, 6, 7, 8],
    colors: ['#d81820', '#369546', '#3278a9', '#e9b926', '#6e5e3c', '#c8148e', '#6c6e70', '#231f20']
  },
  legend: 'none',
  region: ''
};
var pointsPower = 500000;
var endOfGame = false;

//Variable data
var continents = [];
var users = [];
var arr_data = [['Country', 'Conqueror']];
var conquered_countries = {};
var game = 0;

$(function() {
  if(localStorage.users && localStorage.users.length>0){
    loadDataFromLocalStorage();
    loadInitialState(false, function(){
      firstDraw();
    });
  }else{
    newGame(firstDraw);
  }
});

//It does not work inside the ready function
google.load('visualization', '1', {'packages': ['geochart']});

function loadDataFromLocalStorage(){
  continents = JSON.parse(localStorage.continents);
  users = JSON.parse(localStorage.users);
  game = localStorage.game;
  if(localStorage.arr_data) arr_data = JSON.parse(localStorage.arr_data);
  if(localStorage.conquered_countries) conquered_countries = JSON.parse(localStorage.conquered_countries);
}

//Redraw when data changes
function redrawAll(){
  reorderUsers();
  redrawUsersInfo();
  redrawRegionsMap();
}

//First draw of all the visual info
function firstDraw(){
  options.region = continents[game].code;
  chart = new google.visualization.GeoChart(document.getElementById('chart_div'));
  //Create div for user info
  for(var i=0; i<users.length; i++){
    $(getUserInfo(i)).appendTo($("#users_div"));
  }
  //Create div for country names, after drawing all user info
  for(var i=0; i<users.length; i++){
    $("body").append("<div id='userCountry"+i+"' style='position:absolute;width:100px;height:20px;left:"+
      ($("#userInfo"+i)[0].offsetLeft)+"px;top:127px;text-align:center; padding: 0 10px;font: 14px Verdana;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;'></div>");
  }
  redrawAll();
}

function redrawRegionsMap(){
  var data = google.visualization.arrayToDataTable(arr_data);
  chart.draw(data, options);
}

function shuffle (o){
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

function newGame(callback){
  $.getJSON('data/users.json', function(users_info) {
    //Load user info
    users = users_info;
    $.getJSON('data/countries.json', function(info) {
      //Load countries info
      continents = info.continents;
      //Randomly choose a new game
      game = Math.floor(5*Math.random());
      //Save game data
      localStorage.game = game;
      //Shuffle regions
      shuffle(continents[game].regions);
      //Save countries data
      localStorage.continents = JSON.stringify(continents);
      //Assign regions to users
      for(var i=0; i<users.length; i++){
        var index = i % continents[game].regions.length;
        users[i].region = index;
        console.log(i+" assigned region "+continents[game].regions[index].code);
        //Init variables
        users[i].read = 0;
        users[i].skimmed = 0;
        users[i].suggested = 0;
        users[i].points = 0;
        users[i].conquered = 0;
        users[i].color = options.colorAxis.colors[i];
        users[i].id = options.colorAxis.values[i];
        //Assing first country to user
        if(!assignNewCountryToUser(i)){
          endOfGame = true;
          gameOver();
          console.log("No free countries: end of game"); 
        }
      }
      //Simulation of initial data
      /*
      for(var i=0; i<users.length; i++){
        var read = Math.floor(10*Math.random());
        for(j=0; j<read; j++){
          //Conquer
          users[i].points += 500000;
          conquer(i);
        }
      }
      */

      loadInitialState(true, function(){
        callback();
      });
    }).error(function(){console.log("Error loading countries info");});
  }).error(function(){console.log("Error loading users info");});  
}

function loadInitialState(newGame, callback){
  //Initial state
  //var until = new Date().toISOString().substring(0,10);
  var from = new Date();
  from = new Date (from.getFullYear(), from.getMonth());
  //from = from.toISOString().substring(0,10);
  var end = new Date();
  end = new Date (end.getFullYear(), end.getMonth()+1, 0);
  var ONE_DAY = 1000 * 60 * 60 * 24;
  var daysLeft = Math.floor((end - (new Date()))/ONE_DAY);
  $("body").append("<div id='daysLeft'>"+daysLeft+" DAYS LEFT</div>");
  var usersUpdated = 0;
  var newActivities = {};
  users.forEach(function(user){
      newActivities[user.id] = {read:0,skimmed:0,suggested:0};
      $.getJSON('/api/activities/?userKey='+user.key+'&from='+from.getTime(),
      function(activities){
        activities.forEach(function(activity){
            switch(activity.action){
                case 'read':
                    newActivities[user.id].read +=1;
                    if(newGame || newActivities[user.id].read > user.read){
                      user.read +=1;
                      user.points +=pointsPower;
                      conquer(users.indexOf(user));
                    }
                    break;
                case 'skimmed':
                    newActivities[user.id].skimmed +=1;
                    if(newGame || newActivities[user.id].skimmed > user.skimmed){
                      user.skimmed +=1;
                      user.points +=(0.5*pointsPower);
                      conquer(users.indexOf(user));
                    }
                    break;
                case 'suggested':
                    newActivities[user.id].suggested +=1;
                    if(newGame || newActivities[user.id].suggested > user.suggested){
                      user.suggested +=1;
                      user.points +=pointsPower;
                      conquer(users.indexOf(user));
                    }
                    break;
            }
        });
        usersUpdated++;
        if(usersUpdated==users.length){
            //Save user data
            localStorage.users = JSON.stringify(users);
            callback();
        }
    }).error(function(){console.log("error in ajax request");});
  });
}

function reorderUsers(){
  users.sort(function(a,b){
    return b.conquered - a.conquered;
  });
}

function redrawUsersInfo(){
  $("#progressbarg").html("");
  for(var i=0; i<users.length; i++){
    $("#userInfo"+i).replaceWith(function(){return getUserInfo(i)});
    drawTotalProgress(i);
  }
}

function drawTotalProgress(userId){
  var usersProgress = 0;
  for(var i=0;i<users.length;i++){
    usersProgress+=users[i].conquered;
  }
  var width = Math.floor(users[userId].conquered*900/usersProgress);
  $("#progressbarg").append("<div class='indicatorg' style='background-color:"+users[userId].color+
    ";width:"+width+";'></div>");
}

function getUserInfo(userId){
  var progress = "<div id='gameover'><div>GAME OVER</div></div>";
  var countryName = "";

  if(!endOfGame){
    var regionToConquer = continents[game].regions[users[userId].region];
    for(var i=0; i<regionToConquer.countries.length;i++){
      if(regionToConquer.countries[i].code == users[userId].country){
        break;
      }
    }
    var countryToConquer = regionToConquer.countries[i];
    var conquer_progress = Math.round(100*users[userId].points/countryToConquer.area);
    if(conquer_progress>95) conquer_progress=95;
    var progress = '<div class="progressbar"><div class="indicator" style="background: -webkit-gradient(linear, left top, left bottom, from('+
      users[userId].color+'), to(white));width:'+(conquer_progress)+';"></div></div>';
    countryName = countryToConquer.name;
  }
  //TODO: show reads count per participant + in total
  $("#userCountry"+userId).html(countryName);

  //TODO: remove new event onclick: testing
  return "<span id='userInfo"+userId+"' class='userInfo' style='background-color:"+users[userId].color+
  ";'><div><img width='100' height='100' src='"+users[userId].googlePlusImage+"' onclick='newEvent("+
    userId+", \"read\")' /></div>"+progress+"</span>";
}

//Try to conquer current country
function conquer(userId){
  var regionToConquer = continents[game].regions[users[userId].region];
  if(!conquered_countries[regionToConquer.code]){
    conquered_countries[regionToConquer.code] = [];
  }
  if(users[userId].country && conquered_countries[regionToConquer.code].indexOf(users[userId].country) == -1){
    for(var i=0; i<regionToConquer.countries.length;i++){
      if(regionToConquer.countries[i].code == users[userId].country){
        break;
      }
    }
    var countryToConquer = regionToConquer.countries[i];
    if(users[userId].points > countryToConquer.area){//CONQUER
      
      //Update user variables
      users[userId].points -= new Number(countryToConquer.area);
      users[userId].conquered += new Number (countryToConquer.area);
      
      //Remove country from list
      regionToConquer.countries.splice(regionToConquer.countries.indexOf(countryToConquer),1);
      //Add country to conquered
      conquered_countries[regionToConquer.code].push(countryToConquer.code);
      //Add data to display array
      arr_data.push([countryToConquer.code, users[userId].id]);
      //Save local data
      localStorage.users = JSON.stringify(users);
      localStorage.continents = JSON.stringify(continents);
      localStorage.conquered_countries = JSON.stringify(conquered_countries);
      localStorage.arr_data = JSON.stringify(arr_data);
      console.log(userId+" conquered country "+countryToConquer.name);

      //If reserved by other player, change his/her reservation
      for(var i=0; i<users.length;i++){
        if(users[i].country && users[i].country == countryToConquer.code){
          if(!assignNewCountryToUser(i)){
            endOfGame=true;
            gameOver();
            return;
          }
        }
      }
      //Try other conquer
      //if(recur) conquer(userId);
    }else{
      console.log(userId+" NOT conquered country "+users[userId].country);
    }
  }
}

function gameOver(){
  //Remove data from localStorage
  localStorage.removeItem("continents");
  localStorage.removeItem("users");
  localStorage.removeItem("arr_data");
  localStorage.removeItem("conquered_countries");
  localStorage.removeItem("game");
  //Display final info
  var read = 0;
  var skimmed = 0;
  var suggested = 0;
  for(var i=0;i<users.length;i++){
    read+=users[i].read;
    skimmed+=users[i].skimmed;
    suggested+=users[i].suggested;
  }
  $("body").append("<div id='endOfGame'><h5>GAME OVER</h5>Congratulations! You completed the quest!!<br><br>To conquer the continent, your group...<br>...read "+read+
    " papers<br>...skimmed "+skimmed+" papers<br>...suggested "+suggested+
    " papers<br><br> A new game will start in 24 hours. Good luck!</div>");
}

 //Find next country
function assignNewCountryToUser(userId){
  var found = false;
  var countries_in_region = continents[game].regions[users[userId].region].countries;
  var number_of_countries_left = countries_in_region.length;
  if(number_of_countries_left >0){
    found = true;
    var randomIndex = Math.floor((number_of_countries_left-1)*Math.random());
    users[userId].country = countries_in_region[randomIndex].code;
    //Save user data
    localStorage.users = JSON.stringify(users);
    console.log(userId+" reserved country "+countries_in_region[randomIndex].name);
  }
  if(!found){
    if(assignNewRegionToUser(userId)) return assignNewCountryToUser(userId);
    console.log("Impossible to assign new country to the user");//End of game
    return false;
  }
  return true;
}

//Find next region
function assignNewRegionToUser(userId){
  var regionId = users[userId].region;
  //var index = continents[game].regions.indexOf(region);
  var num_regions = continents[game].regions.length;

  for(var i=1; i<num_regions; i++){
    var new_index = (regionId+i)%num_regions;
    console.log(userId+" is going to change to region "+continents[game].regions[new_index].code);
    if(continents[game].regions[new_index].countries.length>0){
      users[userId].region = new_index;
      //Save user data
      localStorage.users = JSON.stringify(users);
      console.log(userId+" assigned region "+continents[game].regions[new_index].code);
      return true;
    }
  }
  return false;
}

function newEvent(userId, eventType){
  if(endOfGame) return;
  switch(eventType){
    case 'read':
        users[userId].read +=1;
        users[userId].points +=pointsPower;
        break;
    case 'skimmed':
        users[userId].skimmed +=1;
        users[userId].points +=(0.5*pointsPower);
        break;
    case 'suggested':
        users[userId].suggested +=1;
        users[userId].points +=pointsPower;
        break;
    case 'toRead':
        return;
  }
  //Save user data
  localStorage.users = JSON.stringify(users);
  conquer(userId);
  redrawAll();
}