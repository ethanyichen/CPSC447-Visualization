class LexisChart {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _dispatcher, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1000,
            containerHeight: 450,
            mainColor: _config.mainColor,
            colorScale: _config.colorScale,
            margin: {top: 35, right: 25, bottom: 85, left: 35},
            displayTooltip: _config.displayTooltip
        }
        this.dispatcher = _dispatcher;
        this.data = _data;
        this.selectedLeaders = [];
        this.initVis();
    }

    /**
     * Create scales, axes, and append static elements
     */

    initVis() {
        let vis = this;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g');

        // Create default arrow head
        // Can be applied to SVG lines using: `marker-end`
        vis.markerEnd = vis.chart.append('defs').append('marker')
            .attr('id', 'arrow-head')
            .attr('markerUnits', 'strokeWidth')
            .attr('refX', '2')
            .attr('refY', '2')
            .attr('markerWidth', '10')
            .attr('markerHeight', '10')
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,0 L2,2 L 0,4')
            .attr('stroke', '#ddd')
            .attr('fill', 'none');

        // Create selected arrow head
        // Can be applied to SVG lines using: `marker-end-selected`
        vis.chart.append('defs').append('marker')
            .attr('id', 'arrow-head-selected')
            .attr('markerUnits', 'strokeWidth')
            .attr('refX', '2')
            .attr('refY', '2')
            .attr('markerWidth', '10')
            .attr('markerHeight', '10')
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,0 L2,2 L 0,4')
            .attr('stroke', '#ffba42')
            .attr('fill', 'none');

        // Create highlighted arrow head
        // Can be applied to SVG lines using: `marker-end-highlighted`
        vis.chart.append('defs').append('marker')
            .attr('id', 'arrow-head-highlighted')
            .attr('markerUnits', 'strokeWidth')
            .attr('refX', '2')
            .attr('refY', '2')
            .attr('markerWidth', '10')
            .attr('markerHeight', '10')
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,0 L2,2 L 0,4')
            .attr('stroke', vis.config.mainColor)
            .attr('fill', 'none');

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // scales
        vis.xScale = d3.scaleLinear()
            .domain([1950, 2021])
            .range([0, vis.width])
        vis.yScale = d3.scaleLinear()
            .domain([31, 95])
            .range([vis.height, 0])

        vis.highlightedArrowColorScale = d3.scaleOrdinal()
            .range(['#ddd', vis.config.mainColor])
            .domain(['0', '1']);

        vis.highlightedArrowStrokeScale = d3.scaleOrdinal()
            .range([1.25, 2.5])
            .domain(['0', '1']);

        vis.labelColorScale = d3.scaleOrdinal()
            .range(['none', '#111'])
            .domain(['0', '1']);

        //axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickPadding(10)

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickPadding(10);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height + 55})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // Initialize clipping mask that covers the whole chart
        vis.chartArea.append('defs')
            .append('clipPath')
            .attr('id', 'chart-mask')
            .append('rect')
            .attr('width', vis.width)
            .attr('y', -vis.config.margin.top)
            .attr('height', vis.config.containerHeight);

        // Apply clipping mask to 'vis.chart' to clip semicircles at the very beginning and end of a year
        vis.chart = vis.chartArea.append('g')
            .attr('clip-path', 'url(#chart-mask)');


        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 10)
            .attr('dy', '.71em')
            .text('Age');
    }


    updateVis() {
        let vis = this;

        vis.startYear = d => d.start_year;
        vis.endYear = d => d.end_year;
        vis.startAge = d => d.start_age;
        vis.endAge = d => d.end_age;
        vis.gender = d => d.gender;
        vis.hasLabel = d => d.label;


        vis.renderVis();
    }


    renderVis() {
        let vis = this;

        vis.arrows = vis.chart.selectAll('.arrow')
            .data(vis.data, d => d.leader)
            .join('line')
            .attr('x1', d => vis.xScale(vis.startYear(d)))
            .attr('x2', d => vis.xScale(vis.endYear(d)))
            .attr('y1', d => vis.yScale(vis.startAge(d)))
            .attr('y2', d => vis.yScale(vis.endAge(d)))
            .attr('stroke', d => vis.highlightedArrowColorScale(vis.hasLabel(d)))
            .attr('stroke-width', d => vis.highlightedArrowStrokeScale(vis.hasLabel(d)))
            .attr('class', 'arrow')
            .classed('selected', d => vis.selectedLeaders.includes(d.leader))
            .attr('marker-end', d => `url(${vis.selectArrowHeads(d)})`)
            .on('click', function (event, d) {
                    // Check if current category is active and toggle class
                    const isSelected = d3.select(this).classed('selected');
                    d3.select(this).classed('selected', !isSelected);
                    // Get the names of all active/filtered categories
                    vis.selectedLeaders = vis.chart.selectAll('.arrow.selected').data().map(d => d.leader);
                    vis.arrows.attr('marker-end', d => `url(${vis.selectArrowHeads(d)})`)
                    // Trigger filter event and pass array with the selected category names
                    vis.dispatcher.call('filterLeadersScatterPlot', event, vis.selectedLeaders);
                }
            );
        vis.labels = vis.chart.selectAll('.label')
            .data(vis.data, d => d.leader)
            .join('text')
            .attr('x', 0)
            .attr('y', 0)
            .text(d => d.leader)
            .attr('class', 'label')
            .attr('fill', d => vis.labelColorScale(vis.hasLabel(d)))
            .attr('transform', d => `translate(${vis.xScale(vis.startYear(d)) + 5},${vis.yScale(vis.startAge(d)) - 5}) rotate(-20)`);


        // render tooltip when mousing hovering
        vis.config.displayTooltip(vis.arrows);


        vis.xAxisG.call(vis.xAxis).call(g => g.select('.domain').remove());

        vis.yAxisG.call(vis.yAxis.tickSizeOuter(0)).call(g => g.select('.domain').remove())
    }

    selectArrowHeads(d) {
        let vis = this;
        if (vis.selectedLeaders.includes(d.leader)) {
            return "#arrow-head-selected";
        } else if (vis.hasLabel(d) == 1) {
            return "#arrow-head-highlighted";
        } else {
            return "#arrow-head";
        }
    }
}