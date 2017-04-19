var request = require('request').defaults({baseUrl:"https://beta.heatingsave.com/api/", jar:true})
var cheerio = require('cheerio')
var semaphore = require('semaphore')(1)
var config = require('./config.js')

function newSession(callback) {
	var dic = {'login[type]':'read', 'login[username]':config.username, 'login[password]': config.password}
	request.post({url: "index.php?login", form:dic}, function(err, res, body) {
		if (err)
			return err
		//console.log(res)
		console.log('[+] Logged In')
		//console.log(body)

		return doInit(callback)
	})
}

function doInit(callback) {
	var dic = {'init[type]':'read'}
	request.post({url: "index.php?init", form:dic}, function(err, res, body) {
		if (err)
			return err

		if ((body.indexOf("init")!=-1) && (body.indexOf("error")==-1)) { //extra strictness to prevent infinite recursion
			console.log('[+] Init Complete')
			return callback() 
		}
		else {
			console.log('[+] Init failed, starting new session')
			return newSession(callback); //possible infinite recursion
		}
		
})}

function getReadings(obj, callback) {
	//var query = {'graph[type]':'read','graph[boilers][]':'431','graph[get][type]':'sensor','graph[get][building_id]':'431','graph[get][id]':'11','graph[get][date]':'2016-10-13'}
	var query = {'graph[type]':'read','graph[boilers][]':'431','graph[get][type]':obj['type'],'graph[get][building_id]':obj['building'],'graph[get][id]':obj['sensor'],'graph[get][date]':obj['date']}
	request({url: "index.php", qs:query}, function(err, res, body) {
		if (err)
			return err

		console.log('[+] Data Downloaded')

		return callback(body)
})}


function dataHandler(data, callback) {
	//console.log('Now What?')
	console.log(data)
	try {
		var data = JSON.parse(data)
		var time = data['graph']['result']['time']
		var values = data['graph']['result']['value']
	} catch (err) {console.log("[-] Err: " + err.toString()); var data = {}}
	
	

	if (typeof time==="undefined")
		return callback("{}")
	var series = time.map(function(row, index) {return [row, values[index]]; })

	return callback(JSON.stringify(series))
}

function getCSV(obj, callback) {
	(typeof obj['dateTo']===undefined) ? obj['dateTo'] : obj['dateFrom']

	var query = {mainExport:{'request':'', data: {devices:[{}], details: {date:{}}}}}
	query['mainExport']['type']='read'
	query['mainExport']['request']='downloadCSV'
	query['mainExport']['data']['method']='export'
	query['mainExport']['data']['exportType']=obj['type']
	query['mainExport']['data']['devices'][0]['building']=obj['building']
	query['mainExport']['data']['devices'][0]['device']=obj['sensor']
	query['mainExport']['data']['details']['date']['from']=obj['dateFrom']+'+00:00:00'
	query['mainExport']['data']['details']['date']['to']=obj['dateTo'] + '+23:59:59'
	query['mainExport']['data']['details']['dateFormat']='1'
	query['mainExport']['data']['details']['datainterval']='0'
	query['mainExport']['data']['details']['order']='DE'
	query['mainExport']['data']['details']['decimal']='1'
//console.log(query)
	//request({baseUrl:"http://127.0.0.1:8080/",url: "soundReadings.csv", qs:query}, function(err, res, body) {
	request({url: "index.php", qs:query, qsStringifyOptions: {encode: false}}, function(err, res, body) {
		if (err)
			return callback(err.toString())

		if (res.headers['content-type']=='application/json') {
			console.log('[-] CSV request returned JSON, assuming dead session')
			console.log('[*] Response: ' + body)
			return newSession(function() {getCSV(obj, callback)})
		}
		else {
			console.log('[+] CSV Data Downloaded')
			return callback(body)
		}
	})
}

function getData(obj, callback) {
	(typeof obj['dateTo']===undefined) ? obj['dateTo'] : obj['dateFrom']

	var query = {buildExport:{'type':'', data: {'type':{}, date:{}}}}
	query['buildExport']['type']='read'
	query['buildExport']['data']['building']=obj['building']
	query['buildExport']['data']['type']['']=obj['type']
	query['buildExport']['data']['deviceinfo']='1'
	query['buildExport']['data']['fill']='0'
	query['buildExport']['data']['divide']='1'
	query['buildExport']['data']['order']='A'
	query['buildExport']['data']['dateformat']='1'	
	query['buildExport']['data']['date']['from']=obj['dateFrom']+'+00:00:00'
	query['buildExport']['data']['date']['to']=obj['dateTo'] + '+23:59:59'
	
//console.log(query)
	//request({baseUrl:"http://127.0.0.1:8080/",url: "soundReadings.csv", qs:query}, function(err, res, body) {
	request({url: "index.php", qs:query, qsStringifyOptions: {encode: false}}, function(err, res, body) {
		if (err) {
			console.log(err)
			return callback(err.toString())
		}

		console.log('[+] CSV Data Downloaded')
		//console.log(body)

		return callback(body)
	})
}

module.exports.json = function(obj,callback) {
	doInit(function() {getReadings(obj, function(data) {dataHandler(data, callback)})})
}

module.exports.csv = function(obj, callback) {
	semaphore.take(function() {
		getCSV(obj, function(data) {
			semaphore.leave()
			callback(data)
		})
	})
}

module.exports.data = function(obj, callback) {
	doInit(function() {getData(obj, callback)})
}