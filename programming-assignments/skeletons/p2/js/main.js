/**
 * Load data from CSV file asynchronously and render charts
 */

let data, lexischart, scatterplot, barchart, selectedCountries = "oecd";
const dispatcher = d3.dispatch('filterCountries')
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

    let selectedArrowColorScale = d3.scaleOrdinal()
        .range(['#ddd', '#ffba42']) // light green to dark green
        .domain(['0', '1']);

    barchart = new BarChart({
            parentElement: '#bar-chart'
        },
        dispatcher,
        data);
    barchart.updateVis();
    lexischart = new LexisChart({
            parentElement: '#lexis-chart',
            colorScale: selectedArrowColorScale
        },
        dispatcher,
        data);
    lexischart.updateVis();
    scatterplot = new ScatterPlot({
            parentElement: '#scatter-plot'
        },
        dispatcher,
        data);
    scatterplot.updateVis();
    dispatcher.call('filterCountries', null, selectedCountries);
});

/**
 * Select box event listener
 */
d3.select('#country-selector').on('change', function() {
    // Get selected display type and update chart
    selectedCountries = d3.select(this).property('value');
    dispatcher.call('filterCountries', null, selectedCountries);
});
dispatcher.on('filterCountries', selectedCountries => {
    lexischart.data = data.filter(d => qualifyForCountryGroup(d, selectedCountries));
    lexischart.updateVis();
});

function qualifyForCountryGroup(d, selectedCountries) {
    switch(selectedCountries) {
        case "oecd":
            return d.oecd == 1
            break;
        case "eu27":
            return d.eu27 == 1
        break;
        case "brics":
            return d.brics == 1
            break;
        case "gseven":
            return d.gseven == 1
            break;
        case "gtwenty":
            return d.gtwenty == 1
            break;
    }
}
