var scale = 4;

var width = 180 * scale;
var height = 160 * scale;

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

function fix(d){
  return typeof(d) === 'string'
    ? d == 'n/a'
      ? 0
      : +(d.replace(',','').replace('£',''))
    : d;
}

var boroughs = [];

function prepareData(data, wardlocations){

  var projection = d3.geo.mercator().scale(scale*12000).center([-0.1, 51.5085300]).translate([width/2, height/2]);

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

function radiusFromPopulation () {
  var radiusScale = d3.scale.linear()
  .domain([
    0,
    dataBounds.Population.max])
  .range([0,4*scale]);

  var obj = function(d){
    d.radius = radiusScale(fix(d.Population));
    return d.radius;}
  obj.caption = function(d){
    return "Population: " + d.Population;
  }
  return obj;
}

function radiusFromArea(){
  var radiusScale = d3.scale.linear()
    .domain([0,Math.sqrt(dataBounds.Area.max)])
    .range([2,6*scale]);
  var obj = function(d){
    d.radius = radiusScale(Math.sqrt(fix(d.Area)));
    return d.radius;
  };
  obj.caption = function(d){
    return "Area: "+d.Area+"sq. km";
  };
  obj.min = {
    radius: radiusScale(1),
    caption: "1 sq.km"
  };
  obj.max = {
    radius: radiusScale(Math.sqrt(dataBounds.Area.max)),
    caption: dataBounds.Area.max + "sq.km"
  };
  return obj;
}

function radiusFromJobs () {
  var radiusScale = d3.scale.linear()
    .domain([0, Math.sqrt(dataBounds.Jobs.max)])
    .range([3,6*scale]);
  var obj = function(d){
    d.radius = radiusScale(Math.sqrt(fix(d.Jobs)));
    return d.radius;
  }
  obj.caption = function(d){
    return "Jobs: " + d.Jobs;
  }
  return obj;
}

function makeRadius(){
  return {
    "Area": radiusFromArea(),
    "Population": radiusFromPopulation(),
    "Jobs": radiusFromJobs()
  }[d3.select('input[name=sizeOption]:checked').node().value]
}

function colourFromBorough() {
  var palette = d3.scale.category20b();

  function makeColourFromBorough (d){
    return palette(boroughs.indexOf(d.borough)%20)
  }
  makeColourFromBorough.caption = function(d){
    return "Borough: " + d.borough
  }
  return makeColourFromBorough;
}

function colourFromSocialHousingPercent() {
  var percentToByteScale = d3.scale.linear().range([0,255])
    .domain([dataBounds.Social_house_percent.min,dataBounds.Social_house_percent.max]);
  function makeColourFromSocialHousingPercent(d){
    var n = Math.round(percentToByteScale(d.Social_house_percent));
    return d3.rgb(0,n,n);
  }
  makeColourFromSocialHousingPercent.caption = function(d){
    return "Social housing: " + d.Social_house_percent + "%";
  }
  return makeColourFromSocialHousingPercent;
}

function colourFromBAMEPercent(){
  function makeColourFromBAMEPercent(d){
    var percentToByteScale = d3.scale.linear().range([0,255])
    .domain([dataBounds.BAME_percent.min,dataBounds.BAME_percent.max]);
    var n = Math.round(percentToByteScale(d.BAME_percent));
    return d3.rgb(255-n,n,255-n);
  }
  makeColourFromBAMEPercent.caption = function(d){
    return "BAME population: " + d.BAME_percent + '%';
  }
  return makeColourFromBAMEPercent;
}

function makeColour(){
  return {
    "Borough": colourFromBorough(),
    "SocialHousingPercent": colourFromSocialHousingPercent(),
    "BAME_percent": colourFromBAMEPercent(),
  }[d3.select('input[name=colourOption]:checked').node().value]
}

function drawKey(key, radiusGenerator, colourGenerator)
{
      var radkey = key.selectAll("circle.radius.key").data([radiusGenerator.max, radiusGenerator.min]);

    radkey.enter()
      .append('circle')
      .attr('cx', 30)
      .attr('cy', function(d,i){return 30+(40*i)})
      .attr("class", "radius key")
      .attr("r", function(d){
        return d.radius
        });
    
    radkey.enter()
      .append('text')
      .text(function(d){return d.caption})
      .attr("x", 60)
      .attr("y", function(d,i){return 30+(40*i)});

      var colkey =  key.selectAll("circle.colour.key").data([colourGenerator.max, colourGenerator.min]);

    radkey.enter()
      .append('circle')
      .attr('cx', 30)
      .attr('cy', function(d,i){return 100+(40*i)})
      .attr("class", "radius key")
      .style("fill", function(d){
        return d.colour
        })
      .attr("r", 10);
    
    radkey.enter()
      .append('text')
      .text(function(d){return d.caption})
      .attr("x", 60)
      .attr("y", function(d,i){return 100+(40*i)});
}

d3.csv('ward_data.txt', function(wardData){
    var data = prepareData(wardData, wardCentres);

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

    var key = svg.append("g")
      .attr("x", 0)
      .attr("y", 0);

    key.append('rect')
      .attr("width", 200)
      .attr("height", 150)
      .style("stroke", "black")
      .style("fill", "none");

    var node = svg.selectAll("circle.datum")
    .data(data);

    var radiusGenerator =  makeRadius();
    var colourGenerator = makeColour();

    drawKey(key, radiusGenerator, colourGenerator);

    node.enter().append("circle")
    .attr("class", "datum")
    .attr("r",radiusGenerator)
    .style("fill",  colourGenerator)
    .append("title").text(function(d){return d.Name + '\n' + radiusGenerator.caption(d) + '\n' + colourGenerator.caption(d)});

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
            var minDistance = node1.radius + node2.radius + scale;
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
      var colourGenerator = makeColour();
      var radiusGenerator = makeRadius();
      var node = svg.selectAll("circle.datum")
        .data(data)
        .transition()
        .duration(700)
        .attr("r", radiusGenerator)
        .selectAll("title")
        .text(function(d){return d.Name + '\n' + radiusGenerator.caption(d) + '\n' + colourGenerator.caption(d)});
      force.resume();
    });

    d3.selectAll('input[name=colourOption]').on("change", function(){
      var colourGenerator = makeColour();
      var radiusGenerator = makeRadius();
      var node = svg.selectAll("circle.datum")
      .data(data)
      .transition()
      .duration(700)
      .style("fill",  colourGenerator)
      .selectAll("title").text(function(d){return d.Name + '\n' + radiusGenerator.caption(d) + '\n' + colourGenerator.caption(d)});
    });

  })
