var config = require('./config.js')

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || config.IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || process.argv[2] || config.port || 8080;


var express = require('express')
var path = require('path');
var compress = require('compression');
var server = express();
server.set('port', port);
server.set('ip', ipaddress);
var http = require('http').Server(server);
var request = require("request")
var diplomat = require('./diplomat.js')
//var io = require('socket.io')(http);
//var csvParse = require('csvParser')

server.use(express.static('static'));
server.use(express.static('pages'));
server.use(compress());
server.disable('x-powered-by');
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next(); 
});

server.get('/api/graph/', function(req, res){
	//res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'})
	res.sendFile(path.join(__dirname, 'graph.json'), {'headers': {'Content-Type': 'application/json; charset=utf-8'} })
});

server.get('/api/weather/', function(req, res){
	//req.query = {'ID': 'IENGLAND1383', 'day': 20, 'month': 7, 'year': 2016, 'graphspan': day}
	var url = 'https://www.wunderground.com/weatherstation/WXDailyHistory.asp?ID={ID}&day={day}&month={month}&year={year}&graphspan={graphspan}&format=1'
	res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})

	for (var key in req.query)
		url = url.replace('\{'+key+'\}',req.query[key]);
	
	request({url: url, headers: {'Cookie': 'Units=metric'}}, function(err, response, body) {
		if (err)
			return res.end("Data fetch error: " + err.toString())

		res.write(body)
		return res.end()
	})
});

server.get('/api/json/', function(req, res){ //This is actually deprecated
	//req.query = {'ID': 'STATID', 'day': 20, 'month': 7, 'year': 2016, 'graphspan': day}
	
	res.writeHead(200, {'Content-Type': 'application/json'})

	if (!(req.query['buildingID'] && req.query['sensorID'] && req.query['date']))
		return res.end("{}")

	return diplomat.json({type:req.query['type'], building: req.query['buildingID'], sensor: req.query['sensorID'], date: req.query['date']},
		function(data) {
			res.write(data)
			return res.end()
		})
	
});

server.get('/api/csv/', function(req, res){
	//req.query = {'ID': 'STATID', 'day': 20, 'month': 7, 'year': 2016, 'graphspan': day}
	
	res.writeHead(200, {'Content-Type': 'text/csv'})

	if (!(req.query['buildingID'] && req.query['sensorID'] && req.query['type'] && req.query['date']))
		return res.end("")

	return diplomat.csv({type:req.query['type'], building: req.query['buildingID'], sensor: req.query['sensorID'], dateFrom: req.query['date'], dateTo: req.query['dateTo']},
		function(data) {
			
			res.write(data)
			return res.end()
		})
	
});

server.get('/api/data/', function(req, res) {
	if (!(req.query['buildingID'] && req.query['type'] && req.query['date'] && req.query['dateTo']))
		return res.end("")

	res.writeHead(200, {'Content-Type': 'text/csv'})

	return diplomat.data({type: req.query['type'], building: req.query['buildingID'], dateFrom: req.query['date'], dateTo: req.query['dateTo']},
		function(file) {
			res.write(file);
			return res.end();
		})
});


/********** WEB SOCKET - SOCKET.IO *******
// Add "socket.io": "~1.4.5" to package.json
// and uncomment require line above
//****************************************
io.on('connection', function(socket){
  socket.on('chatMsg', function(msg){
    io.emit('chatMsg', msg);
  });

  socket.on('cmdMsg', function(msg){
    socket.broadcast.emit('cmdMsg', msg);
  });
});
******************************************/

http.listen(port, ipaddress, function(){
  console.log('listening on *:' + port);
}); 