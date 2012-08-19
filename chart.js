var users = [];
//var server = 'http://3.atinyarm.appspot.com';
$(function() {
	$.getJSON('data/users.json', function(users_info) {
		users = users_info;

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
        user.read = 0;
        user.skimmed = 0;
        user.suggested = 0;
        user.points = 0;
        $.getJSON('/api/activities?userKey='+user.key+'&from='+from.getTime(),
        function(activities){
            activities.forEach(function(activity){
            	var ak_key = Date.parse(activity.date);
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
	//console.log(JSON.stringify(data));
	//console.log(JSON.stringify(data));
	// create the chart
	//Add 0 in future 2 months to show future deadlines
	/*
	var date = new Date();
	date.setDate(date.getMonth()+1);
	data.push([date.getTime(), 1]);
	date.setDate(date.getMonth()+1);
	data.push([date.getTime(), 1]);
	date.setDate(date.getMonth()+1);
	data.push([date.getTime(), 1]);
	*/
	chart = new Highcharts.StockChart({
	    chart: {
	        renderTo: 'container',
	        alignTicks: false
	    },

	    rangeSelector: {
	        selected: 6
	    },

	    title: {
	        text: 'Ariadne group activity'
	    },

	    series: [
/*	    {
	        name: 'read',
	        id: 'read',
	        data: data.read,
		        dataGrouping: {
					units: [[
						'week', // unit name
						[1] // allowed multiples
					], [
						'month',
						[1, 2, 3, 4, 6]
					]]
		        }
	    },
	    {
	        name: 'skimmed',
	        data: data.skimmed,
		        dataGrouping: {
					units: [[
						'week', // unit name
						[1] // allowed multiples
					], [
						'month',
						[1, 2, 3, 4, 6]
					]]
		        }
	    },
	    {
	        name: 'suggested',
	        data: data.suggested,
		        dataGrouping: {
					units: [[
						'week', // unit name
						[1] // allowed multiples
					], [
						'month',
						[1, 2, 3, 4, 6]
					]]
		        }
	    },*/
	    {
	        type: 'column',
	        name: 'total',
	        id: 'total',
	        data: data.total,
		        dataGrouping: {
					units: [[
						'week', // unit name
						[1] // allowed multiples
					], [
						'month',
						[1, 2, 3, 4, 6]
					]]
		        }
	    },
	    {
	    	type : 'flags',
			data : [{
				x : Date.UTC(2012, 3, 2),
				title : 'ECTEL12',
				text : 'ECTEL12 deadline'
			}, {
				x : Date.UTC(2011, 10, 7),
				title : 'LAK12',
				text : 'LAK12 dealine'
			}, {
				x : Date.UTC(2011, 8, 26),
				title : 'CHI12',
				text : 'CHI12 dealine'
			}, {
				x : Date.UTC(2012, 10, 1),
				title : 'LAK13',
				text : 'LAK13 dealine'
			}, {
				x : Date.UTC(2012, 8, 19),
				title : 'CHI13',
				text : 'CHI13 dealine'
			}
			],
			shape : 'squarepin',
			onSeries: 'total',
			width : 45
	    }]
	});
}