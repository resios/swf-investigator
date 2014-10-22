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
          right: 10,
          bottom: 20,
          left: 10
        };

        var width;
        var height = 500 - margin.top - margin.bottom - 5;
        var height2 = 500 - margin.top - margin.bottom - 5;

        scope.$watch('data', function(value){
          if(value && value.tasks.length > 0){
            clean();
            taskTypes = value.taskTypes || [];
            tasks = value.tasks || [];
            init();
            draw();
          }
        });
        scope.$watch('visible', function(visible){
          if(visible){
            clean();
            init();
            draw();
          }
        });

        var clean = function(){
          d3.select(elem[0]).selectAll('*').remove();
        }

        var init = function(){
          width = d3.select(elem[0])[0][0].offsetWidth - 5;
          x = d3.time.scale().range([ 0, width ]).clamp(true);
          y = d3.scale.ordinal().rangeRoundBands([ 0, height - margin.top - margin.bottom ], 0.1);
          xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(tickFormat).tickSubdivide(true)
            .tickSize(8).tickPadding(16);
        }

        var taskTypes = [];
        var tasks = [];

        var timeDomainStart = d3.time.day.offset(new Date(),-3);
        var timeDomainEnd = d3.time.hour.offset(new Date(),+3);

        var x
        var y;

        var xAxis;

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

        var keyFunction = function(d) {
          d = d || {};
          return d.startDate + d.taskName + d.endDate;
        };

        var rectTransform = function(d) {
          return "translate(" + x(d.startDate) + "," + y(d.taskName) + ")";
        };

        var eventWidth = function(d){
          var width = x(d.endDate || maxTimeDomain) - x(d.startDate || minTimeDomain);
          return Math.max(1, width);
        }

        var timeDomain = function(value) {
          if (!arguments.length)
            return [ timeDomainStart, timeDomainEnd ];
          timeDomainStart = new Date(value[0]), timeDomainEnd = new Date(value[1]);
          timeDomainStart = timeDomainStart < minTimeDomain ? minTimeDomain : timeDomainStart;
          timeDomainEnd = timeDomainEnd > maxTimeDomain ? maxTimeDomain : timeDomainEnd;
        };

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

        var draw = function(){
          initTimeDomain(tasks);
          minTimeDomain = timeDomainStart;
          maxTimeDomain = timeDomainEnd;
          if(width < 0 || height <0){
            return;
          }

          x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
          y = d3.scale.ordinal().domain(taskTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], 0.1);

        var svg = d3.select(elem[0]).append('svg')
          .attr('class', 'chart')
          .attr('height', height + margin.top + margin.bottom)
          .attr('width', width);

          svg.append('rect')
            .attr("width", width)
            .attr("height", height + margin.top + margin.bottom)
            .style("fill", "none")
            .style("cursor", "move")
            .style("pointer-events", "all");

          var chart = svg.append('g')
            .attr('class', 'gantt-chart')
            .attr('height', height + margin.top + margin.bottom)
            .attr('width', width)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
          ;

        var zoomer = d3.behavior.zoom().x(x).on("zoom", function(){
          svg.select(".x").transition().call(xAxis);

          var ganttChartGroup = svg.select(".gantt-chart");
          var gg = ganttChartGroup.selectAll('.gg').data(tasks, keyFunction);

          gg.selectAll('rect').transition().attr("transform", rectTransform)
        });
        svg.call(zoomer);

        var elems = chart.selectAll('.chart').data(tasks, keyFunction);
        var bar = elems.enter()
          .append("g")
          .attr('class', 'gg');

        bar.append('rect')
          .attr('class', function(d){return 'gantt-rect ' + d.type ;})
          .attr("y", 0)
          .attr("transform", rectTransform)
          .attr("height", function(d) { return y.rangeBand(); })
          .attr("width", eventWidth)
           .on("click",function(d){console.log(JSON.stringify(d));});

          chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
            .transition()
            .call(xAxis);
        }
      };

      return {
        restric: 'E',
        replace: false,
        scope: {data: '=', visible: '='},
        link: linker
      };
    }]);
})();
