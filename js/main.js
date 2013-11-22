/*global Modernizr requirejs require console*/
/*jshint node:false*/

requirejs.config({
	paths: {
		'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min'
	}
});

require(['jquery', 'socket.io'], function ($, io) {
	'use strict';

	$(function () {
		var game,
			joined = false,
			socket = io.connect('http://cards.local.com:8080');

		socket.on('newCard', function (c) {
			var suit;
			
			switch (c.suit) {
				case "heart":
					suit = "♥";
					break;
				case "club":
					suit = "♣";
					break;
				case "diamond":
					suit = "♦";
					break;
				case "spade":
					suit = "♠";
			}

			$('.topLeft, .bottomRight').text(c.value + suit);
			console.dir(c);
		});

		socket.on('message', function (c) {
			$('.log ul').append('<li>' + c + '</li>');
		});

		socket.on('updatePoints', function (p) {
			$('.currentPoints span').text(p);
		});

		socket.on('updatePlayers', function (p) {
			$('.currentPlayers span').text(p);
		});

		socket.on('joinedRoom', function (r) {
			joined = true;
			$('.currentRoom span').text(game);
		});

		$('.join').on('click', function () {
			if (game === $('.room').val()) {
				return false;
			}
			
			game = $('.room').val();

			socket.emit('joinGame', {
				'game': game,
				'name': 'Jaime'
			});
		});

		$('.start').on('click', function () {
			if (!joined) {
				return false;
			}
			console.log('sending start');
			
			socket.emit('startGame', {
				'game': game,
			});
		});

		$('.card').on('click', function () {
			socket.emit('slapCard');
		});
	});
});