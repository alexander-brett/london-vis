d3.select('body').append('span').text('hi!');

var width = 500;
var height = 500;

d3.csv('London_postcode-ONS-postcode-Directory-May15.csv', function(data){

  var nodes = [{}].concat(data.slice(0,20).map(function(d){
    return { radius:20}
  })),   root = nodes[0],
    color = d3.scale.category10();

  root.radius = 0;
  root.fixed = true;

  var force = d3.layout.force()
      .gravity(0.1)
      .charge(function(d, i) { return i ? -10 : -2000; })
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
    var q = d3.geom.quadtree(nodes),
        i = 0,
        n = nodes.length;

        node.each(collide(e.alpha))

    svg.selectAll("circle")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });

  svg.on("mousemove", function() {
    var p1 = d3.mouse(this);
    root.px = p1[0];
    root.py = p1[1];
    force.resume();
  });


  function collide(alpha) {
    return function(node1) {
      svg.selectAll("circle").each(function(node2) {
        if(node1 != node2) {
          var x = node1.x - node2.x;
          var y = node1.y - node2.y;
          var distance = Math.sqrt(x * x + y * y);

          var minDistance = node1.radius + node2.radius + 3;


            var force =distance < minDistance ? 
            0.5*(minDistance - distance) : 
             Math.min(1, 1 / Math.pow(minDistance - distance, 3));
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
