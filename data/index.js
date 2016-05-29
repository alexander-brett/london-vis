var fs = require('fs');
var parse = require('csv-parse');
var transform = require('stream-transform');
console.log('start');


function fix(d){
  return typeof(d) === 'string' ? +(d.replace(',','').replace('£','')) : d;
}

  var result = {};

var parser = parse();
var input = fs.createReadStream('../London_postcode-ONS-postcode-Directory-May15.csv');
var header, min, max;
var transformation = transform(function(r, c){
    var d = r;
    var stub = d[32];
    if (!result[stub]){
      result[stub]={count:1, lat:+r[r.length-2], long:+r[r.length-1], stub:stub};
    } else {
      result[stub].lat += (+r[r.length-2]-result[stub].lat)/result[stub].count;
      result[stub].long += (+r[r.length-1]-result[stub].long)/result[stub].count;
      result[stub].count++;
    }

  //console.log(JSON.stringify(result));
})


transformation.on('readable', function(){
  while(row = transformer.read()){
    output.push(row);
  }
});



var stream = input.pipe(parser).pipe(transformation).pipe(process.stdout);

stream.on('error', function(e){
console.log(e);
});

parser.on("finish", function(){
  // var result = {};
  // for (var i in header){
  //   result[header[i]] = {min: min[i], max: max[i]};
  // }
console.log('hi!');
  console.log(result);
});

console.log('done');
