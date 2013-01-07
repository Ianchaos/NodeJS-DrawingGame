// Serve files when people access the url of the app in browser and relay socket.io messages

// including the libraries
var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	static = require('node-static');

// make all files in current folder accessible from web
var fileServer = new static.Server('./');

// port for the web server (http://localhost:8080)
app.listen(8080);

// if url of socket server is opened in browser
function handler (request, response) {
	request.addListener('end', function () {
		// return the correct file
		fileServer.serve(request, response);
	});
}

// delete to make debug messages visible
io.set('log level', 1);

// listen for incoming client connections
io.sockets.on('connection', function (socket) {
	
	// listen for mouse move events
	socket.on('mousemove', function (data) {
	
		// broadcast event to everyone (except originating client of course!)
		socket.broadcast.emit('moving', data);
	});
});		