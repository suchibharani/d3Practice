
    
    var data = {
      "nodes": [{
        "name": "N1",
        "group": 0
      }, {
        "name": "N2",
        "group": 0
      }, {
        "name": "N3",
        "group": 1
      }, {
        "name": "N4",
        "group": 1
      }, {
        "name": "N5",
        "group": 1
      }, {
        "name": "N6",
        "group": 2
      }, {
        "name": "N7",
        "group": 2
      }, {
        "name": "N8",
        "group": 2
      }, {
        "name": "N9",
        "group": 2
      }, {
        "name": "N10",
        "group": 2
      }, {
        "name": "N11",
        "group": 3
      }, {
        "name": "N12",
        "group": 3
      }, {
        "name": "N13",
        "group": 4
      }],
      "links": [{
        "source": 0,
        "target": 4
      }, {
        "source": 4,
        "target": 2
      }, {
        "source": 2,
        "target": 1
      }, {
        "source": 1,
        "target": 6
      }, {
        "source": 6,
        "target": 3
      }, {
        "source": 3,
        "target": 8
      }, {
        "source": 8,
        "target": 9
      }, {
        "source": 7,
        "target": 5
      }, {
        "source": 5,
        "target": 10
      }]
    };
    
    
    var svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");
    
    var circles = svg.selectAll(null)
      .data(d3.range(5))
      .enter()
      .append("circle")
      .attr("cx", function(d) {
        return width / 2
      })
      .attr("cy", function(d) {
        return height / 2
      })
      .attr("r", function(d) {
        return d * 50
      })
      .style("fill", "none")
      .style("stroke", "#bbb")
    
    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink())
      .force("radial", d3.forceRadial().radius(function(d) {
        return d.group * 50
      }).x(width / 2).y(height / 2).strength(1))
      .force("charge", d3.forceManyBody(-100));
    
    var link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .enter().append("line")
      .attr("stroke-width", 1)
      .attr("stroke", "#444")
    
    var node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter().append("circle")
      .attr("r", 5)
      .attr("fill", "teal");
    
    var text = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter().append("text")
      .text(function(d) {
        return d.name
      })
      .style("font-size", "10px")
    
    simulation
      .nodes(data.nodes)
      .on("tick", ticked);
    
    simulation.force("link")
      .links(data.links);
    
    function ticked() {
      link
        .attr("x1", function(d) {
          return d.source.x;
        })
        .attr("y1", function(d) {
          return d.source.y;
        })
        .attr("x2", function(d) {
          return d.target.x;
        })
        .attr("y2", function(d) {
          return d.target.y;
        });
    
      node
        .attr("cx", function(d) {
          return d.x;
        })
        .attr("cy", function(d) {
          return d.y;
        });
    
      text
        .attr("x", function(d) {
          return d.x + 8;
        })
        .attr("y", function(d) {
          return d.y;
        });
    }