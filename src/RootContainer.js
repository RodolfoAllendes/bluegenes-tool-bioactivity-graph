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
						<div id="color-div">
							<label>Color Table</label>
							<table id="color-table">
								<tbody></tbody>
							</table>
							<button id="color-add">Add</button>
							{/* on: new Map([ ['click', function(){ self.modalDisplay('color')}] ]) */}
						</div>
						<div id="shape-div">
							<label>Shape Table</label>
							<table id="shape-table">
								<tbody></tbody>
							</table>
							<button id="shape-add">Add</button>
							{/* on: new Map([ ['click',function(){ self.modalDisplay('shape'); }] ]) */}
						</div>
						<div id="visuals-div">
							<label>Other Visuals</label>
							<table id="visuals-table">
								<tbody></tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default RootContainer;
