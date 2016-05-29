d3.select('body').append('span').text('hi!');

var width = 1000;
var height = 1000;

function group(data){
  var result = {};
  for (var i in data){
    var d = data[i];
    var stub = d.statsward;
    if (!result[stub]){
      result[stub]={count:1, lat:+d.lat, long:+d.long, stub:stub};
    } else {
      result[stub].lat += (d.lat-result[stub].lat)/result[stub].count;
      result[stub].long += (d.long-result[stub].long)/result[stub].count;
      result[stub].count++;
    }
  }
  return result;
}


function position(alpha){
  return function(datum){
    var desired = datum.desiredLocation;
    var x = desired[0] - datum.x;
    var y = desired[1] - datum.y;
    var force = 0.01*Math.sqrt(x*x + y*y);
    datum.x += alpha*x*force;
    datum.y += alpha*y*force;
  }
}

d3.csv('ward_data.txt', function(data){

  d3.csv('London_postcode-ONS-postcode-Directory-May15.csv', function(locationData){

    var wardlocations = group(locationData);

    var percentToRadiusScale = d3.scale.pow().exponent(0.2);
  
    var min = 100;
    var max = 0;

    var projection = d3.geo.mercator().scale(35000).center([0, 51.5085300]).translate([width/2, height/2]);


    for (var i in data){
      code = data[i].Old_Code;
      data[i].lat = wardlocations[code].lat;
      data[i].long = wardlocations[code].long;
      data[i].desiredLocation = projection([data[i].long, data[i].lat]);
      data[i].radius = Math.sqrt(+data[i].Area)*4;
      data[i].x = data[i].desiredLocation[0];
      data[i].y = data[i].desiredLocation[1];
      min = Math.min(min, data[i].Social_house_percent);
      max = Math.max(max, data[i].Social_house_percent);
    };
      var percentToByteScale = d3.scale.linear().range([0,255]).domain([min,max]);


    var force = d3.layout.force()
        .gravity(0.0)
        .friction(0.1)
        .charge(0)
        .nodes(data)
        .size([width, height]);

    force.start();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var node = svg.selectAll("circle")
        .data(data);

      node.enter().append("circle")
        .attr("r", function(d) {
           return d.radius;
            })
        .style("fill", function(d, i) {
           var n = Math.round(percentToByteScale(d.Social_house_percent));
            return d3.rgb(0,n,n);
             });

    force.on("tick", function(e) {
          node.each(position(e.alpha));
          node.each(collide(e.alpha));


      svg.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

    function collide(alpha) {
      return function(node1) {
        svg.selectAll("circle").each(function(node2) {
          if(node1 != node2) {
            var x = node1.x - node2.x;
            var y = node1.y - node2.y;
            var distance = Math.sqrt(x * x + y * y);

            var minDistance = node1.radius + node2.radius + 2;


            var force =distance < minDistance ?
              0.5*(minDistance - distance) :
              Math.min(1, 10 / Math.pow(minDistance - distance, 3));
            if(force > 0.1) {
              node1.x = node1.x + force*x/Math.abs(x);
              node1.y = node1.y + force*y/Math.abs(y);
              node2.x = node2.x - force*x/Math.abs(x);
              node2.y = node2.y - force*y/Math.abs(y);
              //node1.px = node1.px + force*x/Math.abs(x);
              //node1.py = node1.py + force*y/Math.abs(y);
              //node2.px = node2.px - force*x/Math.abs(x);
              //node2.py = node2.py - force*y/Math.abs(y);
            }
          }
        });
      };
    }


    //console.log(data);
  })
})