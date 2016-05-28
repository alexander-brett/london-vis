d3.select('body').append('span').text('hi!');

d3.csv('London_postcode-ONS-postcode-Directory-May15.csv', function(data){
  console.log(data);
})
