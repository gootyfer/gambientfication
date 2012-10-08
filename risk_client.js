var questionIndex = window.location.href.indexOf('?');
var querystring = window.location.href.substring(questionIndex);
var arrayParams = querystring.split("&");
var groupArray = arrayParams[1].split("=");
var group = groupArray[1];
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

$(function() {
  $.getJSON('risk?group='+group, function(game) {
  	//console.log(JSON.stringify(game));
  	firstDraw(game);
  });
});

//It does not work inside the ready function
google.load('visualization', '1', {'packages': ['geochart']});


//Redraw when data changes
function redrawAll(game){
  reorderUsers(game);
  redrawUsersInfo(game);
  redrawRegionsMap(game);
}

//First draw of all the visual info
function firstDraw(game){
  options.region = game.continent.code;
  chart = new google.visualization.GeoChart(document.getElementById('chart_div'));
  //Create div for user info
  for(var i=0; i<game.users.length; i++){
    $(getUserInfo(game, i)).appendTo($("#users_div"));
  }
  //Create div for country names, after drawing all user info
  for(var i=0; i<game.users.length; i++){
    $("body").append("<div id='userCountry"+i+"' style='position:absolute;width:100px;height:20px;left:"+
      ($("#userInfo"+i)[0].offsetLeft)+"px;top:127px;text-align:center; padding: 0 10px;font: 14px Verdana;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;'></div>");
  }
  redrawAll(game);
  drawDaysLeft(game);
  if(game.gameOver){
  	gameOver(game);
  }
}

function redrawRegionsMap(game){
  var data = google.visualization.arrayToDataTable(game.arr_data);
  chart.draw(data, options);
}


function drawDaysLeft(game){
  var ONE_DAY = 1000 * 60 * 60 * 24;
  var daysLeft = Math.floor(((new Date(game.endDate)) - (new Date()))/ONE_DAY);
  $("body").append("<div id='daysLeft'>"+daysLeft+" DAYS LEFT</div>");
}

function reorderUsers(game){
  game.users.sort(function(a,b){
    return b.conquered - a.conquered;
  });
}

function redrawUsersInfo(game){
  $("#progressbarg").html("");
  for(var i=0; i<game.users.length; i++){
    $("#userInfo"+i).replaceWith(function(){return getUserInfo(game, i)});
    drawTotalProgress(game, i);
  }
}

function drawTotalProgress(game, userId){
  var usersProgress = 0;
  for(var i=0;i<game.users.length;i++){
    usersProgress+=game.users[i].conquered;
  }
  var width = Math.floor(game.users[userId].conquered*900/usersProgress);
  $("#progressbarg").append("<div class='indicatorg' style='background-color:"+game.users[userId].color+
    ";width:"+width+";'></div>");
}

function getUserInfo(game, userId){
  var progress = "<div id='gameover'><div>GAME OVER</div></div>";
  var countryName = "";

  if(!game.endOfGame){
    var regionToConquer = game.continent.regions[game.users[userId].region];
    for(var i=0; i<regionToConquer.countries.length;i++){
      if(regionToConquer.countries[i].code == game.users[userId].country){
        break;
      }
    }
    var countryToConquer = regionToConquer.countries[i];
    var conquer_progress = Math.round(100*game.users[userId].points/countryToConquer.area);
    if(conquer_progress>95) conquer_progress=95;
    var progress = '<div class="progressbar"><div class="indicator" style="background: -webkit-gradient(linear, left top, left bottom, from('+
      game.users[userId].color+'), to(white));width:'+(conquer_progress)+';"></div></div>';
    countryName = countryToConquer.name;
  }
  //TODO: show reads count per participant + in total
  $("#userCountry"+userId).html(countryName);

  //TODO: remove new event onclick: testing
  return "<span id='userInfo"+userId+"' class='userInfo' style='background-color:"+game.users[userId].color+
  ";'><div><img width='100' height='100' src='"+game.users[userId].googlePlusImage+"'  /></div>"+progress+"</span>";
}

function gameOver(game){
  //Display final info
  var read = 0;
  var skimmed = 0;
  var suggested = 0;
  for(var i=0;i<game.users.length;i++){
    read+=game.users[i].read;
    skimmed+=game.users[i].skimmed;
    suggested+=game.users[i].suggested;
  }
  var textWin = game.win?"The game finished with a total conquer of the continent. Congratulations!!":"The game finished with a parcial conquer of the continent. Try harder next time!!";
  $("body").append("<div id='endOfGame'><h5>GAME OVER</h5>"+textWin+"<br><br>To conquer the continent, your group...<br>...read "+read+
    " papers<br>...skimmed "+skimmed+" papers<br>...suggested "+suggested+
    " papers<br><br> A new game will start in 24 hours. Good luck!</div>");
}



