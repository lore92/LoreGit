var svg = d3.select("body")
            .append("svg")
            .attr("width", 400)
            .attr("height", 300);

var line = d3.svg.line()
    .x(function(d) {return Math.random() * 400; }) 
    .y(function(d) { return Math.random() * 300; });

var array = [1,2,3,4,5,6];
svg.selectAll("path")
        .data(array).enter()
        .append("path")
    .attr("d", function() { return line(array) }) // replacing line with M0,0l100,100 draws a line 
            .attr("class", "line")
            .style("stroke", "black" )
            .attr('fill', 'none');
