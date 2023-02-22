// Initialize helper function to convert date strings to date objects
const parseTime = d3.timeParse("%Y-%m-%d");
let data, timeline;

//Load data from CSV file asynchronously and render chart
d3.csv('data/disaster_costs.csv')
    .then(_data => {
        data = _data
        data.forEach(d => {
            d.cost = +d.cost;
            d.year = +d.year;
            d.date = parseTime(d.mid);
            // Optional: other data preprocessing steps
        });
        timeline = new Timeline({
            parentElement: '#vis',
            // Optional: other configurations
        }, data);
    });