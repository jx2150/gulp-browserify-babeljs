(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _Game = require("./imports/Game");

var _Game2 = _interopRequireWildcard(_Game);

var game = new _Game2["default"]($("#game"), 4);
game.start();

},{"./imports/Game":2}],2:[function(require,module,exports){
'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var Game = (function () {
	function Game(mountNode, size) {
		_classCallCheck(this, Game);

		/*
   * Container for all game elements
   */
		this.container = mountNode;

		/* 
   * Size of container
   * Note: its a square
   */
		this.size = size;

		/*
   * Number of boxes
   */
		this.numBoxes = this.size * this.size;

		/*
   * Number of dots
   */
		this.numDots = (this.size + 1) * (this.size + 1);

		/*
   * Turn history
   */
		this.turnHistory = [];

		/*
   * Map line types to some properties
   */
		this.lineMapping = (function () {
			var _this = this;

			return {
				'horizontal-top': {
					index: 0,
					neighborOffset: -this.size,
					neighborSharedLineType: 'horizontal-bottom',
					neighborIsViable: function neighborIsViable(i) {
						return true;
					}
				},
				'vertical-right': {
					index: 1,
					neighborOffset: 1,
					neighborSharedLineType: 'vertical-left',
					neighborIsViable: function neighborIsViable(i) {
						return (i + 1) % _this.size !== 0;
					}
				},
				'horizontal-bottom': {
					index: 2,
					neighborOffset: this.size,
					neighborSharedLineType: 'horizontal-top',
					neighborIsViable: function neighborIsViable(i) {
						return true;
					}
				},
				'vertical-left': {
					index: 3,
					neighborOffset: -1,
					neighborSharedLineType: 'vertical-right',
					neighborIsViable: function neighborIsViable(i) {
						return i % _this.size !== 0;
					}
				}
			};
		}).bind(this);

		//boxes and dots arrays
		//http://jsperf.com/create-array-with-default-values/2
		var dots = [];
		var boxes = [];
		for (var i = 0; i < this.numDots; i++) {
			dots[i] = new Dot();
		}
		for (var i = 0; i < this.numBoxes; i++) {
			boxes[i] = new Box(this);
		}

		/*
   * Define initial state obj
   */
		this.state = {
			turn: 'red',
			selectedDot: null,
			dots: dots,
			boxes: boxes,
			done: false
		};
	}

	_createClass(Game, [{
		key: 'start',

		/*
   * Initiate the game
   */
		value: function start() {
			this.renderBoard();
			this.setEventListeners();
		}
	}, {
		key: 'renderBoard',

		/*
   * Generate the game board dots and boxes
   */
		value: function renderBoard() {
			var self = this;

			/*
    * Inject the boxes and dots containers
    */
			$(self.container).empty();
			$(self.container).append('<div id="boxes-container"></div>');
			$(self.container).append('<div id="dots-container"></div>');
			$(self.container).append('<div id="turns-container"></div>');

			self.$boxesContainer = $(self.container).find('#boxes-container');
			self.$dotsContainer = $(self.container).find('#dots-container');
			self.$turnsContainer = $(self.container).find('#turns-container');

			self.$turnsContainer.html('<div class="in-game-message">Go ahead, <span class="' + this.state.turn + '">' + this.state.turn.toUpperCase() + '</span>!</div>' + '<p class="end-game-message">' + this.state.endgameMessage + '</p>');

			self.updateTurnsViewWithState(self.$turnsContainer);

			/*
    * Loop through and add all dots and boxes
    *  - state sets modifier classes
    */
			for (var i = 0; i < self.numDots; i++) {

				var row = Math.floor(i / self.size);
				var col = i % self.size;

				//add dot
				var $dot = $('<div class="dot" data-row="' + row + '" data-col="' + col + '" data-index="' + i + '"></div>').appendTo(self.$dotsContainer);

				//setState
				self.updateDotViewWithState($dot, i);

				//don't need as many boxes as we do dots
				if (i < self.numBoxes) {

					// console.log(i + ': i % 4 = '+ (i % 4))
					// console.log(i + ': i % 16 = '+ (i % 16))

					var css = {
						top: 95 * row + 5,
						left: 95 * col + 5
					};

					//add box
					var $box = $('<div class="box" data-row="' + row + '" data-col="' + col + '" data-index="' + i + '">' + '<div class="line type-horizontal-top" data-type="horizontal-top"></div>' + '<div class="line type-vertical-right" data-type="vertical-right"></div>' + '<div class="line type-horizontal-bottom" data-type="horizontal-bottom"></div>' + '<div class="line type-vertical-left" data-type="vertical-left"></div>' + '</div>').appendTo(self.$boxesContainer);

					//position box
					$box.css(css);

					//set state
					self.updateBoxViewWithState($box, i);
				}
			};
		}
	}, {
		key: 'updateTurnsViewWithState',
		value: function updateTurnsViewWithState($turnsContainer) {
			if (this.state.done) {
				$turnsContainer.addClass('end-game');
			}
		}
	}, {
		key: 'updateDotViewWithState',
		value: function updateDotViewWithState($dot, i) {
			// console.log($dot, i)
			// console.log(this.state.dots[i])
			var dot = this.state.dots[i];

			$dot.removeClass('selected, viable');
			if (dot.selected) {
				$dot.addClass('selected');
			}
			if (dot.viable) {
				$dot.addClass('viable');
			}
		}
	}, {
		key: 'updateBoxViewWithState',
		value: function updateBoxViewWithState($box, i) {
			// console.log($box, i)
			// console.log(this.state.boxes[i])
			var box = this.state.boxes[i];

			for (var i = 0; i < box.lines.length; i++) {
				if (box.lines[i]) {
					$box.find('.line:eq(' + i + ')').addClass('selected-' + box.lines[i]);
				}
			}

			if (box.closedBy) {
				$box.addClass(box.closedBy);
			}
		}
	}, {
		key: 'handleDotClick',
		value: function handleDotClick(e) {
			var $dot = $(e.target);
			var index = $dot.index();
			var dot = this.state.dots[index];

			if (dot.viable) {
				console.log('dot is viable, should make line!');
				this.makeLine(index);
			} else if (!dot.selected) {
				console.log('dot is not selected, make it selected');
				this.state.selectedDot = index;
				dot.setState({ selected: true, viable: false });
				this.setViableDots(index);
			}

			this.renderBoard();
		}
	}, {
		key: 'handleLineClick',
		value: function handleLineClick(e) {
			var _this2 = this;

			var $line = $(e.target);
			var $box = $line.parent();
			var index = $box.index();
			var box = this.state.boxes[index];
			this.state.turnCount = this.turnHistory.length;

			console.log('this.state.turnCount: ' + this.state.turnCount);

			this.updateBoxStates(box, $line, index);

			setTimeout(function () {

				_this2.assessCompletion();
				_this2.renderBoard();
			}, 100);
		}
	}, {
		key: 'assessCompletion',

		/*
   * Check for completion of game
   */
		value: function assessCompletion() {

			var closedCount = this.state.boxes.filter(function (box) {
				return box.closedBy !== false;
			}).length;

			//check if done
			if (closedCount === 16) {

				var blue = this.state.boxes.filter(function (box) {
					return box.closedBy == 'blue';
				});
				var red = this.state.boxes.filter(function (box) {
					return box.closedBy == 'red';
				});

				//turn off clickability
				$(this.container).off('click', '.line');

				//set final messaging
				if (blue.length === red.length) {
					this.state.endgameMessage = 'Draw. Valiant effort Red and Blue!';
				} else if (blue.length > red.length) {
					this.state.endgameMessage = 'Good job, Blue! You win.';
				} else {
					this.state.endgameMessage = 'Good job, Red! You win.';
				}

				this.state.done = true;

				//else if still playing
			} else if (this.state.turnCount - this.turnHistory.length < 0) {
				this.changeTurn();
			}
		}
	}, {
		key: 'updateBoxStates',

		/*
   * Update clicked line and account for neighboring "duplicate" lines too
   */
		value: function updateBoxStates(box, $line, i) {
			var self = this;
			var lm = self.lineMapping();
			var lineType = $line.data('type');
			var lineTypeIndex = lm[lineType].index;

			//if line not yet set, set it
			if (!box.lines[lineTypeIndex]) {
				updateLine(box, lineTypeIndex);
			}

			//check for neighboring dup lines to set
			Object.keys(lm).forEach(function (key) {
				if (lineType === key && lm[key].neighborIsViable(i)) {
					var neighborIndex = lm[key].neighborOffset;
					var neighborBox = self.state.boxes[i + neighborIndex];
					if (neighborBox) {
						var neighborLineType = lm[key].neighborSharedLineType;
						var neighborLineTypeIndex = lm[neighborLineType].index;
						updateLine(neighborBox, neighborLineTypeIndex);
					}
				}
			});

			//creates new lines array and sets new state of given box instance
			function updateLine(box, lineIndex) {
				var newLinesData = box.lines.map(function (item, index) {
					return index == lineIndex ? self.state.turn : item;
				});
				box.setState({ lines: newLinesData });
			}
		}
	}, {
		key: 'changeTurn',
		value: function changeTurn() {
			console.log(this.state.turn);
			var turn = this.state.turn;
			if (turn === 'red') {
				turn = 'blue';
			} else {
				turn = 'red';
			}

			this.state.turn = turn;

			return turn;
		}
	}, {
		key: 'setEventListeners',

		/*
   * Event Listeners
   * See: http://es6rocks.com/2014/10/arrow-functions-and-their-scope/
   */
		value: function setEventListeners() {
			var _this3 = this;

			// $(this.container).on('click', '.dot', event => this.handleDotClick(event, this));
			$(this.container).on('click', '.line:not(.selected-red,.selected-blue)', function (event) {
				return _this3.handleLineClick(event, _this3);
			});
		}
	}]);

	return Game;
})();

var Dot = (function () {
	function Dot() {
		_classCallCheck(this, Dot);

		this.selected = false;
		this.viable = false;
	}

	_createClass(Dot, [{
		key: 'setState',
		value: function setState(obj) {
			if (obj.selected != undefined) this.selected = obj.selected;
			if (obj.viable != undefined) this.viable = obj.viable;
		}
	}]);

	return Dot;
})();

var Box = (function () {
	function Box(game) {
		_classCallCheck(this, Box);

		this.closedBy = false;
		this.lines = [false, false, false, false];
		this.game = game;
	}

	_createClass(Box, [{
		key: 'setState',
		value: function setState(obj) {
			if (obj.lines != undefined) this.lines = obj.lines;
			this.validate();
		}
	}, {
		key: 'validate',
		value: function validate() {
			var self = this;
			var selectedLineCount = 0;
			var redTurns = 0;
			var blueTurns = 0;
			for (var i = 0; i < this.lines.length; i++) {
				if (this.lines[i]) {
					selectedLineCount++;
				}
			}

			if (selectedLineCount === 4) {
				console.log('this box was closed by ' + this.game.state.turn + ' so they should go again!');
				this.closedBy = this.game.state.turn;
				this.game.turnHistory.pop();
			} else {
				// setTimeout(() => this.game.changeTurn(), 1000);
				console.log('nobody closed this box yet');
				this.game.turnHistory.push(this.game.state.turn);
			}
		}
	}]);

	return Box;
})();

module.exports = Game;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamFjay9Hb29nbGUgRHJpdmUvZGV2L2RvdHMtYW5kLWJveGVzL2FwcC5qcyIsIi9Vc2Vycy9qYWNrL0dvb2dsZSBEcml2ZS9kZXYvZG90cy1hbmQtYm94ZXMvaW1wb3J0cy9HYW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztvQkNBaUIsZ0JBQWdCOzs7O0FBRWpDLElBQUksSUFBSSxHQUFHLHNCQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Ozs7Ozs7OztJQ0hQLElBQUk7QUFFRSxVQUZOLElBQUksQ0FFRyxTQUFTLEVBQUUsSUFBSSxFQUFFO3dCQUZ4QixJQUFJOzs7OztBQU9SLE1BQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDOzs7Ozs7QUFNM0IsTUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Ozs7O0FBS2pCLE1BQUksQ0FBQyxRQUFRLEdBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxBQUFDLENBQUM7Ozs7O0FBS3hDLE1BQUksQ0FBQyxPQUFPLEdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQSxJQUFLLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQUFBQyxDQUFDOzs7OztBQUtuRCxNQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7Ozs7QUFLdEIsTUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFBLFlBQVc7OztBQUM3QixVQUFPO0FBQ04sb0JBQWdCLEVBQUU7QUFDakIsVUFBSyxFQUFFLENBQUM7QUFDUixtQkFBYyxFQUFFLENBQUUsSUFBSSxDQUFDLElBQUksQUFBQztBQUM1QiwyQkFBc0IsRUFBRSxtQkFBbUI7QUFDM0MscUJBQWdC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QUFtQ1QsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IEdhbWUgZnJvbSBcIi4vaW1wb3J0cy9HYW1lXCI7XG5cbnZhciBnYW1lID0gbmV3IEdhbWUoJCgnI2dhbWUnKSwgNCk7XG5nYW1lLnN0YXJ0KCk7XG5cblxuIiwiY2xhc3MgR2FtZXtcblxuXHRjb25zdHJ1Y3Rvcihtb3VudE5vZGUsIHNpemUpIHtcblx0XHRcblx0XHQvKlxuXHRcdCAqIENvbnRhaW5lciBmb3IgYWxsIGdhbWUgZWxlbWVudHNcblx0XHQgKi9cblx0XHR0aGlzLmNvbnRhaW5lciA9IG1vdW50Tm9kZTtcblxuXHRcdC8qIFxuXHRcdCAqIFNpemUgb2YgY29udGFpbmVyXG5cdFx0ICogTm90ZTogaXRzIGEgc3F1YXJlXG5cdFx0ICovXG5cdFx0dGhpcy5zaXplID0gc2l6ZTtcblxuXHRcdC8qXG5cdFx0ICogTnVtYmVyIG9mIGJveGVzXG5cdFx0ICovXG5cdFx0dGhpcy5udW1Cb3hlcyA9ICh0aGlzLnNpemUgKiB0aGlzLnNpemUpO1xuXG5cdFx0Lypcblx0XHQgKiBOdW1iZXIgb2YgZG90c1xuXHRcdCAqL1xuXHRcdHRoaXMubnVtRG90cyA9ICgodGhpcy5zaXplICsgMSkgKiAodGhpcy5zaXplICsgMSkpO1xuXG5cdFx0Lypcblx0XHQgKiBUdXJuIGhpc3Rvcnlcblx0XHQgKi9cblx0XHR0aGlzLnR1cm5IaXN0b3J5ID0gW107XG5cblx0XHQvKlxuXHRcdCAqIE1hcCBsaW5lIHR5cGVzIHRvIHNvbWUgcHJvcGVydGllc1xuXHRcdCAqL1xuXHRcdHRoaXMubGluZU1hcHBpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdCdob3Jpem9udGFsLXRvcCc6IHtcblx0XHRcdFx0XHRpbmRleDogMCxcblx0XHRcdFx0XHRuZWlnaGJvck9mZnNldDogLSh0aGlzLnNpemUpLFxuXHRcdFx0XHRcdG5laWdoYm9yU2hhcmVkTGluZVR5cGU6ICdob3Jpem9udGFsLWJvdHRvbScsXG5cdFx0XHRcdFx0bmVpZ2hib3JJc1ZpYWJsZTogKGkpID0+IHsgcmV0dXJuIHRydWUgfVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQndmVydGljYWwtcmlnaHQnOiB7XG5cdFx0XHRcdFx0aW5kZXg6IDEsXG5cdFx0XHRcdFx0bmVpZ2hib3JPZmZzZXQ6IDEsXG5cdFx0XHRcdFx0bmVpZ2hib3JTaGFyZWRMaW5lVHlwZTogJ3ZlcnRpY2FsLWxlZnQnLFxuXHRcdFx0XHRcdG5laWdoYm9ySXNWaWFibGU6IChpKSA9PiB7IHJldHVybiAoKGkrMSkgJSB0aGlzLnNpemUpICE9PSAwIH1cblx0XHRcdFx0fSxcblx0XHRcdFx0J2hvcml6b250YWwtYm90dG9tJzoge1xuXHRcdFx0XHRcdGluZGV4OiAyLFxuXHRcdFx0XHRcdG5laWdoYm9yT2Zmc2V0OiAodGhpcy5zaXplKSxcblx0XHRcdFx0XHRuZWlnaGJvclNoYXJlZExpbmVUeXBlOiAnaG9yaXpvbnRhbC10b3AnLFxuXHRcdFx0XHRcdG5laWdoYm9ySXNWaWFibGU6IChpKSA9PiB7IHJldHVybiB0cnVlIH1cblx0XHRcdFx0fSxcblx0XHRcdFx0J3ZlcnRpY2FsLWxlZnQnOiB7XG5cdFx0XHRcdFx0aW5kZXg6IDMsXG5cdFx0XHRcdFx0bmVpZ2hib3JPZmZzZXQ6IC0xLFxuXHRcdFx0XHRcdG5laWdoYm9yU2hhcmVkTGluZVR5cGU6ICd2ZXJ0aWNhbC1yaWdodCcsXG5cdFx0XHRcdFx0bmVpZ2hib3JJc1ZpYWJsZTogKGkpID0+IHsgcmV0dXJuICgoaSkgJSB0aGlzLnNpemUpICE9PSAwIH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0uYmluZCh0aGlzKVxuXG5cdFx0Ly9ib3hlcyBhbmQgZG90cyBhcnJheXNcblx0XHQvL2h0dHA6Ly9qc3BlcmYuY29tL2NyZWF0ZS1hcnJheS13aXRoLWRlZmF1bHQtdmFsdWVzLzJcblx0XHR2YXIgZG90cyA9IFtdO1xuXHRcdHZhciBib3hlcyA9IFtdO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1Eb3RzOyBpKyspIHtcblx0XHRcdGRvdHNbaV0gPSBuZXcgRG90KCk7XG5cdFx0fVxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1Cb3hlczsgaSsrKSB7XG5cdFx0XHRib3hlc1tpXSA9IG5ldyBCb3godGhpcyk7XG5cdFx0fVxuXG5cdFx0Lypcblx0XHQgKiBEZWZpbmUgaW5pdGlhbCBzdGF0ZSBvYmpcblx0XHQgKi9cblx0XHR0aGlzLnN0YXRlID0ge1xuXHRcdFx0dHVybjogJ3JlZCcsXG5cdFx0XHRzZWxlY3RlZERvdDogbnVsbCxcblx0XHRcdGRvdHM6IGRvdHMsXG5cdFx0XHRib3hlczogYm94ZXMsXG5cdFx0XHRkb25lOiBmYWxzZVxuXHRcdH1cblxuXHR9XG5cblxuXHQvKlxuXHQgKiBJbml0aWF0ZSB0aGUgZ2FtZVxuXHQgKi9cblx0c3RhcnQoKSB7XG5cdFx0dGhpcy5yZW5kZXJCb2FyZCgpO1xuXHRcdHRoaXMuc2V0RXZlbnRMaXN0ZW5lcnMoKTtcblx0fVxuXG5cdC8qXG5cdCAqIEdlbmVyYXRlIHRoZSBnYW1lIGJvYXJkIGRvdHMgYW5kIGJveGVzXG5cdCAqL1xuXHRyZW5kZXJCb2FyZCgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHQvKlxuXHRcdCAqIEluamVjdCB0aGUgYm94ZXMgYW5kIGRvdHMgY29udGFpbmVyc1xuXHRcdCAqL1xuXHRcdCQoc2VsZi5jb250YWluZXIpLmVtcHR5KCk7XG5cdFx0JChzZWxmLmNvbnRhaW5lcikuYXBwZW5kKCc8ZGl2IGlkPVwiYm94ZXMtY29udGFpbmVyXCI+PC9kaXY+Jyk7XG5cdFx0JChzZWxmLmNvbnRhaW5lcikuYXBwZW5kKCc8ZGl2IGlkPVwiZG90cy1jb250YWluZXJcIj48L2Rpdj4nKTtcblx0XHQkKHNlbGYuY29udGFpbmVyKS5hcHBlbmQoJzxkaXYgaWQ9XCJ0dXJucy1jb250YWluZXJcIj48L2Rpdj4nKTtcblxuXHRcdHNlbGYuJGJveGVzQ29udGFpbmVyID0gJChzZWxmLmNvbnRhaW5lcikuZmluZCgnI2JveGVzLWNvbnRhaW5lcicpO1xuXHRcdHNlbGYuJGRvdHNDb250YWluZXIgPSAkKHNlbGYuY29udGFpbmVyKS5maW5kKCcjZG90cy1jb250YWluZXInKTtcblx0XHRzZWxmLiR0dXJuc0NvbnRhaW5lciA9ICQoc2VsZi5jb250YWluZXIpLmZpbmQoJyN0dXJucy1jb250YWluZXInKTtcblxuXHRcdHNlbGYuJHR1cm5zQ29udGFpbmVyLmh0bWwoXG5cdFx0XHQnPGRpdiBjbGFzcz1cImluLWdhbWUtbWVzc2FnZVwiPkdvIGFoZWFkLCA8c3BhbiBjbGFzcz1cIicrdGhpcy5zdGF0ZS50dXJuKydcIj4nK3RoaXMuc3RhdGUudHVybi50b1VwcGVyQ2FzZSgpKyc8L3NwYW4+ITwvZGl2PicrXG5cdFx0XHQnPHAgY2xhc3M9XCJlbmQtZ2FtZS1tZXNzYWdlXCI+Jyt0aGlzLnN0YXRlLmVuZGdhbWVNZXNzYWdlKyc8L3A+J1xuXHRcdClcblxuXHRcdHNlbGYudXBkYXRlVHVybnNWaWV3V2l0aFN0YXRlKHNlbGYuJHR1cm5zQ29udGFpbmVyKTtcblxuXHRcdC8qXG5cdFx0ICogTG9vcCB0aHJvdWdoIGFuZCBhZGQgYWxsIGRvdHMgYW5kIGJveGVzXG5cdFx0ICogIC0gc3RhdGUgc2V0cyBtb2RpZmllciBjbGFzc2VzXG5cdFx0ICovXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLm51bURvdHM7IGkrKykge1xuXHRcdFx0XG5cdFx0XHR2YXIgcm93ID0gTWF0aC5mbG9vcigoaSkvc2VsZi5zaXplKTtcblx0XHRcdHZhciBjb2wgPSAoaSAlIHNlbGYuc2l6ZSk7XG5cblx0XHRcdC8vYWRkIGRvdFxuXHRcdFx0dmFyICRkb3QgPSAkKCc8ZGl2IGNsYXNzPVwiZG90XCIgZGF0YS1yb3c9XCInK3JvdysnXCIgZGF0YS1jb2w9XCInK2NvbCsgJ1wiIGRhdGEtaW5kZXg9XCInK2krJ1wiPjwvZGl2PicpLmFwcGVuZFRvKHNlbGYuJGRvdHNDb250YWluZXIpO1xuXHRcdFx0XG5cdFx0XHQvL3NldFN0YXRlXG5cdFx0XHRzZWxmLnVwZGF0ZURvdFZpZXdXaXRoU3RhdGUoJGRvdCwgaSk7XG5cblx0XHRcdC8vZG9uJ3QgbmVlZCBhcyBtYW55IGJveGVzIGFzIHdlIGRvIGRvdHNcblx0XHRcdGlmKGkgPCBzZWxmLm51bUJveGVzKSB7XG5cblx0XHRcdFx0Ly8gY29uc29sZS5sb2coaSArICc6IGkgJSA0ID0gJysgKGkgJSA0KSlcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coaSArICc6IGkgJSAxNiA9ICcrIChpICUgMTYpKVxuXG5cdFx0XHRcdHZhciBjc3MgPSB7XG5cdFx0XHRcdFx0dG9wOiAoOTUgKiByb3cpICsgNSxcblx0XHRcdFx0XHRsZWZ0OiAoOTUgKiBjb2wpICsgNVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRcblx0XHRcdFx0Ly9hZGQgYm94XG5cdFx0XHRcdHZhciAkYm94ID0gJChcblx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImJveFwiIGRhdGEtcm93PVwiJytyb3crJ1wiIGRhdGEtY29sPVwiJytjb2wrICdcIiBkYXRhLWluZGV4PVwiJytpKydcIj4nICtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibGluZSB0eXBlLWhvcml6b250YWwtdG9wXCIgZGF0YS10eXBlPVwiaG9yaXpvbnRhbC10b3BcIj48L2Rpdj4nICtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibGluZSB0eXBlLXZlcnRpY2FsLXJpZ2h0XCIgZGF0YS10eXBlPVwidmVydGljYWwtcmlnaHRcIj48L2Rpdj4nICtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibGluZSB0eXBlLWhvcml6b250YWwtYm90dG9tXCIgZGF0YS10eXBlPVwiaG9yaXpvbnRhbC1ib3R0b21cIj48L2Rpdj4nICtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibGluZSB0eXBlLXZlcnRpY2FsLWxlZnRcIiBkYXRhLXR5cGU9XCJ2ZXJ0aWNhbC1sZWZ0XCI+PC9kaXY+JyArXG5cdFx0XHRcdFx0JzwvZGl2PicpXG5cdFx0XHRcdFx0LmFwcGVuZFRvKHNlbGYuJGJveGVzQ29udGFpbmVyKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vcG9zaXRpb24gYm94XG5cdFx0XHRcdCRib3guY3NzKGNzcyk7XG5cblx0XHRcdFx0Ly9zZXQgc3RhdGVcblx0XHRcdFx0c2VsZi51cGRhdGVCb3hWaWV3V2l0aFN0YXRlKCRib3gsIGkpO1xuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHR9XG5cblx0dXBkYXRlVHVybnNWaWV3V2l0aFN0YXRlKCR0dXJuc0NvbnRhaW5lcikge1xuXHRcdGlmICh0aGlzLnN0YXRlLmRvbmUpIHtcblx0XHRcdCR0dXJuc0NvbnRhaW5lci5hZGRDbGFzcygnZW5kLWdhbWUnKTtcblx0XHR9XG5cdH1cblxuXHR1cGRhdGVEb3RWaWV3V2l0aFN0YXRlKCRkb3QsIGkpIHtcblx0XHQvLyBjb25zb2xlLmxvZygkZG90LCBpKVxuXHRcdC8vIGNvbnNvbGUubG9nKHRoaXMuc3RhdGUuZG90c1tpXSlcblx0XHR2YXIgZG90ID0gdGhpcy5zdGF0ZS5kb3RzW2ldO1xuXG5cdFx0JGRvdC5yZW1vdmVDbGFzcygnc2VsZWN0ZWQsIHZpYWJsZScpO1xuXHRcdGlmIChkb3Quc2VsZWN0ZWQpIHsgJGRvdC5hZGRDbGFzcygnc2VsZWN0ZWQnKTsgfVxuXHRcdGlmIChkb3QudmlhYmxlKSB7ICRkb3QuYWRkQ2xhc3MoJ3ZpYWJsZScpOyB9XG5cdFx0XG5cdH1cblxuXHR1cGRhdGVCb3hWaWV3V2l0aFN0YXRlKCRib3gsIGkpIHtcblx0XHQvLyBjb25zb2xlLmxvZygkYm94LCBpKVxuXHRcdC8vIGNvbnNvbGUubG9nKHRoaXMuc3RhdGUuYm94ZXNbaV0pXG5cdFx0dmFyIGJveCA9IHRoaXMuc3RhdGUuYm94ZXNbaV07XG5cdFx0XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBib3gubGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChib3gubGluZXNbaV0pIHtcblx0XHRcdFx0JGJveC5maW5kKCcubGluZTplcSgnK2krJyknKS5hZGRDbGFzcygnc2VsZWN0ZWQtJytib3gubGluZXNbaV0pXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGJveC5jbG9zZWRCeSkge1xuXHRcdFx0JGJveC5hZGRDbGFzcyhib3guY2xvc2VkQnkpO1xuXHRcdH1cblx0fVxuXG5cdGhhbmRsZURvdENsaWNrKGUpIHtcblx0XHR2YXIgJGRvdCA9ICQoZS50YXJnZXQpO1xuXHRcdHZhciBpbmRleCA9ICRkb3QuaW5kZXgoKTtcblx0XHR2YXIgZG90ID0gdGhpcy5zdGF0ZS5kb3RzW2luZGV4XTtcblxuXHRcdGlmIChkb3QudmlhYmxlKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnZG90IGlzIHZpYWJsZSwgc2hvdWxkIG1ha2UgbGluZSEnKTtcblx0XHRcdHRoaXMubWFrZUxpbmUoaW5kZXgpXG5cdFx0fSBlbHNlIGlmICghZG90LnNlbGVjdGVkKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnZG90IGlzIG5vdCBzZWxlY3RlZCwgbWFrZSBpdCBzZWxlY3RlZCcpXG5cdFx0XHR0aGlzLnN0YXRlLnNlbGVjdGVkRG90ID0gaW5kZXg7XG5cdFx0XHRkb3Quc2V0U3RhdGUoeyBzZWxlY3RlZDogdHJ1ZSwgdmlhYmxlOiBmYWxzZSB9KTtcblx0XHRcdHRoaXMuc2V0VmlhYmxlRG90cyhpbmRleCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW5kZXJCb2FyZCgpO1xuXHR9XG5cblx0aGFuZGxlTGluZUNsaWNrKGUpIHtcblx0XHR2YXIgJGxpbmUgPSAkKGUudGFyZ2V0KTtcblx0XHR2YXIgJGJveCA9ICRsaW5lLnBhcmVudCgpO1xuXHRcdHZhciBpbmRleCA9ICRib3guaW5kZXgoKTtcblx0XHR2YXIgYm94ID0gdGhpcy5zdGF0ZS5ib3hlc1tpbmRleF07XG5cdFx0dGhpcy5zdGF0ZS50dXJuQ291bnQgPSB0aGlzLnR1cm5IaXN0b3J5Lmxlbmd0aDtcblx0XHRcblx0XHRjb25zb2xlLmxvZygndGhpcy5zdGF0ZS50dXJuQ291bnQ6ICcrdGhpcy5zdGF0ZS50dXJuQ291bnQpO1xuXG5cdFx0dGhpcy51cGRhdGVCb3hTdGF0ZXMoYm94LCAkbGluZSwgaW5kZXgpO1xuXG5cdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cblx0XHRcdHRoaXMuYXNzZXNzQ29tcGxldGlvbigpO1xuXHRcdFx0dGhpcy5yZW5kZXJCb2FyZCgpO1xuXG5cdFx0fSwgMTAwKTtcblx0fVxuXG5cdC8qXG5cdCAqIENoZWNrIGZvciBjb21wbGV0aW9uIG9mIGdhbWVcblx0ICovXG5cdGFzc2Vzc0NvbXBsZXRpb24oKSB7XG5cdFx0XG5cdFx0dmFyIGNsb3NlZENvdW50ID0gdGhpcy5zdGF0ZS5ib3hlcy5maWx0ZXIoZnVuY3Rpb24oYm94KSB7XG5cdCBcdFx0cmV0dXJuIGJveC5jbG9zZWRCeSAhPT0gZmFsc2Vcblx0IFx0fSkubGVuZ3RoO1xuXHQgXHRcblx0XHQvL2NoZWNrIGlmIGRvbmVcblx0XHRpZiAoY2xvc2VkQ291bnQgPT09IDE2KSB7XG5cblx0XHQgXHR2YXIgYmx1ZSA9IHRoaXMuc3RhdGUuYm94ZXMuZmlsdGVyKGZ1bmN0aW9uKGJveCkgeyByZXR1cm4gYm94LmNsb3NlZEJ5ID09ICdibHVlJyB9KTtcblx0XHRcdHZhciByZWQgPSB0aGlzLnN0YXRlLmJveGVzLmZpbHRlcihmdW5jdGlvbihib3gpIHsgcmV0dXJuIGJveC5jbG9zZWRCeSA9PSAncmVkJyB9KTtcblxuXHRcdFx0Ly90dXJuIG9mZiBjbGlja2FiaWxpdHlcblx0XHRcdCQodGhpcy5jb250YWluZXIpLm9mZignY2xpY2snLCAnLmxpbmUnKTtcblxuXHRcdFx0Ly9zZXQgZmluYWwgbWVzc2FnaW5nXG5cdFx0XHRpZiAoYmx1ZS5sZW5ndGggPT09IHJlZC5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy5zdGF0ZS5lbmRnYW1lTWVzc2FnZSA9ICdEcmF3LiBWYWxpYW50IGVmZm9ydCBSZWQgYW5kIEJsdWUhJztcblx0XHRcdH0gZWxzZSBpZiAoYmx1ZS5sZW5ndGggPiByZWQubGVuZ3RoKSB7XG5cdFx0XHRcdHRoaXMuc3RhdGUuZW5kZ2FtZU1lc3NhZ2UgPSAnR29vZCBqb2IsIEJsdWUhIFlvdSB3aW4uJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc3RhdGUuZW5kZ2FtZU1lc3NhZ2UgPSAnR29vZCBqb2IsIFJlZCEgWW91IHdpbi4nO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnN0YXRlLmRvbmUgPSB0cnVlO1xuXG5cdFx0Ly9lbHNlIGlmIHN0aWxsIHBsYXlpbmdcblx0XHR9IGVsc2UgaWYgKHRoaXMuc3RhdGUudHVybkNvdW50IC0gdGhpcy50dXJuSGlzdG9yeS5sZW5ndGggPCAwKSB7XG5cdFx0XHR0aGlzLmNoYW5nZVR1cm4oKTtcblx0XHR9XG5cblx0fVxuXG5cdC8qXG5cdCAqIFVwZGF0ZSBjbGlja2VkIGxpbmUgYW5kIGFjY291bnQgZm9yIG5laWdoYm9yaW5nIFwiZHVwbGljYXRlXCIgbGluZXMgdG9vXG5cdCAqL1xuXHR1cGRhdGVCb3hTdGF0ZXMoYm94LCAkbGluZSwgaSkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgbG0gPSBzZWxmLmxpbmVNYXBwaW5nKCk7XG5cdFx0dmFyIGxpbmVUeXBlID0gJGxpbmUuZGF0YSgndHlwZScpO1xuXHRcdHZhciBsaW5lVHlwZUluZGV4ID0gbG1bbGluZVR5cGVdLmluZGV4O1xuXG5cdFx0Ly9pZiBsaW5lIG5vdCB5ZXQgc2V0LCBzZXQgaXRcblx0XHRpZiAoIWJveC5saW5lc1tsaW5lVHlwZUluZGV4XSkge1xuXHRcdFx0dXBkYXRlTGluZShib3gsIGxpbmVUeXBlSW5kZXgpO1xuXHRcdH1cblxuXHRcdC8vY2hlY2sgZm9yIG5laWdoYm9yaW5nIGR1cCBsaW5lcyB0byBzZXRcblx0XHRPYmplY3Qua2V5cyhsbSkuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRcdGlmIChsaW5lVHlwZSA9PT0ga2V5ICYmIGxtW2tleV0ubmVpZ2hib3JJc1ZpYWJsZShpKSkge1xuXHRcdFx0XHR2YXIgbmVpZ2hib3JJbmRleCA9IGxtW2tleV0ubmVpZ2hib3JPZmZzZXQ7XG5cdFx0XHRcdHZhciBuZWlnaGJvckJveCA9IHNlbGYuc3RhdGUuYm94ZXNbaSArIG5laWdoYm9ySW5kZXhdO1xuXHRcdFx0XHRpZiAobmVpZ2hib3JCb3gpIHtcblx0XHRcdFx0XHR2YXIgbmVpZ2hib3JMaW5lVHlwZSA9IGxtW2tleV0ubmVpZ2hib3JTaGFyZWRMaW5lVHlwZTtcblx0XHRcdFx0XHR2YXIgbmVpZ2hib3JMaW5lVHlwZUluZGV4ID0gbG1bbmVpZ2hib3JMaW5lVHlwZV0uaW5kZXg7XG5cdFx0XHRcdFx0dXBkYXRlTGluZShuZWlnaGJvckJveCwgbmVpZ2hib3JMaW5lVHlwZUluZGV4KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly9jcmVhdGVzIG5ldyBsaW5lcyBhcnJheSBhbmQgc2V0cyBuZXcgc3RhdGUgb2YgZ2l2ZW4gYm94IGluc3RhbmNlXG5cdFx0ZnVuY3Rpb24gdXBkYXRlTGluZShib3gsIGxpbmVJbmRleCkge1xuXHRcdFx0dmFyIG5ld0xpbmVzRGF0YSA9IGJveC5saW5lcy5tYXAoZnVuY3Rpb24oaXRlbSwgaW5kZXgpe1xuXHRcdFx0XHRyZXR1cm4gaW5kZXggPT0gbGluZUluZGV4ID8gc2VsZi5zdGF0ZS50dXJuIDogaXRlbTtcblx0XHRcdH0pO1xuXHRcdFx0Ym94LnNldFN0YXRlKHsgbGluZXM6IG5ld0xpbmVzRGF0YSB9KTtcblx0XHR9XG5cdH1cblxuXHRjaGFuZ2VUdXJuKCkge1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuc3RhdGUudHVybik7XG5cdFx0dmFyIHR1cm4gPSB0aGlzLnN0YXRlLnR1cm47XG5cdFx0aWYgKHR1cm4gPT09ICdyZWQnKSB7XG5cdFx0XHR0dXJuID0gJ2JsdWUnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0dXJuID0gJ3JlZCdcblx0XHR9XG5cblx0XHR0aGlzLnN0YXRlLnR1cm4gPSB0dXJuO1xuXG5cdFx0cmV0dXJuIHR1cm47XG5cdH1cblxuXHQvKlxuXHQgKiBFdmVudCBMaXN0ZW5lcnNcblx0ICogU2VlOiBodHRwOi8vZXM2cm9ja3MuY29tLzIwMTQvMTAvYXJyb3ctZnVuY3Rpb25zLWFuZC10aGVpci1zY29wZS9cblx0ICovXG5cdHNldEV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdC8vICQodGhpcy5jb250YWluZXIpLm9uKCdjbGljaycsICcuZG90JywgZXZlbnQgPT4gdGhpcy5oYW5kbGVEb3RDbGljayhldmVudCwgdGhpcykpO1xuXHRcdCQodGhpcy5jb250YWluZXIpLm9uKCdjbGljaycsICcubGluZTpub3QoLnNlbGVjdGVkLXJlZCwuc2VsZWN0ZWQtYmx1ZSknLCBldmVudCA9PiB0aGlzLmhhbmRsZUxpbmVDbGljayhldmVudCwgdGhpcykpO1xuXHR9XG5cbn1cblxuY2xhc3MgRG90IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdHRoaXMudmlhYmxlID0gZmFsc2U7XG5cdH1cblxuXHRzZXRTdGF0ZShvYmopIHtcblx0XHRpZiAob2JqLnNlbGVjdGVkICE9IHVuZGVmaW5lZCkgdGhpcy5zZWxlY3RlZCA9IG9iai5zZWxlY3RlZDtcblx0XHRpZiAob2JqLnZpYWJsZSAhPSB1bmRlZmluZWQpIHRoaXMudmlhYmxlID0gb2JqLnZpYWJsZTtcblx0fVxuXG59XG5cbmNsYXNzIEJveCB7XG5cdGNvbnN0cnVjdG9yKGdhbWUpIHtcblx0XHR0aGlzLmNsb3NlZEJ5ID0gZmFsc2U7XG5cdFx0dGhpcy5saW5lcyA9IFtmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZV07XG5cdFx0dGhpcy5nYW1lID0gZ2FtZTtcblx0fVxuXG5cdHNldFN0YXRlKG9iaikge1xuXHRcdGlmIChvYmoubGluZXMgIT0gdW5kZWZpbmVkKSB0aGlzLmxpbmVzID0gb2JqLmxpbmVzO1xuXHRcdHRoaXMudmFsaWRhdGUoKTtcblx0fVxuXG5cdHZhbGlkYXRlKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgc2VsZWN0ZWRMaW5lQ291bnQgPSAwXG5cdFx0dmFyIHJlZFR1cm5zID0gMDtcblx0XHR2YXIgYmx1ZVR1cm5zID0gMDtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLmxpbmVzW2ldKSB7XG5cdFx0XHRcdHNlbGVjdGVkTGluZUNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHNlbGVjdGVkTGluZUNvdW50ID09PSA0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygndGhpcyBib3ggd2FzIGNsb3NlZCBieSAnICsgdGhpcy5nYW1lLnN0YXRlLnR1cm4gKycgc28gdGhleSBzaG91bGQgZ28gYWdhaW4hJylcblx0XHRcdHRoaXMuY2xvc2VkQnkgPSB0aGlzLmdhbWUuc3RhdGUudHVybjtcblx0XHRcdHRoaXMuZ2FtZS50dXJuSGlzdG9yeS5wb3AoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gc2V0VGltZW91dCgoKSA9PiB0aGlzLmdhbWUuY2hhbmdlVHVybigpLCAxMDAwKTtcblx0XHRcdGNvbnNvbGUubG9nKCdub2JvZHkgY2xvc2VkIHRoaXMgYm94IHlldCcpO1xuXHRcdFx0dGhpcy5nYW1lLnR1cm5IaXN0b3J5LnB1c2godGhpcy5nYW1lLnN0YXRlLnR1cm4pO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7Il19
