var users = [];
//var server = 'http://3.atinyarm.appspot.com';
$(function() {
	$.getJSON('data/users.json', function(users_info) {
		users = users_info;
        console.log(JSON.stringify(users));

        loadPreviousData(function(data){
        	drawChart(data);
        });
        // $.getJSON('data/activities_per_day.json', function(total) {
        // $.getJSON('data/activities_per_day_indiv.json', function(read) {
        // $.getJSON('data/activities_per_day_indiv.json', function(skimmed) {
        // $.getJSON('data/activities_per_day_collab.json', function(suggested) {

        //     drawChart({total:total, read:read, skimmed:skimmed, suggested:suggested});
        // });
        // });
        // });
        // });
	}).error(function(){console.log("errorrr");});
});

function loadPreviousData(callback){
    var dataTotal = [];
    var dataRead = [];
    var dataSkimmed = [];
    var dataSuggested = [];

    //var until = new Date().toISOString().substring(0,10);
    var from = new Date();
    from.setFullYear(from.getFullYear()-1);
    from.setDate(1);
    //from = from.toISOString().substring(0,10);
    var usersUpdated = 0;
    users.forEach(function(user){
        $.getJSON('/api/activities?userKey='+user.key+'&from='+from.getTime(),
        function(activities){
            activities.forEach(function(activity){
                var ak_key = Date.parse(activity.date.substring(0,8)+"01"+activity.date.substring(10));
                //console.log(ak_key);
                //console.log(activity.date.substring(0,7));
                if(!dataTotal[ak_key]) dataTotal[ak_key] = 0;
                if(!dataRead[ak_key]) dataRead[ak_key] = 0;
                if(!dataSkimmed[ak_key]) dataSkimmed[ak_key] = 0;
                if(!dataSuggested[ak_key]) dataSuggested[ak_key] = 0;
                switch(activity.action){
                    case 'read':
                        dataTotal[ak_key] +=1;
                        dataRead[ak_key] +=1;
                        break;
                    case 'skimmed':
                        dataTotal[ak_key] +=0.5;
                        dataSkimmed[ak_key] +=1;
                        break;
                    case 'suggested':
                        dataTotal[ak_key] +=1;
                        dataSuggested[ak_key] +=1;
                        break;
                }
            });
            //user.points = 10 - activities.length;
            usersUpdated++;
            if(usersUpdated==users.length){
                var finalData = {total:[], read:[], skimmed:[], suggested:[]};
                //Order data
                var dates = [];
                for(var day in dataTotal){
                    dates.push(day);
                }
                dates.sort(function(a,b){return a-b});
                for(var i=0; i<dates.length; i++){
                    finalData.total.push([parseInt(dates[i]), dataTotal[dates[i]]]);
                    if(dataRead[dates[i]]) finalData.read.push([parseInt(dates[i]), dataRead[dates[i]]]);
                    if(dataSkimmed[dates[i]]) finalData.skimmed.push([parseInt(dates[i]), dataSkimmed[dates[i]]]);
                    if(dataSuggested[dates[i]]) finalData.suggested.push([parseInt(dates[i]), dataSuggested[dates[i]]]);
                    //console.log(new Date(new Number(dates[i])));
                }
                
                callback(finalData);
            }
        }).error(function(){console.log("error in ajax request");});
    });
}

function drawChart(data) {
	chart = new Highcharts.Chart({
            chart: {
                renderTo: 'container'
            },
            title: {
                text: 'Activity in tinyArm'
            },
            subtitle: {
                text: 'By ariadne group'
            },
            xAxis:{
            	type: 'datetime'
            },
            yAxis: {
                title: {
                    text: 'Papers'
                },
                min: 0,
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                    }
                }
            },
            series: [
            
            {
                name: 'read',
                data: data.read,
                type: 'column'
            }, {
                name: 'skimmed',
                data: data.skimmed,
                type: 'column'
            }, {
                name: 'suggested',
                data: data.suggested,
                type: 'column'
            }, {
                name: 'total',
                data: data.total
            }]
    });
}