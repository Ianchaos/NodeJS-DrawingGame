$(function() {
	
	// depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))) 
	{
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}
	
	// URL of the web server (port set in app.js)
	var url='http://localhost:8080';
	
	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext('2d'),
		instructions = $('#instructions');
		
	// generate an unique user ID
	var id = Math.round($.now()*Math.random());
	
	// flag for drawing event
	var drawing = false;
	
	var clients = {};
	var cursors = {};
	
	var socket = io.connect(url);
	
	socket.on('moving', function (data) {
		if(! (data.id in clients)){
			// new user is online, create cursor for them
			cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
		}
	
		// move mouse pointer
		cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		});
		
		// check whether the user is drawing
		if(data.drawing && clients[data.id]){
			// draw line on canvas
			// clients[data.id] holds previous position of user's mouse
			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
		}
		
		// save current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	});
	
	var prev = {};
	
	canvas.on('mousedown',function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;
		
		// hide instructions
		instructions.fadeOut();
	});
	
	doc.bind('mouseup mouseleave',function(){
		drawing = false;
	});
	
	var lastEmit = $.now();
	
	// use socket.emit() to send message to node.js server upon every mouse movement
	doc.on('mousemove',function(e){
		
		// limit packets to one every 30ms
		if($.now() - lastEmit > 30){
				socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'id': id
			});
			lastEmit = $.now();
		}
		
		// draw line for current user's movement, as it's not
		// received in the socket.on('moving') event above
	
		if(drawing){
			drawLine(prev.x, prev.y, e.pageX, e.pageY);
			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});
	
	// remove user after 10 seconds of inactivity
	setInterval(function(){
		
		for(ident in clients){
			if($.now() - clients[ident].updated > 10000){
				
				//last update more than 10 seconds ago? User has probably gone
				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}
	},10000);
	
	// mousemove not called on every pixel, draw solid lines instead of dots
	// distance between mouse coordinates are joined with straight line
	function drawLine(fromx, fromy, tox, toy){
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}
});
