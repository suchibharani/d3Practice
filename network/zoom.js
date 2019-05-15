var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
    
var radius = 20; 

var nodes_data =  [
    {"name": "Lillian", "sex": "F"},
    {"name": "Gordon", "sex": "M"},
    {"name": "Sylvester", "sex": "M"},
    {"name": "Mary", "sex": "F"},
    {"name": "Helen", "sex": "F"},
    {"name": "Jamie", "sex": "M"},
    {"name": "Collin", "sex": "F", "isSource" : true},
    {"name": "Ashton", "sex": "M"},
    {"name": "Duncan", "sex": "M"},
    {"name": "Evette", "sex": "F"},
    {"name": "Mauer", "sex": "M"},
    {"name": "Fray", "sex": "F"},
    {"name": "Duke", "sex": "M"},
    {"name": "Baron", "sex": "M"},
    {"name": "Infante", "sex": "M"},
    {"name": "Percy", "sex": "M"},
    {"name": "Cynthia", "sex": "F"},
    {"name": "Feyton", "sex": "M"},
    {"name": "Lesley", "sex": "F"},
    {"name": "Yvette", "sex": "F"},
    {"name": "Maria", "sex": "F"},
    {"name": "Lexy", "sex": "F"},
    {"name": "Tim cook", "sex": "M","isDestina" : true},
    {"name": "Ashley", "sex": "F"},
    {"name": "Finkler", "sex": "M"},
    {"name": "Damo", "sex": "M"},
    {"name": "Imogen", "sex": "F"}
    ]

//Sample links data 
//type: A for Ally, E for Enemy
var links_data = [
	{"source": "Sylvester", "target": "Gordon", "type":"A" },
    {"source": "Sylvester", "target": "Lillian", "type":"A" },
    {"source": "Sylvester", "target": "Mary", "type":"A"},
    {"source": "Sylvester", "target": "Jamie", "type":"A"},
    {"source": "Sylvester", "target": "Collin", "type":"A"},
    {"source": "Sylvester", "target": "Helen", "type":"A"},
    {"source": "Helen", "target": "Gordon", "type":"A"},
    {"source": "Mary", "target": "Lillian", "type":"A"},
    {"source": "Ashton", "target": "Mary", "type":"A"},
    {"source": "Duncan", "target": "Jamie", "type":"A"},
    {"source": "Gordon", "target": "Collin", "type":"A"},
    {"source": "Sylvester", "target": "Fray", "type":"E"},
    {"source": "Fray", "target": "Mauer", "type":"A"},
    {"source": "Fray", "target": "Cynthia", "type":"A"},
    {"source": "Fray", "target": "Percy", "type":"A"},
    {"source": "Percy", "target": "Cynthia", "type":"A"},
    {"source": "Infante", "target": "Duke", "type":"A"},
    {"source": "Duke", "target": "Gordon", "type":"A"},
    {"source": "Duke", "target": "Sylvester", "type":"A"},
    {"source": "Baron", "target": "Duke", "type":"A"},
    {"source": "Baron", "target": "Sylvester", "type":"E"},
    {"source": "Evette", "target": "Sylvester", "type":"E"},
    {"source": "Cynthia", "target": "Sylvester", "type":"E"},
    {"source": "Cynthia", "target": "Jamie", "type":"E"},
    {"source": "Mauer", "target": "Collin", "type":"E"},
    {"source": "Duke", "target": "Lexy", "type":"A"},
    {"source": "Feyton", "target": "Lexy", "type":"A"},
    {"source": "Maria", "target": "Feyton", "type":"A"},
    {"source": "Baron", "target": "Yvette", "type":"E"},
    {"source": "Evette", "target": "Maria", "type":"E"},
    {"source": "Cynthia", "target": "Yvette", "type":"E"},
    {"source": "Maria", "target": "Jamie", "type":"E"},
    {"source": "Maria", "target": "Lesley", "type":"E"},
    {"source": "Ashley", "target": "Damo", "type":"A"},
    {"source": "Damo", "target": "Lexy", "type":"A"},
    {"source": "Maria", "target": "Feyton", "type":"A"},
    {"source": "Finkler", "target": "Ashley", "type":"E"},
    {"source": "Sylvester", "target": "Maria", "type":"E"},
    {"source": "Tim cook", "target": "Finkler", "type":"E"},
    {"source": "Ashley", "target": "Gordon", "type":"E"},
    {"source": "Maria", "target": "Imogen", "type":"E"}
    
]


//set up the simulation and add forces  
var simulation = d3.forceSimulation()
					.nodes(nodes_data);
                              
var link_force =  d3.forceLink(links_data)
                        .id(function(d) { return d.name; });
                        // .strength(0.025);
                        // .distance(300);            
         
var charge_force = d3.forceManyBody()
        .strength(-200); 
    
var center_force = d3.forceCenter(width / 2, height / 2);  
                      
simulation
    .force("charge_force", charge_force)
    .force("center_force", center_force)
    // add some collision detection so they don't overlap
    .force("collide", d3.forceCollide().radius(50))
    .force("links",link_force)
 ;

        
//add tick instructions: 
simulation.on("tick", tickActions );


//add encompassing group for the zoom 
var g = svg.append("g")
    .attr("class", "everything");

//draw lines for the links 
var link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links_data)
    .enter().append("line")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray",1)
      .style("stroke", linkColour);     
// var link = svg.selectAll(".link")
//         .data(links_data)
//         .enter()
//         .append("path")
//         .attr("class", "link")
//         .attr('stroke', linkColour);   

//draw circles for the nodes 
var node = g.append("g")
        .attr("class", "nodes") 
        .selectAll("g")
        .data(nodes_data)
        .enter().append("g")

var circles = node.append("circle")
    .attr("r", isMaster)
    .attr("fill", circleColour)
    // .on("click", clicknode(.2))
    .on("mouseover", mouseOver(.2))
    .on("mouseout", mouseOut)
    .call(d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end));
 
 var lables = node.append("text")
      .text(function(d) {
        return d.name;
      })
      .attr('x', -15)
      .attr('y', 0);
 
//add drag capabilities  
var drag_handler = d3.drag()
	.on("start", drag_start)
	.on("drag", drag_drag)
	.on("end", drag_end);	
	
drag_handler(node);


//add zoom capabilities 
var zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

zoom_handler(svg);     

/** Functions **/

//Function to choose what color circle we have
//Let's return blue for males and red for females
function circleColour(d){
	if(d.isSource){
		return "#DCEDC8";
	} else if(d.sex =="M"){
    return "#D1C4E9";
  }
    else {
		return "#B2EBF2";
	}
}

// build a dictionary of nodes that are linked
var linkedByIndex = {};
links_data.forEach(function(d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1;
});

// check the dictionary to see if nodes are linked
function isConnected(a, b) {
    return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
}

function mouseOver(opacity){
  console.log("clicked")
  return function(d) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity at 1, otherwise
    // fade
    node.style("stroke-opacity", function(o) {
        thisOpacity = isConnected(d, o) ? 1 : opacity;
        return thisOpacity;
    });
    node.style("fill-opacity", function(o) {
        thisOpacity = isConnected(d, o) ? 1 : opacity;
        return thisOpacity;
    });
    // also style link accordingly
    link.style("stroke-opacity", function(o) {
        return o.source === d || o.target === d ? 1 : opacity;
    });
    // link.style("stroke", function(o){
    //     return o.source === d || o.target === d ? o.source.colour : "black";
    // });
};
}

function mouseOut() {
  node.style("stroke-opacity", 1);
  node.style("fill-opacity", 1);
  link.style("stroke-opacity", 1);
  // link.style("stroke", "black");
}


//Function to choose what color circle we have
//Let's return blue for males and red for females
function isMaster(d){
	if(d.isSource){
		return 35;
	} else {
		return 20;
	}
}

//Function to choose the line colour and thickness 
//If the link type is "A" return green 
//If the link type is "E" return red 
function linkColour(d){
	if(d.type == "A"){
		return "#00BCD4";
	} else {
		return "black";
	}
}

//Drag functions 
//d is the node 
function drag_start(d) {
 if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

//make sure you can't drag the circle outside the box
function drag_drag(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function drag_end(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

//Zoom functions 
function zoom_actions(){
    g.attr("transform", d3.event.transform)
}

function tickActions() {
    //update circle positions each tick of the simulation 
    //    node
    //     .attr("cx", function(d) { return d.x; })
    //     .attr("cy", function(d) { return d.y; });
    node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
        
    //update link positions 
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    // link.attr("d", positionLink);
} 

// through the intermediate nodes
// function positionLink(d) {
//   var offset = 30;

//   var midpoint_x = (d.source.x + d.target.x) / 2;
//   var midpoint_y = (d.source.y + d.target.y) / 2;

//   var dx = (d.target.x - d.source.x);
//   var dy = (d.target.y - d.source.y);

//   var normalise = Math.sqrt((dx * dx) + (dy * dy));

//   var offSetX = midpoint_x + offset*(dy/normalise);
//   var offSetY = midpoint_y - offset*(dx/normalise);

//   return "M" + d.source.x + "," + d.source.y +
//       "S" + offSetX + "," + offSetY +
//       " " + d.target.x + "," + d.target.y;
// }
