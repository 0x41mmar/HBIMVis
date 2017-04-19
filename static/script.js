dataBuffer = "";

function processData(dataArr) {
	var funs = {'TemperatureF': function(value) {return Math.round((parseInt(value)-32)*5/9)/100;}};
	var newNames = {'TemperatureF': 'TemperatureC'};
	// Two 
	dataArr[0].forEach( function(col, c) {
		if (funs[col]) {
			dataArr[0][c] = newNames[dataArr[0][c]];
			for (var r=1;r<dataArr.length;r++)
				dataArr[r][c] = funs[col](dataArr[r][c]); //map, practically
		}
	});
	
	return dataArr
}

function getDate(formSelect) {
	var year = $(formSelect + '>[name^=year]').val()
	var month = $(formSelect + '>[name^=month]').val()
	var day = $(formSelect + '>[name^=day]').val()
	return Date.parse(year+'/'+month+'/'+day).toString("yyyy-MM-dd")
}

function loadWeather(variable, callback) {
	if (dataBuffer != "")
		return callback(dataBuffer)
	//cols in CSV
	var col = {Temperature:1 , Dewpoint:2 , Pressure:3 , WindDirection:5 , WindSpeed:6 , WindSpeedGust:7 , Humidity:8 , HourlyPrecipitation:9 , DailyRain:12 , SolarRadiation:13}

	var StationID = document.getElementsByName('ID')[0].value
	var date = Date.parse(getDate('#dateForm'))
	var days = Math.floor((Date.parse(getDate('#dateForm2'))-date)/(86400000))
	

	var promises = []
	for (var d=0;d<=days;d++) {
		var req = 'api/weather/?ID=' + StationID + '&graphspan=day&month=' + date.toString('M') + '&day=' + date.toString('dd') + '&year=' + date.toString('yyyy') + '&format=1';
		promises.push(new Promise(function(resolve, reject) {
			$.get(req, function(data,status,xhr) {
				console.log('[*] Got day: ' + date.toString('yyyy-MM-dd'))
				var data = data.replace(/<br>/g,"").replace(/^\s*[\r\n]/gm,'').replace(/[,]$/gm,'');
				//data = $.csv.toArrays(data);
				//if (date==0) {data = data.substring(data.indexOf("201"));} //drop header
				//var table = data.slice(1).map(function(row, index) {return [Date.parse(row[0]+'UTC').getTime(), parseFloat(row[col[variable]])]});
				resolve(data)
			})
		}))
		date.addDays(1)
	}

	Promise.all(promises).then(function(tables) {
		for (var t=1;t<tables.length;t++)
			tables[t] = tables[t].substring(tables[t].indexOf("201"));

		var table = tables.join("");
		dataBuffer = table;
		callback(table);
	})
}

function viewCSV(callback) {
	loadWeather(undefined, function(data) {
		//data = processData($.csv.toArrays(data));
		document.getElementById('dataTable').innerHTML = generateTable($.csv.toArrays(data));
		return callback()
	})
}
	
function downloadCSV(callback) {
	loadWeather(undefined,function(data) {
		var element = document.createElement('a');
		element.style.display = 'none';
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data));
		element.setAttribute('download', $('select').val()+'.csv');
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		return callback()
	})
}


function armButton(elementSelect, action) { //action is a function that takes a callback only
	$(document).ready(function() {
		$(elementSelect+">.submit").click(function() {
			$(elementSelect+">.submit").addClass("loading");

	    	action(function() {
	    		setTimeout(function() {
			    	//remove loading
			    	$(elementSelect+">.submit").addClass("hide-loading");
			    	$(elementSelect+">.done").addClass("finish");
		    		
		    		//set finish
		    		// For failed icon just replace ".done" with ".failed"
			    	$(elementSelect+">.submit").removeClass("loading");
			    	$(elementSelect+">.submit").removeClass("hide-loading");
			     	$(elementSelect+">.done").removeClass("finish");
			     	$(elementSelect+">.failed").removeClass("finish");
			     }, 1000);
	    	})
	    })
    });
}

armButton('#viewBt', viewCSV);
armButton('#downloadBt', downloadCSV);
$(document).ready(function() {$('select').on('change', function(){dataBuffer = ""});})

$.get('api/graph', function(data) {$('#treeBox').jstree({'core': { 'data': data }});})



function generateTable(data) {
	var html = '';
	if (typeof(data[0]) === 'undefined') {
		return null;
	}
	if (data[0].constructor === String) {
		html += '<tr>\r\n';
		for (var item in data) {
			html += '<td>' + data[item] + '</td>\r\n';
		}
		html += '</tr>\r\n';
	}
	if (data[0].constructor === Array) {
		for (var row in data) {
			html += '<tr>\r\n';
			for (var item in data[row]) {
				html += '<td>' + data[row][item] + '</td>\r\n';
			}
			html += '</tr>\r\n';
		}
	}
	if (data[0].constructor === Object) {
		for (var row in data) {
			html += '<tr>\r\n';
			for (var item in data[row]) {
				html += '<td>' + item + ':' + data[row][item] + '</td>\r\n';
			}
			html += '</tr>\r\n';
		}
	}
	return html;
}

//jQuery-CSV
RegExp.escape=function(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")},function(a){"use strict";var b;b="undefined"!=typeof jQuery&&jQuery?jQuery:{},b.csv={defaults:{separator:",",delimiter:'"',headers:!0},hooks:{castToScalar:function(a){var b=/\./;if(isNaN(a))return a;if(b.test(a))return parseFloat(a);var c=parseInt(a);return isNaN(c)?null:c}},parsers:{parse:function(b,c){function d(){if(j=0,k="",c.start&&c.state.rowNum<c.start)return i=[],c.state.rowNum++,void(c.state.colNum=1);if(c.onParseEntry===a)h.push(i);else{var b=c.onParseEntry(i,c.state);b!==!1&&h.push(b)}i=[],c.end&&c.state.rowNum>=c.end&&(l=!0),c.state.rowNum++,c.state.colNum=1}function e(){if(c.onParseValue===a)i.push(k);else{var b=c.onParseValue(k,c.state);b!==!1&&i.push(b)}k="",j=0,c.state.colNum++}var f=c.separator,g=c.delimiter;c.state.rowNum||(c.state.rowNum=1),c.state.colNum||(c.state.colNum=1);var h=[],i=[],j=0,k="",l=!1,m=RegExp.escape(f),n=RegExp.escape(g),o=/(D|S|\r\n|\n|\r|[^DS\r\n]+)/,p=o.source;return p=p.replace(/S/g,m),p=p.replace(/D/g,n),o=new RegExp(p,"gm"),b.replace(o,function(a){if(!l)switch(j){case 0:if(a===f){k+="",e();break}if(a===g){j=1;break}if(/^(\r\n|\n|\r)$/.test(a)){e(),d();break}k+=a,j=3;break;case 1:if(a===g){j=2;break}k+=a,j=1;break;case 2:if(a===g){k+=a,j=1;break}if(a===f){e();break}if(/^(\r\n|\n|\r)$/.test(a)){e(),d();break}throw new Error("CSVDataError: Illegal State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");case 3:if(a===f){e();break}if(/^(\r\n|\n|\r)$/.test(a)){e(),d();break}if(a===g)throw new Error("CSVDataError: Illegal Quote [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");throw new Error("CSVDataError: Illegal Data [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");default:throw new Error("CSVDataError: Unknown State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]")}}),0!==i.length&&(e(),d()),h},splitLines:function(b,c){function d(){if(h=0,c.start&&c.state.rowNum<c.start)return i="",void c.state.rowNum++;if(c.onParseEntry===a)g.push(i);else{var b=c.onParseEntry(i,c.state);b!==!1&&g.push(b)}i="",c.end&&c.state.rowNum>=c.end&&(j=!0),c.state.rowNum++}var e=c.separator,f=c.delimiter;c.state.rowNum||(c.state.rowNum=1);var g=[],h=0,i="",j=!1,k=RegExp.escape(e),l=RegExp.escape(f),m=/(D|S|\n|\r|[^DS\r\n]+)/,n=m.source;return n=n.replace(/S/g,k),n=n.replace(/D/g,l),m=new RegExp(n,"gm"),b.replace(m,function(a){if(!j)switch(h){case 0:if(a===e){i+=a,h=0;break}if(a===f){i+=a,h=1;break}if("\n"===a){d();break}if(/^\r$/.test(a))break;i+=a,h=3;break;case 1:if(a===f){i+=a,h=2;break}i+=a,h=1;break;case 2:var b=i.substr(i.length-1);if(a===f&&b===f){i+=a,h=1;break}if(a===e){i+=a,h=0;break}if("\n"===a){d();break}if("\r"===a)break;throw new Error("CSVDataError: Illegal state [Row:"+c.state.rowNum+"]");case 3:if(a===e){i+=a,h=0;break}if("\n"===a){d();break}if("\r"===a)break;if(a===f)throw new Error("CSVDataError: Illegal quote [Row:"+c.state.rowNum+"]");throw new Error("CSVDataError: Illegal state [Row:"+c.state.rowNum+"]");default:throw new Error("CSVDataError: Unknown state [Row:"+c.state.rowNum+"]")}}),""!==i&&d(),g},parseEntry:function(b,c){function d(){if(c.onParseValue===a)g.push(i);else{var b=c.onParseValue(i,c.state);b!==!1&&g.push(b)}i="",h=0,c.state.colNum++}var e=c.separator,f=c.delimiter;c.state.rowNum||(c.state.rowNum=1),c.state.colNum||(c.state.colNum=1);var g=[],h=0,i="";if(!c.match){var j=RegExp.escape(e),k=RegExp.escape(f),l=/(D|S|\n|\r|[^DS\r\n]+)/,m=l.source;m=m.replace(/S/g,j),m=m.replace(/D/g,k),c.match=new RegExp(m,"gm")}return b.replace(c.match,function(a){switch(h){case 0:if(a===e){i+="",d();break}if(a===f){h=1;break}if("\n"===a||"\r"===a)break;i+=a,h=3;break;case 1:if(a===f){h=2;break}i+=a,h=1;break;case 2:if(a===f){i+=a,h=1;break}if(a===e){d();break}if("\n"===a||"\r"===a)break;throw new Error("CSVDataError: Illegal State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");case 3:if(a===e){d();break}if("\n"===a||"\r"===a)break;if(a===f)throw new Error("CSVDataError: Illegal Quote [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");throw new Error("CSVDataError: Illegal Data [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");default:throw new Error("CSVDataError: Unknown State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]")}}),d(),g}},helpers:{collectPropertyNames:function(a){var b,c,d=[];for(b in a)for(c in a[b])a[b].hasOwnProperty(c)&&d.indexOf(c)<0&&"function"!=typeof a[b][c]&&d.push(c);return d}},toArray:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter;var g=d.state!==a?d.state:{};d={delimiter:f.delimiter,separator:f.separator,onParseEntry:d.onParseEntry,onParseValue:d.onParseValue,state:g};var h=b.csv.parsers.parseEntry(c,d);return f.callback?void f.callback("",h):h},toArrays:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter;var g=[];return d={delimiter:f.delimiter,separator:f.separator,onPreParse:d.onPreParse,onParseEntry:d.onParseEntry,onParseValue:d.onParseValue,onPostParse:d.onPostParse,start:d.start,end:d.end,state:{rowNum:1,colNum:1}},d.onPreParse!==a&&d.onPreParse(c,d.state),g=b.csv.parsers.parse(c,d),d.onPostParse!==a&&d.onPostParse(g,d.state),f.callback?void f.callback("",g):g},toObjects:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter,f.headers="headers"in d?d.headers:b.csv.defaults.headers,d.start="start"in d?d.start:1,f.headers&&d.start++,d.end&&f.headers&&d.end++;var g=[],h=[];d={delimiter:f.delimiter,separator:f.separator,onPreParse:d.onPreParse,onParseEntry:d.onParseEntry,onParseValue:d.onParseValue,onPostParse:d.onPostParse,start:d.start,end:d.end,state:{rowNum:1,colNum:1},match:!1,transform:d.transform};var i={delimiter:f.delimiter,separator:f.separator,start:1,end:1,state:{rowNum:1,colNum:1}};d.onPreParse!==a&&d.onPreParse(c,d.state);var j=b.csv.parsers.splitLines(c,i),k=b.csv.toArray(j[0],d);g=b.csv.parsers.splitLines(c,d),d.state.colNum=1,d.state.rowNum=k?2:1;for(var l=0,m=g.length;m>l;l++){for(var n=b.csv.toArray(g[l],d),o={},p=0;p<k.length;p++)o[k[p]]=n[p];h.push(d.transform!==a?d.transform.call(a,o):o),d.state.rowNum++}return d.onPostParse!==a&&d.onPostParse(h,d.state),f.callback?void f.callback("",h):h},fromArrays:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter;var g,h,i,j,k="";for(i=0;i<c.length;i++){for(g=c[i],h=[],j=0;j<g.length;j++){var l=g[j]===a||null===g[j]?"":g[j].toString();l.indexOf(f.delimiter)>-1&&(l=l.replace(f.delimiter,f.delimiter+f.delimiter));var m="\n|\r|S|D";m=m.replace("S",f.separator),m=m.replace("D",f.delimiter),l.search(m)>-1&&(l=f.delimiter+l+f.delimiter),h.push(l)}k+=h.join(f.separator)+"\r\n"}return f.callback?void f.callback("",k):k},fromObjects:function(c,d,e){d=d!==a?d:{};var f={};if(f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter,f.headers="headers"in d?d.headers:b.csv.defaults.headers,f.sortOrder="sortOrder"in d?d.sortOrder:"declare",f.manualOrder="manualOrder"in d?d.manualOrder:[],f.transform=d.transform,"string"==typeof f.manualOrder&&(f.manualOrder=b.csv.toArray(f.manualOrder,f)),f.transform!==a){var g=c;c=[];var h;for(h=0;h<g.length;h++)c.push(f.transform.call(a,g[h]))}var i=b.csv.helpers.collectPropertyNames(c);if("alpha"===f.sortOrder&&i.sort(),f.manualOrder.length>0){var j,k=[].concat(f.manualOrder);for(j=0;j<i.length;j++)k.indexOf(i[j])<0&&k.push(i[j]);i=k}var l,j,m,n,o=[];for(f.headers&&o.push(i),l=0;l<c.length;l++){for(m=[],j=0;j<i.length;j++)n=i[j],m.push(n in c[l]&&"function"!=typeof c[l][n]?c[l][n]:"");o.push(m)}return b.csv.fromArrays(o,d,f.callback)}},b.csvEntry2Array=b.csv.toArray,b.csv2Array=b.csv.toArrays,b.csv2Dictionary=b.csv.toObjects,"undefined"!=typeof module&&module.exports&&(module.exports=b.csv)}.call(this);