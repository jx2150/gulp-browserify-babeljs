class Game{

	constructor(mountNode, size) {
		
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
		this.numBoxes = (this.size * this.size);

		/*
		 * Number of dots
		 */
		this.numDots = ((this.size + 1) * (this.size + 1));

		/*
		 * Turn history
		 */
		this.turnHistory = [];

		/*
		 * Map line types to some properties
		 */
		this.lineMapping = function() {
			return {
				'horizontal-top': {
					index: 0,
					neighborOffset: -(this.size),
					neighborSharedLineType: 'horizontal-bottom',
					neighborIsViable: (i) => { return true }
				},
				'vertical-right': {
					index: 1,
					neighborOffset: 1,
					neighborSharedLineType: 'vertical-left',
					neighborIsViable: (i) => { return ((i+1) % this.size) !== 0 }
				},
				'horizontal-bottom': {
					index: 2,
					neighborOffset: (this.size),
					neighborSharedLineType: 'horizontal-top',
					neighborIsViable: (i) => { return true }
				},
				'vertical-left': {
					index: 3,
					neighborOffset: -1,
					neighborSharedLineType: 'vertical-right',
					neighborIsViable: (i) => { return ((i) % this.size) !== 0 }
				}
			}
		}.bind(this)

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
		}

	}


	/*
	 * Initiate the game
	 */
	start() {
		this.renderBoard();
		this.setEventListeners();
	}

	/*
	 * Generate the game board dots and boxes
	 */
	renderBoard() {
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

		self.$turnsContainer.html(
			'<div class="in-game-message">Go ahead, <span class="'+this.state.turn+'">'+this.state.turn.toUpperCase()+'</span>!</div>'+
			'<p class="end-game-message">'+this.state.endgameMessage+'</p>'
		)

		self.updateTurnsViewWithState(self.$turnsContainer);

		/*
		 * Loop through and add all dots and boxes
		 *  - state sets modifier classes
		 */
		for (var i = 0; i < self.numDots; i++) {
			
			var row = Math.floor((i)/self.size);
			var col = (i % self.size);

			//add dot
			var $dot = $('<div class="dot" data-row="'+row+'" data-col="'+col+ '" data-index="'+i+'"></div>').appendTo(self.$dotsContainer);
			
			//setState
			self.updateDotViewWithState($dot, i);

			//don't need as many boxes as we do dots
			if(i < self.numBoxes) {

				// console.log(i + ': i % 4 = '+ (i % 4))
				// console.log(i + ': i % 16 = '+ (i % 16))

				var css = {
					top: (95 * row) + 5,
					left: (95 * col) + 5
				};
				
				//add box
				var $box = $(
					'<div class="box" data-row="'+row+'" data-col="'+col+ '" data-index="'+i+'">' +
						'<div class="line type-horizontal-top" data-type="horizontal-top"></div>' +
						'<div class="line type-vertical-right" data-type="vertical-right"></div>' +
						'<div class="line type-horizontal-bottom" data-type="horizontal-bottom"></div>' +
						'<div class="line type-vertical-left" data-type="vertical-left"></div>' +
					'</div>')
					.appendTo(self.$boxesContainer);
				
				//position box
				$box.css(css);

				//set state
				self.updateBoxViewWithState($box, i);
			}

		};

	}

	updateTurnsViewWithState($turnsContainer) {
		if (this.state.done) {
			$turnsContainer.addClass('end-game');
		}
	}

	updateDotViewWithState($dot, i) {
		// console.log($dot, i)
		// console.log(this.state.dots[i])
		var dot = this.state.dots[i];

		$dot.removeClass('selected, viable');
		if (dot.selected) { $dot.addClass('selected'); }
		if (dot.viable) { $dot.addClass('viable'); }
		
	}

	updateBoxViewWithState($box, i) {
		// console.log($box, i)
		// console.log(this.state.boxes[i])
		var box = this.state.boxes[i];
		
		for (var i = 0; i < box.lines.length; i++) {
			if (box.lines[i]) {
				$box.find('.line:eq('+i+')').addClass('selected-'+box.lines[i])
			}
		}

		if (box.closedBy) {
			$box.addClass(box.closedBy);
		}
	}

	handleDotClick(e) {
		var $dot = $(e.target);
		var index = $dot.index();
		var dot = this.state.dots[index];

		if (dot.viable) {
			console.log('dot is viable, should make line!');
			this.makeLine(index)
		} else if (!dot.selected) {
			console.log('dot is not selected, make it selected')
			this.state.selectedDot = index;
			dot.setState({ selected: true, viable: false });
			this.setViableDots(index);
		}

		this.renderBoard();
	}

	handleLineClick(e) {
		var $line = $(e.target);
		var $box = $line.parent();
		var index = $box.index();
		var box = this.state.boxes[index];
		this.state.turnCount = this.turnHistory.length;
		
		console.log('this.state.turnCount: '+this.state.turnCount);

		this.updateBoxStates(box, $line, index);

		setTimeout(() => {

			this.assessCompletion();
			this.renderBoard();

		}, 100);
	}

	/*
	 * Check for completion of game
	 */
	assessCompletion() {
		
		var closedCount = this.state.boxes.filter(function(box) {
	 		return box.closedBy !== false
	 	}).length;
	 	
		//check if done
		if (closedCount === 16) {

		 	var blue = this.state.boxes.filter(function(box) { return box.closedBy == 'blue' });
			var red = this.state.boxes.filter(function(box) { return box.closedBy == 'red' });

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

	/*
	 * Update clicked line and account for neighboring "duplicate" lines too
	 */
	updateBoxStates(box, $line, i) {
		var self = this;
		var lm = self.lineMapping();
		var lineType = $line.data('type');
		var lineTypeIndex = lm[lineType].index;

		//if line not yet set, set it
		if (!box.lines[lineTypeIndex]) {
			updateLine(box, lineTypeIndex);
		}

		//check for neighboring dup lines to set
		Object.keys(lm).forEach(function(key) {
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
			var newLinesData = box.lines.map(function(item, index){
				return index == lineIndex ? self.state.turn : item;
			});
			box.setState({ lines: newLinesData });
		}
	}

	changeTurn() {
		console.log(this.state.turn);
		var turn = this.state.turn;
		if (turn === 'red') {
			turn = 'blue';
		} else {
			turn = 'red'
		}

		this.state.turn = turn;

		return turn;
	}

	/*
	 * Event Listeners
	 * See: http://es6rocks.com/2014/10/arrow-functions-and-their-scope/
	 */
	setEventListeners() {
		// $(this.container).on('click', '.dot', event => this.handleDotClick(event, this));
		$(this.container).on('click', '.line', event => this.handleLineClick(event, this));
	}

}

class Dot {
	constructor() {
		this.selected = false;
		this.viable = false;
	}

	setState(obj) {
		if (obj.selected != undefined) this.selected = obj.selected;
		if (obj.viable != undefined) this.viable = obj.viable;
	}

}

class Box {
	constructor(game) {
		this.closedBy = false;
		this.lines = [false, false, false, false];
		this.game = game;
	}

	setState(obj) {
		if (obj.lines != undefined) this.lines = obj.lines;
		this.validate();
	}

	validate() {
		var self = this;
		var selectedLineCount = 0
		var redTurns = 0;
		var blueTurns = 0;
		for (var i = 0; i < this.lines.length; i++) {
			if (this.lines[i]) {
				selectedLineCount++;
			}
		}

		if (selectedLineCount === 4) {
			console.log('this box was closed by ' + this.game.state.turn +' so they should go again!')
			this.closedBy = this.game.state.turn;
			this.game.turnHistory.pop();
		} else {
			// setTimeout(() => this.game.changeTurn(), 1000);
			console.log('nobody closed this box yet');
			this.game.turnHistory.push(this.game.state.turn);
		}
	}
}

module.exports = Game;