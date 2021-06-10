'use strict';

import * as d3 from 'd3';

/**
 * @class BioActivityGraph
 * @classdesc Used to display the bioactivity levels of a given compound in their
 * corresponding report page
 * @author Rodolfo Allendes
 * @version 1.1 Adapted to use a scaleBand
 */
export class BioActivityGraph {
	/**
	 * Initialize an instance of BioActivityGraph
	 *
	 * @param {object} chemblObj The object returned by the query performed on
	 * TargetMine
	 */
	constructor(chemblObj) {
		/* initialize super class attributes */
		this._type = 'bioActivity';
		this._name = chemblObj.name;
		this._containerId = undefined;
		/* width and height of the canvas, together with margins for the graph */
		this._width = 400;
		this._height = 400;
		this._margin = { top: 40, right: 40, bottom: 40, left: 40 };
		/* used for the display of violin plots associated to the data points */
		this._bins = undefined;
		/* the list of colors and shapes used to display data points */
		this._colors = { Default: '#C0C0C0' };
		this._shapes = { Default: 'Circle' };
		/* exit if there is no data to display */
		if (chemblObj.targetProteins.length === 0) {
			d3.select('#bioActivityGraph-div').text(
				'No BioActivity Data to Display.'
			);
			return;
		}
		/* initilize points */
		this._points = this.loadData(chemblObj.targetProteins);

		/* Initialize the Axis of the graph */
		this._xLabels = this.extractXLabels(chemblObj.targetProteins);
		this._xAxis = undefined;
		this.initXAxis();
		this._yAxis = undefined;
		this.initYAxis(chemblObj.targetProteins);
		/* Initialize data points, position, color and shape */
		this.updatePointPositions();
		this.updatePointColors();
		this.updatePointShapes();
		/* Initialize histogram for violin plots display */
		this.initHistogramBins();
		/* Update DOM elements */
		this.updateTableColor();
		this.updateTableShape();
		this.updateTableVisuals();
		this.initFunctions();
		/* Plot the graph */
		this.plot();
	}

	/**
	 * Initialize the labels of the X axis of the Graph.
	 *
	 * @param {array} proteins The array containing all the target protein objects
	 */
	extractXLabels(proteins) {
		let labels = [];
		proteins.forEach(prot => {
			prot.activities.forEach(act => {
				if (!labels.includes(act.type)) labels.push(act.type);
			});
		});
		return labels;
	}

	/**
	 * 
	 */
	initFunctions() {
		let self = this;
		/* Right control buttons */
		d3.select('#color-add').on('click', function() { self.modalDisplay('color'); });
		d3.select('#shape-add').on('click', function() { self.modalDisplay('shape'); });
		d3.select('#input[type=checkbox]').on('change', () => { self.plot();} );
		/* Modal inputs */
		d3.select('#modal-select-column')
			.on('change', function(e) { self.updateSelectOptions('#modal-select-value', e.target.value); })
			.dispatch('change');
		d3.select('#modal-ok').on('click', function() { self.modalOK(); });
		d3.select('#modal-cancel').on('click', function() { d3.select('#modal_bioActivity').style('display', 'none'); });
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
			self._points,
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
		/* use the scaleBand scale provided by D3 */
		let scale = d3.scaleBand()
			.domain(this._xLabels)
			.range([0, this._width - this._margin.left - this._margin.right])
			.padding(0.05);
		this._xAxis = d3.axisBottom(scale);
	}

	/**
	 * Initialize the Y axis of the graph
	 * The Y axis will always be numerical with a logarithmic scale.
	 * The axis will be generated based on the min and max bioactivity values
	 * found in the list of target proteins
	 *
	 * @param {array} proteins The list of target proteins
	 */
	initYAxis(proteins) {
		/* find the min and max bioactivity values values*/
		let min = +Infinity;
		let max = -Infinity;
		proteins.forEach(p => {
			p.activities.forEach(a => {
				max = Math.max(a.conc, max);
				min = Math.min(a.conc, min);
			});
		});
		/* initialize the logarithmic scale */
		let scale = d3
			.scaleLog()
			.domain([min, max])
			.range([this._height - this._margin.bottom, this._margin.top])
			.nice();
		this._yAxis = d3.axisLeft(scale);
		this._yAxis.ticks(10, '~g');
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
		d3.select('#modal_bioActivity')
			.style('display', 'flex')
			.attr('data-type', type);

		/* define the title for the window */
		d3.select('#modal-title')
			.text('Select '+type+' to apply:');
		/* update input elements */
		d3.select('#modal-input-label')
			.text(type + ':');
		d3.selectAll('#modal-input > *').remove();
		/* If adding a color element, define a new color input  */
		if( type === 'color' ){
			d3.select('#modal-input').append('input')
				.attr('id', 'modal-selected')
				.property('type', 'color')
				.property('value', '#000000');
		}
		/* else, incorporate the input required for shape elements */
		else{
			let opts = ['Circle','Cross','Diamond','Square','Star','Triangle','Wye'];
			d3.select('#modal-input').append('select')
				.attr('id', 'modal-selected')
				.selectAll('option').data(opts).enter().append('option')
					.attr('value', d => d)
					.text(d => d);
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
		let modal = d3.select('#modal_bioActivity').style('display', 'none');
		/* capture the type of modal and the values that the user selected */
		let type = modal.attr('data-type');
		let val = d3.select('#modal-select-value').property('value');
		let upd = d3.select('#modal-selected').property('value');
		/* update the corresponding table */
		if( type === 'color' ){
			this._colors[val] = upd;
			this.updatePointColors();
			this.updateTableColor();
		}
		else{
			this._shapes[val] = upd;
			this.updatePointShapes();
			this.updateTableShape();
		}
		/* redraw the graph */
		this.plot();
	}

	/**
	 * Plot a BioActivity Graph
	 */
	plot() {
		/* plot the X and Y axis of the graph */
		this.plotXAxis(0, 'Bio-Activity Type');
		this.plotYAxis('Activity Concentration (nM)');

		/* draw the points, grouped in a single graphics element  */
		let canvas = d3.select('svg#canvas_bioActivity > g#graph');
		canvas.selectAll('#points').remove();
		canvas.append('g')
			.attr('id', 'points')
			.attr('transform', 'translate(' + this._margin.left + ', 0)');
		/* Each data point will be d3 symbol (represented using svg paths) */
		let pts = d3.select('#points').selectAll('g')
			.data(this._points);
		/* each point belongs to the 'data-point' class its positioned in the graph
		 * according to the associated (x,y) coordinates and its drawn using its
		 * color and shape */
		let point = pts.enter().append('path')
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
			});
		/* each point will also have an associated svg title (tooltip) */
		point.append('svg:title').text(d => {
			return (
				'Organism: ' +
				d['Organism Name'] +
				'\nGene: ' +
				d['Gene Symbol'] +
				'\nConcentation: ' +
				d['Activity Concentration'] +
				'nM'
			);
		});
	}
	
	/**
	 *
	 */
	plotViolins(){
		/* add violin strips if requested */
		let canvas = d3.select('svg#canvas_'+this._type+' > g#graph');
		let X = this._xAxis.scale();
		let Y = this._yAxis.scale();
		canvas.selectAll('#violins').remove();

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

		canvas.append('g')
			.attr('id', 'violins')
			.attr('transform', 'translate('+this._margin.left+', 0)');

		let vls = d3.select('#violins').selectAll('g')
			.data(this._bins);
		vls.enter().append('g')        // So now we are working group per group
			.attr('class', 'violin')
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
	 *
	 * @param {int} labelAngle An optional rotation angle for Axis' ticks
	 * @param {string} title An optional title for the X axis
	 */
	plotXAxis(labelAngle = 0, title = undefined) {
		/* remove previous axis components */
		let canvas = d3.select('svg#canvas_' + this._type + ' > g#graph');
		canvas.selectAll('#bottom-axis').remove();
		/* add the axis to the display, making sure it is positioned only within the
		 * area of the graph allocated for that */
		let g = canvas
			.append('g')
			.attr('id', 'bottom-axis')
			.attr('transform', 'translate(' +	this._margin.left +	', ' + (this._height - this._margin.bottom) +	')')
			.call(this._xAxis);
		/* rotate the labels of the axis - if the rotation angle is != 0 */
		if (labelAngle != 0) {
			g.selectAll('text')
				.attr('y', 0)
				.attr('x', 9)
				.attr('dy', '.35em')
				.attr('transform', 'rotate(' + labelAngle + ')')
				.style('text-anchor', 'start');
		}
		/* add title to the axis, if defined
		 * The title is always positioned anchored to the mid-point of the bottom
		 * margin */
		if (title !== undefined) {
			d3.selectAll('svg#canvas_' + this._type + ' > text#bottom-axis-label').remove();
			canvas.append('text')
				.attr('id', 'bottom-axis-label')
				.attr('transform', 'translate(' +	this._width / 2 +	',' +	(this._height - this._margin.bottom / 3) + ')')
				.style('text-anchor', 'middle')
				.text(title);
		}
	}

	/**
	 * Add the Y-axis to the graph
	 */
	plotYAxis(title = undefined) {
		let canvas = d3.select('svg#canvas_' + this._type + ' > g#graph');
		canvas.selectAll('#left-axis').remove();
		canvas
			.append('g')
			.attr('id', 'left-axis')
			.attr('transform', 'translate(' + this._margin.left + ',0)')
			.call(this._yAxis);
		/* if defined, add a title to the axis */
		if (title !== undefined) {
			canvas.selectAll('text#left-axis-label').remove();
			canvas
				.append('text')
				.attr('id', 'left-axis-label')
				.attr('transform', 'rotate(-90)')
				.attr('y', -this._margin.left / 3)
				.attr('x', -this._height / 2)
				.attr('dy', '1em')
				.style('text-anchor', 'middle')
				.text(title);
		}
	}

	/**
	 * Assing color to data points.
	 * The list of current colors is stored in the _colors object. Each item in
	 * the data-set has its VALUES matched to the KEYS of the _colors list, in
	 * order to find a match.
	 */
	updatePointColors() {
		/* extract the list of values with a color code (keys from the _colors list) */
		let colorkeys = Object.keys(this._colors);
		/* for each data point, check if any of its values is part of this list, and
		 * assign a color accordingly. Default color is assigned otherwise. */
		this._points.map(p => {
			p.color = this._colors.Default;
			colorkeys.some(k => {
				if (Object.values(p).includes(k)){
					p.color = this._colors[k];
					return true;
				}
			}, this);
			return p;
		}, this);
	}

	/**
	 * Set the position (in display coordinates) of each point in the data
	 *
	 * @param {boolean} jitter Should the position of the point be randomly
	 * jittered along the X axis or not.
	 */
	updatePointPositions(jitter = false) {
		let X = this._xAxis.scale();
		let dx = X.bandwidth() / 2;
		let Y = this._yAxis.scale();
		this._points.forEach(d => {
			d.x = X(d.type) + dx;
			if (jitter) dx -= (dx / 2) * Math.random();
			d.y = Y(d.value);
		}, this);
	}

	/**
	 * Assign shape to data points.
	 * The list of current shapes is stored in the _shapes object. Each item in
	 * the data-set has its VALUES matched to the KEYS of the _shapes list, in
	 * order to find a match.
	 */
	updatePointShapes() {
		/* extract the list of the values with a shape code (keys from _shapes) */
		let shapekeys = Object.keys(this._shapes);
		/* for each data point, check if any of its values is part of the list, and
		 * assing a shape accordingly. Default shape is assigned otherwise */
		this._points.map(p => {
			p.shape = this._shapes.Default;
			shapekeys.some(k => {
				if (Object.values(p).includes(k)) {
					p.shape = this._shapes[k];
					return true;
				}
			}, this);
			return p;
		}, this);
	}

	/**
	 * Update the options available for a given Select DOM element.
	 * Given the id of a select element, it updates the options available based on
	 * the list of values provided
	 *
	 * @param {string} id The id of the select component that should be updated
	 * @param {string} values The list of values to use for the definition of
	 * options
	 */
	updateSelectOptions(id, key){
		/* select all the elements */
		let values = [...new Set(this._points.map(p => p[key]))];
		d3.select(id).selectAll('option').remove();
		d3.select(id).selectAll('option')
			.data(values)
			.enter().append('option')
				.attr('value', d => d)
				.text(d => d);
	}

	/**
	 * Update the display of colors used in the display
	 */
	updateTableColor() {
		let self = this;
		/* clear previous elements */
		d3.select('#color-table').selectAll('div').remove();
		let keys = Object.keys(this._colors);
		let values = Object.values(this._colors);
		d3.select('#color-table').selectAll('div')
			.data(keys).enter()
			.append('div')
				.attr('class', 'flex-row')
				.attr('id', d => 'color-' + d)
				.each(function(d, i) {
					let row = d3.select(this);
					row.append('div')
						.attr('class', 'row-cell')
						.style('background-color', values[i]);
					row.append('div')
						.attr('class', 'row-label')
						.text(d);
					row.append('span')
						.attr('class', 'row-small-close')
						.attr('data-key', d)
						.html('&times;')
						.on('click', function(){
							if( this.dataset.key === 'Default' ) return;
							delete( self._colors[this.dataset.key] );
							self.updatePointColors();
							self.updateTableColor();
							self.plot();
						});
				});
	}

	/**
	 * Initialize the display of the shape table
	 */
	updateTableShape(){
		let self = this;
		/* clear the previous elements */
		d3.select('#shape-table').selectAll('div').remove();
		/* we customize the DOM elements according to the values of the shapes list */
		let keys = Object.keys(this._shapes);
		let values = Object.values(this._shapes);
		d3.select('#shape-table').selectAll('.div')
			.data(keys).enter()
			.append('div')
				.attr('class', 'flex-row')
				.attr('id', d => 'shape-' + d)
				.each(function(d, i) {
					let row = d3.select(this);
					row.append('svg')
						.attr('class', 'row-cell')
						.attr('viewBox', '-5 -5 10 10')
						.append('path')
							.attr('fill', 'black')
							.attr('d', () => { return d3.symbol().type(d3['symbol'+values[i]]).size(10)(); });
					row.append('div')
						.attr('class', 'row-label')
						.text(d);
					row.append('span')
						.attr('class', 'row-small-close')
						.attr('data-key', () => d)
						.html('&times;')
						.on('click', function(){
							if( this.dataset.key === 'Default' ) return;
							delete( self._shapes[this.dataset.key] );
							self.updatePointShapes();
							self.updateTableShape();
							self.plot();
						});
				});	
	}

	/**
	*
	*/
	updateTableVisuals() {
		let self = this;
		/* Event handlers association */
		d3.select('#cb-violin').on('change', function(){
			if( this.checked )
				self.plotViolins();
			else{
				d3.selectAll('#violins').remove();
			}
		});
		d3.select('#cb-jitter').on('change', function(){
			self.updatePointPositions(this.checked);
			self.plot();
		});
	}
}
