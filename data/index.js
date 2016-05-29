var d3 = require('d3');
var fs = require('fs');

d3.csv('ward_data.csv', function(data){
  fs.writefile('output', {foo: 'bar'}.toString());
})
