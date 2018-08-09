function forceGraph() {

  var svg = d3.select("#fd_graph svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
      return d.id;
    }).strength(0.1))
    .force("charge", d3.forceManyBody().strength(-15))
    .force("center", d3.forceCenter(width / 2, height / 2));

  d3.json("./static/assets/js/network_data_twitter.json", function (error, graph) {
    if (error) throw error;

    var link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function (d) {
        return Math.sqrt(d.value)*2;
      });

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
      .attr('r',  function(d){
  return d.value;
})
      .attr("fill", function (d) {
        return color(d.group);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));


    node.append("title")
      .text(function (d) {return d.id+" has "+d.followers+" followers";});
/*
    node.append("text")
                  .attr("dy", -3)
                  .text(function (d) {return d.id});
*/
    simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(graph.links);

    function ticked() {
      link
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        });

      node
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });
    }
  });

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

function initMap() {
  var genned_markers;

  var myLatLng = {
    lat: 20.955601,
    lng: 77.853431
  };

  // Create a map object and specify the DOM element
  // for display.
  var map = new google.maps.Map(document.getElementById('map'), {
    center: myLatLng,
    zoom: 5
  });

  // get the data from the external file
  // when it returns the rest can run. That's why it's in a
  // callback.
  d3.json("./static/assets/js/map_data.json", function (error, graph) {
    if (error) throw error;

    // Create the marker and set their position
    // also fill the markers array to set the map bounds later
    markers = new Array()

    graph.forEach(marker => {
      createdMarker = new google.maps.Marker({
        map: map,
        position: {
          lat: marker.lat,
          lng: marker.lng
        },
        title: marker.title
      });

      markers.push(createdMarker)
    });

    // set the map bounds to include all of the markers
    var bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < markers.length; i++) {
      if (markers[i].getVisible()) {
        bounds.extend(markers[i].getPosition());
      }
    }
    map.fitBounds(bounds);
  });
}

function lineGraph() {
  var svg = d3.select("#line_chart svg"),
    margin = {
      top: 20,
      right: 20,
      bottom: 110,
      left: 60
    },
    margin2 = {
      top: 430,
      right: 20,
      bottom: 30,
      left: 60
    },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

  var parseDate = d3.timeParse("%Y %b %d %H %M");

  var x = d3.scaleTime().range([0, width]),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    y2 = d3.scaleLinear().range([height2, 0]);

  var xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y);

  var brush = d3.brushX()
    .extent([
      [0, 0],
      [width, height2]
    ])
    .on("brush end", brushed);

  var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([
      [0, 0],
      [width, height]
    ])
    .extent([
      [0, 0],
      [width, height]
    ])
    .on("zoom", zoomed);

  var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x(d.date);
    })
    .y0(height)
    .y1(function (d) {
      return y(d.count);
    });

  var area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x2(d.date);
    })
    .y0(height2)
    .y1(function (d) {
      return y2(d.count);
    });

  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  d3.csv("./static/assets/js/brush_data.csv", type, function (error, data) {
    if (error) throw error;

    x.domain(d3.extent(data, function (d) {
      return d.date;
    }));
    y.domain([0, d3.max(data, function (d) {
      return d.count;
    })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area);

    focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

    context.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area2);

    context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());
    

    svg.append("text")
        .attr("font-size", 18)
        .attr("text-anchor", "middle")
        .attr("x", -170)
        .attr("y", 15)
        .style("fill", '#000000')
        .attr("transform", "rotate(270)")
        .text("# of tweets")
    

    svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);
  });

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
  }

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());
    focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }

  function type(d) {
    d.date = parseDate(d.date);
    d.count = +d.count;
    return d;
  }
}


function chart_gauge() {
     var barWidth, chart, chartInset, degToRad, repaintGauge,
         height, margin, numSections, padRad, percToDeg, percToRad,
         percent, radius, sectionIndx, svg, totalPercent, width,
             targetText, actualText, formatValue, k;

     percent = .632;
     numSections = 1;
     sectionPerc = 1 / numSections / 2;
     padRad = 0.025;
     chartInset = 10;
     targetValue = 3000000
     totalPercent = 0.75;

     el = d3.select('#chart-gauge');

     margin = {
         top: 50,
         right: 40,
         bottom: 20,
         left: 40
     };

     width = +el.attr("width") - margin.left - margin.right,
     height = +el.attr("height") - margin.top - margin.bottom,
     radius = Math.min(width, height);
     barWidth = 40 * width / 300;

     /*
       Utility methods
     */
     percToDeg = function (perc) {
         return perc * 360;
     };

     percToRad = function (perc) {
         return degToRad(percToDeg(perc));
     };

     degToRad = function (deg) {
         return deg * Math.PI / 180;
     };

     // Create SVG element
     svg = el.append('svg').attr('width', width).attr('height', (height+margin.top+margin.bottom));
     // Add layer for the panel
     chart = svg.append('g').attr('transform', "translate(" + (width/2) + ", " + (height+20) + ")");
     chart.append('path').attr('class', "arc chart-filled");
     chart.append('path').attr('class', "arc chart-empty");
     chart.append('path').attr('class', "arc chart-target");

     svg.append("text")
        .attr("font-size", 18)
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", margin.top/2)
        .style("fill", '#0000FF')
        .text('Total Signatures')


     svg.append("text")
        .attr("font-size", 24)
        .attr("text-anchor", "middle")
        .attr("x", width/2+ 100)
        .attr("y", margin.top + 90)
        .style("fill", '#CD6660')
        .text("63%")   

     targetText = chart.append("text")
                    .attr('id', "Value")
                    .attr("font-size", 16)
                    .attr("text-anchor", "middle")
                    .attr("dy", ".5em")
                    .style("fill", '#0000FF');

     var thetaRad = percToRad(targetValue / 2);
     var textX = -(self.len + 5) * Math.cos(thetaRad);
     var textY = -(self.len + 5) * Math.sin(thetaRad);

     actualText = chart.append('text')
                    .attr('id', "Value")
                    .attr("font-size", 16)
                    .attr("text-anchor", "middle")
                    .attr("dy", -13)
                    .style("fill", '#0000FF')
                    .attr('class', 'needle').attr('cx', 100).attr('cy', 100).attr('r', self.radius);

     arc3 = d3.arc().outerRadius(radius - chartInset).innerRadius(radius - chartInset - barWidth)
     arc2 = d3.arc().outerRadius(radius - chartInset).innerRadius(radius - chartInset - barWidth)
     arc1 = d3.arc().outerRadius(radius - chartInset).innerRadius(radius - chartInset - barWidth)

     repaintGauge = function (actualPerc, targetPerc) {

         var next_start = totalPercent;
         arcStartRad = percToRad(next_start);
         arcEndRad = arcStartRad + percToRad(actualPerc / 2);
         next_start += actualPerc / 2;

         arc1.startAngle(arcStartRad).endAngle(arcEndRad);

         var next_start1 = totalPercent;
         arcStartRad = percToRad(next_start1);
         arcEndRad = arcStartRad + percToRad(targetPerc / 2);
         next_start1 += targetPerc / 2;

         arc3.startAngle(arcEndRad - padRad).endAngle(arcEndRad);

         arcStartRad = percToRad(next_start);
         arcEndRad = arcStartRad + percToRad((1 - actualPerc) / 2);

         arc2.startAngle(arcStartRad).endAngle(arcEndRad);
         var fillColor = "#CD6660";
         if (actualPerc >= targetPerc) {
             fillColor = "#94BFF5";
         }

         chart.select(".chart-filled").style("fill", fillColor).attr('d', arc1);
         chart.select(".chart-empty").attr('d', arc2);
         chart.select(".chart-target").attr('d', arc3);

     }
var Needle = function () {

         var recalcPointerPos = function (perc) {
             var centerX, centerY, leftX, leftY, rightX, rightY, thetaRad, topX, topY;
             thetaRad = percToRad(perc / 2);
             centerX = 0;
             centerY = 0;
             topX = centerX - this.len * Math.cos(thetaRad);
             topY = centerY - this.len * Math.sin(thetaRad);
             leftX = centerX - this.radius * Math.cos(thetaRad - Math.PI / 2);
             leftY = centerY - this.radius * Math.sin(thetaRad - Math.PI / 2);
             rightX = centerX - this.radius * Math.cos(thetaRad + Math.PI / 2);
             rightY = centerY - this.radius * Math.sin(thetaRad + Math.PI / 2);
             return "M " + leftX + " " + leftY + " L " + topX + " " + topY + " L " + rightX + " " + rightY;
         };

         function Needle(el) {
             this.el = el;
             this.len = width / 3;
             this.radius = this.len / 6;
         }

         Needle.render = function () {
             return this.el;
         };

         Needle.moveTo = function (perc, perc2) {
             var self,
                 oldValue = this.perc || 0;

             this.perc = perc;
             self = this;

             // Reset pointer position
             d3.transition().delay(100).ease(d3.easeQuad).duration(200).select('.needle').tween('reset-progress', function () {
                 var needle = d3.select(this);
                 return function (percentOfPercent) {
                     var progress = (1 - percentOfPercent) * oldValue;

                     repaintGauge(progress, perc2);
                     return needle.attr('d', recalcPointerPos.call(self, progress));
                 };
             });

             d3.transition().delay(300).ease(d3.easeBounce).duration(1500).select('.needle').tween('progress', function () {
                 var needle = d3.select(this);
                 return function (percentOfPercent) {
                     var progress = percentOfPercent * perc;

                     repaintGauge(progress, perc2);

                     var thetaRad = percToRad(perc2 / 2);
                     var textX = -(this.len + 5) * Math.cos(thetaRad);
                     var textY = -(this.len + 5) * Math.sin(thetaRad);

                     targetText.text('Goal: 3,000,000')
                               /*.attr('transform', "translate(" + textX + "," + textY + ")")*/

                     actualText.text('Current: 1,896,140')          

                     return needle.attr('d', recalcPointerPos.call(self, progress));
                 };
             });

         };

         return Needle;

     };

     needle = new Needle(chart);
     needle.render();

     needle.moveTo(percent, percent);

 };

function showMetrics() {
  
  d3.csv("./static/assets/js/metrics.csv", function(error, data) {
    if (error) throw error;
    console.log(data[0]);
  
    var svg1 = d3.select("#metric1");
    var svg2 = d3.select("#metric2");
    var svg3 = d3.select("#metric3");

    svg1.append("text")
        .attr("font-size", 24)
        .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 50)
        .style("fill", '#CD6660')
        .text("Unique Users")
    
    svg1.append("text")
        .attr("font-size", 20)
        .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 90)
        .style("fill", '#1096d9')
        .text("9791")

    svg2.append("text")
        .attr("font-size", 24)
        .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 50)
        .style("fill", '#CD6660')
        .text("Unique Tweets")
        
    svg2.append("text")
        .attr("font-size", 20)
        .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 90)
        .style("fill", '#1096d9')
        .text("1523")
        
    svg3.append("text")
        .attr("font-size", 24)
        .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 50)
        .style("fill", '#CD6660')
        .text("Total Followers")
        
    svg3.append("text")
        .attr("font-size", 20)
        .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 90)
        .style("fill", '#1096d9')
        .text("53,577,917")                
  });
}

forceGraph();
lineGraph();
showMetrics();
chart_gauge();