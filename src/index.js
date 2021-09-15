'use strict';

import { BioActivityGraph } from './BioActivityGraph.js';

// make sure to export main, with the signature
function main(el, service, imEntity, state, config, navigate) {
	if (!state) state = {};
	if (!el || !service || !imEntity || !state || !config) {
		throw new Error('Call main with correct signature');
	}
	// define the TargetMine service
	let tmService = new imjs.Service(service);
	tmService.fetchModel().then(model => {
		// retrieve the data from TargetMine using a predefined query
		let query = new imjs.Query({model});
		query.adjustPath('ChemblCompound');
		query.select([
			'ChemblCompound.identifier',
			'ChemblCompound.name',
			'ChemblCompound.targetProteins.protein.primaryAccession',
			'ChemblCompound.targetProteins.protein.symbol',
			'ChemblCompound.targetProteins.protein.name',
			'ChemblCompound.targetProteins.protein.isUniprotCanonical',
			'ChemblCompound.targetProteins.protein.organism.name',
			'ChemblCompound.targetProteins.activities.type',
			'ChemblCompound.targetProteins.activities.conc',
			'ChemblCompound.targetProteins.activities.relation',
			'ChemblCompound.targetProteins.activities.unit'
		]);
		query.addConstraint({ path: 'id', op: '=', value: imEntity.ChemblCompound.value } );
		return tmService.records(query);
	}).then(rows => {
		window.bioActivityGraph = new BioActivityGraph(rows[0], navigate);
	});
	
	// define fixed DOM elements
	el.innerHTML = `
		<div class="rootContainer">
			<div id="bioActivityGraph" class="targetMineBioActivityGraph" >
			
				<svg id="canvas_bioActivity" class="targetMineBioActivityGraphSVG" viewBox="0 0 400 400">
					<g id="graph">
						<g id="bottom-axis"></g>
						<text id="bottom-axis-title">Bio-Activity Type</text>
						<g id="left-axis"></g>
						<text id="left-axis-title">Activity Concentration (nM)</text>
						<g id="points"></g>
					</g>
				</svg>
				
				<div id="rightColumn_bioActivity" class="rightColumn">	
					<div id="color-div" class="flex-table">
						<h5 class="report-item-heading">Colors:</h5>
						<button id="color-add" value="Color" class="flex-button">Add</button>
					</div>
					<div id="shape-div" class="flex-table">
						<h5 class="report-item-heading">Shapes:</h5>
						<button id="shape-add" value="Shape" class="flex-button">Add</button>
					</div>	
					<div id="visuals-div" class="flex-table">
						<h5 class="report-item-heading">Visual Aids:</h5>
						<div id="visuals-violin" class="flex-row">
							<input id="cb-violin" type="checkbox" onchange="window.bioActivityGraph.updatePointPositions(); window.bioActivityGraph.plotData(); window.bioActivityGraph.plotViolins();" ></input>
							<label class="row-label">Violin plot</label>
						</div>	
						<div id="visuals-jitter" class="flex-row">
							<input type="checkbox" id="cb-jitter" onchange="window.bioActivityGraph.updatePointPositions(); window.bioActivityGraph.plotData();"></input>
							<label class="row-label">Jitter</label>
						</div>
					</div>
				</div>

				<div class="im-modal" id="modal-bioActivity">
					<div class="im-modal-content">
						<div id="modal-dialog">
							<div class="modal-content">
								<div class="modal-header">
									<h4 id="modal-title">
										Select Options to Apply...
										<a class="close">&times</a>
									</h4>
								</div>
								<div class="modal-body">
									<div class="modal-body exporttable-body">
										<div class="export-options">
											
											<div class="panel panel-default">
												<div class="panel-heading active">
													<h3 class="panel-title">Category</h3>
												</div>
												<div id="panel-body-category" class="panel-body">
													<label class="row-label">
														<input type="radio" name="radio-category" value="primaryAccession" checked>
														Primary Accession
													</label>
													<label class="row-label">
														<input type="radio" name="radio-category" value="symbol">
														Gene Symbol
													</label>
													<label class="row-label">
														<input type="radio" name="radio-category" value="type">
														Activity Type
													</label>
												</div>
											</div>
											
											<div class="panel panel-default">
												<div class="panel-heading active">
													<h3 class="panel-title">Value</h3>
												</div>
												<div id="panel-body-value" class="panel-body">
												</div>
											</div>

											<div class="panel panel-default">
												<div class="panel-heading active">
													<h3 id="panel-title-input" class="panel-title"></h3>
												</div>
												<div id="panel-body-input" class="panel-body">
												</div>
											</div>
											
											
										</div>
									</div>
								</div>
								<div class="modal-footer">
									<a id="modal-apply" class="btn btn-raised btn-primary">Apply!</a>
								</div>
							</div>		
						</div>	
					</div>
				</div>

			</div>
		</div>
	`;
}

export { main };
