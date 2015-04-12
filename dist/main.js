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
			$(this.container).on('click', '.line', function (event) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamFjay9Hb29nbGUgRHJpdmUvZGV2L2RvdHMtYW5kLWJveGVzL2FwcC5qcyIsIi9Vc2Vycy9qYWNrL0dvb2dsZSBEcml2ZS9kZXYvZG90cy1hbmQtYm94ZXMvaW1wb3J0cy9HYW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztvQkNBaUIsZ0JBQWdCOzs7O0FBRWpDLElBQUksSUFBSSxHQUFHLHNCQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Ozs7Ozs7OztJQ0hQLElBQUk7QUFFRSxVQUZOLElBQUksQ0FFRyxTQUFTLEVBQUUsSUFBSSxFQUFFO3dCQUZ4QixJQUFJOzs7OztBQU9SLE1BQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDOzs7Ozs7QUFNM0IsTUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Ozs7O0FBS2pCLE1BQUksQ0FBQyxRQUFRLEdBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxBQUFDLENBQUM7Ozs7O0FBS3hDLE1BQUksQ0FBQyxPQUFPLEdBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQSxJQUFLLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQUFBQyxDQUFDOzs7OztBQUtuRCxNQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7Ozs7QUFLdEIsTUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFBLFlBQVc7OztBQUM3QixVQUFPO0FBQ04sb0JBQWdCLEVBQUU7QUFDakIsVUFBSyxFQUFFLENBQUM7QUFDUixtQkFBYyxFQUFFLENBQUUsSUFBSSxDQUFDLElBQUksQUFBQztBQUM1QiwyQkFBc0IsRUFBRSxtQkFBbUI7QUFDM0MscUJBQWdC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bUNULE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBHYW1lIGZyb20gXCIuL2ltcG9ydHMvR2FtZVwiO1xuXG52YXIgZ2FtZSA9IG5ldyBHYW1lKCQoJyNnYW1lJyksIDQpO1xuZ2FtZS5zdGFydCgpO1xuXG5cbiIsImNsYXNzIEdhbWV7XG5cblx0Y29uc3RydWN0b3IobW91bnROb2RlLCBzaXplKSB7XG5cdFx0XG5cdFx0Lypcblx0XHQgKiBDb250YWluZXIgZm9yIGFsbCBnYW1lIGVsZW1lbnRzXG5cdFx0ICovXG5cdFx0dGhpcy5jb250YWluZXIgPSBtb3VudE5vZGU7XG5cblx0XHQvKiBcblx0XHQgKiBTaXplIG9mIGNvbnRhaW5lclxuXHRcdCAqIE5vdGU6IGl0cyBhIHNxdWFyZVxuXHRcdCAqL1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cblx0XHQvKlxuXHRcdCAqIE51bWJlciBvZiBib3hlc1xuXHRcdCAqL1xuXHRcdHRoaXMubnVtQm94ZXMgPSAodGhpcy5zaXplICogdGhpcy5zaXplKTtcblxuXHRcdC8qXG5cdFx0ICogTnVtYmVyIG9mIGRvdHNcblx0XHQgKi9cblx0XHR0aGlzLm51bURvdHMgPSAoKHRoaXMuc2l6ZSArIDEpICogKHRoaXMuc2l6ZSArIDEpKTtcblxuXHRcdC8qXG5cdFx0ICogVHVybiBoaXN0b3J5XG5cdFx0ICovXG5cdFx0dGhpcy50dXJuSGlzdG9yeSA9IFtdO1xuXG5cdFx0Lypcblx0XHQgKiBNYXAgbGluZSB0eXBlcyB0byBzb21lIHByb3BlcnRpZXNcblx0XHQgKi9cblx0XHR0aGlzLmxpbmVNYXBwaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHQnaG9yaXpvbnRhbC10b3AnOiB7XG5cdFx0XHRcdFx0aW5kZXg6IDAsXG5cdFx0XHRcdFx0bmVpZ2hib3JPZmZzZXQ6IC0odGhpcy5zaXplKSxcblx0XHRcdFx0XHRuZWlnaGJvclNoYXJlZExpbmVUeXBlOiAnaG9yaXpvbnRhbC1ib3R0b20nLFxuXHRcdFx0XHRcdG5laWdoYm9ySXNWaWFibGU6IChpKSA9PiB7IHJldHVybiB0cnVlIH1cblx0XHRcdFx0fSxcblx0XHRcdFx0J3ZlcnRpY2FsLXJpZ2h0Jzoge1xuXHRcdFx0XHRcdGluZGV4OiAxLFxuXHRcdFx0XHRcdG5laWdoYm9yT2Zmc2V0OiAxLFxuXHRcdFx0XHRcdG5laWdoYm9yU2hhcmVkTGluZVR5cGU6ICd2ZXJ0aWNhbC1sZWZ0Jyxcblx0XHRcdFx0XHRuZWlnaGJvcklzVmlhYmxlOiAoaSkgPT4geyByZXR1cm4gKChpKzEpICUgdGhpcy5zaXplKSAhPT0gMCB9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdCdob3Jpem9udGFsLWJvdHRvbSc6IHtcblx0XHRcdFx0XHRpbmRleDogMixcblx0XHRcdFx0XHRuZWlnaGJvck9mZnNldDogKHRoaXMuc2l6ZSksXG5cdFx0XHRcdFx0bmVpZ2hib3JTaGFyZWRMaW5lVHlwZTogJ2hvcml6b250YWwtdG9wJyxcblx0XHRcdFx0XHRuZWlnaGJvcklzVmlhYmxlOiAoaSkgPT4geyByZXR1cm4gdHJ1ZSB9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdCd2ZXJ0aWNhbC1sZWZ0Jzoge1xuXHRcdFx0XHRcdGluZGV4OiAzLFxuXHRcdFx0XHRcdG5laWdoYm9yT2Zmc2V0OiAtMSxcblx0XHRcdFx0XHRuZWlnaGJvclNoYXJlZExpbmVUeXBlOiAndmVydGljYWwtcmlnaHQnLFxuXHRcdFx0XHRcdG5laWdoYm9ySXNWaWFibGU6IChpKSA9PiB7IHJldHVybiAoKGkpICUgdGhpcy5zaXplKSAhPT0gMCB9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LmJpbmQodGhpcylcblxuXHRcdC8vYm94ZXMgYW5kIGRvdHMgYXJyYXlzXG5cdFx0Ly9odHRwOi8vanNwZXJmLmNvbS9jcmVhdGUtYXJyYXktd2l0aC1kZWZhdWx0LXZhbHVlcy8yXG5cdFx0dmFyIGRvdHMgPSBbXTtcblx0XHR2YXIgYm94ZXMgPSBbXTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtRG90czsgaSsrKSB7XG5cdFx0XHRkb3RzW2ldID0gbmV3IERvdCgpO1xuXHRcdH1cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtQm94ZXM7IGkrKykge1xuXHRcdFx0Ym94ZXNbaV0gPSBuZXcgQm94KHRoaXMpO1xuXHRcdH1cblxuXHRcdC8qXG5cdFx0ICogRGVmaW5lIGluaXRpYWwgc3RhdGUgb2JqXG5cdFx0ICovXG5cdFx0dGhpcy5zdGF0ZSA9IHtcblx0XHRcdHR1cm46ICdyZWQnLFxuXHRcdFx0c2VsZWN0ZWREb3Q6IG51bGwsXG5cdFx0XHRkb3RzOiBkb3RzLFxuXHRcdFx0Ym94ZXM6IGJveGVzLFxuXHRcdFx0ZG9uZTogZmFsc2Vcblx0XHR9XG5cblx0fVxuXG5cblx0Lypcblx0ICogSW5pdGlhdGUgdGhlIGdhbWVcblx0ICovXG5cdHN0YXJ0KCkge1xuXHRcdHRoaXMucmVuZGVyQm9hcmQoKTtcblx0XHR0aGlzLnNldEV2ZW50TGlzdGVuZXJzKCk7XG5cdH1cblxuXHQvKlxuXHQgKiBHZW5lcmF0ZSB0aGUgZ2FtZSBib2FyZCBkb3RzIGFuZCBib3hlc1xuXHQgKi9cblx0cmVuZGVyQm9hcmQoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0Lypcblx0XHQgKiBJbmplY3QgdGhlIGJveGVzIGFuZCBkb3RzIGNvbnRhaW5lcnNcblx0XHQgKi9cblx0XHQkKHNlbGYuY29udGFpbmVyKS5lbXB0eSgpO1xuXHRcdCQoc2VsZi5jb250YWluZXIpLmFwcGVuZCgnPGRpdiBpZD1cImJveGVzLWNvbnRhaW5lclwiPjwvZGl2PicpO1xuXHRcdCQoc2VsZi5jb250YWluZXIpLmFwcGVuZCgnPGRpdiBpZD1cImRvdHMtY29udGFpbmVyXCI+PC9kaXY+Jyk7XG5cdFx0JChzZWxmLmNvbnRhaW5lcikuYXBwZW5kKCc8ZGl2IGlkPVwidHVybnMtY29udGFpbmVyXCI+PC9kaXY+Jyk7XG5cblx0XHRzZWxmLiRib3hlc0NvbnRhaW5lciA9ICQoc2VsZi5jb250YWluZXIpLmZpbmQoJyNib3hlcy1jb250YWluZXInKTtcblx0XHRzZWxmLiRkb3RzQ29udGFpbmVyID0gJChzZWxmLmNvbnRhaW5lcikuZmluZCgnI2RvdHMtY29udGFpbmVyJyk7XG5cdFx0c2VsZi4kdHVybnNDb250YWluZXIgPSAkKHNlbGYuY29udGFpbmVyKS5maW5kKCcjdHVybnMtY29udGFpbmVyJyk7XG5cblx0XHRzZWxmLiR0dXJuc0NvbnRhaW5lci5odG1sKFxuXHRcdFx0JzxkaXYgY2xhc3M9XCJpbi1nYW1lLW1lc3NhZ2VcIj5HbyBhaGVhZCwgPHNwYW4gY2xhc3M9XCInK3RoaXMuc3RhdGUudHVybisnXCI+Jyt0aGlzLnN0YXRlLnR1cm4udG9VcHBlckNhc2UoKSsnPC9zcGFuPiE8L2Rpdj4nK1xuXHRcdFx0JzxwIGNsYXNzPVwiZW5kLWdhbWUtbWVzc2FnZVwiPicrdGhpcy5zdGF0ZS5lbmRnYW1lTWVzc2FnZSsnPC9wPidcblx0XHQpXG5cblx0XHRzZWxmLnVwZGF0ZVR1cm5zVmlld1dpdGhTdGF0ZShzZWxmLiR0dXJuc0NvbnRhaW5lcik7XG5cblx0XHQvKlxuXHRcdCAqIExvb3AgdGhyb3VnaCBhbmQgYWRkIGFsbCBkb3RzIGFuZCBib3hlc1xuXHRcdCAqICAtIHN0YXRlIHNldHMgbW9kaWZpZXIgY2xhc3Nlc1xuXHRcdCAqL1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5udW1Eb3RzOyBpKyspIHtcblx0XHRcdFxuXHRcdFx0dmFyIHJvdyA9IE1hdGguZmxvb3IoKGkpL3NlbGYuc2l6ZSk7XG5cdFx0XHR2YXIgY29sID0gKGkgJSBzZWxmLnNpemUpO1xuXG5cdFx0XHQvL2FkZCBkb3Rcblx0XHRcdHZhciAkZG90ID0gJCgnPGRpdiBjbGFzcz1cImRvdFwiIGRhdGEtcm93PVwiJytyb3crJ1wiIGRhdGEtY29sPVwiJytjb2wrICdcIiBkYXRhLWluZGV4PVwiJytpKydcIj48L2Rpdj4nKS5hcHBlbmRUbyhzZWxmLiRkb3RzQ29udGFpbmVyKTtcblx0XHRcdFxuXHRcdFx0Ly9zZXRTdGF0ZVxuXHRcdFx0c2VsZi51cGRhdGVEb3RWaWV3V2l0aFN0YXRlKCRkb3QsIGkpO1xuXG5cdFx0XHQvL2Rvbid0IG5lZWQgYXMgbWFueSBib3hlcyBhcyB3ZSBkbyBkb3RzXG5cdFx0XHRpZihpIDwgc2VsZi5udW1Cb3hlcykge1xuXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGkgKyAnOiBpICUgNCA9ICcrIChpICUgNCkpXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGkgKyAnOiBpICUgMTYgPSAnKyAoaSAlIDE2KSlcblxuXHRcdFx0XHR2YXIgY3NzID0ge1xuXHRcdFx0XHRcdHRvcDogKDk1ICogcm93KSArIDUsXG5cdFx0XHRcdFx0bGVmdDogKDk1ICogY29sKSArIDVcblx0XHRcdFx0fTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vYWRkIGJveFxuXHRcdFx0XHR2YXIgJGJveCA9ICQoXG5cdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJib3hcIiBkYXRhLXJvdz1cIicrcm93KydcIiBkYXRhLWNvbD1cIicrY29sKyAnXCIgZGF0YS1pbmRleD1cIicraSsnXCI+JyArXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImxpbmUgdHlwZS1ob3Jpem9udGFsLXRvcFwiIGRhdGEtdHlwZT1cImhvcml6b250YWwtdG9wXCI+PC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImxpbmUgdHlwZS12ZXJ0aWNhbC1yaWdodFwiIGRhdGEtdHlwZT1cInZlcnRpY2FsLXJpZ2h0XCI+PC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImxpbmUgdHlwZS1ob3Jpem9udGFsLWJvdHRvbVwiIGRhdGEtdHlwZT1cImhvcml6b250YWwtYm90dG9tXCI+PC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImxpbmUgdHlwZS12ZXJ0aWNhbC1sZWZ0XCIgZGF0YS10eXBlPVwidmVydGljYWwtbGVmdFwiPjwvZGl2PicgK1xuXHRcdFx0XHRcdCc8L2Rpdj4nKVxuXHRcdFx0XHRcdC5hcHBlbmRUbyhzZWxmLiRib3hlc0NvbnRhaW5lcik7XG5cdFx0XHRcdFxuXHRcdFx0XHQvL3Bvc2l0aW9uIGJveFxuXHRcdFx0XHQkYm94LmNzcyhjc3MpO1xuXG5cdFx0XHRcdC8vc2V0IHN0YXRlXG5cdFx0XHRcdHNlbGYudXBkYXRlQm94Vmlld1dpdGhTdGF0ZSgkYm94LCBpKTtcblx0XHRcdH1cblxuXHRcdH07XG5cblx0fVxuXG5cdHVwZGF0ZVR1cm5zVmlld1dpdGhTdGF0ZSgkdHVybnNDb250YWluZXIpIHtcblx0XHRpZiAodGhpcy5zdGF0ZS5kb25lKSB7XG5cdFx0XHQkdHVybnNDb250YWluZXIuYWRkQ2xhc3MoJ2VuZC1nYW1lJyk7XG5cdFx0fVxuXHR9XG5cblx0dXBkYXRlRG90Vmlld1dpdGhTdGF0ZSgkZG90LCBpKSB7XG5cdFx0Ly8gY29uc29sZS5sb2coJGRvdCwgaSlcblx0XHQvLyBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLmRvdHNbaV0pXG5cdFx0dmFyIGRvdCA9IHRoaXMuc3RhdGUuZG90c1tpXTtcblxuXHRcdCRkb3QucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkLCB2aWFibGUnKTtcblx0XHRpZiAoZG90LnNlbGVjdGVkKSB7ICRkb3QuYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7IH1cblx0XHRpZiAoZG90LnZpYWJsZSkgeyAkZG90LmFkZENsYXNzKCd2aWFibGUnKTsgfVxuXHRcdFxuXHR9XG5cblx0dXBkYXRlQm94Vmlld1dpdGhTdGF0ZSgkYm94LCBpKSB7XG5cdFx0Ly8gY29uc29sZS5sb2coJGJveCwgaSlcblx0XHQvLyBjb25zb2xlLmxvZyh0aGlzLnN0YXRlLmJveGVzW2ldKVxuXHRcdHZhciBib3ggPSB0aGlzLnN0YXRlLmJveGVzW2ldO1xuXHRcdFxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYm94LmxpbmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoYm94LmxpbmVzW2ldKSB7XG5cdFx0XHRcdCRib3guZmluZCgnLmxpbmU6ZXEoJytpKycpJykuYWRkQ2xhc3MoJ3NlbGVjdGVkLScrYm94LmxpbmVzW2ldKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChib3guY2xvc2VkQnkpIHtcblx0XHRcdCRib3guYWRkQ2xhc3MoYm94LmNsb3NlZEJ5KTtcblx0XHR9XG5cdH1cblxuXHRoYW5kbGVEb3RDbGljayhlKSB7XG5cdFx0dmFyICRkb3QgPSAkKGUudGFyZ2V0KTtcblx0XHR2YXIgaW5kZXggPSAkZG90LmluZGV4KCk7XG5cdFx0dmFyIGRvdCA9IHRoaXMuc3RhdGUuZG90c1tpbmRleF07XG5cblx0XHRpZiAoZG90LnZpYWJsZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2RvdCBpcyB2aWFibGUsIHNob3VsZCBtYWtlIGxpbmUhJyk7XG5cdFx0XHR0aGlzLm1ha2VMaW5lKGluZGV4KVxuXHRcdH0gZWxzZSBpZiAoIWRvdC5zZWxlY3RlZCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2RvdCBpcyBub3Qgc2VsZWN0ZWQsIG1ha2UgaXQgc2VsZWN0ZWQnKVxuXHRcdFx0dGhpcy5zdGF0ZS5zZWxlY3RlZERvdCA9IGluZGV4O1xuXHRcdFx0ZG90LnNldFN0YXRlKHsgc2VsZWN0ZWQ6IHRydWUsIHZpYWJsZTogZmFsc2UgfSk7XG5cdFx0XHR0aGlzLnNldFZpYWJsZURvdHMoaW5kZXgpO1xuXHRcdH1cblxuXHRcdHRoaXMucmVuZGVyQm9hcmQoKTtcblx0fVxuXG5cdGhhbmRsZUxpbmVDbGljayhlKSB7XG5cdFx0dmFyICRsaW5lID0gJChlLnRhcmdldCk7XG5cdFx0dmFyICRib3ggPSAkbGluZS5wYXJlbnQoKTtcblx0XHR2YXIgaW5kZXggPSAkYm94LmluZGV4KCk7XG5cdFx0dmFyIGJveCA9IHRoaXMuc3RhdGUuYm94ZXNbaW5kZXhdO1xuXHRcdHRoaXMuc3RhdGUudHVybkNvdW50ID0gdGhpcy50dXJuSGlzdG9yeS5sZW5ndGg7XG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJ3RoaXMuc3RhdGUudHVybkNvdW50OiAnK3RoaXMuc3RhdGUudHVybkNvdW50KTtcblxuXHRcdHRoaXMudXBkYXRlQm94U3RhdGVzKGJveCwgJGxpbmUsIGluZGV4KTtcblxuXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXG5cdFx0XHR0aGlzLmFzc2Vzc0NvbXBsZXRpb24oKTtcblx0XHRcdHRoaXMucmVuZGVyQm9hcmQoKTtcblxuXHRcdH0sIDEwMCk7XG5cdH1cblxuXHQvKlxuXHQgKiBDaGVjayBmb3IgY29tcGxldGlvbiBvZiBnYW1lXG5cdCAqL1xuXHRhc3Nlc3NDb21wbGV0aW9uKCkge1xuXHRcdFxuXHRcdHZhciBjbG9zZWRDb3VudCA9IHRoaXMuc3RhdGUuYm94ZXMuZmlsdGVyKGZ1bmN0aW9uKGJveCkge1xuXHQgXHRcdHJldHVybiBib3guY2xvc2VkQnkgIT09IGZhbHNlXG5cdCBcdH0pLmxlbmd0aDtcblx0IFx0XG5cdFx0Ly9jaGVjayBpZiBkb25lXG5cdFx0aWYgKGNsb3NlZENvdW50ID09PSAxNikge1xuXG5cdFx0IFx0dmFyIGJsdWUgPSB0aGlzLnN0YXRlLmJveGVzLmZpbHRlcihmdW5jdGlvbihib3gpIHsgcmV0dXJuIGJveC5jbG9zZWRCeSA9PSAnYmx1ZScgfSk7XG5cdFx0XHR2YXIgcmVkID0gdGhpcy5zdGF0ZS5ib3hlcy5maWx0ZXIoZnVuY3Rpb24oYm94KSB7IHJldHVybiBib3guY2xvc2VkQnkgPT0gJ3JlZCcgfSk7XG5cblx0XHRcdC8vdHVybiBvZmYgY2xpY2thYmlsaXR5XG5cdFx0XHQkKHRoaXMuY29udGFpbmVyKS5vZmYoJ2NsaWNrJywgJy5saW5lJyk7XG5cblx0XHRcdC8vc2V0IGZpbmFsIG1lc3NhZ2luZ1xuXHRcdFx0aWYgKGJsdWUubGVuZ3RoID09PSByZWQubGVuZ3RoKSB7XG5cdFx0XHRcdHRoaXMuc3RhdGUuZW5kZ2FtZU1lc3NhZ2UgPSAnRHJhdy4gVmFsaWFudCBlZmZvcnQgUmVkIGFuZCBCbHVlISc7XG5cdFx0XHR9IGVsc2UgaWYgKGJsdWUubGVuZ3RoID4gcmVkLmxlbmd0aCkge1xuXHRcdFx0XHR0aGlzLnN0YXRlLmVuZGdhbWVNZXNzYWdlID0gJ0dvb2Qgam9iLCBCbHVlISBZb3Ugd2luLic7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnN0YXRlLmVuZGdhbWVNZXNzYWdlID0gJ0dvb2Qgam9iLCBSZWQhIFlvdSB3aW4uJztcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zdGF0ZS5kb25lID0gdHJ1ZTtcblxuXHRcdC8vZWxzZSBpZiBzdGlsbCBwbGF5aW5nXG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLnR1cm5Db3VudCAtIHRoaXMudHVybkhpc3RvcnkubGVuZ3RoIDwgMCkge1xuXHRcdFx0dGhpcy5jaGFuZ2VUdXJuKCk7XG5cdFx0fVxuXG5cdH1cblxuXHQvKlxuXHQgKiBVcGRhdGUgY2xpY2tlZCBsaW5lIGFuZCBhY2NvdW50IGZvciBuZWlnaGJvcmluZyBcImR1cGxpY2F0ZVwiIGxpbmVzIHRvb1xuXHQgKi9cblx0dXBkYXRlQm94U3RhdGVzKGJveCwgJGxpbmUsIGkpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIGxtID0gc2VsZi5saW5lTWFwcGluZygpO1xuXHRcdHZhciBsaW5lVHlwZSA9ICRsaW5lLmRhdGEoJ3R5cGUnKTtcblx0XHR2YXIgbGluZVR5cGVJbmRleCA9IGxtW2xpbmVUeXBlXS5pbmRleDtcblxuXHRcdC8vaWYgbGluZSBub3QgeWV0IHNldCwgc2V0IGl0XG5cdFx0aWYgKCFib3gubGluZXNbbGluZVR5cGVJbmRleF0pIHtcblx0XHRcdHVwZGF0ZUxpbmUoYm94LCBsaW5lVHlwZUluZGV4KTtcblx0XHR9XG5cblx0XHQvL2NoZWNrIGZvciBuZWlnaGJvcmluZyBkdXAgbGluZXMgdG8gc2V0XG5cdFx0T2JqZWN0LmtleXMobG0pLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRpZiAobGluZVR5cGUgPT09IGtleSAmJiBsbVtrZXldLm5laWdoYm9ySXNWaWFibGUoaSkpIHtcblx0XHRcdFx0dmFyIG5laWdoYm9ySW5kZXggPSBsbVtrZXldLm5laWdoYm9yT2Zmc2V0O1xuXHRcdFx0XHR2YXIgbmVpZ2hib3JCb3ggPSBzZWxmLnN0YXRlLmJveGVzW2kgKyBuZWlnaGJvckluZGV4XTtcblx0XHRcdFx0aWYgKG5laWdoYm9yQm94KSB7XG5cdFx0XHRcdFx0dmFyIG5laWdoYm9yTGluZVR5cGUgPSBsbVtrZXldLm5laWdoYm9yU2hhcmVkTGluZVR5cGU7XG5cdFx0XHRcdFx0dmFyIG5laWdoYm9yTGluZVR5cGVJbmRleCA9IGxtW25laWdoYm9yTGluZVR5cGVdLmluZGV4O1xuXHRcdFx0XHRcdHVwZGF0ZUxpbmUobmVpZ2hib3JCb3gsIG5laWdoYm9yTGluZVR5cGVJbmRleCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vY3JlYXRlcyBuZXcgbGluZXMgYXJyYXkgYW5kIHNldHMgbmV3IHN0YXRlIG9mIGdpdmVuIGJveCBpbnN0YW5jZVxuXHRcdGZ1bmN0aW9uIHVwZGF0ZUxpbmUoYm94LCBsaW5lSW5kZXgpIHtcblx0XHRcdHZhciBuZXdMaW5lc0RhdGEgPSBib3gubGluZXMubWFwKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KXtcblx0XHRcdFx0cmV0dXJuIGluZGV4ID09IGxpbmVJbmRleCA/IHNlbGYuc3RhdGUudHVybiA6IGl0ZW07XG5cdFx0XHR9KTtcblx0XHRcdGJveC5zZXRTdGF0ZSh7IGxpbmVzOiBuZXdMaW5lc0RhdGEgfSk7XG5cdFx0fVxuXHR9XG5cblx0Y2hhbmdlVHVybigpIHtcblx0XHRjb25zb2xlLmxvZyh0aGlzLnN0YXRlLnR1cm4pO1xuXHRcdHZhciB0dXJuID0gdGhpcy5zdGF0ZS50dXJuO1xuXHRcdGlmICh0dXJuID09PSAncmVkJykge1xuXHRcdFx0dHVybiA9ICdibHVlJztcblx0XHR9IGVsc2Uge1xuXHRcdFx0dHVybiA9ICdyZWQnXG5cdFx0fVxuXG5cdFx0dGhpcy5zdGF0ZS50dXJuID0gdHVybjtcblxuXHRcdHJldHVybiB0dXJuO1xuXHR9XG5cblx0Lypcblx0ICogRXZlbnQgTGlzdGVuZXJzXG5cdCAqIFNlZTogaHR0cDovL2VzNnJvY2tzLmNvbS8yMDE0LzEwL2Fycm93LWZ1bmN0aW9ucy1hbmQtdGhlaXItc2NvcGUvXG5cdCAqL1xuXHRzZXRFdmVudExpc3RlbmVycygpIHtcblx0XHQvLyAkKHRoaXMuY29udGFpbmVyKS5vbignY2xpY2snLCAnLmRvdCcsIGV2ZW50ID0+IHRoaXMuaGFuZGxlRG90Q2xpY2soZXZlbnQsIHRoaXMpKTtcblx0XHQkKHRoaXMuY29udGFpbmVyKS5vbignY2xpY2snLCAnLmxpbmUnLCBldmVudCA9PiB0aGlzLmhhbmRsZUxpbmVDbGljayhldmVudCwgdGhpcykpO1xuXHR9XG5cbn1cblxuY2xhc3MgRG90IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdHRoaXMudmlhYmxlID0gZmFsc2U7XG5cdH1cblxuXHRzZXRTdGF0ZShvYmopIHtcblx0XHRpZiAob2JqLnNlbGVjdGVkICE9IHVuZGVmaW5lZCkgdGhpcy5zZWxlY3RlZCA9IG9iai5zZWxlY3RlZDtcblx0XHRpZiAob2JqLnZpYWJsZSAhPSB1bmRlZmluZWQpIHRoaXMudmlhYmxlID0gb2JqLnZpYWJsZTtcblx0fVxuXG59XG5cbmNsYXNzIEJveCB7XG5cdGNvbnN0cnVjdG9yKGdhbWUpIHtcblx0XHR0aGlzLmNsb3NlZEJ5ID0gZmFsc2U7XG5cdFx0dGhpcy5saW5lcyA9IFtmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZV07XG5cdFx0dGhpcy5nYW1lID0gZ2FtZTtcblx0fVxuXG5cdHNldFN0YXRlKG9iaikge1xuXHRcdGlmIChvYmoubGluZXMgIT0gdW5kZWZpbmVkKSB0aGlzLmxpbmVzID0gb2JqLmxpbmVzO1xuXHRcdHRoaXMudmFsaWRhdGUoKTtcblx0fVxuXG5cdHZhbGlkYXRlKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgc2VsZWN0ZWRMaW5lQ291bnQgPSAwXG5cdFx0dmFyIHJlZFR1cm5zID0gMDtcblx0XHR2YXIgYmx1ZVR1cm5zID0gMDtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLmxpbmVzW2ldKSB7XG5cdFx0XHRcdHNlbGVjdGVkTGluZUNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHNlbGVjdGVkTGluZUNvdW50ID09PSA0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygndGhpcyBib3ggd2FzIGNsb3NlZCBieSAnICsgdGhpcy5nYW1lLnN0YXRlLnR1cm4gKycgc28gdGhleSBzaG91bGQgZ28gYWdhaW4hJylcblx0XHRcdHRoaXMuY2xvc2VkQnkgPSB0aGlzLmdhbWUuc3RhdGUudHVybjtcblx0XHRcdHRoaXMuZ2FtZS50dXJuSGlzdG9yeS5wb3AoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gc2V0VGltZW91dCgoKSA9PiB0aGlzLmdhbWUuY2hhbmdlVHVybigpLCAxMDAwKTtcblx0XHRcdGNvbnNvbGUubG9nKCdub2JvZHkgY2xvc2VkIHRoaXMgYm94IHlldCcpO1xuXHRcdFx0dGhpcy5nYW1lLnR1cm5IaXN0b3J5LnB1c2godGhpcy5nYW1lLnN0YXRlLnR1cm4pO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7Il19
