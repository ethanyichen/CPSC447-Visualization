class Scatterplot {

    // Todo: Draw chart based on the given instructions
    constructor(_config, _data) {
        // build scatterplot with custom configuration
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || {top: 50, right: 50, bottom: 50, left: 50}
        };
        this.data = _data;
        this.initVis();
    }

    /**
     this function initializes the visualization static components
     */
    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.accuracyScale = d3.scaleLinear().domain([0, 1]).range([0, vis.width]);
        vis.trialScale = d3.scaleBand().range([0, vis.height]);

        vis.xAxis = d3.axisTop().scale(vis.accuracyScale).ticks(6).tickSize(0).tickSizeOuter(0);
        vis.yAxis = d3.axisLeft().scale(vis.trialScale).tickSize(0);

        vis.svg = d3.select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        vis.chart = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

        // append x-axis group to the bottom of the chart group
        vis.xAxisG = vis.chart
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        // append y-axis group to the left of the chart group
        vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");
    }

    /**
     this function updates the visualization components based on data input
     */
    updateVis() {
        let vis = this;

        vis.trial = (d) => d.trial;
        vis.trials = vis.data.map(vis.trial).sort();
        vis.trialsLabels = vis.trials.map(String).map((d) => {
            return "Trial ".concat(d)
        });
        vis.trialScale.domain(vis.trials);
        vis.yAxis.tickFormat((d) => "Trial ".concat(d));
        vis.yAxis.ticks(vis.trials.length);

        vis.renderVis()
    }


    renderVis() {
        let vis = this;

        vis.chart.selectAll(".dot")
            .data(vis.data)
            .join("circle")
            .attr("class", "dot")
            .attr("cx", d => vis.accuracyScale(d.accuracy))
            .attr("cy", d => vis.trialScale(d.trial) + 25)
            .attr("r", 3);

        vis.xAxisG.call(vis.xAxis).call(g => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis);
    }
}