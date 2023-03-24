/**
 * Load data from CSV file asynchronously and render charts
 */

let data, lexischart, scatterplot, barchart, charts, selectedCountryGroup = "oecd";
let tooltipPadding = 15;
const dispatcher = d3.dispatch('filterLeadersLexisChart', 'filterLeadersScatterPlot')
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

    let selectedColorScale = d3.scaleOrdinal()
        .range(['#ddd', '#ffba42']) // light green to dark green
        .domain(['0', '1']);

    let mainColor = "#50b7cc"

    barchart = new BarChart({
            parentElement: '#bar-chart'
        },
        dispatcher,
        data);
    lexischart = new LexisChart({
            parentElement: '#lexis-chart',
            colorScale: selectedColorScale,
            mainColor: mainColor,
            displayTooltip: displayTooltip
        },
        dispatcher,
        data);
    scatterplot = new ScatterPlot({
            parentElement: '#scatter-plot',
            mainColor: mainColor,
            dotRadius: "5px",
            displayTooltip: displayTooltip
        },
        dispatcher,
        data);
    charts = [barchart, scatterplot, lexischart];
    filterDataByCountryGroupAndUpdateVis(charts, selectedCountryGroup);
});

/**
 * Select box event listener
 */
d3.select('#country-selector').on('change', function () {
    // Get selected display type and update chart
    selectedCountryGroup = d3.select(this).property('value');
    filterDataByCountryGroupAndUpdateVis(charts, selectedCountryGroup);
});

dispatcher.on('filterLeadersLexisChart', selectedLeaders => {
    lexischart.selectedLeaders = selectedLeaders;
    lexischart.updateVis();
});

dispatcher.on('filterLeadersScatterPlot', selectedLeaders => {
    scatterplot.selectedLeaders = selectedLeaders;
    scatterplot.updateVis();
});
function displayTooltip(element) {
    element.on('mouseover', (event, d) => {
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + tooltipPadding) + 'px')
            .style('top', (event.pageY + tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.leader}</div>
              <div><i>${d.country}, ${d.start_year} - ${d.end_year}</i></div>
              <ul>
                <li>Age at inauguration: ${d.start_age}</li>
                <li>Time in office: ${d.duration}</li>
                ${d.pcgdp === null ? `` : `<li>GDP/capita: ${d.pcgdp}</li>`}
              </ul>
            `);
    })
        .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
        })
}

function filterDataByCountryGroupAndUpdateVis(charts, selectedCountryGroup) {
    charts.forEach((chart) => {
        chart.data = data.filter(d => d[selectedCountryGroup] == 1)
        chart.updateVis();
    })
}
