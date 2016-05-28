d3.select('body').append('span').text('hi!');

var width = 800;
var height = 500;

function group(data){
  var indices = {};
  var result = [];
  for (var i in data){
    var d = data[i];
    var stub = d.pcd2.split(' ')[0];
    var i = indices[stub];
    if (i === undefined){
      indices[stub] = result.length;
      result.push({count:1, lat:+d.lat, long:+d.long, stub:stub});
    } else {
      result[i].lat += (d.lat-result[i].lat)/result[i].count;
      result[i].long += (d.long-result[i].long)/result[i].count;
      result[i].count++;
    }
  }

  return result;
}

function position(alpha){
  return function(datum){
    var projection = d3.geo.equirectangular().scale(35000).center([0, 51.5085300]).translate([width/2, height/2]);
    var desired = projection([datum.long, datum.lat]);
    var x = desired[0] - datum.x;
    var y = desired[1] - datum.y;
    var force = 0.01*Math.sqrt(x*x + y*y);
    datum.x += alpha*x*force;
    datum.y += alpha*y*force;
  }
}

d3.csv('London_postcode-ONS-postcode-Directory-May15.csv', function(data){

  var nodes = group(data).map(function(d){
    d.radius = Math.pow(d.count, 0.25);
    return d;
  }),
    color = d3.scale.category10();


  var force = d3.layout.force()
      .gravity(0.0)
      .charge(function(d, i) { -1*d.radius; })
      .nodes(nodes)
      .size([width, height]);

  force.start();

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  var node = svg.selectAll("circle")
      .data(nodes.slice(1));

    node.enter().append("circle")
      .attr("r", function(d) { return d.radius; })
      .style("fill", function(d, i) { return color(i % 3); });

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
            0// Math.min(1, 1 / Math.pow(minDistance - distance, 3));
               if(force > 0.1) {
            node1.x = node1.x + force*x/Math.abs(x);
            node1.y = node1.y + force*y/Math.abs(y);
            node2.x = node2.x - force*x/Math.abs(x);
            node2.y = node2.y - force*y/Math.abs(y);
          }
        }
      });
    };
  }


  //console.log(data);
})
