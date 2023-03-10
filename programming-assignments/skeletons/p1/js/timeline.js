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
            margin: {top: 200, right: 20, bottom: 20, left: 45},
            legendMarginTop: 30,
            legendLabelPaddingRight: 10,
            legendLabelPaddingTop: 5,
            legendWidth: 300,
            legendHeight: 100,
            legendRadius: 5,
            legendCountEachRow: 2
        }
        this._data = _data;
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

        // generate array of all the categories given by the dataset
        vis.disasterByCategory = d3.groups(vis.data, d => d.category);
        vis.disasterCategories = vis.disasterByCategory.map(d => d[0]);

        // scales for legend
        vis.legendScaleHorizontal = d3.scaleLinear()
            .domain([0, vis.config.legendCountEachRow])
            .range([0, vis.config.legendWidth])
        vis.legendScaleVertical = d3.scaleLinear()
            .range([vis.config.legendHeight, 0])
            .domain([0, Math.ceil(vis.disasterCategories.length / vis.config.legendCountEachRow) - 1]);

        // Initialize axes
        vis.xAxis = d3.axisTop(vis.xScale)
            .ticks(d3.timeMonth, 1)
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

        // Append group that will hold the legend elements, place it on the appropriate position on svg
        vis.legendGroup = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.legendMarginTop})`)
            .attr('class', 'legends-group')

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
        // date parser that takes a year (ex. 2017) and convert into Date (2017-01-01) for scale function input
        vis.parseYear = (year) => {
            return new Date(`${year}-01-01`)
        };

        // date parser that takes a date and converts that date to format for scale function input
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


        // generate map with key being the year and the values being an array of the disasters that happened that year
        vis.disastersByYear = d3.rollup(vis.data, v => v, d => d.year);

        // calculate the maximum cost of each year, key being year, value being the max cost of that year
        vis.maximumCostOfEachYear = d3.rollup(vis.data, v => d3.max(v, d => d.cost), d => d.year)


        vis.renderLegend();
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

        //render row groups
        vis.row = vis.chart.selectAll('.disaster-row')
            .data(vis.disastersByYear, d => d[0]);

        vis.rowEnter = vis.row.join('g')
            .attr('class', 'disaster-row')
            .attr('transform', d => `translate(0,${vis.yScale(vis.parseYear(d[0]))})`);

        //render each cell group and its associated mark and text
        vis.disasterGroup = vis.rowEnter
            .selectAll('.disaster-group')
            .data(d => d[1], d => d.category)
            .join((enter) => {
                let cell = enter;
                let disasterGroup = cell
                    .append('g')
                    .attr('class', 'disaster-group')
                    .attr('transform', d => `translate(${vis.xScale(vis.parseMonthToFitMonthScale(d.date))}, 0)`)
                vis.marks = disasterGroup.append('path')
                    .attr('class', 'mark')
                    .attr('id', d => d.category)
                    .attr('d', d => vis.arcGenerator(d.cost))
                disasterGroup
                    .append('text')
                    .attr('class', 'max-label')
                    .attr('text-anchor', 'middle')
                    .attr('transform', `translate(0,${vis.config.maxLabelPadding})`)
                    .text(d => d.name)
                    .attr('fill', (d) => {
                        if (d.cost !== vis.maximumCostOfEachYear.get(d.year)) {
                            return "none";
                        }
                    });
            })

        // render tooltip when mousing hovering
        vis.marks
            .on('mouseover', (event, d) => {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
              <div class="tooltip-title">${d.name}</div>
              <div>${d.cost} billion</div>
            `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            })

    }

    renderLegend() {
        let vis = this;

        // generate legend cells for disaster categories each with circle and text description
        vis.legendCell = vis.legendGroup
            .selectAll('.legend-cell')
            .data(vis.disasterCategories)
            .join((enter) => {
                let group = enter.append('g')
                    .attr('class', 'legend-cell');

                // xPosition and yPosition calculator based on given category legend index in the category list
                let xValue = (d, i) => (vis.legendScaleHorizontal(i % vis.config.legendCountEachRow));
                let yValue = (d, i) => (vis.legendScaleVertical(Math.ceil(i / vis.config.legendCountEachRow)));

                // append legend circles with given radius
                group.append('circle')
                    .attr('class', 'legend-mark')
                    .attr('id', d => d)
                    .attr("r", vis.config.legendRadius + 'px')
                    .attr("cx", (d, i) => xValue(d, i))
                    .attr("cy", (d, i) => yValue(d, i));
                // append legend labels for the legend, transform to the right of the legend circles with
                // add listener to legend labels for filtering data based on selectedCategories
                group.append('text')
                    .attr('class', 'legend-label')
                    .attr('text-anchor', 'right')
                    .text(d => d)
                    .attr("x", (d, i) => xValue(d, i))
                    .attr("y", (d, i) => yValue(d, i))
                    .attr('transform', `translate(${vis.config.legendLabelPaddingRight},${vis.config.legendLabelPaddingTop})`)
                    .on('click', function (event, d) {
                        const isActive = vis.selectedCategories.includes(d);
                        // add the category if it was not previously selected, remove otherwise
                        if (isActive) {
                            vis.selectedCategories = vis.selectedCategories.filter(f => f !== d);
                        } else {
                            vis.selectedCategories.push(d);
                        }
                        vis.filterData(); // Call filterData function to update vis.data
                        d3.select(this).classed('active', !isActive); // toggle active status
                    });
            })
    }

    // this function filters visualization data based on the state of array selectedCategories
    // return unfiltered data when selectedCategories is empty
    // otherwise, return filtered data with only the categories in selectedCategories
    filterData() {
        let vis = this;
        if (vis.selectedCategories.length === 0) {
            vis.data = vis._data;
        } else {
            vis.data = vis._data.filter(d => timeline.selectedCategories.includes(d.category));
        }
        vis.updateVis();
    }
}

