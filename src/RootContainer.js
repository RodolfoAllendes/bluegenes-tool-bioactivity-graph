import React from 'react';

class RootContainer extends React.Component {
	render() {
		return (
			<div className="rootContainer">
				<div id="bioActivityGraph-div" className="targetmineGraphDisplayer">
					<svg
						id="canvas_bioActivity"
						className="targetmineGraphSVG"
						viewBox="0 0 400 400"
					>
						<g id="graph"></g>
					</svg>
					<div id="rightColumn_bioActivity" className="rightColumn">
						<div id="color-div" className="flex-table">
							<label>Color Table</label>
							<div id="color-table">
							</div>
							<button id="color-add" className="flex-button">Add</button>
						</div>
						<div id="shape-div" className="flex-table">
							<label>Shape Table</label>
							<div id="shape-table">
							</div>
							<button id="shape-add" className="flex-button">Add</button>
						</div>
						<div id="visuals-div" className="flex-table">
							<label>Other Visuals</label>
							<div id="visuals-table">
								<div id="visuals-violin" className="flex-row">
									<input type="checkbox" id="cb-violin">
									</input>
									<label className="row-label">Violin plot</label>
								</div>
								<div id="visuals-jitter" className="flex-row">
									<input type="checkbox" id="cb-jitter">
									</input>
									<label className="row-label">Jitter</label>
								</div>
							</div>
						</div>
					</div>
					<div id="modal_bioActivity" className="targetmineGraphModal">
						<h3 id="modal-title"></h3>
						<div className="modal-content">
							<label className="modal-label">Category:</label>
							<select id="modal-select-column" className="modal-select">
								<option value="primaryAccession">Primary Accession</option>
								<option value="symbol">Gene symbol</option>
								<option value="type">Activity Type</option>

								{/*on: new Map([ ['change',function(e){
									let values = [...new Set(self._data.map(pa => pa[e.target.value]))];
									self.updateSelectOptions('#modal-value-select', values);}] ]), */}
							</select>
							<label className="modal-label">Value:</label>
							<select id="modal-select-value" className="modal-select"></select>
							<label id="modal-input-label" className="modal-label"></label>
							<div id="modal-input"></div>
							<button id="modal-ok" className="modal-button">OK</button>
							<button id="modal-cancel" className="modal-button">Cancel</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default RootContainer;
