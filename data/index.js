var fs = require('fs');
var parse = require('csv-parse');
var transform = require('stream-transform');
console.log('start');

function fix(d){
  return typeof(d) === 'string'
    ? d == 'n/a'
      ? 0
      : +(d.trim().replace(new RegExp(',', 'g'),'').replace('£',''))
    : d;
}

var parser = parse();
var input = fs.createReadStream('../ward_data.txt');
var header, min, max;
var transformation = transform(function(r, c){
  if (!header) {
    header = r;
  } else if (!min){
    min = r.map(fix);
    max = r.map(fix);
  } else {
    for (var i in r){
      min[i] = Math.min(min[i], fix(r[i]));
      max[i] = Math.max(max[i], fix(r[i]));
    }
  }
  console.log('transform')
  return true;
})


transformation.on('readable', function(){
  while(row = transformer.read()){
    output.push(row);
  }
});


input.on('end', function(d){
  var result = {};
  for (var i in header){
    result[header[i]] = {min: min[i], max: max[i]};
  }

  var output = fs.writeFile('dataBounds.json', "dataBounds = " + JSON.stringify(result));
  console.log(result);
})

input.pipe(parser).pipe(transformation).pipe(process.stdout);

console.log('done');
