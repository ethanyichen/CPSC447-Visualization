class BarChart {

  constructor(_config, _dispatcher, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 200,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 30, right: 20, bottom: 50, left: 40}
    }
    this.dispatcher = _dispatcher;
    this.data = _data;
    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // scales
    vis.xScale = d3.scaleBand()
        .domain(["Male", "Female"])
        .range([0, vis.width])
    vis.yScale = d3.scaleLinear()
        .domain([0, 500])
        .range([vis.height, 0])

    //axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSize(0)
        .tickPadding(15)

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSize(-vis.width - 10)
        .tickPadding(10);


    // initilize svg components
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height + 10})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    vis.svg.append('text')
        .attr('class', 'axis-title')
        .attr('x', 0)
        .attr('y', 5)
        .attr('dy', '.71em')
        .text('Age');
  }

  updateVis() {
    // Prepare data and scales
    let vis = this;

    vis.renderVis()
  }

  renderVis() {
    let vis = this;
    // render axes
    vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());

    vis.yAxisG
        .call(vis.yAxis.tickSizeOuter(0))
        .call(g => g.select('.domain').remove())
  }
}