var questionIndex = window.location.href.indexOf('?');
var querystring = window.location.href.substring(questionIndex);
var arrayParams = querystring.split("&");
var groupArray = arrayParams[1].split("=");
var group = groupArray[1];

var canvas = document.getElementById("my_canvas");
var ctx = canvas.getContext('2d');
var users = [];
var positions = [
    {posx:0, posy:0},
    {posx:250, posy:0},
    {posx:500, posy:0},
    {posx:750, posy:0},
    {posx:0, posy:375},
    {posx:250, posy:375},
    {posx:500, posy:375},
    {posx:750, posy:375}
];

$(function() {
    $.getJSON('data/'+group+'.json', function(users_info) {
        users = users_info;

        loadPreviousData(function(){
            loadImages(function(){
                redrawHangmen();
            });
        });
        
    }).error(function(){console.log("errorrr");});
});

function loadPreviousData(callback){
    //var until = new Date().toISOString().substring(0,10);
    var from = new Date();
    from.setDate(from.getDate()-10);
    //from = from.toISOString().substring(0,10);
    var usersUpdated = 0;
    users.forEach(function(user){
        user.read = 0;
        user.skimmed = 0;
        user.suggested = 0;
        user.points = 0;
        $.getJSON('/api/activities?userKey='+user.key+'&from='+from.getTime(),
        function(activities){
            activities.forEach(function(activity){
                switch(activity.action){
                    case 'read':
                        user.read +=1;
                        user.points +=1;
                        break;
                    case 'skimmed':
                        user.skimmed +=1;
                        user.points +=0.5;
                        break;
                    case 'suggested':
                        user.suggested +=1;
                        user.points +=1;
                        break;
                }
            });
            //user.points = 10 - activities.length;
            usersUpdated++;
            if(usersUpdated==users.length){
                callback();
            }
        }).error(function(){console.log("error in ajax request");});
    });
}

function reorderUsers(){
  users.sort(function(a,b){
    if (b.points == a.points){
        return b.skimmed - a.skimmed;
    }
    return b.points - a.points;
  });
}

function redrawHangmen(){
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1200, 800);

    reorderUsers();
    for(var i=0; i<users.length; i++) {
        drawHangman(positions[i].posx, positions[i].posy, 8 - users[i].points, 
        users[i].image, users[i].read, users[i].skimmed, users[i].suggested, i);

        //TODO: remove testing
        // divs for testing
        $("body").append("<div style='position:absolute;width:135px;height:135px;left:"+
        (positions[i].posx+120)+";top:"+(positions[i].posy+40)+";' onclick='newEvent("+i+", \"read\")'></div>");
    }
}

// Draw the canvas
function drawHangman(posx, posy, badGuesses, image, read, skimmed, suggested, pos) {
    ctx.font      = "bold 14px Verdana";
    ctx.fillStyle = "#000000";
    ctx.fillText("Last 10 days", posx+35, posy+250);
    ctx.font      = "normal 14px Verdana";
    ctx.fillText("Read: "+read, posx+35, posy+280);
    ctx.fillText("Skimmed: "+skimmed, posx+35, posy+300);
    ctx.fillText("Suggested: "+suggested, posx+35, posy+320);
    // reset the canvas and set basic styles
    //canvas.width = canvas.width;
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'green';
    ctx.font = 'bold 24px Optimer, Arial, Helvetica, sans-serif';
    ctx.fillStyle = 'red';
    // draw the ground
    drawLine(ctx, [posx+10,posy+340], [posx+240,posy+340]);

    // draw head
    if(badGuesses >7.5){
        ctx.globalAlpha = 0.4;
    }
    ctx.drawImage(image, posx+120, posy+50, 100, 100);
    ctx.globalAlpha = 1.0;
      
    ctx.strokeStyle = 'black';
    if(badGuesses < 8){
        if(pos==0) ctx.strokeStyle = '#D4A017';
        if(pos==1) ctx.strokeStyle = '#C0C0C0';
        if(pos==2) ctx.strokeStyle = '#b4593a';
    }
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(posx+230, posy+100);
    ctx.arc(posx+170, posy+100, 60, 0, (Math.PI/180)*360);
    ctx.stroke();
    
    // start building the gallows if there's been a bad guess
    if (badGuesses > 0) {
        // create the upright
        ctx.strokeStyle = '#A52A2A';
        ctx.lineWidth = 20;
        drawLine(ctx, [posx+20,posy+330], [posx+20,posy+10]);
        if (badGuesses > 1) {
            // create the arm of the gallows
            ctx.lineTo(posx+190,posy+10);
            ctx.stroke();
            ctx.lineWidth = 10;
            drawLine(ctx, [posx+20,posy+80], [posx+80,posy+15]);
        }
        if (badGuesses > 2) {
            ctx.strokeStyle = '#b58c30';
            ctx.lineWidth = 6;
            // draw rope
            drawLine(ctx, [posx+170,posy+20], [posx+170,posy+30]);
            drawLine(ctx, [posx+160,posy+173], [posx+180,posy+173]);
        }
        if (badGuesses > 3) {
            ctx.strokeStyle = 'black';
            // draw body
            drawLine(ctx, [posx+170,posy+176], [posx+170,posy+240]);
        }
        if (badGuesses > 4) {
            // draw left arm
            drawLine(ctx, [posx+170,posy+185], [posx+100,posy+205]);
        }
        if (badGuesses > 5) {
            // draw right arm
            drawLine(ctx, [posx+170,posy+185], [posx+240,posy+205]);
        }
        if (badGuesses > 6) {
            // draw left leg
            drawLine(ctx, [posx+170,posy+240], [posx+140,posy+320]);
        }
        if (badGuesses > 7) {
            // draw right leg and end game
            drawLine(ctx, [posx+170,posy+240], [posx+210,posy+320]);
        }
    }
}

function drawLine(context, from, to) {
    context.beginPath();
    context.moveTo(from[0], from[1]);
    context.lineTo(to[0], to[1]);
    context.stroke();
}

function loadImages(callback) {
    var loadedImages = 0;
    for(var i=0; i<users.length; i++) {
        users[i].image = new Image();
        users[i].image.onload = function() {
            if(++loadedImages >= users.length) {
                callback();
            }
        };
        users[i].image.src = users[i].googlePlusImage;
    }
}

function newEvent(userId, eventType){
  switch(eventType){
    case 'read':
        users[userId].read +=1;
        users[userId].points += 1;
        break;
    case 'skimmed':
        users[userId].skimmed +=1;
        users[userId].points +=0.5;
        break;
    case 'suggested':
        users[userId].suggested +=1;
        users[userId].points += 1;
        break;
  }
  
  redrawHangmen();
}