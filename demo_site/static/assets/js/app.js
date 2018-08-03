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
  var campaignTarget_followers = 1000000
  var campaignTarget_friends = 10000
  var campaignTarget_retweet_count = 1000

  d3.csv("static/assets/js/gauge_data.csv", function (data) {
    for (var i = 0; i < data.length; i++) {
      console.log(data[i].followers);
      console.log(data[i].friends);
      console.log(data[i].retweet_count);

      var gauge1 = loadLiquidFillGauge("fillgauge1", Math.round(data[0].followers / campaignTarget_followers));
      var gauge2 = loadLiquidFillGauge("fillgauge2", Math.round(data[0].friends / campaignTarget_friends));
      var gauge3 = loadLiquidFillGauge("fillgauge3", Math.round(data[0].retweet_count / campaignTarget_retweet_count));
    }
  });


  //    var gauge1 = loadLiquidFillGauge("fillgauge1", 60);
  var config1 = liquidFillGaugeDefaultSettings();
  config1.circleThickness = 0.4;
  config1.circleColor = "#6DA398";
  config1.textColor = "#0E5144";
  config1.waveTextColor = "#6DA398";
  config1.waveColor = "#246D5F";
  config1.textVertPosition = 0.52;
  config1.waveAnimateTime = 1000;
  config1.waveHeight = 0;
  config1.waveAnimate = false;
  config1.waveCount = 2;
  config1.waveOffset = 0.25;
  config1.textSize = 1.2;
  config1.minValue = 30;
  config1.maxValue = 150
  config1.displayPercent = false;

  var config2 = liquidFillGaugeDefaultSettings();
  config2.circleColor = "#D4AB6A";
  config2.textColor = "#553300";
  config2.waveTextColor = "#805615";
  config2.waveColor = "#AA7D39";
  config2.circleThickness = 0.1;
  config2.circleFillGap = 0.2;
  config2.textVertPosition = 0.8;
  config2.waveAnimateTime = 2000;
  config2.waveHeight = 0.3;
  config2.waveCount = 1;

  var config4 = liquidFillGaugeDefaultSettings();
  config4.circleThickness = 0.15;
  config4.circleColor = "#808015";
  config4.textColor = "#555500";
  config4.waveTextColor = "#FFFFAA";
  config4.waveColor = "#AAAA39";
  config4.textVertPosition = 0.8;
  config4.waveAnimateTime = 1000;
  config4.waveHeight = 0.05;
  config4.waveAnimate = true;
  config4.waveRise = false;
  config4.waveHeightScaling = false;
  config4.waveOffset = 0.25;
  config4.textSize = 0.75;
  config4.waveCount = 3;

  var config5 = liquidFillGaugeDefaultSettings();
  config5.circleThickness = 0.4;
  config5.circleColor = "#6DA398";
  config5.textColor = "#0E5144";
  config5.waveTextColor = "#6DA398";
  config5.waveColor = "#246D5F";
  config5.textVertPosition = 0.52;
  config5.waveAnimateTime = 5000;
  config5.waveHeight = 0;
  config5.waveAnimate = false;
  config5.waveCount = 2;
  config5.waveOffset = 0.25;
  config5.textSize = 1.2;
  config5.minValue = 30;
  config5.maxValue = 150
  config5.displayPercent = false;


  function NewValue() {
    if (Math.random() > .5) {
      return Math.round(Math.random() * 100);
    } else {
      return (Math.random() * 100).toFixed(1);
    }
  }
}

forceGraph();
lineGraph();
// showGauge();
