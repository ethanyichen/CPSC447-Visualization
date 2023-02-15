class Timeline {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            disasterCategories: _config.disasterCategories,
            containerWidth: 800,
            containerHeight: 1100,
            yAxisTopMargin: 30,
            leftPadding: 30,
            tooltipPadding: 15,
            maxLabelPadding: 9,
            margin: {top: 120, right: 20, bottom: 20, left: 45},
            legendWidth: 170,
            legendHeight: 8,
            legendRadius: 5
        }
        this.data = _data;
        this.selectedCategories = [];
        this.initVis();
    }

    /**
     * We initialize the arc generator, scales, axes, and append static elements
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // scales
        vis.xScale = d3.scaleTime()
            .domain([new Date("2012-01-01"), new Date("2012-12-31")])
            .range([0, vis.width]);
        vis.yScale = d3.scaleTime()
            .domain([new Date("1980-01-01"), new Date("2017-12-31")])
            .range([vis.height, vis.config.yAxisTopMargin]);

        vis.radiusScale = d3.scaleSqrt()
            .domain(d3.extent(vis.data, d => d.cost))
            .range([4, 140]);

        // Initialize axes
        vis.xAxis = d3.axisTop(vis.xScale)
            .ticks(d3.timeMonth, 1)
            .tickFormat(d3.timeFormat("%b"));

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(d3.timeYear, 1)
            .tickSize(-vis.width - 10)
            .tickPadding(15)
            .tickFormat(d3.timeFormat("%Y"));


        // Initialize arc generator that we use to create the SVG path for the half circles.
        vis.arcGenerator = d3.arc()
            .outerRadius(d => vis.radiusScale(d))
            .innerRadius(0)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('id', 'chart')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append x-axis group
        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(${vis.config.leftPadding}, 0)`);


        // Append y-axis group
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis')

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

        // Optional: other static elements
        vis.parseYear = (year) => {
            return new Date(`${year}-01-01`)
        };

        vis.parseMonthToFitMonthScale = (date) => {
            let parsedDate = new Date(date)
            parsedDate.setFullYear(2012)
            return parsedDate
        };

        vis.updateVis();
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        //[{year1, [{disaster 1} {disaster 2}]}, {{year2, [{disaster 3} {disaster 4}}]
        vis.disastersByYear = d3.groups(vis.data, d => d.year);
        vis.maximumCostOfEachYear = d3.rollup(vis.data, v => d3.max(v, d => d.cost), d => d.year)

        vis.renderVis();
    }

    /**
     * Bind data to visual elements (enter-update-exit) and update axes
     */
    renderVis() {
        let vis = this;

        // render axes
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis.tickSizeOuter(0))
            .call(g => g.select('.domain').remove())

        //render year/disasters groups
        vis.yearGroups = vis.chart.selectAll('.row')
            .data(vis.disastersByYear)
            .join('g')
            .attr('class', 'row')
            .attr('transform', d => `translate(0,${vis.yScale(vis.parseYear(d[0]))})`)
        vis.disasterGroups = vis.yearGroups.selectAll('.disaster-group')
            .data(d => d[1])
            .join('g')
            .attr('class', 'disaster-group')
            .attr('transform', d => `translate(${vis.xScale(vis.parseMonthToFitMonthScale(d.date))}, 0)`)

        vis.marks = vis.disasterGroups
            .append('path')
            .attr('class', 'mark')
            .attr('id', d => d.category)
            .attr('d', d => vis.arcGenerator(d.cost))

        vis.maxLabels = vis.disasterGroups
            .data(d => d[1].filter(v => v.cost === vis.maximumCostOfEachYear.get(d[0])))
            .append('text')
            .attr('class', 'max-label')
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(0,${vis.config.maxLabelPadding})`)
            .text(d => d.name);


    }

    renderLegend() {
        let vis = this;

        // Todo: Display the disaster category legend that also serves as an interactive filter.
        // You can add the legend also to `index.html` instead and have your event listener in `main.js`.
    }
}