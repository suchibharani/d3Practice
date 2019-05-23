window.onload = function() {
    // set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 80},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
var tooltip = d3.select("#my_dataviz").append("div")
    .attr("class", "tooltip")				
    .style("display", "none")
    .style("position", "absolute")
    .style("text-align", "center")
    .style("width", "200px")
    .style("height", "85px")
    .style("padding", "2px")
    .style("font", "12px sans-serif")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-radius", "8px")
    .style("stroke", "black")
    .style("opacity", 1)
    .style("pointer-events", "none");
// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


//Read the data
console.log(d3.csv)
d3.csv("https://raw.githubusercontent.com/haomengchao/haomengchao.github.io/master/movies_modified_2%202.csv")
.get( function(data) {
  // Add X axis
  console.log(data)
  var x = d3.scaleLinear()
    .domain([0, 10])
    .range([ 0, width -200 ]);

		var x_axis = d3.axisBottom()
			.scale(x);

		svg.append("g")
			
				.attr("transform", "translate(0, " + height + ")")
				.call(x_axis);

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([25000, 115000000])
    .range([ height , 2*margin.top]);
  
  var y_axis = d3.axisLeft().scale(y);
  svg.append("g")
    .attr("class", "y_axis")
    .call(y_axis);
  //add a title
  svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", margin.top)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")  
        .text("Budget VS Rating Of Movies In History");
    //add a x-axis title
  svg.append("text")
        .attr("x", width-margin.right-200)             
        .attr("y", height-margin.bottom/2)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")  
        .text("Rating");
    //add a y-axis title
  svg.append("text")
        .attr("x", 0)             
        .attr("y", margin.top)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")  
        .text("Budget");
 
  // Add a scale for bubble size
  var z = d3.scaleLinear()
    .domain([0,230 ])
    .range([ 5,40]);

  // Add a scale for bubble color
  var myColor = d3.scaleOrdinal()
    .domain(['Drama', 'Horror', 'Thriller', 'Action', 'Comedy', 'Adventure', 'Romance', 'Crime', 'Animation', 'Fantasy', 'Science Firction' ])
    .range(d3.schemeSet2);
  
  var legend_keys = ['Drama', 'Horror', 'Thriller', 'Action', 'Comedy', 'Adventure', 'Romance', 'Crime', 'Animation', 'Fantasy', 'Science Firction' ]

  var lineLegend = svg.selectAll(".lineLegend")
                      .data(legend_keys)
                      .enter().append("g")
                      .attr("class","lineLegend")
                      .attr("transform", function (d,i) {
                      return "translate(" +width*0.8 + "," + (i*20)+")";
                       });

  lineLegend.append("text").text(function (d) {return d;})
    .attr("transform", "translate(20,10)"); //align texts with boxes

  lineLegend.append("rect")
    .attr("fill", function (d, i) {return myColor(d); })
    .attr("width", 10)
    .attr("height", 10);
  
  d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };
  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .filter(function(d) { return d.title_year ==1994  })
      .attr("cx", function (d) { return x(d.vote_average); } )
      .attr("cy", function (d) { return y(d.budget); } )
      .attr("r", function (d) { return z(d.popularity); } )
      .style("fill", function (d) { return myColor(d.genres); } )
      .style("opacity", "0.7")
      .attr("stroke", "white")
      .style("stroke-width", "0.5px")
        .on("click", function(){
          d3.select(this).moveToBack();
      })
      .on("mouseover", function(){
          tooltip.style("display", "inline");
      })
      .on("mousemove", function(d) {
          tooltip.html("MOVIE INFORMATION:"+"<br/>" + "Movie Title: "+d.movie_title + "<br/>" + "Language: "+d.language + "<br/>" + "Country: "+d.country + "<br/>" + "Duration: "+d.duration)	
            .style("left", 750 + "px")		
            .style("top", 300 + "px");	
      })					
      .on("mouseout", function() {		
          tooltip.style("display", "none");
        });
      
  function drawplot(new_data) {
    // recompute density estimation
    var maxRange = d3.max(new_data, function (d) {return parseInt(d.budget);});
    // console.log(maxRange);
    y.domain([1000, maxRange])
      .range([ height , 2*margin.top]);
    svg.select(".y_axis")
    .transition()
    .duration(1000)
    .call(y_axis);
    
    svg.selectAll("circle").remove();
    
    // update the chart
    var circles = svg
      .selectAll("dot")
      .data(new_data);
    
    circles.enter()
      .append("circle")
      // .transition()
      // .duration(1000)
      .attr("cx", function (d) { return x(d.vote_average); } )
      .attr("cy", function (d) { return y(d.budget); } )
      .attr("r", function (d) { return z(d.popularity); } )
      .style("fill", function (d) { return myColor(d.genres); } )
      .style("opacity", "0.7")
      .attr("stroke", "white")
      .style("stroke-width", "0.5px")
      .on("click", function(){
          d3.select(this).moveToBack();
      })
      .on("mouseover", function(){
          tooltip.style("display", "inline");
      })
      .on("mousemove", function(d) {
        tooltip.html("MOVIE INFORMATION:"+"<br/>" + "Movie title: "+d.movie_title + "<br/>" + "Language: "+d.language + "<br/>" + "Country: "+d.country + "<br/>" + "Duration: "+d.duration)	
            .style("left", 750 + "px")		
            .style("top", 300 + "px");	
      })					
      .on("mouseout", function() {		
          tooltip.style("display", "none");
    });
    
    circles.exit()
    .remove();
  };
  
  function updateChart(currentyear){
    var newData = data.filter(function(d) {
    return d.title_year == currentyear;
  });
    drawplot(newData);
  };
  
  d3.select("#add").on("click",function(){
    var currentyear = document.getElementById("show_year").innerText
    if (parseInt(currentyear) == 2016) { return; }
    var newyear = "" + (parseInt(currentyear)+1);
    updateChart(newyear);
    d3.select('#show_year').text(newyear);
    document.getElementById("range1").value = newyear;
  });
  
  d3.select("#minus").on("click",function(){
    var currentyear = document.getElementById("show_year").innerText
    if (parseInt(currentyear) == 1927) { return; }
    var newyear = "" + (parseInt(currentyear)-1);
    updateChart(newyear);
    d3.select('#show_year').text(newyear);
    document.getElementById("range1").value = newyear;
  });

  // Add an event listener to the button created in the html part
  d3.select("#range1").on("change", function(d){
    var currentyear = this.value;
    updateChart(currentyear);
    d3.select('#show_year').text(currentyear);
  });

});
}