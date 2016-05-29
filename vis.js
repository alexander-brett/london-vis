var width = 1200;
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
    var force = 0.005*Math.sqrt(x*x + y*y);
    datum.x += alpha*x*force;
    datum.y += alpha*y*force;
  }
}

function fix(d){
  return typeof(d) === 'string' ? +(d.replace(',','').replace('£','')) : d;
}


  var boroughs = [];

function prepareData(data, locationData){
  var wardlocations = group(locationData);

  var min = 100;
  var max = 0;

  var projection = d3.geo.mercator().scale(70000).center([0, 51.5085300]).translate([width/2, height/2]);



  for (var i in data){
    var code = data[i].Old_Code;
    data[i].lat = wardlocations[code].lat;
    data[i].long = wardlocations[code].long;
    data[i].desiredLocation = projection([data[i].long, data[i].lat]);
    data[i].radius =
    data[i].x = data[i].desiredLocation[0];
    data[i].y = data[i].desiredLocation[1];
    data[i].borough = data[i].Name.split('-')[0];
    if (boroughs.indexOf(data[i].borough) < 0) boroughs.push(data[i].borough);
  };

  return data;
}

function makeRadiusFromPopulation (d) {
  var radiusScale = d3.scale.linear()
  .domain([
    0,
    dataBounds.Population.max])
    .range([0,20]);

    d.radius = radiusScale(fix(d.Population));
    return d.radius;
  }

  function makeRadiusFromArea (d) {
    var radiusScale = d3.scale.linear()
    .domain([
      0,
      Math.sqrt(dataBounds.Area.max)])
      .range([3,20]);

      d.radius = radiusScale(Math.sqrt(fix(d.Area)));
      return d.radius;
  }


    var palette = d3.scale.category20();

  function makeColourFromBorough (d){
    var percentToByteScale = d3.scale.linear().range([0,255])
      .domain([dataBounds.Social_house_percent.min,dataBounds.Social_house_percent.max]);
    var n = Math.round(percentToByteScale(d.Social_house_percent));
    return palette(boroughs.indexOf(d.borough)%20)//d3.rgb(0,n,n);
  }

  function makeRadius(){
    if (d3.select('input[name=sizeOption]:checked').node().value == "Area"){
      return makeRadiusFromArea
    }
    return makeRadiusFromPopulation;
  }


  d3.csv('ward_data.txt', function(wardData){

    d3.csv('London_postcode-ONS-postcode-Directory-May15.csv', function(locationData){
      var data = prepareData(wardData, locationData);

      var force = d3.layout.force()
        .gravity(0.0)
        .friction(0.1)
        .charge(function(d){return -0*makeRadius()(d)})
        .nodes(data)
        .size([width, height]);

      force.start();

      var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

      var node = svg.selectAll("circle")
        .data(data);

      node.enter().append("circle")
        .attr("r", makeRadius())
        .style("fill",  makeColourFromBorough)
        .append("title").text(function(d){return d.Name});

      force.on("tick", function(e) {
        node.each(position(e.alpha));
        node.each(collide(e.alpha));

        node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });

      function collide(alpha) {
        return function(node1) {
          node.each(function(node2) {
            if(node1 != node2) {
              var x = node1.x - node2.x;
              var y = node1.y - node2.y;
              var distance = Math.sqrt(x * x + y * y);
              var minDistance = node1.radius + node2.radius + 4;
              var force =distance < minDistance ?  0.2*(minDistance - distance) : 0;
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


        d3.selectAll('input[name=sizeOption]').on("change", function(){
          var node = svg.selectAll("circle")
            .data(data)
            .transition()
            .duration(1000)
            .attr("r", makeRadius())
            .style("fill",  makeColourFromBorough);
          force.resume();
        });
      
    })
  })
