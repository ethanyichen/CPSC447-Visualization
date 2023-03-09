/**
 * Load data from CSV file asynchronously and render charts
 */

let data, lexischart, scatterplot, barchart;
const dispatcher = d3.dispatch('filteredLeaders')
d3.csv('data/leaderlist.csv').then(_data => {
    data = _data;

    // Convert columns to numerical values
    data.forEach(d => {
        Object.keys(d).forEach(attr => {
            if (attr == 'pcgdp') {
                d[attr] = (d[attr] == 'NA') ? null : +d[attr];
            } else if (attr != 'country' && attr != 'leader' && attr != 'gender') {
                d[attr] = +d[attr];
            }
        });
    });

    data.sort((a, b) => a.label - b.label);

    barchart = new BarChart({
            parentElement: '#barchart'
        },
        dispatcher,
        data);
    barchart.updateVis();
    lexischart = new LexisChart({
            parentElement: '#lexischart'
        },
        dispatcher,
        data);
    lexischart.updateVis();
    scatterplot = new ScatterPlot({
            parentElement: '#scatterplot'
        },
        dispatcher,
        data);
    scatterplot.updateVis();
});

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
