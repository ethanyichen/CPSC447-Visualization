class ScatterPlot {

  constructor(_config, _dispatcher, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 900,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 30, right: 30, bottom: 50, left: 30}
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
    vis.xScale = d3.scaleLinear()
        .domain([0, 100000])
        .range([0, vis.width])
    vis.yScale = d3.scaleLinear()
        .domain([30, 90])
        .range([vis.height, 0])

    //axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSize(-vis.height - 20)
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

    vis.chart.append('text')
        .attr('class', 'axis-title')
        .attr('y', vis.height + 10)
        .attr('x', vis.width + 10)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('GDP per Capita (US$)');
  }

  updateVis() {
    // Prepare data and scales
    let vis = this;

    vis.gdpValue = d => d.pcgdp;
    vis.startAgeValue = d => d.start_age;

    vis.renderVis()
  }

  renderVis() {
    // Bind data to visual elements, update axes
    let vis = this;

    // Update the axes/gridlines
    // We use the second .call() to remove the axis and just show gridlines
    vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());

    vis.yAxisG
        .call(vis.yAxis)
        .call(g => g.select('.domain').remove())
  }

}