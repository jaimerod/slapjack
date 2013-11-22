var io = require('socket.io').listen(8080),
	async = require('./lib/async'),
	Slapjack = require('./lib/slapjack'),
	games = [],
	queue = [];

/**
 * Helper function for building requests for node to process
 */
var buildRequest = (function () {
	var template = {
		'game': '',
		'player': '',
		'action': ''
	};

	return {
		add: function (obj) {
			queue.push(obj);
		}
	};
}());

/**
 * Parses the queue
 * @param  object   request  [description]
 * @param  function callback [description]
 * @return {[type]}          [description]
 */
function processRequest(request, callback) {
	switch (request.action) {
	case 'dropGame':
		if (typeof games[request.game] !== 'undefined') {
			delete games[request.game];
		}
		break;
	case 'joinGame':
		if (typeof games[request.game] !== 'undefined') {
			games[request.game].addPlayer(request.socket);
		} else {
			games[request.game] = new Slapjack();
			games[request.game].addPlayer(request.socket);
		}
		break;
	case 'startGame':
		if (typeof games[request.game] !== 'undefined') {
			games[request.game].start();
		}
		break;
	}
}

io.sockets.on('connection', function (socket) {
	socket.on('joinGame', function (data) {
		buildRequest.add({
			'action': 'joinGame',
			'game': data.game,
			'name': data.name,
			'socket': socket
		});
	});

	socket.on('startGame', function (data) {
		buildRequest.add({
			'action': 'startGame',
			'game': data.game,
			'socket': socket
		});
	});
});

(function gameLoop() {
	if (queue.length > 0) {
		processRequest(queue.shift());
	}

	setTimeout(function () {
		gameLoop();
	}, 33);
}());