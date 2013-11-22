	var Deck = function (numberOfDecks) {

		var cards = [],
			trash = [],
			inPlay = [],
			suits = [
				'diamond',
				'club',
				'heart',
				'spade'
			],
			values = [
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14
			];

		/**
		 * Shuffles an array, to be used with cards[];
		 * @param arr An array to be shuffled
		 */
		var scramble = function (arr) {
			var i = arr.length;

			if (i === 0) {
				return false;
			}

			while (--i) {
				var j = Math.floor(Math.random() * (i + 1));
				var tempi = arr[i];
				var tempj = arr[j];
				arr[i] = tempj;
				arr[j] = tempi;
			}

			return arr;
		};

		var Card = function (theSuit, theValue) {
			var dealt = false;
			var lock;
			var suit = theSuit;
			var value = theValue;

			/**
			 * Generates a GUID
			 * @return string GUID
			 */
			var getGUID = function () {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
					var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
					return v.toString(16);
				});
			};

			return {
				/**
				 * Makes sure the card is available and returns a key to view the card.
				 * @return string a key to unlock the cards secrets
				 */
				take: function () {
					if (dealt) {
						return false;
					}

					lock = getGUID();
					dealt = true;
					return lock;
				},

				/**
				 * Gives up the secret to the card and makes it available for someone else.
				 * @return bool true if successful
				 */
				pass: function () {
					if (!dealt) {
						return false;
					}

					lock = getGUID();
					dealt = false;
					return true;
				},

				/**
				 * Gets the cards suit, if you have the key
				 * @param  string key The key to open the cards secrets
				 * @return string suit
				 */
				getSuit: function (key) {
					if (key !== lock) {
						return false;
					}

					return suit;
				},

				/**
				 * Gets the cards value, if you have the key
				 * @param  string key The key to open the cards secrets
				 * @return string value
				 */
				getValue: function (key) {
					if (key !== lock) {
						return false;
					}

					return value;
				}
			};
		};

		/**
		 * Clears the old cards and populates the deck.
		 */
		var populateDeck = function (decks) {
			var i;
			var j;
			var k;

			// clear the deck;
			cards = [];
			trash = [];
			inPlay = [];

			for (k = 0; k < decks; k++) {
				for (i = 0; i < suits.length; i++) {
					for (j = 0; j < values.length; j++) {
						cards.push(new Card(suits[i], values[j]));
					}
				}
			}

			cards = scramble(cards);
		};

		populateDeck(numberOfDecks);

		return {
			reset: function () {
				populateDeck();
			},
			shuffle: function () {
				cards = scramble(cards);
			},
			remaining: function () {
				return cards.length;
			},
			getCard: function () {
				var key;

				inPlay.push(cards.shift());

				return {
					'key': inPlay[inPlay.length - 1].take(),
					'index': inPlay.length - 1
				};
			},
			trashCard: function (i) {
				trash.push(inPlay[i]);
				inPlay[i] = undefined;
			},
			returnCard: function (i) {
				inPlay[i].pass();
				cards.push(inPlay[i]);
				inPlay[i] = undefined;
			},
			seeCard: function (obj) {
				return {
					suit: inPlay[obj.index].getSuit(obj.key),
					value: inPlay[obj.index].getValue(obj.key)
				};
			}
		};
	};

	module.exports = Deck;