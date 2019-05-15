var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
    
var radius = 20; 

var nodes_data =  [
    {"name": "Golden Equator", "type": "company"},
    {"name": "Linked in", "type": "company"},
    {"name": "xplain", "type": "company"},
    {"name": "Rachel", "type": "user" , "isMaster" : true},
    {"name": "Collin", "type": "user"},
    {"name": "Suchi", "type": "user"},
    {"name": "Arindam", "type": "user"},
    {"name": "Sylvester", "type": "user"},
    {"name": "Jessie", "type": "user"},
    {"name": "Mary", "type": "user"},
    {"name": "Helen", "type": "user"},
    {"name": "Gordon", "type": "user"},
    {"name": "Jie Sheng", "type": "user"},
    {"name": "user1", "type": "user"},
    {"name": "user2", "type": "user"},
    {"name": "user3", "type": "user"},
    {"name": "user4", "type": "user"},
    ]

//Sample links data 
//type: A for Ally, E for Enemy
var links_data = [
  {"source": "Rachel", "target": "Golden Equator", "subType":"1" },
  {"source": "Rachel", "target": "Linked in", "subType":"1" },
  {"source": "Rachel", "target": "xplain", "subType":"1" },
	{"source": "Golden Equator", "target": "Collin", "subType":"1" },
    {"source": "Golden Equator", "target": "Suchi", "subType":"1" },
    {"source": "Golden Equator", "target": "Arindam", "subType":"1"},
    {"source": "Linked in", "target": "Sylvester", "subType":"2"},
    {"source": "Linked in", "target": "Jessie", "subType":"2"},
    {"source": "Linked in", "target": "Mary", "subType":"2"},
    {"source": "xplain", "target": "Helen", "subType":"3"},
    {"source": "xplain", "target": "Gordon", "subType":"3"},
    {"source": "xplain", "target": "Jie Sheng", "subType":"3"},
    {"source": "xplain", "target": "user1", "subType":"3"},
    {"source": "xplain", "target": "user2", "subType":"3"},
    {"source": "xplain", "target": "user3", "subType":"3"},
    {"source": "xplain", "target": "user4", "subType":"3"},
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
	if(d.isMaster){
		return "#DCEDC8";
	} else if(d.type =="company"){
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
        debugger;
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
	if(d.isMaster){
		return 45;
  } else if(d.type =="company") {
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
