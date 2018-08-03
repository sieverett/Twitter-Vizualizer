function forceGraph() {

  var svg = d3.select("#fd_graph svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
      return d.id;
    }))
    .force("charge", d3.forceManyBody().strength(-5))
    .force("center", d3.forceCenter(width / 2, height / 2));

  d3.json("static/assets/js/data_twitter.json", function (error, graph) {
    if (error) throw error;

    var link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", function (d) {
        return Math.sqrt(d.value);
      });

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
      .attr("r", 5)
      .attr("fill", function (d) {
        return color(d.group);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("title")
      .text(function (d) {
        return d.id;
      });

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
  d3.json("static/assets/js/map_data.json", function (error, graph) {
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
      return y(d.price);
    });

  var area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function (d) {
      return x2(d.date);
    })
    .y0(height2)
    .y1(function (d) {
      return y2(d.price);
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

  d3.csv("static/assets/js/brush_data.csv", type, function (error, data) {
    if (error) throw error;

    x.domain(d3.extent(data, function (d) {
      return d.date;
    }));
    y.domain([0, d3.max(data, function (d) {
      return d.price;
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
    d.price = +d.price;
    return d;
  }
}

function showGauge() {
  var config3 = liquidFillGaugeDefaultSettings();
                   config3.textVertPosition = 0.5
                   config3.waveAnimateTime = 1000;
  config3.valueCountUp = true;
                   config3.displayPercent = true;
                   config3.waveCount = 1;

  d3.csv("static/assets/js/gauge_data.csv", function(error, data) {
    if (error) throw error;
    console.log(data[0]);

      var foll_target = 90000000;
      var frnd_target = 500000;
      var retwt_target = 100000
      var foll_i = 0;
      var frnd_i = 0;
      var retwt_i = 0;

      var gauge4 = loadLiquidFillGauge("fillgauge4", ((data[0].followers/foll_target)* 100), config3);
                       function NewValue() {
                           if (Math.random() > .5) {
                               return Math.round(Math.random() * 100);
                           } else {
                               return (Math.random() * 100).toFixed(1);
                           }
                       }
      var gauge1 = loadLiquidFillGauge("fillgauge1", ((data[0].friends/frnd_target) * 100), config3);
                       function NewValue() {
                           if (Math.random() > .5) {
                               return Math.round(Math.random() * 100);
                           } else {
                               return (Math.random() * 100).toFixed(1);
                           }
                       }

      var gauge2 = loadLiquidFillGauge("fillgauge2", ((data[0].retweet_count/retwt_target) * 100), config3);
                       function NewValue() {
                           if (Math.random() > .5) {
                               return Math.round(Math.random() * 100);
                           } else {
                               return (Math.random() * 100).toFixed(1);
                           }
                       }

  });
}

forceGraph();
lineGraph();
showGauge();
