class Scatterplot {
    constructor(_config, _data) {
        // build scatterplot with custom configuration
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 250,
            margin: _config.margin || {top: 30, right: 30, bottom: 30, left: 30},
            yOffSet: _config.yOffSet || 15,
            paddingBetweenPointsAndMeanLabels: _config.paddingBetweenPointsAndMeanLabels || 35
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
        vis.meanChartWidth = vis.width / 6;

        // scales for x and y axis values
        vis.accuracyScale = d3.scaleLinear().range([0, vis.width - vis.meanChartWidth - vis.config.paddingBetweenPointsAndMeanLabels]);
        vis.trialScale = d3.scaleBand().range([0, vis.height - vis.config.yOffSet]);

        //initialize axes
        vis.xAxis = d3.axisTop().scale(vis.accuracyScale).ticks(6).tickSize(0).tickSizeOuter(0);
        vis.yAxis = d3.axisLeft().scale(vis.trialScale).tickSize(0);


        vis.svg = d3.select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // group transformations
        vis.chart = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );
        vis.meanAccuracyChart = vis.chart
            .append("g")
            .attr("class", "meanAccuracyChart")
            .attr("transform", `translate(${vis.width - vis.meanChartWidth},0)`);


        // append x-axis group to the bottom of the chart group
        vis.xAxisG = vis.chart
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        // append title group to the top of the svg
        // add title texts
        vis.titles = ["Trial/Accuracy Scatterplot", "Mean Accuracy Per Trial"]
        vis.titleScale = d3.scaleBand().domain(vis.titles).range([0, vis.config.containerWidth])
        vis.titleGroup = vis.svg.append("g")
            .attr("class", "title")
            .attr("transform", `translate(0, ${vis.config.margin.top / 2})`);
        vis.titleText = vis.titleGroup
            .selectAll("title-text")
            .data(vis.titles)
            .join("text")
            .attr("class", "title-text")
            .attr("x", (d) => vis.titleScale(d))
            .style("font-size", "13px")
            .text(d => d)

        // add x-axis-label to the bottom of the svg
        vis.xAxisLabel = vis.svg
            .append("g")
            .attr("class", "x-axis-label")
            .attr("transform", `translate(25,${vis.height + vis.config.margin.top + 25})`)
            .append("text")
            .style("font-size", "13px")
            .text("Accuracy");

        // append y-axis group to the left of the chart group
        vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

        // generate grid for each ticks of x-axis
        vis.grid = vis.chart
            .selectAll("gridLine")
            .data(vis.accuracyScale.ticks(6))
            .join("line")
            .attr("class", "gridLine")
            .attr("x1", (d) => vis.accuracyScale(d))
            .attr("y1", 0)
            .attr("x2", (d) => vis.accuracyScale(d))
            .attr("y2", vis.height - 20)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("Stroke-opacity", 0.25)
            .style("fill", "none")
            .style("shape-rendering", "crispEdges")
    }

    /*
     this function updates the visualization components based on data input
     **/
    updateVis() {
        let vis = this;

        vis.accuracyScale.domain([Math.floor(d3.min(vis.data, (d) => d.accuracy)), Math.ceil(d3.max(vis.data, (d) => d.accuracy))]);
        // update y-axis ticks format and domain with updated trial data
        vis.trial = (d) => d.trial;
        vis.trials = vis.data.map(vis.trial).sort();
        vis.trialsLabels = vis.trials.map(String).map((d) => {
            return "Trial ".concat(d)
        });
        vis.trialScale.domain(vis.trials);
        vis.yAxis.tickFormat((d) => "Trial ".concat(d));
        vis.yAxis.ticks(vis.trials.length);

        //Calculating mean Accuracy per Trial
        vis.meanAccuracyPerTrial = meanAccuracyPerTrial(vis.data);

        vis.renderVis()
    }

    // this function renders the visualization components that are data dependent
    renderVis() {
        let vis = this;

        // rendering accuracy points for each trial
        vis.chart.selectAll("point")
            .data(vis.data)
            .join("circle")
            .attr("class", "point")
            .attr("cx", d => vis.accuracyScale(d.accuracy))
            .attr("cy", d => vis.trialScale(d.trial) + vis.config.yOffSet)
            .attr("r", "8px");

        // rendering mean accuracy for each trial
        vis.meanAccuracyChart.selectAll(".accuracyLabel")
            .data(vis.meanAccuracyPerTrial)
            .join("text")
            .text((d) => (d))
            .attr("class", "accuracyLabel")
            .attr("x", 0)
            .attr("y", (d, index) => (vis.trialScale((index + 1).toString()) + vis.config.yOffSet + 5));

        // rendering x-axis and y-axis without axis line
        vis.xAxisG.call(vis.xAxis).call(g => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis).call(g => g.select(".domain").remove());
    }
}

/**
returns an array of mean accuracy per trial
 */
function meanAccuracyPerTrial(data) {
    let accuracy = [[]];
    // create an array with each trial's accuracy data
    data.forEach((d) => {
        let trial = parseInt(d.trial);
        if (accuracy[trial] === undefined) {
            accuracy[trial] = [];
        }
        accuracy[trial].push(d.accuracy);
    })
    let meanAccuracyPerTrial = [];
    const avg = (arr) => d3.mean(arr);
    // calculating mean accuracy per trial
    accuracy.forEach((a) => {
        if (a.length > 0) {
            meanAccuracyPerTrial.push(avg(a))
        }
    });

    //round mean accuracy to 2 decimal places
    meanAccuracyPerTrial = meanAccuracyPerTrial.map(d => d.toFixed(2));
    return meanAccuracyPerTrial;
}