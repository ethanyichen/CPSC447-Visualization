/**
 * Load data from CSV file asynchronously and visualize it
 */
d3.csv('data/experiment_data.csv')
  .then(data => {
    data.forEach(d => {
      d.accuracy = +d.accuracy;
    });
    const scatterPlot = new Scatterplot({parentElement: '#vis'}, data);

    scatterPlot.updateVis();

  })
  .catch(error => console.error(error));