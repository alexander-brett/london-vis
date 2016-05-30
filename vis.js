var scale = 4;

var width = 180 * scale;
var height = 160 * scale;

function position(alpha){
  return function(datum){
    var desired = datum.desiredLocation;
    var x = desired[0] - datum.x;
    var y = desired[1] - datum.y;
    var force = 0.008*datum.radius*Math.sqrt(x*x + y*y);
    datum.x += alpha*x*force;
    datum.y += alpha*y*force;
  }
}

function fix(d){
  return typeof(d) === 'string'
    ? d == 'n/a'
      ? 0
      : +(d.replace(new RegExp(',', 'g'),'').replace('£',''))
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
  }
  return data;
}


function radiusFromProperty(caption, property, maxSize, radiusScale) {
    
  var obj = function(d){
    d.radius = radiusScale(fix(d[property]));
    return d.radius;
  }
  obj.caption = function(d){
    return caption + ": " + d[property];
  };
  obj.key = [{
    radius: radiusScale(fix(dataBounds[property][0])),
    caption: dataBounds[property][0] + ' ' +caption
  }, {
    radius: radiusScale(fix(dataBounds[property][1])),
    caption: dataBounds[property][1] + ' ' +caption
  }];
  return obj;
}

function radiusFromPropertyLinear(caption, property, maxSize) {
 return radiusFromProperty(caption, property, maxSize, d3.scale.linear().domain([0,dataBounds[property][1]])
    .range([0,maxSize*scale]));
}


function radiusFromPropertySqrt(caption, property, maxSize) {
 return radiusFromProperty(caption, property, maxSize, d3.scale.sqrt().domain([0,dataBounds[property][1]])
    .range([0,maxSize*scale]));
}

var radiusMap = {
    "Population - 2015": radiusFromPropertyLinear('Population', 'Population', 3.2),
    "Number of jobs in area - 2013": radiusFromPropertySqrt('Jobs', 'Jobs', 7),
    "In employment (16-64) - 2011": radiusFromPropertyLinear('Employed', 'Employed', 3.2),
    "Median House Price (£) - 2014": radiusFromPropertySqrt('Median house price', 'Median_house_price', 3.5),
    "Area - Square Kilometres": radiusFromPropertySqrt('Sq km', 'Area', 6.2),
  };

sizeInputs = d3.select('#sizeInput').selectAll("input").data(Object.keys(radiusMap)).enter().append('div');
sizeInputs.append('input')
  .attr('type', 'radio')
  .attr('checked', function(d, i){ return i== 0? "checked" : ""})
  .attr('name', 'sizeOption')
  .attr('value', function(d){return d});
sizeInputs.append('span').html(function(d){return d});


function makeRadius(){
  return radiusMap[d3.select('input[name=sizeOption]:checked').node().value]
}

function colourFromBorough() {
  var palette = d3.scale.category20b();

  function makeColourFromBorough (d){
    return palette(boroughs.indexOf(d.borough)%20)
  }
  makeColourFromBorough.caption = function(d){
    return "Borough: " + d.borough
  };
  makeColourFromBorough.key = [];
  return makeColourFromBorough;
}

function colourFromGenericPercent(caption, index){
  var percentToByteScale = d3.scale.linear().range([0,255])
    .domain(dataBounds[index]);
  function c(a){
    var n = Math.round(percentToByteScale(a));
    return d3.rgb(255-n,n,255-n);
  }
  function makeColour(d){
    return c(d[index]);
  }
  makeColour.caption = function(d){
    return caption + ": " + d[index] + '%';
  }
  makeColour.key = [{
    colour: c(dataBounds[index][1]),
    caption: dataBounds[index][1]+"% " + caption
  }, {
    colour: c(dataBounds[index][0]),
    caption: dataBounds[index][0]+"% " + caption
  }];
  return makeColour;
}

var colourMap = {
    "% Households Social Rented - 2011": colourFromGenericPercent('Social housing', 'Social_house_percent'),
    "% BAME - 2011": colourFromGenericPercent('BAME Population', 'BAME_percent'),
    "Employment rate (16-64) - 2011": colourFromGenericPercent('Employment rate', 'Employment_rate'),
    "% Flat, maisonette or apartment - 2011": colourFromGenericPercent('Apartments', 'Apartment_percent'),
    'Claimant rate of key out-of-work benefits (working age client group) (2014)': colourFromGenericPercent('OOW Benefits Recipients', 'Out_of_work_benefints_percent'),
    "Turnout at Mayoral election - 2012":colourFromGenericPercent('Turnout', 'Mayoral_turnout'),
    "Borough": colourFromBorough(),
  };

function makeColour(){
  return colourMap[d3.select('input[name=colourOption]:checked').node().value]
}


colourInputs = d3.select('#colourInput').selectAll("input").data(Object.keys(colourMap)).enter().append('div');
colourInputs.append('input')
  .attr('type', 'radio')
  .attr('checked', function(d, i){ return d=="Area" ? "true" : "false"})
  .attr('name', 'colourOption')
  .attr('value', function(d){return d});

colourInputs.append('span').html(function(d){return d});

function drawRadiusKey(base, radiusGenerator)
{
  var radkey = base.selectAll("circle.radius.key").data(radiusGenerator.key);

  radkey.transition().attr("r", function(d){return d.radius})

  radkey.enter()
    .append('circle')
    .attr('cx', 30)
    .attr('cy', function(d,i){return 10+(40*i)})
    .attr("class", "radius key")
    .attr("r", function(d){return d.radius})
    .style("fill", "none")
    .style("stroke", "black");

  var radcaption =  base.selectAll("text.radius.key").data(radiusGenerator.key);

  radcaption.text(function(d){return d.caption});

  radcaption.enter()
    .append('text')
    .attr("alignment-baseline", "middle")
    .attr("class", "radius key")
    .text(function(d){return d.caption})
    .attr("x", 60)
    .attr("y", function(d,i){return 10+(40*i)});

}

function drawColourKey(base, colourGenerator)
{

  var colkey =  base.selectAll("circle.colour.key").data(colourGenerator.key);

  colkey.transition().duration(700).style("fill", function(d){return d.colour});

  colkey.exit().remove();

  colkey.enter()
    .append('circle')
    .attr('cx', width-30)
    .attr('cy', function(d,i){return 30+(40*i)})
    .attr("class", "colour key")
    .style("fill", function(d){return d.colour})
    .attr("r", 10);

  var colcaption = base.selectAll("text.colour.key").data(colourGenerator.key);
  
  colcaption.text(function(d){return d.caption});

  colcaption.exit().remove();

  colcaption.enter()
    .append('text')
    .attr("alignment-baseline", "middle")
    .attr("text-anchor", "end")
    .attr("class", "colour key")
    .text(function(d){return d.caption})
    .attr("x", width - 60)
    .attr("y", function(d,i){return 30+(40*i)});
}

d3.csv('ward_data.txt', function(wardData){
    var data = prepareData(wardData, wardCentres);

    var force = d3.layout.force()
    .gravity(0.0)
    .friction(0.1)
    .charge(function(d){return -1*makeRadius()(d)})
    .nodes(data)
    .size([width, height]);

    force.start();

    var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

    var node = svg.selectAll("circle.datum")
    .data(data);

    var radiusGenerator =  makeRadius();
    var colourGenerator = makeColour();

    drawRadiusKey(svg, radiusGenerator);
    drawColourKey(svg, colourGenerator);

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
            var ratio = (scale+node2.radius) / (scale+node1.radius);
            var force =distance < minDistance ?  0.2*(minDistance - distance) : 0;
            if(force > 0) {
              node1.x = node1.x + ratio*force*x/Math.abs(x);
              node1.y = node1.y + ratio*force*y/Math.abs(y);
              node2.x = node2.x - (1/ratio)*force*x/Math.abs(x);
              node2.y = node2.y - (1/ratio)*force*y/Math.abs(y);
            }
          }
        });
      };
    }

    d3.selectAll('input[name=sizeOption]').on("change", function(){
      var colourGenerator = makeColour();
      var radiusGenerator = makeRadius();

      drawRadiusKey(svg, radiusGenerator);

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

      
      drawColourKey(svg, colourGenerator);

      var node = svg.selectAll("circle.datum")
      .data(data)
      .transition()
      .duration(700)
      .style("fill",  colourGenerator)
      .selectAll("title").text(function(d){return d.Name + '\n' + radiusGenerator.caption(d) + '\n' + colourGenerator.caption(d)});

    });

  })
