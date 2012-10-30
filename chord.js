var questionIndex = window.location.href.indexOf('?');
var querystring = window.location.href.substring(questionIndex);
var arrayParams = querystring.split("&");
var groupArray = arrayParams[0].split("=");
var group = groupArray[1];

d3.json("data/"+group+".json", function(users){
  d3.json("chord?group="+group, function(chordData){
    //Users
    var colors = ['#d81820','#369546', '#3278a9','#e9b926', '#6e5e3c', '#c8148e', '#6c6e70', '#231f20'];
    
    d3.select("#users_div").selectAll("span").data(users).enter().append("span")
      .attr("class", "userInfo")
      .style("background-color", function(d, i){return colors[i]})
      .on("mouseover", fade(.1, true))
      .on("mouseout", fade(1, true))
      .append("div").append("img")
        .attr("width", 100)
        .attr("height", 100)
        .attr("src",function(d){return d.googlePlusImage});

    //Chord
    var matrix = [];
    var suggested = chordData.suggested;
    var accepted = chordData.accepted;

    for(var i=0; i<users.length;i++){
      matrix[2*i] = [];
      matrix[2*i+1] = [];
      for(var j=0; j<users.length;j++){
        matrix[2*i].push(0);
        if(suggested[i][j] == accepted[i][j]) suggested[i][j]+=0.001;
        matrix[2*i].push(suggested[i][j]);
        matrix[2*i+1].push(accepted[i][j]);
        matrix[2*i+1].push(0);
      }
    }

    for(var i=0; i<2*users; i++){
      console.log(JSON.stringify(matrix));
    }

    var chord = d3.layout.chord()
        .padding(.025)
        .sortSubgroups(d3.descending)
        .matrix(matrix);

    //console.log(JSON.stringify(chord.chords()));

    //console.log(chord.groups());
    var width = 600,
        height = 600,
        innerRadius = Math.min(width, height) * .41,
        outerRadius = innerRadius * 1.1;

    var fill = d3.scale.ordinal()
        .domain(d3.range(16))
        .range(['#d81820','#d81820','#369546','#369546', '#3278a9','#3278a9','#e9b926','#e9b926', '#6e5e3c', '#6e5e3c', '#c8148e', '#c8148e', '#6c6e70', '#6c6e70', '#231f20', '#231f20']);
        //.range(['#d81820','#369546', '#3278a9','#e9b926', '#6e5e3c', '#c8148e', '#6c6e70', '#231f20']);

    var svg = d3.select("#chart")
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.append("g")
      .selectAll("path")
        .data(chord.groups)
      .enter().append("path")
        .style("fill", function(d) { return fill(d.index); })
        .style("stroke", function(d) { return fill(d.index); })
        .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on("mouseover", fade(.1))
        .on("mouseout", fade(1));

    var ticks = svg.append("g")
      .selectAll("g")
        .data(chord.groups)
      .enter().append("g")
      .selectAll("g")
        .data(groupTicks)
      .enter().append("g")
        .attr("transform", function(d) {
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
              + "translate(" + outerRadius + ",0)";
        });

    ticks.append("line")
        .attr("x1", 1)
        .attr("y1", 0)
        .attr("x2", 5)
        .attr("y2", 0)
        .style("stroke", "#000");

    ticks.append("text")
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) {
          return d.angle > Math.PI ? "end" : null;
        })
        .attr("transform", function(d) {
          return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
        })
        .text(function(d) { return d.label; });

    svg.append("g")
        .attr("class", "chord")
      .selectAll("path")
        .data(chord.chords)
      .enter().append("path")
        .style("fill", function(d) { return fill(d.source.index); })
        .attr("d", d3.svg.chord().radius(innerRadius))
        .style("opacity", 1);



    /** Returns an array of tick angles and labels, given a group. */
    function groupTicks(d) {
      var k = (d.endAngle - d.startAngle) / d.value;
      return d3.range(0, d.value, 1).map(function(v, i) {
        return {
          angle: v * k + d.startAngle,
          label: i % 5 ? null : v
        };
      });
    }

    /** Returns an event handler for fading a given chord group. */
    function fade(opacity, img) {
      return function(g, i) {
        svg.selectAll("g.chord path")
            .filter(function(d) {
              var filt_index = i%2==1?1:-1;
              var filt = (d.source.index != i && d.target.index != i) && (d.source.index+filt_index != i && d.target.index+filt_index != i);
              if(img) filt = (d.source.index != 2*i && d.target.index != 2*i) && (d.source.index != 2*i+1 && d.target.index != 2*i+1);
              return filt;
            })
          .transition()
            .style("opacity", opacity);
        d3.select("#users_div").selectAll("span")
            .filter(function(d, index) {
              var filt = index != i;
              if(!img) filt = (2*index != i && 2*index+1 != i);
              return filt;
            })
            .transition()
            .style("opacity", opacity);
      };
    }

  });
});

// From http://mkweb.bcgsc.ca/circos/guide/tables/
var users = 4;
var matrix = [
[0,0,0,6,0,5,0,5],
[0,0,6,0,2,0,1,0],
[0,7,0,0,0,5,0,8],
[6,0,0,0,3,0,2,0],
[0,7,0,8,0,0,0,9],
[5,0,1,0,0,0,2,0],
[0,7,0,8,0,9,0,0],
[5,0,1,0,4,0,0,0] 
            ];


// var matrix = [];
// for(var i=0; i<users; i++){
//   var accepted= [];
//   for(var j=0; j<users; j++){
//     var value = Math.floor(10*Math.random());
//     accepted[j] = (i==j)?0:value;
//   }
//   matrix[i] = getZeroArray(users).concat(accepted);
// }

// for(var i=0; i<users; i++){
//   var suggestions = [];
//   for(var j=0; j<users; j++){
//     var value = Math.floor(10*Math.random());
//     suggestions[j] = (i==j)?0:value;
//   }
//   matrix[i+users] = suggestions.concat(getZeroArray(users));
// }

// function getZeroArray(length){
//   var zeros = [];
//   for(var i=0;i<length;i++){
//     zeros.push(0)
//   }
//   return zeros;
// }

/*
var matrix = [];
for(var i=0; i<2*users; i++){
  matrix[i] = [];
  for(var j=0; j<2*users; j++){
    var value = Math.floor(10*Math.random());
    if(i%2==0){
      if(j%2==0){
        matrix[i][j]=0;
      }else{
        if(i-j==-1){
          matrix[i][j]=0;
        }else{
          matrix[i][j]=value;
        }
      }
    }else{
      if(j%2==0){
        if(i-j==1){
          matrix[i][j]=0;
        }else{
          matrix[i][j]=value;
        }
      }else{
        matrix[i][j]=0;
      }
    }
  }
}

for(var i=0; i<2*users; i++){
  console.log(JSON.stringify(matrix));
}

for(var i=0; i<2*users; i++){
  console.log(JSON.stringify(matrix[i]));
}
*/


