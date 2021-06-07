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
		this._colors = undefined;
		this._shapes = undefined;
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
		// super.setPointPositions();
		// super.initColorsAndShapes(false);
		// super.assignColors();
		// super.assignShapes();
		// /* Initialize histogram for violin plots display */
		// super.initHistogramBins();

		// /* init DOM elements */
		// this.initDOM();
		// /* assign functionality to different interface components */
		// let self = this;
		// d3.select('#input[type=checkbox]')
		//   .on('change', () => { self.plot();} )
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
	 * Initialize the X axis of the graph
	 * As the X axis will be ordinal, in order to generate the list of ticks in
	 * the axis, we use the current this._xLabels
	 */
	initXAxis() {
		/* use the scaleBand scale provided by D3 */
		let scale = d3
			.scaleBand()
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

	// 	/* First, we update the three tables used for visualization handling within
	// 	 * the graph */
	// 	this.updateColorTable();
	// 	this.updateShapeTable();
	// 	this.updateVisualsTable();

	// 	/* 'column' options are fixed */
	// 	self.updateSelectOptions('#modal-column-select', [...new Set(this._data.columns.filter( e => typeof(this._data[0][e]) === 'string'))]);
	// 	/* but each time a new column is selected, the options in the 'value' select
	// 	 * need to be updated */
	// 	d3.select('#modal-column-select')
	// 		.dispatch('change') // make sure to initially update the values
	// 		;
	// }

	// /**
	//  * Display the modal to allow user interaction
	//  *
	//  * @param {string} type An identifier of the type of modal to be shown, either
	//  * 'color' or 'shape'.
	//  */
	// modalDisplay(type){
	// 	let self = this;
	// 	/* Set display to True */
	// 	let content = d3.select('#modal')
	// 		.style('display', 'flex')
	// 		.attr('data-type', type)
	// 	;
	// 	/* define the title for the window */
	// 	d3.select('#modal-title')
	// 		.text('Select '+type+' to apply:')

	// 	/* remove previous input elements */
	// 	d3.selectAll('#modal-input > *').remove();
	// 	/* If adding a color element, define a new color input  */
	// 	if( type === 'color' ){
	// 		d3.select('#modal-input')
	// 			.append('input')
	// 				.attr('class', 'modal-item')
	// 				.property('type', 'color')
	// 				.property('value', '#000000')
	// 		;
	// 	}
	// 	/* else, incorporate the input required for shape elements */
	// 	else{
	// 		let opts = d3.select('#modal-input').selectAll('input')
	// 			.data(['Circle','Cross','Diamond','Square','Star','Triangle','Wye'])
	// 			.enter()

	// 		opts.append('input')
	// 				.attr('id', (d,i) => 'symbol-'+d)
	// 				.attr('value', (d,i) => d)
	// 				.attr('type', 'radio')
	// 				.attr('name', 'shape')
	// 		opts.insert('label', 'input:nth-child(odd)')
	// 				.attr('class', 'modal-item modal-label')
	// 				.text((d,i) => d)
	// 		;
	// 		d3.select('#symbol-Circle').property('checked', true);
	// 	}
	// }

	// /**
	//  * Handle application of color or shape to data.
	//  * Once the user selects to apply a specific color or shape to a category of
	//  * data, here we handle the update of the color or shape list, and apply the
	//  * corresponding change to the dataset.
	//  */
	// modalOK(){
	// 	/* hide the modal from view */
	// 	let modal = d3.select('#modal').style('display', 'none');
	// 	/* capture the type of modal and the values that the user selected */
	// 	let type = modal.attr('data-type');
	// 	let col = d3.select('#modal-column-select').property('value');
	// 	let val = d3.select('#modal-value-select').property('value');
	// 	let upd = type === 'color' ?
	// 		d3.select('#modal-input > input').property('value') :
	// 		d3.select('input[name="shape"]:checked').property('value')
	// 	;
	// 	/* apply the changes in visual properties to the corresponding data points */
	// 	this._data.map(data => {
	// 		if(data[col] === val)
	// 			data[type]=upd;
	// 		return data;
	// 	});

	// 	/* update the corresponding table */
	// 	if( type === 'color' ){
	// 		this._colors[val] = upd;
	// 		this.updateColorTable();
	// 	}
	// 	else{
	// 		this._shapes[val] = upd;
	// 		this.updateShapeTable();
	// 	}
	// 	/* redraw the graph */
	// 	this.plot();
	// }

	// /**
	//  * Update the options available for a given Select DOM element.
	//  * Given the id of a select element, it updates the options available based on
	//  * the list of values provided
	//  *
	//  * @param {string} id The id of the select component that should be updated
	//  * @param {string} values The list of values to use for the definition of
	//  * options
	//  */
	// updateSelectOptions(id, values){
	// 	/* select all the elements */
	// 	d3.select(id).selectAll('option').remove();
	// 	d3.select(id).selectAll('option')
	// 		.data(values)
	// 		.enter().append('option')
	// 			.attr('value', function(d){ return d; })
	// 			.text(function(d){ return d; })
	// 		;
	// }

	// /**
	//  * Initialize the display of the color table
	//  *
	//  */
	// updateColorTable(){
	// 	let self = this;
	// 	let keys = Object.keys(this._colors);
	// 	let values = Object.values(this._colors);
	// 	/* these are the DOM elements in each row of the table */
	// 	let rowComponents = [
	// 		{ 'type': 'div', 'attr':[['class', 'flex-cell display']] },
	// 		{ 'type': 'div', 'attr':[['class', 'flex-cell label']] },
	// 		{ 'type': 'span', 'attr':[['class', 'flex-cell small-close']] },
	// 	];
	// 	super.initTableRows('#color-table', 'color', keys, rowComponents);
	// 	/* update the color backgroud of the display are of each row */
	// 	d3.select('#color-table').selectAll('.display')
	// 		.data(values)
	// 		.style('background-color', d => d )
	// 	;
	// 	/* set the labels for each row */
	// 	d3.select('#color-table').selectAll('.label')
	// 		.data(keys)
	// 		.text(d => d)
	// 	;
	// 	/* update the small close span element */
	// 	d3.select('#color-table').selectAll('.small-close')
	// 		.data(keys)
	// 		.attr('data-key', d => d)
	// 		.html('&times;')
	// 		.on('click', function(d){
	// 			if( this.dataset.key === 'Default' ) return;
	// 			delete( self._colors[this.dataset.key] );
	// 			self.assignColors();
	// 			self.updateColorTable();
	// 			self.plot();
	// 		})
	// 	;
	// }

	// /**
	//  * Initialize the display of the shape table
	//  */
	// updateShapeTable(){
	// 	let self = this;
	// 	let keys = Object.keys(this._shapes);
	// 	let values = Object.values(this._shapes);
	// 	/* these are the DOM elements in each row of the table */
	// 	let rowComponents = [
	// 		{ 'type': 'div', 'attr':[['class', 'flex-cell display']] },
	// 		{ 'type': 'div', 'attr':[['class', 'flex-cell label']] },
	// 		{ 'type': 'span', 'attr':[['class', 'flex-cell small-close']] },
	// 	];
	// 	super.initTableRows('#shape-table', 'shape', keys, rowComponents);
	// 	/* we customize the DOM elements according to the values of the shapes list */
	// 	d3.select('#shape-table').selectAll('.display')
	// 		.data(values)
	// 		.append('svg')
	// 			.attr('class', 'display-cell')
	// 			.attr('viewBox', '-5 -5 10 10')
	// 			.append('path')
	// 				.attr('fill', 'black')
	// 				.attr('d', (d) => { return d3.symbol().type(d3['symbol'+d]).size(10)(); })
	// 	;
	// 	/* set the label for each row */
	// 	d3.select('#shape-table').selectAll('.label')
	// 		.data(keys)
	// 		.text(d => d)
	// 	;
	// 	/* update the small-close span element */
	// 	let close = d3.select("#shape-table").selectAll('.small-close')
	// 		.data(keys)
	// 		.attr('data-key', d => d)
	// 		.html('&times;')
	// 		.on('click', function(){
	// 			if( this.dataset.key === 'Default' ) return;
	// 			delete( self._shapes[this.dataset.key] );
	// 			self.assignShapes();
	// 			self.updateShapeTable();
	// 			self.plot();
	// 		})
	// 	;
	// }

	// /**
	// *
	// */
	// updateVisualsTable(){
	// 	let self = this;
	// 	/* these are the DOM elements in each row of the table */
	// 	let rowElements =[ 'violin', 'jitter' ];
	// 	let rowComponents = [
	// 		{ 'type': 'input', 'attr': [['type', 'checkbox'], ['class','flex-cell display']] },
	// 		{ 'type': 'div', 'attr':[['class', 'flex-cell label']] },
	// 	];
	// 	super.initTableRows('#visuals-table', 'visual', rowElements, rowComponents);
	// 	/* Customization of DOM elements */
	// 	d3.select('#visuals-table').selectAll('.label')
	// 		.data(rowElements)
	// 		.text( d => 'Add '+d )
	// 	d3.select('#visuals-table').selectAll('input')
	// 		.data(rowElements)
	// 		.attr('id', d => 'cb-'+d)
	// 	/* Event handlers association */
	// 	d3.select('#cb-violin').on('change', function(){
	// 		if( this.checked )
	// 			self.plotViolins();
	// 		else{
	// 			d3.selectAll("#violins").remove();
	// 		}
	// 	});
	// 	d3.select('#cb-jitter').on('change', function(){
	// 		self.setPointPositions(this.checked);
	// 		self.plot();
	// 	});
	// }

	/**
	 * Plot a BioActivity Graph
	 *
	 */
	plot() {
		/* plot the X and Y axis of the graph */
		this.plotXAxis(0, 'Bio-Activity Type');
		this.plotYAxis('Activity Concentration (nM)');

		/* draw the points, grouped in a single graphics element  */
		let canvas = d3.select('svg#canvas_bioActivity > g#graph');
		canvas.selectAll('#points').remove();
		canvas
			.append('g')
			.attr('id', 'points')
			.attr('transform', 'translate(' + this._margin.left + ', 0)');
		/* Each data point will be d3 symbol (represented using svg paths) */
		let pts = d3
			.select('#points')
			.selectAll('g')
			.data(this._points);
		/* each point belongs to the 'data-point' class its positioned in the graph
		 * according to the associated (x,y) coordinates and its drawn using its
		 * color and shape */
		let point = pts
			.enter()
			.append('path')
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
				let symbol = d3
					.symbol()
					.size(50)
					.type(s.indexOf(d.shape));
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
	// /**
	//  * Initialize Visualization Handling elements
	//  * @param {Object} elements When provided, it lists DOM elements that
	//  * should be appended to the main visualization panel
	//  */
	// async addToDOM(parent, elements){
	// 	let self = this;

	// 	d3.select(`#${parent}`)
	// 		.selectAll()
	// 		.data(elements)
	// 		.enter()
	// 		.each(function(d){

	// 			// insert the element at the give position (if specified)
	// 			let head = (d.position !== undefined) ? d3.select(this).insert(d.type, d.position) : d3.select(this).insert(d.type);

	// 			if( d.id !== undefined )
	// 				head.attr('id', d.id);
	// 			if( d.attributes !== undefined)
	// 				for(const [k,v] of d.attributes.entries())
	// 					k === 'text' ? head.text(v) : head.attr(k,v);
	// 			if( d.style !== undefined )
	// 				for( const[k,v] of d.style.entries() )
	// 					head.style(k,v);
	// 			if( d.on !== undefined )
	// 				for(const [k,v] of d.on.entries())
	// 					head.on(k,v);
	// 			if( d.children !== undefined )
	// 				self.addToDOM(d.id, d.children)
	// 		})
	// 		.exit().remove()
	// 	;
	// }
	// /**
	//  * Initialize list of colors and Shapes
	//  * Different colors and shapes can be used to differentiate the categories of
	//  * data points according to their X-axis dimension. Here, we generate the list
	//  * of all colors and shapes according to the currently displayed categories.
	//  *
	//  * @param {boolean} addXLabels Flag that indicates if individual shapes and
	//  * colors should be assiged for each individual category available in the
	//  * X axis of the graph. Default value: true.
	//  */
	// initColorsAndShapes(addXLabels=true){
	// 	/* init the default color and shape of data elements */
	// 	this._colors = { 'Default': '#C0C0C0' };
	// 	this._shapes = { 'Default': 'Circle' };
	// 	/* upon request, add individual color for each _xLabel */
	// 	if( addXLabels == true ){
	// 		this._xLabels.map( (label, i) => {
	// 			this._colors[label] = d3.schemeCategory10[i%d3.schemeCategory10.length];
	// 		});
	// 	}
	// }

	// /**
	//  * Initialize the graph's data distribution bins
	//  * Histogram bins are used for the display of violin of the data. A single
	//  * violin plot is associated to each tick along the xAxis of the graph.
	//  * tic
	//  *
	//  * @param {number} nBins The number of bins to use. Default value 10
	//  */
	// initHistogramBins(nBins=10){
	// 	let self = this;
	// 	/* function used to define the number of bins and the bounds for each of
	// 	 * them */
	// 	let histogram = d3.bin()
	// 		.domain(self._yAxis.scale().domain())
	// 		.thresholds(self._yAxis.scale().ticks(nBins))
	// 		.value(d => d)
	// 		;
	// 	/* actually bin the data points */
	// 	this._bins = d3.rollup(
	// 		self._data,
	// 		d => {
	// 			let input = d.map( g => g['Activity Concentration']);
	// 			let bins = histogram(input);
	// 			return bins;
	// 		},
	// 		d => d['Activity Type']
	// 	);
	// }

	// /**
	//  * Assing color to data points.
	//  * The list of current colors is stored in the _colors object. Each item in
	//  * the data-set has its VALUES matched to the KEYS of the _colors list, in
	//  * order to find a match.
	//  */
	// assignColors(){
	// 	/* extract the list of values with a color code (keys from the _colors list) */
	// 	let colorkeys = Object.keys(this._colors);
	// 	/* for each data point, check if any of its values is part of this list, and
	// 	 * assign a color accordingly. Default color is assigned otherwise. */
	// 	this._data.forEach( (item,i) => {
	// 		for(let j=colorkeys.length-1; j>0; --j){
	// 			if( Object.values(item).includes(colorkeys[j]) ){
	// 				item.color = this._colors[colorkeys[j]];
	// 				return;
	// 			}
	// 		}
	// 		item.color = this._colors.Default;
	// 	}, this);
	// }

	// /**
	//  * Assign shape to data points.
	//  * The list of current shapes is stored in the _shapes object. Each item in
	//  * the data-set has its VALUES matched to the KEYS of the _shapes list, in
	//  * order to find a match.
	//  */
	// assignShapes(){
	// 	/* extract the list of the values with a shape code (keys from _shapes) */
	// 	let shapekeys = Object.keys(this._shapes);
	// 	/* for each data point, check if any of its values is part of the list, and
	// 	 * assing a shape accordingly. Default shape is assigned otherwise */
	// 	this._data.forEach( (item,i) => {
	// 		for( let j=shapekeys.length-1; j>0; --j){
	// 			if( Object.values(item).includes(shapekeys[j]) ){
	// 				item.shape = this._shapes[shapekeys[j]];
	// 				return;
	// 			}
	// 		}
	// 		item.shape = this._shapes.Default;
	// 	}, this);
	// }

	// /**
	//  * Initialize table components
	//  *
	//  * @param {string} tableid The id of the table whose elements we are going to
	//  * modify
	//  * @param {string} type A string that describes the visual elemets for which
	//  * the table is used
	//  * @param {array} rowElements List of identifiers for each row of the table
	//  * @param {object} rowComponents List of elements to be added to each row
	//  */
	// initTableRows(tableid, type, rowElements, rowComponents){
	// 	d3.select(tableid+' > tbody').selectAll('div').remove();
	// 	d3.select(tableid+' > tbody').selectAll('div')
	// 		.data(rowElements)
	// 		.enter().append('div')
	// 			.attr('class', 'flex-row')
	// 			.attr('id', d => type+'-'+d)
	// 			.each(function(d,i){
	// 				rowComponents.forEach(g => {
	// 					let ele = d3.select(this).append(g.type);
	// 					g.attr.forEach( h => {
	// 						ele.attr(h[0], h[1]);
	// 					});
	// 				});
	// 			})
	// }

	// /**
	//  * Set the position (in display coordinates) of each point in the data
	//  *
	//  * @param {boolean} jitter Should the position of the point be randomly
	//  * jittered along the X axis or not.
	//  */
	// setPointPositions(jitter=false){
	// 	let X = this._xAxis.scale();
	// 	let dx = X.bandwidth()/2;
	// 	let Y = this._yAxis.scale();
	// 	this._points.forEach(d => {
	// 		d.x = X(d.type)+dx;
	// 		if( jitter ) dx -= (dx/2)*Math.random();
	// 		d.y = Y(d.value);
	// 	},this);
	// }

	// /**
	//  *
	//  */
	// plotViolins(){
	// 	/* add violin strips if requested */
	// 	let canvas = d3.select('svg#canvas_'+this._type+' > g#graph');
	// 	let X = this._xAxis.scale();
	// 	let Y = this._yAxis.scale();
	// 	canvas.selectAll("#violins").remove();

	// 	// What is the biggest number of value in a bin? We need it cause this value
	// 	// will have a width of 100% of the bandwidth.
	// 	let maxNum = 0
	// 	this._bins.forEach(d => {
	// 		let lengths = d.map(g => g.length);
	// 		let longest = d3.max(lengths);
	// 		maxNum = longest > maxNum ? longest : maxNum;
	// 	});
	// 	let xNum = d3.scaleLinear()
	// 		.range([0, X.bandwidth()])
	// 		.domain([-maxNum, maxNum])

	// 	canvas.append('g')
	// 		.attr('id', 'violins')
	// 		.attr('transform', 'translate('+this._margin.left+', 0)')
	// 	;

	// 	let vls = d3.select('#violins').selectAll('g')
	// 		.data(this._bins)
	// 	let violin = vls.enter().append('g')        // So now we are working group per group
	// 		.attr('class', 'violin')
	// 		.attr("transform", d => "translate(" + (X(d[0])+(X.bandwidth()/10)) +" ,0)")
	// 			.append("path")
	// 				.datum(d => d[1]) //extract only the bins
	// 				.attr("class", "violin")
	// 				.attr("d", d3.area()
	// 					.x0( xNum(0) )
	// 					.x1(function(d){ return(xNum(d.length)) } )
	// 					.y(function(d){ return(Y(d.x0)) } )
	// 					.curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
	// 				)

	// }

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
			.attr(
				'transform',
				'translate(' +
					this._margin.left +
					', ' +
					(this._height - this._margin.bottom) +
					')'
			)
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
			d3.selectAll(
				'svg#canvas_' + this._type + ' > text#bottom-axis-label'
			).remove();
			canvas
				.append('text')
				.attr('id', 'bottom-axis-label')
				.attr(
					'transform',
					'translate(' +
						this._width / 2 +
						',' +
						(this._height - this._margin.bottom / 3) +
						')'
				)
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
}
