$(document).ready(function() {


  /*Tooltip showing address info*/
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "60")
    .style("visibility", "hidden")
    .text("tooltip");

  /*Initialize Leaflet Map*/
  var map = new L.Map("map", {
      center: [23.9916519, -102.0162908],
      minZoom: 4,
      maxZoom: 10,
      zoom: 5.5
    })
    .addLayer(new L.TileLayer("https://api.mapbox.com/styles/v1/gobmx15/cj869w4w917zp2srtvgh4u0k0/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ29ibXgxNSIsImEiOiJjaWZpaTl2eGtibDBjcnNtN3NqdW1wN25xIn0.yxAJmrmgXO_IaXuI1lckYA"));

  /* Initialize the SVG layer */
  map._initPathRoot();
  //L.svg().addTo(map);

  /* Pass map SVG layer to d3 */
  var svg = d3.select("#map").select("svg"),
    g = svg.append("g");

  /*Animation Timing Variables*/
  var startingTime = -2207325600;
  var step = 50000000000;
  var maxTime;
  var timer;
  var isPlaying = false;
  var counterTime = startingTime;

  var url = 'https://api.myjson.com/bins/yc29t';

  $.getJSON(url, function(collection) {
    var cumEvictions = 0;
    startingTime = Date.parse(collection.features[0].properties.fechaFormateada) - 1000000;
    maxTime = Date.parse(collection.features[collection.features.length - 1].properties.fechaFormateada) + 4000000;
    counterTime = startingTime;
    collection.features.forEach(function(d) {
      d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
      cumEvictions += d.properties.magnitud;
      d.properties.totalEvictions = cumEvictions;
    });

    /*Add an svg group for each data point*/
    var node = g.selectAll(".node").data(collection.features).enter().append("g");
    var feature = node.append("circle")
      .attr("r", function(d) {
        return d.properties.magnitud*2;
      })
      .attr("class", "center")
      .style("stroke", function(d) {
        if (d.properties.magnitud <= 6.5) {
          return "#FFFF00";
        } else if (d.properties.magnitud <= 7.5) {
          return "#FF7F00";
        }
        else  {
          return "#FF0000";
        }
      })
      .style("fill", function(d) {
        if (d.properties.magnitud <= 6.5) {
          return "#FFFF00";
        } else if (d.properties.magnitud <= 7.5) {
          return "#FF7F00";
        }
        else  {
          return "#FF0000";
        }
      });
    /*show node info on mouseover*/
    node.on("mouseover", function(d) {
        var fullDate = d.properties.fechaFormateada;
        var thisYear = new Date(fullDate).getFullYear();
        var currMonth = new Date(fullDate).getMonth() + 1;
        var currDay = new Date(fullDate).getDate() + 1;
        var magnitud = d.properties.magnitud + " Magnitud Richter";
        var hora = d.properties.hora;
        var dateString = currMonth + "/" + currDay + "/" + thisYear;
        $(".tooltip").html(d.properties.profundidad + " km de profundidad<br>" + magnitud + "<br>" + dateString + "<br>Hora: " + hora );
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function() {
        return tooltip.style("top",
          (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
      })
      // .on("click", function(d) {
      //   tooltip.text(d.properties.profundidad);
      //   return tooltip.style("visibility", "visible");
      // })
      .on("mouseout", function() {
        return tooltip.style("visibility", "hidden");
      });

    /*Initialize play button and slider*/
    $("#play").click(togglePlay);
    $("#slider").slider({
      max: maxTime,
      min: startingTime,
      value: maxTime,
      step: step,
      start: function(event, ui) {
        clearInterval(timer);
      },
      change: function(event, ui) {
        counterTime = $("#slider").slider("value");
        filterCurrentPoints();
      },
      slide: function(event, ui) {
        counterTime = $("#slider").slider("value");
        filterCurrentPoints();
      },
      stop: function(event, ui) {
        if (isPlaying) {
          playAnimation();
        }
        filterCurrentPoints();
      }
    });

    /*Starting setup*/
    var currDate = new Date(counterTime).getFullYear();
    //stopAnimation();
    filterCurrentPoints();
    map.on("zoomend", update);
    update();
    playAnimation();

    /*Filter map points by date*/
    function filterCurrentPoints() {
      var filtered = node.attr("visibility", "hidden")
        .filter(function(d) {
          return Date.parse(d.properties.fechaFormateada) < counterTime
        })
        .attr("visibility", "visible");
      // console.log(JSON.stringify(filtered[0]));
      // updateCounter(filtered[0].length-1);
      filtered.filter(function(d) {

          return Date.parse(d.properties.fechaFormateada) > counterTime - step
        })
        .append("circle")
        .attr("r", 4)
        .style("fill", "red")
        .style("fill-opacity", 0.8)
        .transition()

        .duration(1000)
        .ease(Math.sqrt)
        .attr("r", function(d) {
          var i = 2;
          if (d.properties.profundidad <= 20) {
            return 60*i;
          } else if (d.properties.profundidad <= 40) {
            return 50*i;
          }
          else if (d.properties.profundidad <= 80) {
            return 40*i;
          }
          else if (d.properties.profundidad <= 160) {
            return 30*i;
          }
          else{
            return 20*i;;
          }
          //return (100/(d.properties.profundidad+0.1))^2;
          //return d.properties.magnitud * 30
        })
        .style("fill", function(d) {
          if (d.properties.magnitud <= 6.5) {
            return "#FFFF00";
          } else if (d.properties.magnitud <= 7.5) {
            return "#FF7F00";
          }
          else  {
            return "#FF0000";
          }
        })
        .style("fill-opacity", 1e-6)
        .remove();
      updateCounter(filtered[0].length - 1);
    }


    /*Update map counters*/
    function updateCounter(index) {
      var totalEvictions = 0;
      if (index < 1) {

      } else {
        var props = collection.features[index].properties;
        totalEvictions = props.magnitud;
      }
      document.getElementById('counter').innerHTML = totalEvictions + " ";
      currDate = new Date(counterTime).getFullYear();
      var currMonth = new Date(counterTime).getMonth() + 1;
      var currDay = new Date(counterTime).getDate();

      document.getElementById('date').innerHTML = currMonth + "/" + currDay + "/" + currDate +  " - 28/09/2017";

    }

    /*Update slider*/
    function playAnimation() {
      counterTime = $("#slider").slider("value");
      if (counterTime >= maxTime) {
        $("#slider").slider("value", startingTime);

      }
      isPlaying = true;
      timer = setInterval(function() {
        counterTime += step;
        $("#slider").slider("value", counterTime);
        if (counterTime >= maxTime) {
          stopAnimation();
        }
      }, 500);

    }

    function stopAnimation() {
      clearInterval(timer);
      $('#play').css('background-image', 'url(images/play.png)');
      isPlaying = false;
    }

    /*Scale dots when map size or zoom is changed*/
    function update() {
      var up = map.getZoom() / 13;
      node.attr("transform", function(d) {
        return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ") scale(" + up + ")"
      });

    }

    /*called when play/pause button is pressed*/
    function togglePlay() {
      if (isPlaying) {
        stopAnimation();
      } else {
        $('#play').css('background-image', 'url(images/pause.png)');
        playAnimation();
      }
    }
  }); // termina inicia

  /*Show info about on mouseover*/
  $(".popup").hide();
  $(".triggerPopup").mouseover(function(e) {
    $(".popup").position();
    var id = $(this).attr('id');
    if (id == "ellis") {
      $("#ellisPopup").show();
    } else if (id == "omi") {
      $("#omiPopup").show();
    } else {
      $("#demoPopup").show();
    }
    $('.popup').css("top", e.pageY + 20);
  });

  $(".triggerPopup").on("mouseout", function() {
    $(".popup").hide();
  });
});
