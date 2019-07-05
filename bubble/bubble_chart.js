/* Bubble chart
 * 
 * Based on Jim Vallandingham's work
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */

function createBubbleChart() {
    /* bubbleChart creation function. Returns a function that will
     * instantiate a new bubble chart given a DOM element to display
     * it in and a dataset to visualize.
     */

    // Tooltip object for mouseover functionality, width 200
    var tooltip = floatingTooltip('bubble_chart_tooltip', 200);
    // These will be set in the `bubbleChart` function
    var svg = null, inner_svg = null;
    var bubbles = null;
    var forceSim = null;
    var fillColorScale = null;
    var radiusScale = null;
    var nodes = [];
    var margin = null;
    var width = null;
    var height = null;
    var dataExtents = {};
    // For scatterplots (initialized if applicable)
    var xAxis = null;
    var yAxis = null;
    var xScale = null;
    var yScale = null;
    // For the map
    var bubbleMercProjection = d3.geoAlbers();

    function getFillColorScale() {
        // Obtain a color mapping from keys to color values specified in our parameters file

        // Get the keys and values from the parameters file
        var color_groupsKeys = Object.keys(BUBBLE_PARAMETERS.fill_color.color_groups)
        var color_groupsValues = []
        for (var i=0; i<color_groupsKeys.length; i++) {
            var key = color_groupsKeys[i]
            color_groupsValues.push(BUBBLE_PARAMETERS.fill_color.color_groups[key])
        }
        
        // Generate the key -> value mapping for colors
        var fillColorScale = d3.scaleOrdinal()
            .domain(color_groupsKeys)
            .range(color_groupsValues);

        return fillColorScale;
    }
    
    function createNodes(rawData) {
        /*
         * This data manipulation function takes the raw data from
         * the CSV file and converts it into an array of node objects.
         * Each node will store data and visualization values to visualize
         * a bubble.
         *
         * rawData is expected to be an array of data objects, read in from
         * one of d3's loading functions like d3.csv.
         *
         * This function returns the new node array, with a node in that
         * array for each element in the rawData input.
         */
        // Use map() to convert raw data into node data.
        var myNodes = rawData.map(function (data_row) {
            node = {
                id: data_row.id,
                scaled_radius: radiusScale(+data_row[BUBBLE_PARAMETERS.radius_field]),
                actual_radius: +data_row[BUBBLE_PARAMETERS.radius_field],
                fill_color_group: data_row[BUBBLE_PARAMETERS.fill_color.data_field],
                // Put each node initially in a random location
                x: Math.random() * width,
                y: Math.random() * height
            };
            for(var key in data_row) {
                // Skip loop if the property is from prototype
                if (!data_row.hasOwnProperty(key)) continue;
                node[key] = data_row[key];
            }
            
            return node;
        });

        // Sort them to prevent occlusion of smaller nodes.
        myNodes.sort(function (a, b) { return b.actual_radius - a.actual_radius; });

        return myNodes;
    }

    function getGridTargetFunction(mode) {
        // Given a mode, return an anonymous function that maps nodes to target coordinates
        if (mode.type != "grid") {
            throw "Error: getGridTargetFunction called with mode != 'grid'";
        }
        return function (node) {
            // Given a mode and node, return the correct target
            if(mode.size == 1) {
                // If there is no grid, our target is the default center
                target = mode.gridCenters[""];
            } else {
                // If the grid size is greater than 1, look up the appropriate target
                // coordinate using the relevant node_tag for the mode we are in
                node_tag = node[mode.dataField]
                target = mode.gridCenters[node_tag];
            }
            return target;
        }
    }
    
    function showLabels(mode) {
        /*
         * Shows labels for each of the positions in the grid.
         */
        var currentLabels = mode.labels; 
        var bubble_group_labels = inner_svg.selectAll('.bubble_group_label')
            .data(currentLabels);

        var grid_element_half_height = height / (mode.gridDimensions.rows * 2);
            
        bubble_group_labels.enter().append('text')
            .attr('class', 'bubble_group_label')
            .attr('x', function (d) { return mode.gridCenters[d].x; })
            .attr('y', function (d) { return mode.gridCenters[d].y - grid_element_half_height; })
            .attr('text-anchor', 'middle')                // centre the text
            .attr('dominant-baseline', 'hanging') // so the text is immediately below the bounding box, rather than above
            .text(function (d) { return d; });

        // GRIDLINES FOR DEBUGGING PURPOSES
        /*
        var grid_element_half_height = height / (mode.gridDimensions.rows * 2);
        var grid_element_half_width = width / (mode.gridDimensions.columns * 2);
        
        for (var key in currentMode.gridCenters) {
            if (currentMode.gridCenters.hasOwnProperty(key)) {
                var rectangle = inner_svg.append("rect")
                    .attr("class", "mc_debug")
                    .attr("x", currentMode.gridCenters[key].x - grid_element_half_width)
                    .attr("y", currentMode.gridCenters[key].y - grid_element_half_height)
                    .attr("width", grid_element_half_width*2)
                    .attr("height", grid_element_half_height*2)
                    .attr("stroke", "red")
                    .attr("fill", "none");
                var ellipse = inner_svg.append("ellipse")
                    .attr("class", "mc_debug")
                    .attr("cx", currentMode.gridCenters[key].x)
                    .attr("cy", currentMode.gridCenters[key].y)
                    .attr("rx", 15)
                    .attr("ry", 10);
            }
        }*/
    }

    function tooltipContent(d) {
        /*
         * Helper function to generate the tooltip content
         * 
         * Parameters: d, a dict from the node
         * Returns: a string representing the formatted HTML to display
         */
        var content = ''

        // Loop through all lines we want displayed in the tooltip
        for(var i=0; i<BUBBLE_PARAMETERS.tooltip.length; i++) {
            var cur_tooltip = BUBBLE_PARAMETERS.tooltip[i];
            var value_formatted;

            // If a format was specified, use it
            if ("format_string" in cur_tooltip) {
                value_formatted = 
                    d3.format(cur_tooltip.format_string)(d[cur_tooltip.data_field]);
            } else {
                value_formatted = d[cur_tooltip.data_field];
            }
            
            // If there was a previous tooltip line, add a newline separator
            if (i > 0) {
                content += '<br/>';
            }
            content += '<span class="name">'  + cur_tooltip.title + ': </span>';
            content += '<span class="value">' + value_formatted     + '</span>';
        }        

        return content;
    }

    function showTooltip(d) {
        /*
         * Function called on mouseover to display the
         * details of a bubble in the tooltip.
         */
        // Change the circle's outline to indicate hover state.
        d3.select(this).attr('stroke', 'black');

        // Show the tooltip
        tooltip.showTooltip(tooltipContent(d), d3.event);
    }

    function hideTooltip(d) {
        /*
         * Hide tooltip
         */
        // Reset the circle's outline back to its original color.
        var originalColor = d3.rgb(fillColorScale(d.fill_color_group)).darker()
        d3.select(this).attr('stroke', originalColor);

        // Hide the tooltip
        tooltip.hideTooltip();
    }

    function ticked() {
        bubbles.each(function (node) {})
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }

    function showAxis(mode) {
        /*
         *  Show the axes.
         */

        // Set up axes
        xAxis = xScale; //d3.scaleBand().rangeRound([0, width]).padding(0.1);
        yAxis = yScale; //d3.scaleLinear().rangeRound([height, 0]);  

        inner_svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xAxis))
        inner_svg.append("text")
            .attr("class", "axis axis--x label")
            .attr("transform", "translate(" + (width/2) + " , " + (height) + ")")
            // so the text is immediately below the bounding box, rather than above
            .attr('dominant-baseline', 'hanging')
            .attr("dy", "1.5em")
            .style("text-anchor", "middle")
            .text(mode.xDataField);

        inner_svg.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(yAxis).ticks(10))//, "%"))
        
        inner_svg.append("text")
            .attr("class", "axis axis--y label")
            // We need to compose a rotation with a translation to place the y-axis label
            .attr("transform", "translate(" + 0 + ", " + (height/2) + ")rotate(-90)")
            .attr("dy", "-3em")
            .attr("text-anchor", "middle")
            .text(mode.yDataField);
    }

    function createBubbles() {
        // Bind nodes data to what will become DOM elements to represent them.
        inner_svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.id; })
            // Create new circle elements each with class `bubble`.
            // There will be one circle.bubble for each object in the nodes array.
            .enter()
            .append('circle').attr('r', 0) // Initially, their radius (r attribute) will be 0.
            .classed('bubble', true)
            .attr('fill', function (d) { return fillColorScale(d.fill_color_group); })
            .attr('stroke', function (d) { return d3.rgb(fillColorScale(d.fill_color_group)).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showTooltip)
            .on('mouseout', hideTooltip);

        bubbles = d3.selectAll('.bubble');

        // Fancy transition to make bubbles appear, ending with the correct radius
        bubbles.transition()
            .duration(2000)
            .attr('r', function (d) { return d.scaled_radius; });
    }
    
    function addForceLayout(isStatic) {
        if (forceSim) {
            // Stop any forces currently in progress
            forceSim.stop();
        }
        // Configure the force layout holding the bubbles apart
        forceSim = d3.forceSimulation()
            .nodes(nodes)
            .velocityDecay(0.3)
            .on("tick", ticked);
        
        if (!isStatic) {
            // Decide what kind of force layout to use: "collide" or "charge"
            if(BUBBLE_PARAMETERS.force_type == "collide") {
                var bubbleCollideForce = d3.forceCollide()
                    .radius(function(d) { return d.scaled_radius + 0.5; })
                    .iterations(4)
                forceSim
                    .force("collide", bubbleCollideForce)
            }
            if(BUBBLE_PARAMETERS.force_type == "charge") {
                function bubbleCharge(d) {
                    return -Math.pow(d.scaled_radius, 2.0) * (+BUBBLE_PARAMETERS.force_strength);
                }    
                forceSim
                    .force('charge', d3.forceManyBody().strength(bubbleCharge));
            }
        }
    }

    function createCanvas(parentDOMElement) {
        // Create a SVG element inside the provided selector with desired size.
        svg = d3.select(parentDOMElement)
            .append('svg')
            .attr('width', BUBBLE_PARAMETERS.width)
            .attr('height', BUBBLE_PARAMETERS.height);

        // Specify margins and the inner width and height
        margin = {top: 20, right: 20, bottom: 50, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

        // Create an inner SVG panel with padding on all sides for axes
        inner_svg = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        
    }    
    //////////////////////////////////////////////////////////////
    
    var bubbleChart = function bubbleChart(parentDOMElement, rawData) {
        /*
         * Main entry point to the bubble chart. This function is returned
         * by the parent closure. It prepares the rawData for visualization
         * and adds an svg element to the provided selector and starts the
         * visualization creation process.
         *
         * parentDOMElement is expected to be a DOM element or CSS selector that
         * points to the parent element of the bubble chart. Inside this
         * element, the code will add the SVG continer for the visualization.
         *
         * rawData is expected to be an array of data objects as provided by
         * a d3 loading function like d3.csv.
         */
        
        // Capture all the maximums and minimums in the numeric fields, which
        // will be used in any scatterplots.
        for (var numeric_field_index in BUBBLE_PARAMETERS.numeric_fields) {
            var numeric_field = BUBBLE_PARAMETERS.numeric_fields[numeric_field_index];
            dataExtents[numeric_field] = d3.extent(rawData, function (d) { return +d[numeric_field]; });
        }
        // Scale bubble radii using ^(0.5)
        // We size bubbles based on area instead of radius
        var maxRadius = dataExtents[BUBBLE_PARAMETERS.radius_field][1];
        radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([2, 30])  // Range between 2 and 25 pixels
            .domain([0, maxRadius]);   // Domain between 0 and the largest bubble radius

        fillColorScale = getFillColorScale();
        
        // Initialize the "nodes" with the data we've loaded
        nodes = createNodes(rawData);

        // Initialize svg and inner_svg, which we will attach all our drawing objects to.
        createCanvas(parentDOMElement);

        // Create a container for the map before creating the bubbles
        // Then we will draw the map inside this container, so it will appear behind the bubbles
        inner_svg.append("g")
            .attr("class", "world_map_container");
        
        // Create the bubbles and the force holding them apart
        createBubbles();
    };

    bubbleChart.switchMode = function (buttonID) {
        /*
         * Externally accessible function (this is attached to the
         * returned chart function). Allows the visualization to toggle
         * between display modes.
         *
         * buttonID is expected to be a string corresponding to one of the modes.
         */
        // Get data on the new mode we have just switched to
        currentMode = new ViewMode(buttonID, width, height);

        // Remove current labels
        inner_svg.selectAll('.bubble_group_label').remove();
        // Remove current debugging elements
        inner_svg.selectAll('.mc_debug').remove(); // DEBUG
        // Remove axes components
        inner_svg.selectAll('.axis').remove();
        // Remove map
        inner_svg.selectAll('.world_map').remove();

        // SHOW LABELS (if we have more than one category to label)
        if (currentMode.type == "grid" && currentMode.size > 1) {
            showLabels(currentMode);
        }

        // SHOW AXIS (if our mode is scatter plot)
        if (currentMode.type == "scatterplot") {
            xScale = d3.scaleLinear().range([0, width])
                .domain([dataExtents[currentMode.xDataField][0], dataExtents[currentMode.xDataField][1]]);
            yScale = d3.scaleLinear().range([height, 0])
                .domain([dataExtents[currentMode.yDataField][0], dataExtents[currentMode.yDataField][1]]);
            
            showAxis(currentMode);
        }
        // ADD FORCE LAYOUT
        if (currentMode.type == "scatterplot" || currentMode.type == "map") {
            addForceLayout(true);  // make it static so we can plot bubbles
        } else {
            addForceLayout(false); // the bubbles should repel about the grid centers
        }

        // SHOW MAP (if our mode is "map")
        if (currentMode.type == "map") {
            var path = d3.geoPath().projection(bubbleMercProjection);

            d3.queue()
                .defer(d3.json, BUBBLE_PARAMETERS.map_file)
                .await(ready);

                function ready(error, topology) {
                  if (error) throw error;

                  inner_svg.selectAll(".world_map_container")
                    .append("g")
                    .attr("class", "world_map")
                    .selectAll("path")
                    .data(topojson.feature(topology, topology.objects.states).features)
                    .enter()
                    .append("path")
                    .attr("d", path);
                }
        }
        
        // MOVE BUBBLES TO THEIR NEW LOCATIONS
        var targetFunction;
        if (currentMode.type == "grid") {
            targetFunction = getGridTargetFunction(currentMode);
        }
        if (currentMode.type == "scatterplot") {
            targetFunction = function (d) {
                return { 
                    x: xScale(d[currentMode.xDataField]),
                    y: yScale(d[currentMode.yDataField])
                };
            };
        }
        if (currentMode.type == "map") {
            targetFunction = function (d) {
                return {
                    x: bubbleMercProjection([+d.Longitude, +d.Latitude])[0],
                    y: bubbleMercProjection([+d.Longitude, +d.Latitude])[1]
                };
            };
        }
        
        // Given the mode we are in, obtain the node -> target mapping
        var targetForceX = d3.forceX(function(d) {return targetFunction(d).x})
            .strength(+BUBBLE_PARAMETERS.force_strength);
        var targetForceY = d3.forceY(function(d) {return targetFunction(d).y})
            .strength(+BUBBLE_PARAMETERS.force_strength);

        // Specify the target of the force layout for each of the circles
        forceSim
            .force("x", targetForceX)
            .force("y", targetForceY);

        // Restart the force layout simulation
        forceSim.alphaTarget(1).restart();
    };
    
    // Return the bubbleChart function from closure.
    return bubbleChart;
}

/////////////////////////////////////////////////////////////////////////////////////
function ViewMode(button_id, width, height) {
    /* ViewMode: an object that has useful parameters for each view mode.
     * initialize it with your desired view mode, then use its parameters.
     * Attributes:
     - mode_index (which button was pressed)
     - buttonId     (which button was pressed)
     - gridDimensions    e.g. {"rows": 10, "columns": 20}
     - gridCenters       e.g. {"group1": {"x": 10, "y": 20}, ...}
     - dataField    (string)
     - labels       (an array)
     - type         (type of grouping: "grouping" or "scatterplot")
     - size         (number of groups)
     */
    // Find which button was pressed
    var mode_index;
    for(mode_index=0; mode_index<BUBBLE_PARAMETERS.modes.length; mode_index++) {
        if(BUBBLE_PARAMETERS.modes[mode_index].button_id == button_id) {
            break;
        }
    }
    if(mode_index>=BUBBLE_PARAMETERS.modes.length) {
        console.log("Error: can't find mode with button_id = ", button_id)
    }
    
    var curMode = BUBBLE_PARAMETERS.modes[mode_index];
    this.buttonId = curMode.button_id;
    this.type = curMode.type;
    
    if (this.type == "grid") {
        this.gridDimensions = curMode.grid_dimensions;
        this.labels = curMode.labels;
        if (this.labels == null) { this.labels = [""]; }
        this.dataField = curMode.data_field;
        this.size = this.labels.length;
        // Loop through all grid labels and assign the centre coordinates
        this.gridCenters = {};
        for(var i=0; i<this.size; i++) {
            var cur_row = Math.floor(i / this.gridDimensions.columns);    // indexed starting at zero
            var cur_col = i % this.gridDimensions.columns;    // indexed starting at zero
            var currentCenter = {
                x: (2 * cur_col + 1) * (width / (this.gridDimensions.columns * 2)),
                y: (2 * cur_row + 1) * (height / (this.gridDimensions.rows * 2))
            };
            this.gridCenters[this.labels[i]] = currentCenter;
        }
    }
    if (this.type == "scatterplot") {
        // Set up the x and y scales (domains need to be set using the actual data)
        this.xDataField = curMode.x_data_field;
        this.yDataField = curMode.y_data_field;
        this.xFormatString = curMode.x_format_string;
        this.yFormatString = curMode.y_format_string;
    }
    if (this.type == "map") {
        this.latitudeField = curMode.latitude_field;
        this.longitudeField = curMode.longitude_field;
    }
};


/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// Set title
document.title = BUBBLE_PARAMETERS.report_title;
report_title.innerHTML = BUBBLE_PARAMETERS.report_title;
// Set footer
document.getElementById("footer_text").innerHTML = BUBBLE_PARAMETERS.footer_text;

// Create a new bubble chart instance
var myBubbleChart = createBubbleChart();
debugger;
// Load data
// d3.csv(BUBBLE_PARAMETERS.data_file, function (error, data) {
    // Once the data is loaded...
    
    // if (error) { console.log(error); }
    var data = [
        {
          "Asset": "Trump Tower (New York City)",
          "Type": "Office and retail",
          "Asset Value": 471,
          "Debt": 100,
          "Net Value": 371,
          "Change vs 2015": -159,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "Opened 1983"
        },
        {
          "Asset": "1290 Avenue of the Americas (New York City)",
          "Type": "Office and retail",
          "Asset Value": 2310,
          "Debt": 950,
          "Net Value": 408,
          "Change vs 2015": -62,
          "Change": "Down",
          "Stake": 0.3,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": ""
        },
        {
          "Asset": "Niketown (New York City)",
          "Type": "Office and retail",
          "Asset Value": 400,
          "Debt": 10,
          "Net Value": 390,
          "Change vs 2015": -52,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "Ground lease through 2079"
        },
        {
          "Asset": "40 Wall Street (New York City)",
          "Type": "Office and retail",
          "Asset Value": 501,
          "Debt": 156,
          "Net Value": 345,
          "Change vs 2015": -28,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": ""
        },
        {
          "Asset": "Trump Park Avenue (New York City)",
          "Type": "Residential and retail",
          "Asset Value": 191,
          "Debt": 14.3,
          "Net Value": 176.7,
          "Change vs 2015": -27,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "49,564 sq. ft. of condos; 27,467 sq. ft. of retail"
        },
        {
          "Asset": "Trump Parc/Trump Parc East (New York City)",
          "Type": "Residential and retail",
          "Asset Value": 88,
          "Debt": 0,
          "Net Value": 88,
          "Change vs 2015": 17,
          "Change": "Up",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "11,750 sq. ft. of condos; 14,963 sq. feet of retail; 13,108 sq. ft. of garage"
        },
        {
          "Asset": "Trump International Hotel and Tower, Central Park West (New York City)",
          "Type": "Hotel, condos and retail",
          "Asset Value": 38,
          "Debt": 0,
          "Net Value": 38,
          "Change vs 2015": 21,
          "Change": "Up",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": ""
        },
        {
          "Asset": "Trump World Tower, 845 United Nations Plaza (New York City)",
          "Type": "Residential and retail",
          "Asset Value": 27,
          "Debt": 0,
          "Net Value": 27,
          "Change vs 2015": -16,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "9,007 sq. ft. of retail; 28,579 sq. ft. of garage; one 2,835-square-foot condo"
        },
        {
          "Asset": "Spring Creek Towers (Brooklyn, N.Y.)",
          "Type": "Affordable housing units",
          "Asset Value": 1000,
          "Debt": 408,
          "Net Value": 23.68,
          "Change vs 2015": 0,
          "Change": "No Change",
          "Stake": 0.04,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "Trump’s father, Fred, amassed a portfolio of 20,000 Brooklyn and Queens apartments worth hundreds of millions at one point. But Donald was more interested in Manhattan. Over time the family sold most of the outer-borough holdings. The lone remaining asset from his father’s era is a 4% interest in Spring Creek Towers, a massive, 46-tower government subsidized housing complex with 5,881 units in Brooklyn’s East New York neighborhood that the Trumps reportedly bought into in 1973."
        },
        {
          "Asset": "Trump Plaza (New York City)",
          "Type": "Residential and retail",
          "Asset Value": 27.7,
          "Debt": 14.7,
          "Net Value": 13,
          "Change vs 2015": -16,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "Ground lease through 2082"
        },
        {
          "Asset": "Trump Tower Penthouse (New York City)",
          "Type": "Personal assets",
          "Asset Value": 90,
          "Debt": 0,
          "Net Value": 90,
          "Change vs 2015": -10,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 40.768277,
          "Longitude": -73.981455,
          "Notes": "Personal residence, 30,000 sq. ft."
        },
        {
          "Asset": "555 California Street (San Francisco)",
          "Type": "Office and retail",
          "Asset Value": 1645,
          "Debt": 589,
          "Net Value": 316.8,
          "Change vs 2015": 32,
          "Change": "Up",
          "Stake": 0.3,
          "Latitude": 37.792282,
          "Longitude": -122.403747,
          "Notes": "The other half of the deal that Trump’s Chinese investors completed in 2006. In exchange for a 78-acre tract of land on New York’s Upper West Side, the Chinese got 1290 Avenue of Americas in New York (see above) and 555 California Street in San Francisco, then called the Bank of America Center. While valuations for San Francisco office space have dipped, the building has brought a higher net income, raising the value of Trump’s stake by $32 million."
        },
        {
          "Asset": "Trump National Doral Miami",
          "Type": "Golf resort",
          "Asset Value": 275,
          "Debt": 106,
          "Net Value": 169,
          "Change vs 2015": -25,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 25.813875,
          "Longitude": -80.339183,
          "Notes": ""
        },
        {
          "Asset": "Mar-A-Lago (Palm Beach, Florida)",
          "Type": "Golf resort",
          "Asset Value": 150,
          "Debt": 0,
          "Net Value": 150,
          "Change vs 2015": -50,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 26.677316,
          "Longitude": -80.036959,
          "Notes": "Private club"
        },
        {
          "Asset": "U.S. Golf Courses",
          "Type": "Golf resort",
          "Asset Value": 225,
          "Debt": 18.5,
          "Net Value": 206.5,
          "Change vs 2015": -72,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 39.80949,
          "Longitude": -71.886246,
          "Notes": "10 golf courses in 6 states plus the District of Columbia"
        },
        {
          "Asset": "Scotland & Ireland Golf Courses",
          "Type": "Golf resort",
          "Asset Value": 85,
          "Debt": 0,
          "Net Value": 85,
          "Change vs 2015": -3,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 55.314129,
          "Longitude": -4.828675,
          "Notes": "3 golf resorts in Scotland and Ireland"
        },
        {
          "Asset": "Trump Chicago",
          "Type": "Hotel, condos and retail",
          "Asset Value": 169,
          "Debt": 50,
          "Net Value": 119,
          "Change vs 2015": -39,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 41.888988,
          "Longitude": -87.625997,
          "Notes": ""
        },
        {
          "Asset": "Trump International Hotel Washington, D.C.",
          "Type": "Hotel, condos and retail",
          "Asset Value": 229,
          "Debt": 125,
          "Net Value": 104,
          "Change vs 2015": -97,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 38.89454,
          "Longitude": -77.027011,
          "Notes": "Ground lease through 2075"
        },
        {
          "Asset": "Trump International Hotel Las Vegas",
          "Type": "Hotel, condos and retail",
          "Asset Value": 156,
          "Debt": 18,
          "Net Value": 69,
          "Change vs 2015": -27,
          "Change": "Down",
          "Stake": 0.5,
          "Latitude": 36.129588,
          "Longitude": -115.172671,
          "Notes": "The gleaming hotel–which claims to be encased in 24-karat gold glass–has been more successful than Trump’s previous forays in gambling zones. While his Atlantic City casinos suffered through corporate bankruptcies, eventually reducing his stake to nothing, this joint venture with fellow real estate billionaire Phil Ruffin has become a premier destination by the Strip. It has 1,282 suites, more than half of which have been sold since it opened in 2008. It apparently has managed some of the properties for owners, renting them out."
        },
        {
          "Asset": "Cash/Liquid Assets",
          "Type": "Personal assets",
          "Asset Value": 230,
          "Debt": 0,
          "Net Value": 230,
          "Change vs 2015": -97,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 39.80949,
          "Longitude": -71.886246,
          "Notes": ""
        },
        {
          "Asset": "Trump Winery (Charlottesville, Va.)",
          "Type": "Winery",
          "Asset Value": 30,
          "Debt": 0,
          "Net Value": 30,
          "Change vs 2015": 0,
          "Change": "No Change",
          "Stake": 1,
          "Latitude": 37.93909,
          "Longitude": -78.498251,
          "Notes": ""
        },
        {
          "Asset": "Seven Springs (Bedford, N.Y.)",
          "Type": "Personal assets",
          "Asset Value": 37.5,
          "Debt": 20,
          "Net Value": 17.5,
          "Change vs 2015": -5.5,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 41.170502,
          "Longitude": -73.700027,
          "Notes": "Private estate"
        },
        {
          "Asset": "Trump Hotel Management & Licensing Business",
          "Type": "Licensing agreements",
          "Asset Value": 123,
          "Debt": 0,
          "Net Value": 123,
          "Change vs 2015": -229,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 39.80949,
          "Longitude": -71.886246,
          "Notes": "The management and licensing company has roughly two dozen properties under its umbrella. Trump’s organization manages some of the hotels and resorts, including Trump Vancouver. Others, like India’s luxury condo Trump Tower, merely pay Trump to use his name. The highly lucrative business has enabled the Donald to spread his brand from the Philippines to Uruguay. While Trump has struck more licensing arrangements in the past year, FORBES cut the value of the portfolio after several sources suggested that the revenue from wholly owned properties like Doral Miami and Trump Las Vegas (disclosed in Federal Election Commission filings) should not be included in the valuation. FORBES already values those assets separately and thus this year subtracted their estimated revenues from the management business to avoid double counting."
        },
        {
          "Asset": "Product Licensing",
          "Type": "Licensing agreements",
          "Asset Value": 14,
          "Debt": 0,
          "Net Value": 14,
          "Change vs 2015": -8.75,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 39.80949,
          "Longitude": -71.886246,
          "Notes": "Products: Trump Home, Select by Trump (coffee), Trump Natural Spring Water, Trump Fragrance"
        },
        {
          "Asset": "Aircraft",
          "Type": "Personal assets",
          "Asset Value": 35,
          "Debt": 0,
          "Net Value": 35,
          "Change vs 2015": -27,
          "Change": "Down",
          "Stake": 1,
          "Latitude": 39.80949,
          "Longitude": -71.886246,
          "Notes": "Models: Two 1989 Sikorsky S-76B Helicopters, one 1990 Sikorsky S-76B Helicopter, one 1991 Boeing 757, one 1997 Cessna 750 Citation X."
        },
        {
          "Asset": "Two Palm Beach, Fla. Residences",
          "Type": "Personal assets",
          "Asset Value": 14.5,
          "Debt": 0,
          "Net Value": 14.5,
          "Change vs 2015": 2.85,
          "Change": "Up",
          "Stake": 1,
          "Latitude": 26.714198,
          "Longitude": -80.054904,
          "Notes": ""
        },
        {
          "Asset": "809 N. Canon Drive, Beverly Hills",
          "Type": "Personal assets",
          "Asset Value": 9,
          "Debt": 0,
          "Net Value": 9,
          "Change vs 2015": 0.5,
          "Change": "Up",
          "Stake": 1,
          "Latitude": 34.079731,
          "Longitude": -118.413402,
          "Notes": ""
        },
        {
          "Asset": "Stark Industrial Park, Charleston, S.C.",
          "Type": "Industrial warehouse",
          "Asset Value": 3.5,
          "Debt": 0,
          "Net Value": 3.5,
          "Change vs 2015": 0,
          "Change": "No Change",
          "Stake": 1,
          "Latitude": 32.859908,
          "Longitude": -79.906982,
          "Notes": ""
        }
      ]
    // Display bubble chart inside the #vis div.
    myBubbleChart('#vis', data);
    debugger;
    // Start the visualization with the first button
    myBubbleChart.switchMode(BUBBLE_PARAMETERS.modes[0].button_id)
// });

function setupButtons() {
    // As the data is being loaded: setup buttons
    // Create the buttons
    // TODO: change this to use native d3js selection methods
    for (i = 0; i<BUBBLE_PARAMETERS.modes.length; i++) {
        var button_element = document.createElement("a");
        button_element.href = "#";
        if (i == 0) {
            button_element.className = "button active";
        } else {
            button_element.className = "button";
        }
        button_element.id = BUBBLE_PARAMETERS.modes[i].button_id;
        button_element.innerHTML = BUBBLE_PARAMETERS.modes[i].button_text;
        document.getElementById("toolbar").appendChild(button_element);
    }     

    // Handle button click
    // Set up the layout buttons to allow for toggling between view modes.
    d3.select('#toolbar')
        .selectAll('.button')
        .on('click', function () {
            // Remove active class from all buttons
            d3.selectAll('.button').classed('active', false);

            // Set the button just clicked to active
            d3.select(this).classed('active', true);

            // Get the id of the button
            var buttonId = d3.select(this).attr('id');

            // Switch the bubble chart to the mode of
            // the currently clicked button.
            myBubbleChart.switchMode(buttonId);
        });    
}

setupButtons();