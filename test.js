var assert = require("assert");
var jsdom = require('mocha-jsdom');

//import our Game class
import Game from './imports/Game';

describe('Dot and Boxes Tests', function(){

	var game = null;
	var $;
  	jsdom();
	
	this.timeout(15000);

	before(function(done){

		$ = require('jquery');
		game = new Game($('#game'), 4);
		// game.start();
		done();

	})

	describe('General', function(){

		it('should be an object', function(){
			assert.equal(typeof game, 'object');
		})

		it('should have a size property', function(){
			assert.equal(typeof game.size, 'number');
			assert.equal(game.size, 4);
		})

		it('should have initial state', function(){
			assert.equal(typeof game.state, 'object');
			assert.equal(typeof game.state.boxes, 'object');
			assert.equal(game.state.boxes.length, 16);
			assert.equal(game.state.dots.length, 25);
		})

	})

	describe('Game started', function(){			

		it('should start with red turn', function(){
			assert.equal(game.state.turn, 'red');
		})
	})

})