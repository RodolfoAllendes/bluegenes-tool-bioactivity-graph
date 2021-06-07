'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import RootContainer from './RootContainer';

import { BioActivityGraph } from './BioActivityGraph.js';

// make sure to export main, with the signature
function main(el, service, imEntity, state, config) {
	if (!state) state = {};
	if (!el || !service || !imEntity || !state || !config) {
		throw new Error('Call main with correct signature');
	}
	// Tips to ensure your tool works correctly in BlueGenes:
	// - Do not use element IDs or query selectors; use React's createRef/useRef instead
	ReactDOM.render(
		<RootContainer
			serviceUrl={service.root}
			entity={imEntity}
			config={config}
		/>,
		el
	);
	let imObject = imEntity.ChemblCompound;
	// retrieve the data required for visualization from the database
	let query = {
		from: imObject.class,
		select: [
			'ChemblCompound.identifier',
			'ChemblCompound.name',
			'ChemblCompound.targetProteins.protein.primaryAccession',
			'ChemblCompound.targetProteins.protein.symbol',
			'ChemblCompound.targetProteins.protein.name',
			'ChemblCompound.targetProteins.protein.isUniprotCanonical',
			'ChemblCompound.targetProteins.activities.type',
			'ChemblCompound.targetProteins.activities.conc',
			'ChemblCompound.targetProteins.activities.relation',
			'ChemblCompound.targetProteins.activities.unit'
		],
		where: [{ path: imObject.format, op: '=', value: imObject.value }]
	};
	// run the query and store the results in the initial layer of the network
	new imjs.Service(service).records(query).then(function(response) {
		window.bioActivityGraph = new BioActivityGraph(response[0]);
	});
}
export { main };
