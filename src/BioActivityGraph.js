'use strict';

// import { saveAs } from 'file-saver';
const d3 = require('d3');

/**
 * @class BioActivityGraph
 * @classdesc Used to display the bioactivity levels of a given compound in their
 * corresponding report page
 * @author Rodolfo Allendes
 * @version 2.0 Removed React
 */
export class BioActivityGraph {
	/**
	 * Initialize an instance of BioActivityGraph
	 *
	 * @param {object} chemblObj The object returned by the query performed on
	 * TargetMine
	 */
	constructor(chemblObj) {
		/* exit if there is no data to display */
		if (chemblObj === undefined || chemblObj.targetProteins.length === 0) {
			d3.select('div#bioActivityGraph')
				.text('No BioActivity Data to Display.');
			return;
		}
		/* width and height of the canvas, together with margins for the graph */
		this._width = 400;
		this._height = 400;
		this._margin = { top: 40, right: 40, bottom: 40, left: 40 };
		/* used for the display of violin plots associated to the data points */
		this._bins = undefined;
		/* the list of colors and shapes used to display data points */
		this._colors = new Map([['Default', '#C0C0C0']]);
		this._shapes = new Map([['Default', 'Circle']]);
		
		/* initilize points */
		this._data = this.loadData(chemblObj.targetProteins);
		/* Initialize the Axis of the graph */
		this._xAxis = this.initXAxis();
		this._yAxis = this.initYAxis();
		/* Initialize data points, position, color and shape */
		this.updatePointPositions();
		this.updatePointColors();
		this.updatePointShapes();
		/* Initialize histogram for violin plots display */
		this.initHistogramBins();
		/* Update DOM elements */
		this.updateTableColor();
		this.updateTableShape();
		this.initFunctions();
		/* Plot the graph */
		this.plotXAxis();
		this.plotYAxis();
		this.plotData();
	}

	/**
	 * 
	 */
	initFunctions() {
		let self = this;
		/* Right control buttons */
		d3.selectAll('#rightColumn_bioActivity button')
			.on('click', function(){ 
				self.modalDisplay(this.value);
			});
		/* Modal inputs */
		d3.selectAll('#bioActivityGraph div.im-modal div#panel-body-category')
			.on('change', function(){ self.updateModalOptions(); })
			.dispatch('change');
		d3.select('#modal-apply').on('click', function(){ self.modalOK(); });
		d3.select('#bioActivityGraph div.im-modal a.close')
			.on('click', function(){
				d3.select('#bioActivityGraph div.im-modal')
					.style('display', 'none');
			});
	}

	/**
	 * Initialize the graph's data distribution bins
	 * Histogram bins are used for the display of violin of the data. A single
	 * violin plot is associated to each tick along the xAxis of the graph.
	 * tic
	 *
	 * @param {number} nBins The number of bins to use. Default value 10
	 */
	initHistogramBins(nBins=10){
		let self = this;
		/* function used to define the number of bins and the bounds for each of
			* them */
		let histogram = d3.bin()
			.domain(self._yAxis.scale().domain())
			.thresholds(self._yAxis.scale().ticks(nBins))
			.value(d => d);
		/* actually bin the data points */
		this._bins = d3.rollup(
			self._data,
			p => {
				let input = p.map( g => g.value);
				let bins = histogram(input);
				return bins;
			},
			d => d.type
		);
	}

	/**
	 * Initialize the X axis of the graph
	 * As the X axis will be ordinal, in order to generate the list of ticks in
	 * the axis, we use the current this._xLabels
	 */
	initXAxis() {
		let labels = this._data.reduce((p,c) => p.add(c.type), new Set());
		/* use the scaleBand scale provided by D3 */
		let scale = d3.scaleBand()
			.domain([...labels.keys()])
			.range([0, this._width - this._margin.left - this._margin.right])
			.padding(0.05);
		return d3.axisBottom(scale);
	}

	/**
	 * Initialize the Y axis of the graph
	 * The Y axis will always be numerical with a logarithmic scale.
	 * The axis will be generated based on the min and max bioactivity values
	 * found in the list of target proteins
	 */
	initYAxis() {
		/* find the min and max bioactivity values values*/
		let [min,max] = this._data.reduce((p,c) => {
			p[0] = Math.min(c.value, p[0]);
			p[1] = Math.max(c.value, p[1]);
			return p;
		}, [+Infinity, -Infinity]);
		/* initialize the logarithmic scale */
		let scale = d3
			.scaleLog()
			.domain([min, max])
			.range([this._height - this._margin.bottom, this._margin.top])
			.nice();
		return d3.axisLeft(scale).ticks(10, '~g');
	}

	/**
	 * Load data for graph display
	 * Data is provided by TargetMine in the form of an Array of Target Protein
	 * objects. Each of these needs to be processed in order to retrieve the
	 * bioactivity values associated with each.
	 *
	 * @param {array} proteins The array containing all the target protein objects
	 * @returns The array of points representing all the bioactivity values found
	 */
	loadData(proteins) {
		/* we will store all bioactivity values in a single array of points */
		let points = [];
		proteins.forEach(p => {
			p.activities.forEach(a => {
				let point = {
					symbol: p.protein.symbol,
					primaryAccession: p.protein.primaryAccession,
					organism: p.protein.organism.name,
					value: a.conc,
					type: a.type,
					unit: a.unit
				};
				points.push(point);
			});
		});
		return points;
	}

	/**
	 * Display the modal to allow user interaction
	 *
	 * @param {string} type An identifier of the type of modal to be shown, either
	 * 'color' or 'shape'.
	 */
	modalDisplay(type){
		/* Set display to True */
		let modal = d3.select('#bioActivityGraph div#modal-bioActivity')
			.attr('data-type', type)
			.style('display', 'block');
			
		/* If adding a color element, define a new color input  */
		modal.select('h3#panel-title-input')
			.text(`${type} input`);
		// define the color or shape input options
		if( type === 'Color' ){
			modal.select('#panel-body-input').selectAll('*').remove();
			modal.select('#panel-body-input').append('input')
				.attr('id', 'modal-selected')
				.property('type', 'color')
				.property('value', '#000000');
		}
		else{
			let opts = ['Circle','Cross','Diamond','Square','Star','Triangle','Wye'];
			modal.select('#panel-body-input').selectAll('*').remove();
			modal.select('#panel-body-input').selectAll('label')
				.data(opts)
				.join('label')
					.classed('row-label', true)
					.html((d) => `<input type="radio" name="radio-shape" value="${d}">\n${d}`);
		}
	}

	/**
	 * Handle application of color or shape to data.
	 * Once the user selects to apply a specific color or shape to a category of
	 * data, here we handle the update of the color or shape list, and apply the
	 * corresponding change to the dataset.
	 */
	modalOK(){
		/* hide the modal from view */
		let m = d3.select('#bioActivityGraph .im-modal')
			.style('display', 'none');
		/* capture the type of modal and the values that the user selected */
		let type = m.attr('data-type');
		let val = d3.select('#bioActivityGraph .im-modal #panel-body-value input:checked').property('value');
		/* update the corresponding table */
		if( type === 'Color' ){
			let upd = d3.select('#bioActivityGraph .im-modal #panel-body-input input').property('value');
			this._colors.set(val,upd);
			this.updatePointColors();
			this.updateTableColor();
		}
		else{
			let upd = d3.select('#bioActivityGraph .im-modal #panel-body-input input:checked').property('value');
			this._shapes.set(val,upd);
			this.updatePointShapes();
			this.updateTableShape();
		}
		/* redraw the graph */
		this.plotData();
	}

	/**
	 * Plot a BioActivity Graph
	 */
	plotData() {
		/* draw the points, grouped in a single graphics element  */
		d3.select('svg#canvas_bioActivity g#points')
			.attr('transform', 'translate(' + this._margin.left + ', 0)');

		/* Each data point will be d3 symbol (represented using svg paths) 
		 * each point belongs to the 'data-point' class its positioned in the graph
		 * according to the associated (x,y) coordinates and its drawn using its
		 * color and shape */
		d3.select('svg#canvas_bioActivity g#points').selectAll('path')
			.data(this._data)
			.join('path')
				.attr('class', 'data-point')
				.attr('transform', d => 'translate(' + d.x + ' ' + d.y + ')')
				.attr('fill', d => d.color)
				.attr('d', function(d) {
					let s = [
						'Circle',
						'Cross',
						'Diamond',
						'Square',
						'Star',
						'Triangle',
						'Wye'
					];
					let symbol = d3.symbol().size(50).type(d3.symbols[s.indexOf(d.shape)]);
					return symbol();
				})
			/* each point will also have an associated svg title (tooltip) */
			.append('svg:title').text(d => {
				return (
					'Organism: '+d.organism+'\n'+
					'Gene: '+d.symbol+'\n'+
					'Concentation: '+d.value+'nM'
				);
			});
	}
	
	/**
	 *
	 */
	plotViolins(){
		/* add violin strips if requested */
		d3.select('svg#canvas_bioActivity g#violins').remove();
		if(!d3.select('#rightColumn_bioActivity #cb-violin').property('checked')) return; 
		let X = this._xAxis.scale();
		let Y = this._yAxis.scale();
		
		// What is the biggest number of value in a bin? We need it cause this value
		// will have a width of 100% of the bandwidth.
		let maxNum = 0;
		this._bins.forEach(d => {
			let lengths = d.map(g => g.length);
			let longest = d3.max(lengths);
			maxNum = longest > maxNum ? longest : maxNum;
		});
		let xNum = d3.scaleLinear()
			.range([0, X.bandwidth()])
			.domain([-maxNum, maxNum]);

		d3.select('svg#canvas_bioActivity g#graph')
			.append('g')
			.attr('id', 'violins')
			.attr('transform', 'translate('+this._margin.left+', 0)')
			.selectAll('g')
				.data(this._bins)
				.join('g')        // So now we are working group per group
					.classed('violin', true)
					.attr('transform', d => 'translate(' + (X(d[0])+(X.bandwidth()/10)) +' ,0)')
					.append('path')
						.datum(d => d[1]) //extract only the bins
						.attr('class', 'violin')
						.attr('d', d3.area()
							.x0( xNum(0) )
							.x1(function(d){ return(xNum(d.length)); } )
							.y(function(d){ return(Y(d.x0)); } )
							.curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
						);
	}

	/**
	 * Add the X axis to the graph
	 */
	plotXAxis() {
		/* remove previous axis components */
		d3.select('svg#canvas_bioActivity g#bottom-axis')
			.attr('transform', 'translate(' +	this._margin.left +	', ' + (this._height - this._margin.bottom) +	')')
			.call(this._xAxis);
		/* position the title text */
		d3.select('svg#canvas_bioActivity text#bottom-axis-title')
			.attr('transform', 'translate(' +	this._width / 2 +	',' +	(this._height - this._margin.bottom / 3) + ')')
			.style('text-anchor', 'middle');
	}

	/**
	 * Add the Y-axis to the graph
	 */
	plotYAxis() {
		d3.select('svg#canvas_bioActivity g#left-axis')
			.attr('transform', 'translate(' + this._margin.left + ',0)')
			.call(this._yAxis);
		/* position the title */
		d3.select('svg#canvas_bioActivity text#left-axis-title')
			.attr('transform', 'rotate(-90)')
			.attr('y', -this._margin.left / 3)
			.attr('x', -this._height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle');
	}

	/**
	 * 
	 */
	updateModalOptions(){
		let key = d3.select('#bioActivityGraph .im-modal #panel-body-category input:checked').property('value');
		let opts = this._data.reduce((p,c) => p.add(c[key]) ,new Set());
		
		d3.select('#bioActivityGraph .im-modal #panel-body-value').selectAll('*').remove();
		d3.select('#bioActivityGraph .im-modal #panel-body-value').selectAll('label')
			.data([...opts])
			.join('label')
				.classed('row-label', true)
				.html((d) => `<input type="radio" name="radio-value" value="${d}">\n${d}`);
	}

	/**
	 * Assing color to data points.
	 * The list of current colors is stored in the _colors object. Each item in
	 * the data-set has its VALUES matched to the KEYS of the _colors list, in
	 * order to find a match.
	 */
	updatePointColors() {
		/* for each data point, check if any of its values is part of this list, and
		 * assign a color accordingly. Default color is assigned otherwise. */
		this._data = this._data.map(p => {
			p.color = this._colors.get('Default');
			[...this._colors.keys()].some(c => {
				if (Object.values(p).includes(c)){
					p.color = this._colors.get(c);
					return true;
				}
			}, this);
			return p;
		}, this);
	}

	/**
	 * Set the position (in display coordinates) of each point in the data
	 */
	updatePointPositions() {
		let jitter = d3.select('#rightColumn_bioActivity #cb-jitter').property('checked');
		let violin = d3.select('#rightColumn_bioActivity #cb-violin').property('checked');
		let X = this._xAxis.scale();
		let xwidth = X.bandwidth()/4;
		let Y = this._yAxis.scale();
		this._data = this._data.map(d => {
			let dx = (jitter && violin)? 2*xwidth-(xwidth*Math.random()) : jitter ? xwidth+(xwidth*2*Math.random()) : 2*xwidth;
			d.x = X(d.type) + dx;
			d.y = Y(d.value);
			return d;
		});
	}

	/**
	 * Assign shape to data points.
	 * The list of current shapes is stored in the _shapes object. Each item in
	 * the data-set has its VALUES matched to the KEYS of the _shapes list, in
	 * order to find a match.
	 */
	updatePointShapes() {
		/* for each data point, check if any of its values is part of the list, and
		 * assing a shape accordingly. Default shape is assigned otherwise */
		this._data = this._data.map(p => {
			p.shape = this._shapes.get('Default');
			[...this._shapes.keys()].some(s => {
				if (Object.values(p).includes(s)) {
					p.shape = this._shapes.get(s);
					return true;
				}
			}, this);
			return p;
		}, this);
	}


	/**
	 * Update the display of colors used in the display
	 */
	updateTableColor() {
		let self = this;
		d3.select('div#rightColumn_bioActivity div#color-div').selectAll('.flex-row').remove();
		d3.select('div#rightColumn_bioActivity div#color-div').selectAll('.flex-row')
			.data([...this._colors.keys()])
			.join('div')
				.classed('flex-row', true)
				.attr('id', d => 'color-'+d)
				.each(function(d){
					d3.select(this).insert('div')
						.attr('class', 'row-cell')
						.style('background-color', d => self._colors.get(d));
					d3.select(this).insert('label')
						.attr('class', 'row-label')
						.text(d);
					d3.select(this).insert('a')
						.attr('class', 'row-close')
						.attr('data-key', d)
						.html('&times')
						.on('click', function(){
							if( this.dataset.key === 'Default' ) return;
							self._colors.delete(this.dataset.key);
							self.updatePointColors();
							self.updateTableColor();
							self.plotData();
						});
				});
	}

	/**
	 * Initialize the display of the shape table
	 */
	updateTableShape(){
		let self = this;
		/* clear the previous elements */
		d3.select('div#rightColumn_bioActivity div#shape-div').selectAll('.flex-row').remove();
		d3.select('div#rightColumn_bioActivity div#shape-div').selectAll('.flex-row')
			.data([...this._shapes.keys()])
			.join('div')
				.classed('flex-row', true)
				.attr('id', d => 'shape-' + d)
				.each(function(d) {
					d3.select(this).insert('svg')
						.classed('row-cell',true)
						.attr('viewBox', '-5 -5 10 10')
						.append('path')
							.attr('fill', 'black')
							.attr('d', () => { return d3.symbol().type(d3['symbol'+self._shapes.get(d)]).size(10)(); });
					d3.select(this).insert('label')
						.classed('row-label', true)
						.text(d);
					d3.select(this).insert('a')
						.classed('row-close', true)
						.attr('data-key', d)
						.html('&times')
						.on('click', function(){
							if( this.dataset.key === 'Default' ) return;
							self._shapes.delete(this.dataset.key);
							self.updatePointShapes();
							self.updateTableShape();
							self.plotData();
						});
				});	
	}

}
