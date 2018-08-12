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

function heatchart() {
  var svg = d3.select("#line_chart svg"),
    margin = {
      top: 50,
      right: 100,
      bottom: 30,
      left: 50
    },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    gridSize = Math.floor(width / 24),
    legendElementWidth = gridSize*2,
    buckets = 9,
    colors = ["#FFFFFF","#FFCCCC","#FF9999","#FF6666","#FF0000","#CC0000","#990000","#660000","#330000"],
    days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"];

   var svg1 = d3.select("#line_chart svg").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   var dayLabels = svg1.selectAll(".dayLabel")
        .data(days)
        .enter().append("text")
          .text(function (d) { return d; })
          .attr("x", 0)
          .attr("y", function (d, i) { return i * gridSize; })
          .style("text-anchor", "end")
          .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
          .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

    var timeLabels = svg1.selectAll(".timeLabel")
        .data(times)
        .enter().append("text")
          .text(function(d) { return d; })
          .attr("x", function(d, i) { return i * gridSize; })
          .attr("y", 0)
          .style("text-anchor", "middle")
          .attr("transform", "translate(" + gridSize / 2 + ", -6)")
          .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

    var parseDate = d3.timeParse("%Y %b %d %H %M");

    var heatmapChart = function() {
      d3.csv("./static/assets/js/brush_data.csv",
      function(d) {
        d.date = parseDate(d.date);
        d.day = d.date.getDay()
        d.hour = d.date.getHours()
        d.count = +d.count;
        return d;
      },
      function(error, data) {
        var colorScale = d3.scaleQuantile()
            .domain([0, buckets - 1, d3.max(data, function (d) { return d.count; })])
            .range(colors);

        var cards = svg1.selectAll(".hour")
            .data(data, function(d) {return d.day+':'+d.hour;});

        cards.enter().append("rect")
            .attr("x", function(d) { return d.hour * gridSize; })
            .attr("y", function(d) { return d.day * gridSize; })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", "hour bordered")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("fill", function (d) { return colorScale(d.count); });

        var legend = d3.legendColor()
                       .labelFormat(d3.format(",.0f"))
                       .cells(10)
                       .scale(colorScale);          
        
        svg1.append("g")
           .attr("class", "legendQuant")
           .attr("transform", "translate(830,20)");

        svg1.select(".legendQuant")
           .call(legend);

      });  
    };

    heatmapChart();
};

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
heatchart();
showMetrics();
chart_gauge();