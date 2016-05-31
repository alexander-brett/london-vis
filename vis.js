var scale = 4;
var width = 180 * scale;
var height = 160 * scale;
var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

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

function collide(nodes, alpha) {
  return function(node1) {
    nodes.each(function(node2) {
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

function fix(d){
  return typeof(d) === 'string'
    ? d == 'n/a'
      ? 0
      : +(d.replace(new RegExp(',', 'g'),'').replace('£','').replace('%', ''))
    : d;
}

function makeOptionsRadioButtons(base, map, name, className){
   sizeInputs = base.enter().append('div');
  sizeInputs.append('input')
    .attr('type', 'radio')
    .attr('name', name)
    .attr('value', function(d){return d})
    .filter(function(d, i){ return i==0})
    .attr('checked', "checked");
  sizeInputs.append('span').html(function(d){return d});
  var yearInputs = sizeInputs.filter(function(d){return typeof map[d].years !== 'undefined'})
    .append('fieldset');
  yearInputs.each(function(d,i){
    var newInputs = d3.select(this).selectAll('input').data(map[d].years.reverse()).enter().append('span');
    newInputs.append('input').attr('type', 'radio')
    .attr('name', d+' year').attr('class', className).attr('value', function(y){return y.value})
    .on('change.year', function(y){ y.action();})
    .filter(function(y){
      return y.value == map[d].year
      })
    .attr('checked',true);
    newInputs.append('span').text(function(y){return y.value});
  })
  yearInputs.append('legend').text('Year');
}

function drawRadiusKey(base, radiusGenerator){
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
    .attr("y", function(d,i){return 20+(40*i)});

}

function drawColourKey(base, colourGenerator){
  var colkey =  base.selectAll("circle.colour.key").data(colourGenerator.key);
  colkey.transition().duration(700).style("fill", function(d){return d.colour});
  colkey.exit().remove();
  colkey.enter()
    .append('circle')
    .attr('cx', width-30)
    .attr('cy', function(d,i){return 20+(40*i)})
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

function doRadii(generator, nodes){
  nodes.attr('r', function(d,i){
    d.radius = generator.radius(i);
    d.radiusCaption = generator.caption(i);
    return d.radius;
  })
}

function doColours(generator, nodes){
  nodes.style('fill', function(d,i){
    d.colour = generator.colour(i);
    d.colourCaption = generator.caption(i);
    return d.colour;
  })
}

function doCaption(nodes){
  nodes.selectAll('title').text(function(d){
    return d.name +"\n" + d.radiusCaption + "\n" + d.colourCaption;
  })
}

function startForce(data, db){

    var force = d3.layout.force()
    .gravity(0.0)
    .friction(0.1)
    .charge(function(d){return -1*d.radius})
    .nodes(data)
    .size([width, height]);

    var nodes = svg.selectAll("circle.datum").data(data).enter().append("circle")
    .attr("class", "datum");
    
    nodes.append("title").text(function(d){
      return d.name
      });

    var options = makeOptions(db);

    function updateRadii(circles){
      var radiusGenerator = options.makeRadius(db);
      doRadii(radiusGenerator, circles);
      drawRadiusKey(svg, radiusGenerator);
      doCaption(circles);
      force.start();
    };

    function updateColours(circles){
      var colourGenerator = options.makeColour(db);
      doColours(colourGenerator, circles);
      drawColourKey(svg, colourGenerator);
      doCaption(circles);
    };

    updateRadii(nodes);
    updateColours(nodes);

    force.on("tick", function(e) {
      nodes.each(position(e.alpha));
      nodes.each(collide(nodes, e.alpha));
      nodes
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    });
   
    d3.selectAll('input[name=sizeOption],input.radius.year')
      .on("change.main", function(){updateRadii(nodes.transition().duration(700))});

    d3.selectAll('input[name=colourOption],input.colour.year')
      .on("change.main",  function(){updateColours(nodes.transition().duration(700))});
}

var xhr = new XMLHttpRequest();
xhr.open('GET', 'sqlite/data.db', true);
xhr.responseType = 'arraybuffer';
xhr.onload = function(e) {
  var uInt8Array = new Uint8Array(this.response);
  var db = new SQL.Database(uInt8Array);
  var statement = db.prepare(
    "SELECT * from boroughs JOIN locations ON boroughs.id = locations.id ORDER BY boroughs.id ASC"
  );
  var projection = d3.geo.mercator()
    .scale(scale*12000)
    .center([-0.1, 51.5085300])
    .translate([width/2, height/2]);
  var data = [];
  while(statement.step()){
    var result = statement.getAsObject();
    result.desiredLocation = projection([result.long, result.lat]);
    result.x = result.desiredLocation[0];
    result.y = result.desiredLocation[1];
    data.push(result);
   }
  startForce(data, db);
};
xhr.send();