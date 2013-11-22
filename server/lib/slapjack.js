var Deck = require('./deck-of-cards'),
	async = require('./async');

module.exports = function () {
	var cards = new Deck(1),
		stack = [],
		players = [],
		started = false,
		whoseTurn = 0,
		timer;

	var Player = function (s) {
		var lock,
			cards = [],
			points = 0,
			messageBuffer = [],
			socket = s;

		/**
		 * Generates a GUID
		 * @return string GUID
		 */
		var getGUID = function () {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		};

		return {
			'socket': socket,
			'addPoints': function (p) {
				points = points + p;
			},
			'getPoints': function () {
				return points;
			},
			'delete': function (key) {
				if (key !== lock) {
					return false;
				}

				return true;
			},
			getKey: function () {
				if (typeof lock === 'string') {
					return false;
				}

				lock = getGUID();
				return lock;
			},
			sendMessage: function (msg) {
				messageBuffer.push(msg);
			},
			getMessages: function (key) {
				if (lock !== key) {
					return false;
				}

				var messages = messageBuffer;

				messageBuffer = [];

				return messages;
			},
			getCard: function () {
				var card = cards.pop();
				return card;
			},
			giveCard: function (card) {
				cards.push(card);
			},
			getCards: function () {
				return cards;
			},
			resetCards: function () {

			}
		};
	};

	function showPlayers(card) {
		// Send the cards out to all
		for (var i = 0; i < players.length; i++) {
			players[i].socket.emit('newCard', cards.seeCard(card));
		}
	}

	function flipCards() {
		console.log('flipping card');

		var card,
			numberOfPlayers = players.length;

		if (whoseTurn === numberOfPlayers) {
			whoseTurn = 0;
		}

		card = players[whoseTurn].getCard();

		stack.push(card);

		showPlayers(card);

		whoseTurn++;
	}

	return {
		resetCards: function () {
			var currentPlayer = 0;

			stack = [];

			// Remove cards from players
			for (var i = 0; i < players.length; i++) {
				players[i].resetCards();
			}

			// Get a new deck
			cards = new Deck(1);

			// Distribute cards to all players
			for (var i = 0; i < 52; i++) {
				if (currentPlayer === players.length) {
					currentPlayer = 0;
				}

				players[currentPlayer].giveCard(cards.getCard());

				currentPlayer++;
			}
		},
		loop: function () {
			var that = this;
			
			timer = setInterval(function () {
				if (stack.length === 51) {
					that.resetCards();
				}
				flipCards();
			}, 1000);
		},
		start: function () {
			var i,
				that = this;

			started = true;

			// Add listeners for each player
			for (i = 0; i < players.length; i++) {
				players[i].socket.on('slapCard', (function (index) {
					return function () {
						that.slap(index);
					}
				})(i));
			}

			// Start new Game
			that.newGame();
		},
		slap: function (idx) {
			var that = this;

			console.log('slap - cards: ' + stack.length + ' idx: ' + idx);
			
			// Make sure we have some cards
			if (stack.length > 0) {
				console.log('We have some cards');
				// stop the timer
				clearInterval(timer);

				// Is it really a jack?
				if (cards.seeCard(stack[stack.length - 1]).value == 11) {
					console.log('it was a jack!');
					console.dir(players[idx]);
					players[idx].addPoints(stack.length);
					players[idx].socket.emit('updatePoints', players[idx].getPoints());
					async.each(players, function (item, callback) {
						item.socket.emit('message', 'Player ' + idx + ' has taken the stack!');
					}, function (err) {

					});
				} else {
					console.log('its not a jack');
					// Not a jack, divide stack to other players
					for (var i = 0; i < players.length; i++) {
						if (i !== idx) {
							players[i].addPoints(Math.round(stack.length / players.length));
							players[i].socket.emit('updatePoints', players[i].getPoints());
						}
					}

					async.each(players, function (item, callback) {
						item.socket.emit('message', 'Player ' + idx + ' clicked the wrong card!');
					}, function (err) {

					});
				}

				that.newGame();
			}
		},
		newGame: function () {
			this.resetCards();
			this.loop();
		},
		addPlayer: function (socket) {
			if (started) {
				socket.emit('message', 'The game has already started!');
				return false;
			}
			
			players.push(new Player(socket));

			socket.emit('joinedRoom', true);

			async.each(players, function (item, callback) {
				item.socket.emit('updatePlayers', players.length);
			}, function (err) {

			});
			return {
				'key': players[players.length - 1].getKey(),
				'index': players.length - 1
			};
		},
		removePlayer: function (player) {
			if (players[player.index].delete(player.key)) {
				async.each(players[player.index].cards, function (item, callback) {

				}, function (err) {
					delete players[player.index];
				});
			} else {
				return false;
			}
		}
	};
};