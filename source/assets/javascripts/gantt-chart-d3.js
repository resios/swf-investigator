/**
 * @author Dimitry Kudrayvtsev
 * @version 2.1
 */
// http://bl.ocks.org/bunkat/1962173
// http://protembla.com/swimlane.html
(function(){
  angular.module('Gantt',[])
   .factory('d3Service',[function(){return window.d3;}])
   .directive('ganttChart', ['d3Service', function (d3){

      var linker = function(scope, elem, attrs){
        var margin = {
          top: 20,
          right: 40,
          bottom: 20,
          left: 80
        };

        var width = d3.select(elem[0])[0][0].offsetWidth - 5;
        var height = 400 - margin.top - margin.bottom - 5;

        scope.$watch('data', function(value){
          if(value){
            clean();
            taskTypes = value.taskTypes || [];
            taskStatus = value.taskStatus || [];
            tasks = value.tasks || [];
            draw();
          }
        });

        var clean = function(){
          d3.select(elem[0]).selectAll('*').remove();
        }

        var svg;

        var draw = function(){
          initTimeDomain(tasks);
          minTimeDomain = timeDomainStart;
          maxTimeDomain = timeDomainEnd;
          initAxis();

          svg = d3.select(elem[0]).append('svg')
          .attr('class', 'chart')
          .attr('height', height + margin.top + margin.bottom)
          .attr('width', width);

          var chart = svg.append('g')
          .attr('class', 'gantt-chart')
          .attr('height', height + margin.top + margin.bottom)
          .attr('width', width)
          .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          ;

          var line = chart.append('line')
            .attr('class', 'gantt-line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('visibility', 'hidden')

          svg.on('mousemove', function(){
            var d3mouse = d3.mouse(this);
            var mouseX = d3mouse[0] - margin.left;

            if (mouseX > 0) {
              line.attr('x1', mouseX)
              .attr('x2', mouseX)
              .attr('y1', height - margin.bottom)
              .attr('y2', 0)
              .attr('visibility', 'visible')
              ;
            }

          }).on('mouseout', function(){
            line.attr('visibility', 'hidden');
          });

        svg.call(d3.behavior.zoom().on("zoom", function(){
          var td = timeDomain();
          var scale = (td[1]-td[0])/10;

          if (d3.event.scale < prevScale)
            timeDomain([td[0].getTime()-scale, td[1].getTime()+scale]);
          else
            timeDomain([td[0].getTime()+scale, td[1].getTime()-scale]);
          redraw();
          prevScale = d3.event.scale;
          d3.event.sourceEvent.stopPropagation();
        }))
        ;

        svg
        .on("mousedown.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);

        svg.call(d3.behavior.drag()
          .on('dragstart', function() { d3.event.sourceEvent.stopPropagation(); })
          .on('drag', function() {
            var td = timeDomain();
            var scale = (td[1]-td[0])/1000;

            d3.event.sourceEvent.stopPropagation();
            timeDomain([td[0]-scale*d3.event.dx, td[1]-scale*d3.event.dx]);
            redraw();
          })
          .on('dragend', function() { d3.event.sourceEvent.stopPropagation(); }))
          ;

          var bar = chart.selectAll('.chart').data(tasks, keyFunction).enter()
            .append("g")
            .attr('class', 'gg');

          bar.append('rect')
          .attr('class', function(d){return 'gantt-rect ' + d.type ;})
          //.style("fill", function(d) { return d.color || 'blue'; })
          .attr("y", 0)
          .attr("transform", rectTransform)
          .attr("height", function(d) { return y.rangeBand(); })
          .attr("width", eventWidth);

          chart.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
          .transition()
          .call(xAxis);

          //chart.append("g").attr("class", "y axis").transition().call(yAxis);
        }

        var taskTypes = scope.data.taskTypes || [];
        var taskStatus = scope.data.taskStatus || [];
        var tasks = scope.data.tasks || [];
        var prevScale = 0;

        var timeDomainStart = d3.time.day.offset(new Date(),-3);
        var timeDomainEnd = d3.time.hour.offset(new Date(),+3);
        var tickFormat = function(t){
          //  max - min -> duration => define format
          var diff = timeDomainEnd - timeDomainStart;
          var format = "";
          if(diff > 3 * 24 * 3600){
            format = "%Y-%m-%d";
          } else {
            format = "%H:%M:%S";
          }
          return d3.time.format(format)(t);
        };

        var keyFunction = function(d) {
          d = d || {};
          return d.startDate + d.taskName + d.endDate;
        };

        var rectTransform = function(d) {
          return "translate(" + x(d.startDate) + "," + y(d.taskName) + ")";
        };

        // Axis scales
        var x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
        var y = d3.scale.ordinal().domain(taskTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], 0.1);
        var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(tickFormat)
        .tickSubdivide(true)
        .tickSize(8)
        .tickPadding(16);

        var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);

        var initTimeDomain = function(tasks) {
          if (tasks === undefined || tasks.length < 1) {
            timeDomainStart = d3.time.day.offset(new Date(), -3);
            timeDomainEnd = d3.time.hour.offset(new Date(), +3);
            return;
          }
          tasks.sort(function(a, b) {
            return a.endDate - b.endDate;
          });
          timeDomainEnd = tasks[tasks.length - 1].endDate;
          tasks.sort(function(a, b) {
            return a.startDate - b.startDate;
          });
          timeDomainStart = tasks[0].startDate;
        };
        
        var eventWidth = function(d){
          return Math.max(5, x(d.endDate) - x(d.startDate));
        }

        var initAxis = function() {
          x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
          y = d3.scale.ordinal().domain(taskTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], 0.1);
          // depending on the extent change the format
          xAxis = d3.svg.axis().scale(x).orient("bottom")
          .tickFormat(tickFormat)
          .tickSubdivide(true)
          .tickSize(8).tickPadding(8);

          yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);
        };

        var timeDomain = function(value) {
          if (!arguments.length)
            return [ timeDomainStart, timeDomainEnd ];
          timeDomainStart = new Date(value[0]), timeDomainEnd = new Date(value[1]);
          timeDomainStart = timeDomainStart < minTimeDomain ? minTimeDomain : timeDomainStart;
          timeDomainEnd = timeDomainEnd > maxTimeDomain ? maxTimeDomain : timeDomainEnd;
        };

        var redraw = function() {

          initAxis();

          var ganttChartGroup = svg.select(".gantt-chart");
          var gg = ganttChartGroup.selectAll('.gg').data(tasks, keyFunction);

          // transitions
          gg.selectAll('rect').transition()
          .attr("transform", rectTransform)
          .attr("height", function(d) { return y.rangeBand(); })
          .attr("width", eventWidth)
          ;
          /*
          gg.selectAll('text').transition()
          .attr("transform", rectTransform)
          .attr('dy', function(d) {return y.rangeBand() / 2;})
          .attr('dx', function(d) {
            // to small to be displayed?
            if ((x(d.endDate) - x(d.startDate))/2 < d.label.length*3)
              return -10000;
            else return (x(d.endDate) - x(d.startDate))/2 - (d.label.length*3);
          })
          ;*/

          // rect.exit().remove();

          svg.select(".x").transition().call(xAxis);
          svg.select(".y").transition().call(yAxis);
        };
      };

      return {
        restric: 'E',
        replace: false,
        scope: {data: '='},
        link: linker
      };
    }]);
})();
