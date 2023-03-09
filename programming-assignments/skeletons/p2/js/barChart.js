class BarChart {

  constructor(_config, _dispatcher, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 260,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 40}
    }
    this.dispatcher = _dispatcher;
    this.data = _data;
    this.initVis();
  }
  
  initVis() {
    // Create SVG area, initialize scales and axes
  }

  updateVis() {
    // Prepare data and scales
  }

  renderVis() {
    // Bind data to visual elements, update axes
  }
}