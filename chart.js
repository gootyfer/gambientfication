var users = [];
var finalData = [];
$(function() {
	$.getJSON('data/users.json', function(users_info) {
		users = users_info;

        loadPreviousData(function(data){
            drawChart(data);
        });
	}).error(function(){console.log("errorrr");});
});

function loadPreviousData(callback){
	var dataraw = [];
    var until = new Date().toISOString().substring(0,10);
    var from = new Date();
    from.setFullYear(from.getFullYear()-1);
    from = from.toISOString().substring(0,10);
    var usersUpdated = 0;
    users.forEach(function(user){
        user.read = 0;
        user.skimmed = 0;
        user.suggested = 0;
        user.points = 0;
        $.getJSON('http://3.atinyarm.appspot.com/api/activities/jsonp?userKey='+
        user.key+'&from='+from+'&until='+until+'&page=all&callback=?',
        function(activities_obj){
            var activities = activities_obj.items;
            activities.forEach(function(activity){
            	var ak_key = Date.parse(activity.published.substr(0,11));
            	if(!dataraw[ak_key]) dataraw[ak_key] = 0;
                switch(activity.verb){
                    case 'read':
                        dataraw[ak_key] +=1;
                        break;
                    case 'skimmed':
                        dataraw[ak_key] +=0.5;
                        break;
                    case 'suggested':
                        dataraw[ak_key] +=1;
                        break;
                }
            });
            //user.points = 10 - activities.length;
            usersUpdated++;
            if(usersUpdated==users.length){
            	//Order data
				var dates = [];
				for(var day in dataraw){
					dates.push(day);
				}
				dates.sort(function(a,b){return a-b});
				for(var i=0; i<dates.length; i++){
					finalData.push([parseInt(dates[i]), dataraw[dates[i]]]);
					//console.log(new Date(new Number(dates[i])));
				}
				
                callback(finalData);
            }
        }).error(function(){console.log("error in ajax request");});
    });
}

function drawChart(data) {
	//console.log(JSON.stringify(data));
	//data = [[1313532000000,3],[1313704800000,1],[1313964000000,2],[1314136800000,2],[1314223200000,4],[1314309600000,0],[1314396000000,2],[1314482400000,4],[1314568800000,2],[1314741600000,2],[1314828000000,1],[1315173600000,5],[1315260000000,0],[1315346400000,2],[1315432800000,2],[1315519200000,6],[1315864800000,4],[1315951200000,3],[1316037600000,0],[1316296800000,1],[1316383200000,8],[1316556000000,2],[1316642400000,7],[1316728800000,4],[1316901600000,3],[1316988000000,1],[1317074400000,4],[1317160800000,2],[1317247200000,5],[1317333600000,2],[1317420000000,6],[1317592800000,8],[1317679200000,4],[1317765600000,21],[1317938400000,4],[1318197600000,14],[1318284000000,13],[1318370400000,4],[1318543200000,6],[1318716000000,1],[1318802400000,1],[1318888800000,2],[1318975200000,9],[1319061600000,0],[1319148000000,0],[1319493600000,1],[1319580000000,1],[1319666400000,2],[1319752800000,3],[1320188400000,1],[1320706800000,8],[1320793200000,9],[1321052400000,1],[1321225200000,5],[1321311600000,3],[1321484400000,2],[1321570800000,2],[1321657200000,0],[1321830000000,3],[1321916400000,2],[1322002800000,2],[1322348400000,2],[1322434800000,1],[1322521200000,4],[1322607600000,2],[1322780400000,3],[1323039600000,6],[1323126000000,1],[1323298800000,7],[1323471600000,1],[1323730800000,1],[1323817200000,2],[1323903600000,3],[1323990000000,1],[1324249200000,2],[1324335600000,3],[1324594800000,5],[1324854000000,2],[1324940400000,2],[1325458800000,2],[1325545200000,1],[1325631600000,6],[1325718000000,1],[1326409200000,4],[1326668400000,3],[1326754800000,3],[1326841200000,4],[1326927600000,8],[1327014000000,0],[1327273200000,6],[1327359600000,3],[1327446000000,6],[1327532400000,4],[1327878000000,1],[1328223600000,1],[1328482800000,1],[1328742000000,1],[1328828400000,1],[1329001200000,0],[1329087600000,1],[1329174000000,9],[1329260400000,3],[1329346800000,0],[1329433200000,1],[1329606000000,0],[1329692400000,2],[1329778800000,5],[1329865200000,1],[1330297200000,3],[1330470000000,1],[1330556400000,0],[1330988400000,1],[1331074800000,7],[1331161200000,7],[1331247600000,5],[1331593200000,1],[1331852400000,3],[1332111600000,2],[1332198000000,1],[1332284400000,3],[1332712800000,2],[1332799200000,1],[1333058400000,2],[1333317600000,0],[1333576800000,10],[1333922400000,1],[1334008800000,2],[1334440800000,2],[1334527200000,0],[1335132000000,2],[1335477600000,2],[1335564000000,0],[1335650400000,1],[1335909600000,1],[1336428000000,3],[1336687200000,1],[1337724000000,1],[1338242400000,1],[1338328800000,1],[1338415200000,1],[1338501600000,1],[1338933600000,1],[1339020000000,3],[1339365600000,7],[1339538400000,0],[1340056800000,2],[1341525600000,0],[1341612000000,1],[1341698400000,0],[1341871200000,3],[1341957600000,2],[1342044000000,3],[1342130400000,10],[1342476000000,0],[1342562400000,6],[1342648800000,2],[1342735200000,3],[1342994400000,0],[1343167200000,0],[1343599200000,4],[1343858400000,8],[1343944800000,3],[1344204000000,1],[1344290400000,4],[1344376800000,1],[1344463200000,4],[1344549600000,1],[1344895200000,1]];
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

	    series: [{
	        type: 'column',
	        name: 'tinyarm activity',
	        data: data,
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
				x : Date.UTC(2012, 3, 30),
				title : 'MATEL',
				text : 'MATEL deadline'
			}, {
				x : Date.UTC(2011, 10, 2),
				title : 'LAK12',
				text : 'LAK12 dealine'
			}, {
				x : Date.UTC(2011, 8, 23),
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
			onSeries : 'dataseries',
			shape : 'squarepin',
			width : 45
	    }]
	});
}