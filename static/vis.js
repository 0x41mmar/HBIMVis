var activeGraph = {};

function getDate(formSelect) {
	var year = $(formSelect + '>[name^=year]').val()
	var month = $(formSelect + '>[name^=month]').val()
	var day = $(formSelect + '>[name^=day]').val()
	return Date.parse(year+'/'+month+'/'+day).toString("yyyy-MM-dd")
}

function dateQuery(date) {
	return 'graphspan=day&month=' + date.toString('M') + '&day=' + date.toString('dd') + '&year=' + date.toString('yyyy');
}

function dateFormat(dateString) {
	//convert 'DD/MM/YYYY HH:MM:SS' To 'YYYY/MM/DD HH:MM:SS'
	var d = dateString.replace(' ','/').split('/')
	return d[2]+'/'+d[1]+'/'+d[0]+' '+d[3]+'UTC'
}

function endLoading() {
	setTimeout(function() {
			    	//remove loading
			    	$("#loadDiv").addClass("hide-loading");
			    	$("#loadDiv>.done").addClass("finish");
		    		//set finish
		    		// For failed icon just replace ".done" with ".failed"
			    	$("#loadDiv").removeClass("loading");
			    	$("#loadDiv").removeClass("hide-loading");
			     	$("#loadDiv>.done").removeClass("finish");
			     	$("#loadDiv>.failed").removeClass("finish");
			     }, 300);
}

function exportCSV(placeholder) {
	var data = $(placeholder).data('plot').getData(); //array of objects
	var header = "Time,Reading,"
	for (var s in data) {
		var content = data[s]['data'].map(function(row) {return "\r\n" + (new Date(parseInt(row[0]))).toString('dd/MM/yyyy HH:mm:ss') +","+ row[1]})
		var filename = data[s]['label'].replace(/[|?*:/\;"<>]/g, "_");

		var element = document.createElement('a');
		element.style.display = 'none';
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(header) + encodeURIComponent(content));
		element.setAttribute('download', filename+'.csv');
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
}

function insertIcons(placeholder) {
	$('<span class="icon fa fa-close fa-2x"></span>').appendTo(placeholder).on('click', function() {delGraph($(this).parent()[0]);});
    $('<span class="icon fa fa-save fa-2x"></span>').appendTo(placeholder).on('click', 
    	function() {
    		$(this).addClass('loading');
    		exportCSV(placeholder[0]); //$(this).parent()[0]
    		$(this).removeClass('loading');
    	});
    $('<span class="icon fa fa-search-minus fa-2x"></span>').appendTo(placeholder).on('click', 
    	function() {
    		var plot = placeholder.data('plot')
	     	$.each(plot.getXAxes(), function(_, axis) {
					var opts = axis.options;
					opts.min = opts.datamin;
					opts.max = opts.datamax;
				});
				plot.setupGrid();
				plot.draw();
		});
}

function delGraph(element) {
	$('#tooltip_'+element.id).remove() //remove tooltip
	$(element)[0].remove() //remove graph
	//but is it the last one?
	activeGraph = {}
	if ($('#visCanvas').children().length > 0)
		activeGraph = $('#visCanvas>:last-child').data('plot');
	//if ($(element)[0]===activeGraph.getPlaceholder()[0]) //if this is the active one 
	//	activeGraph = {}

}

function graphData(data) { //data = [ [a,b] [a2,b2] , ...] or [ {data: [ [a,b], ...], label:'string' }]
	$('#errorBar').html(' ')
	var colors = ['#5b9f4a', '#d6212a', '#002f80', '#EF9856', '#0074a2', '#87c404', '#1e2023', '#802674', '#FFB92F']
	var units = {co2: 'ppm', humidity: '%', lux: 'lux', sound: 'dB', temperature: '\u00b0C', voc:'%', meters:'kWh', pirs:'', Temperature: '\u00b0C', Dewpoint: '\u00b0C', Pressure: 'hPa', WindDirection: '\u00b0Degrees', WindSpeed: 'km/h', WindSpeedGust: 'km/h', Humidity: '%', HourlyPrecipitation: 'mm', DailyRain: 'mm', SolarRadiation: 'W/m^2'}
	var font = {weight:'bold', color:'grey', family:'Helvetica'}

	if ((data.constructor === Array) && (data[0].constructor === Array)) //input is just data points, not an array of obj
		data = [{data: data, label:''}]

	var series = []
	for (var i in data)
		series.push({label: data[i]['label'], data: data[i]['data'], yaxis:1, lines: { show: true }, color:colors[Math.floor(Math.random() * colors.length)]})
	
	//var timeformat = ""

	
	var options = {xaxis: {mode: "time"}, yaxes:[{position:'left', labelWidth:40, axisLabel:units[data[0]['type']], axisLabelPadding:17},{position:'right', labelWidth:40, axisLabel:units[data[0]['type']], axisLabelPadding:17}], 
	crosshair: {mode: "xy"}, lines:{color:'#FF0000'},shadowSize: 0, 
	selection: {mode: "x"},
	legend: {show: true, backgroundColor: null, hoverable: false},
	grid: {hoverable: true, autoHighlight: true, margin:{left:20}} };

	//if ()
		// options['xaxis']['tickFormatter']=function (val, axis) { console.log(axis); return val}
	//		return (new Date(val)).toString('dd dddd')};
    

	if (document.getElementById('hold').checked && !(jQuery.isEmptyObject(activeGraph)))
	{
		//same axes
		activeGraph.setData(activeGraph.getData().concat(series));
		activeGraph.setupGrid();
		activeGraph.draw();

		return endLoading();
	}

	
	var randName = Math.random().toString(36).substr(2,2); //two random letters
	var placeholder=$('<div id="' + randName + '" class="placeholder" "></div>').appendTo($('#visCanvas'))
	var plot = $.plot(placeholder,series,options)
	activeGraph = plot;

	$("<div id='tooltip_"+randName+"' class='tooltip'></div>").appendTo("body");

	placeholder.bind("plothover", function (event, pos, item) {
		if (!item)
			return $('#tooltip_'+randName).hide()

		var x = new Date(item.datapoint[0]).toString('HH:mm'),
			y = item.datapoint[1];
		$('#tooltip_'+randName).html(x+' , '+y)
		.css({top: item.pageY+5, left: item.pageX+5})
		.fadeIn(200);
		//setTimeout(function() {$('#tooltip_'+randName).fadeOut(150,function() {$('#tooltip_'+randName).hide()})});
    });

    placeholder.bind("plotselected", function(event,ranges) {
    	$.each(plot.getXAxes(), function(_, axis) {
				var opts = axis.options;
				opts.min = ranges.xaxis.from;
				opts.max = ranges.xaxis.to;
			});
			plot.setupGrid();
			plot.draw();
			plot.clearSelection();
    });
   //  placeholder.bind("click", function(event) {
   //  	console.log("unselected")
   //  	$.each(plot.getXAxes(), function(_, axis) {
			// 	var opts = axis.options;
			// 	opts.min = opts.datamin;
			// 	opts.max = opts.datamax;
			// });
			// plot.setupGrid();
			// plot.draw();
			// plot.clearSelection();
   //  })
    insertIcons(placeholder);

    return endLoading();
}

function loadSensorExport(id, building, type, callback) {
	var req = 'api/csv/?'+ 'type=' + type +'&buildingID=' + building + '&sensorID=' + id + "&date=" + getDate('#dateForm') + '&dateTo=' + getDate('#dateForm2');
	$.get(req, function(data) {
		var data = $.csv.toArrays(data.replace(/<br>/g,"").replace(/^\s*[\r\n]/gm,''));
		var table = data.slice(1).map(function(row, index) {return [Date.parse(dateFormat(row[2])).getTime(), parseFloat(row[3])]});
		if (table.length < 1) {
			$('#errorBar').html("No data points found for the selected range");
			endLoading();
		}
		else
			callback(table)
	})
}

function loadSensorJson(id, building, type) {
	$("#loadDiv").addClass("loading");
	var req = 'api/json/?'+ 'type=' + type +'&buildingID=' + building + '&sensorID=' + id + "&date=" + getDate('#dateForm');
	$.get(req, function(data) {
		 
		if (data.length < 1) 
			$('#errorBar').html("No data points found for the selected range");
		else
			graphData(data)

	endLoading();
	})
}

function loadWeather(StationID, variable, callback) {
	//cols in CSV
	var col = {Temperature:1 , Dewpoint:2 , Pressure:3 , WindDirection:5 , WindSpeed:6 , WindSpeedGust:7 , Humidity:8 , HourlyPrecipitation:9 , DailyRain:12 , SolarRadiation:13}

	var date = Date.parse(getDate('#dateForm'))
	var days = Math.floor((Date.parse(getDate('#dateForm2'))-date)/(86400000))
	var promises = []
	
	for (var d=0;d<=days;d++) {
		var req = 'api/weather/?ID=' + StationID + '&'+ dateQuery(date) + '&format=1';
		promises.push(new Promise(function(resolve, reject) {
			$.get(req, function(data) {
				console.log('[*] Get date: ' + date.toString('yyyy-MM-dd'))
				var data = $.csv.toArrays(data.replace(/<br>/g,"").replace(/^\s*[\r\n]/gm,'')); 
				var table = data.slice(1).map(function(row, index) {return [Date.parse(row[0]+'UTC').getTime(), parseFloat(row[col[variable]])]});
				resolve(table)
			})
		}))
		date.addDays(1)
	}

	Promise.all(promises).then(function(tables) {
		var table = [].concat.apply([],tables);
		if (table.length < 1)
		{
			$('#errorBar').html("No data points found for the selected range"); //should be converted to callback err
		}
		else {
			callback(table)
		}
	})
	
}

function loadTree(data) {
	$('#treeBox').jstree({'core': { 'data': data }})
	
	$('#treeBox').on('select_node.jstree', function(e, data) {
		// start loading animation
		$("#loadDiv").addClass("loading");
		var name = data['node']['text']
		var parent = data['node']['parent'].substring(0,data['node']['parent'].indexOf('_')) //remove group e.g. Example_temperature

		if (data['node']['parent'].indexOf('_W0')!=-1) { //This is a weather node. e.g. IENGLAND1381_W0
			//var StationID = parent; //true but why waste time
			loadWeather(parent, name, function(data) {
				graphData([{data:data, label:name, type:name}])
			})
			return true;
		}

		
		var b = data['node']['id'].indexOf('B')
		var t = data['node']['id'].indexOf('T')
		
		var id = data['node']['id'].substring(1,b)
		var bid = data['node']['id'].substring(b+1,t)
		var type = data['node']['id'].substring(t+1)
		
		loadSensorExport(id,bid,type, function(data) {
			graphData([{data:data, label:parent+'>'+name, type:type}])
		})
		

	})
}


$(document).ready($.get('api/graph', function(data) {loadTree(data);}))

//jQuery-CSV
RegExp.escape=function(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")},function(a){"use strict";var b;b="undefined"!=typeof jQuery&&jQuery?jQuery:{},b.csv={defaults:{separator:",",delimiter:'"',headers:!0},hooks:{castToScalar:function(a){var b=/\./;if(isNaN(a))return a;if(b.test(a))return parseFloat(a);var c=parseInt(a);return isNaN(c)?null:c}},parsers:{parse:function(b,c){function d(){if(j=0,k="",c.start&&c.state.rowNum<c.start)return i=[],c.state.rowNum++,void(c.state.colNum=1);if(c.onParseEntry===a)h.push(i);else{var b=c.onParseEntry(i,c.state);b!==!1&&h.push(b)}i=[],c.end&&c.state.rowNum>=c.end&&(l=!0),c.state.rowNum++,c.state.colNum=1}function e(){if(c.onParseValue===a)i.push(k);else{var b=c.onParseValue(k,c.state);b!==!1&&i.push(b)}k="",j=0,c.state.colNum++}var f=c.separator,g=c.delimiter;c.state.rowNum||(c.state.rowNum=1),c.state.colNum||(c.state.colNum=1);var h=[],i=[],j=0,k="",l=!1,m=RegExp.escape(f),n=RegExp.escape(g),o=/(D|S|\r\n|\n|\r|[^DS\r\n]+)/,p=o.source;return p=p.replace(/S/g,m),p=p.replace(/D/g,n),o=new RegExp(p,"gm"),b.replace(o,function(a){if(!l)switch(j){case 0:if(a===f){k+="",e();break}if(a===g){j=1;break}if(/^(\r\n|\n|\r)$/.test(a)){e(),d();break}k+=a,j=3;break;case 1:if(a===g){j=2;break}k+=a,j=1;break;case 2:if(a===g){k+=a,j=1;break}if(a===f){e();break}if(/^(\r\n|\n|\r)$/.test(a)){e(),d();break}throw new Error("CSVDataError: Illegal State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");case 3:if(a===f){e();break}if(/^(\r\n|\n|\r)$/.test(a)){e(),d();break}if(a===g)throw new Error("CSVDataError: Illegal Quote [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");throw new Error("CSVDataError: Illegal Data [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");default:throw new Error("CSVDataError: Unknown State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]")}}),0!==i.length&&(e(),d()),h},splitLines:function(b,c){function d(){if(h=0,c.start&&c.state.rowNum<c.start)return i="",void c.state.rowNum++;if(c.onParseEntry===a)g.push(i);else{var b=c.onParseEntry(i,c.state);b!==!1&&g.push(b)}i="",c.end&&c.state.rowNum>=c.end&&(j=!0),c.state.rowNum++}var e=c.separator,f=c.delimiter;c.state.rowNum||(c.state.rowNum=1);var g=[],h=0,i="",j=!1,k=RegExp.escape(e),l=RegExp.escape(f),m=/(D|S|\n|\r|[^DS\r\n]+)/,n=m.source;return n=n.replace(/S/g,k),n=n.replace(/D/g,l),m=new RegExp(n,"gm"),b.replace(m,function(a){if(!j)switch(h){case 0:if(a===e){i+=a,h=0;break}if(a===f){i+=a,h=1;break}if("\n"===a){d();break}if(/^\r$/.test(a))break;i+=a,h=3;break;case 1:if(a===f){i+=a,h=2;break}i+=a,h=1;break;case 2:var b=i.substr(i.length-1);if(a===f&&b===f){i+=a,h=1;break}if(a===e){i+=a,h=0;break}if("\n"===a){d();break}if("\r"===a)break;throw new Error("CSVDataError: Illegal state [Row:"+c.state.rowNum+"]");case 3:if(a===e){i+=a,h=0;break}if("\n"===a){d();break}if("\r"===a)break;if(a===f)throw new Error("CSVDataError: Illegal quote [Row:"+c.state.rowNum+"]");throw new Error("CSVDataError: Illegal state [Row:"+c.state.rowNum+"]");default:throw new Error("CSVDataError: Unknown state [Row:"+c.state.rowNum+"]")}}),""!==i&&d(),g},parseEntry:function(b,c){function d(){if(c.onParseValue===a)g.push(i);else{var b=c.onParseValue(i,c.state);b!==!1&&g.push(b)}i="",h=0,c.state.colNum++}var e=c.separator,f=c.delimiter;c.state.rowNum||(c.state.rowNum=1),c.state.colNum||(c.state.colNum=1);var g=[],h=0,i="";if(!c.match){var j=RegExp.escape(e),k=RegExp.escape(f),l=/(D|S|\n|\r|[^DS\r\n]+)/,m=l.source;m=m.replace(/S/g,j),m=m.replace(/D/g,k),c.match=new RegExp(m,"gm")}return b.replace(c.match,function(a){switch(h){case 0:if(a===e){i+="",d();break}if(a===f){h=1;break}if("\n"===a||"\r"===a)break;i+=a,h=3;break;case 1:if(a===f){h=2;break}i+=a,h=1;break;case 2:if(a===f){i+=a,h=1;break}if(a===e){d();break}if("\n"===a||"\r"===a)break;throw new Error("CSVDataError: Illegal State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");case 3:if(a===e){d();break}if("\n"===a||"\r"===a)break;if(a===f)throw new Error("CSVDataError: Illegal Quote [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");throw new Error("CSVDataError: Illegal Data [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]");default:throw new Error("CSVDataError: Unknown State [Row:"+c.state.rowNum+"][Col:"+c.state.colNum+"]")}}),d(),g}},helpers:{collectPropertyNames:function(a){var b,c,d=[];for(b in a)for(c in a[b])a[b].hasOwnProperty(c)&&d.indexOf(c)<0&&"function"!=typeof a[b][c]&&d.push(c);return d}},toArray:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter;var g=d.state!==a?d.state:{};d={delimiter:f.delimiter,separator:f.separator,onParseEntry:d.onParseEntry,onParseValue:d.onParseValue,state:g};var h=b.csv.parsers.parseEntry(c,d);return f.callback?void f.callback("",h):h},toArrays:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter;var g=[];return d={delimiter:f.delimiter,separator:f.separator,onPreParse:d.onPreParse,onParseEntry:d.onParseEntry,onParseValue:d.onParseValue,onPostParse:d.onPostParse,start:d.start,end:d.end,state:{rowNum:1,colNum:1}},d.onPreParse!==a&&d.onPreParse(c,d.state),g=b.csv.parsers.parse(c,d),d.onPostParse!==a&&d.onPostParse(g,d.state),f.callback?void f.callback("",g):g},toObjects:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter,f.headers="headers"in d?d.headers:b.csv.defaults.headers,d.start="start"in d?d.start:1,f.headers&&d.start++,d.end&&f.headers&&d.end++;var g=[],h=[];d={delimiter:f.delimiter,separator:f.separator,onPreParse:d.onPreParse,onParseEntry:d.onParseEntry,onParseValue:d.onParseValue,onPostParse:d.onPostParse,start:d.start,end:d.end,state:{rowNum:1,colNum:1},match:!1,transform:d.transform};var i={delimiter:f.delimiter,separator:f.separator,start:1,end:1,state:{rowNum:1,colNum:1}};d.onPreParse!==a&&d.onPreParse(c,d.state);var j=b.csv.parsers.splitLines(c,i),k=b.csv.toArray(j[0],d);g=b.csv.parsers.splitLines(c,d),d.state.colNum=1,d.state.rowNum=k?2:1;for(var l=0,m=g.length;m>l;l++){for(var n=b.csv.toArray(g[l],d),o={},p=0;p<k.length;p++)o[k[p]]=n[p];h.push(d.transform!==a?d.transform.call(a,o):o),d.state.rowNum++}return d.onPostParse!==a&&d.onPostParse(h,d.state),f.callback?void f.callback("",h):h},fromArrays:function(c,d,e){d=d!==a?d:{};var f={};f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter;var g,h,i,j,k="";for(i=0;i<c.length;i++){for(g=c[i],h=[],j=0;j<g.length;j++){var l=g[j]===a||null===g[j]?"":g[j].toString();l.indexOf(f.delimiter)>-1&&(l=l.replace(f.delimiter,f.delimiter+f.delimiter));var m="\n|\r|S|D";m=m.replace("S",f.separator),m=m.replace("D",f.delimiter),l.search(m)>-1&&(l=f.delimiter+l+f.delimiter),h.push(l)}k+=h.join(f.separator)+"\r\n"}return f.callback?void f.callback("",k):k},fromObjects:function(c,d,e){d=d!==a?d:{};var f={};if(f.callback=e!==a&&"function"==typeof e?e:!1,f.separator="separator"in d?d.separator:b.csv.defaults.separator,f.delimiter="delimiter"in d?d.delimiter:b.csv.defaults.delimiter,f.headers="headers"in d?d.headers:b.csv.defaults.headers,f.sortOrder="sortOrder"in d?d.sortOrder:"declare",f.manualOrder="manualOrder"in d?d.manualOrder:[],f.transform=d.transform,"string"==typeof f.manualOrder&&(f.manualOrder=b.csv.toArray(f.manualOrder,f)),f.transform!==a){var g=c;c=[];var h;for(h=0;h<g.length;h++)c.push(f.transform.call(a,g[h]))}var i=b.csv.helpers.collectPropertyNames(c);if("alpha"===f.sortOrder&&i.sort(),f.manualOrder.length>0){var j,k=[].concat(f.manualOrder);for(j=0;j<i.length;j++)k.indexOf(i[j])<0&&k.push(i[j]);i=k}var l,j,m,n,o=[];for(f.headers&&o.push(i),l=0;l<c.length;l++){for(m=[],j=0;j<i.length;j++)n=i[j],m.push(n in c[l]&&"function"!=typeof c[l][n]?c[l][n]:"");o.push(m)}return b.csv.fromArrays(o,d,f.callback)}},b.csvEntry2Array=b.csv.toArray,b.csv2Array=b.csv.toArrays,b.csv2Dictionary=b.csv.toObjects,"undefined"!=typeof module&&module.exports&&(module.exports=b.csv)}.call(this);
