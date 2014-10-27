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
      var margin = {top: 10, right: 10, bottom: 100, left: 40},
      margin2 = {top: 430, right: 10, bottom: 20, left: 40},
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom;

      scope.$watch('data', function(value){
        if(value && value.tasks.length > 0){
          clean();
          scope.taskTypes = value.taskTypes || [];
          scope.tasks = value.tasks || [];
          draw();
        }
      });
      scope.$watch('visible', function(visible){
        var newWidth = d3.select(elem[0])[0][0].offsetWidth - margin.left - margin.right;
        if(visible && scope.width != newWidth){
          clean();
          draw();
        }
      });

      var clean = function(){
        d3.select(elem[0]).selectAll('*').remove();
      }

      var initTimeDomain = function() {
        if (scope.tasks === undefined || scope.tasks.length < 1) {
          scope.timeDomainStart = d3.time.day.offset(new Date(), -3);
          scope.timeDomainEnd = d3.time.hour.offset(new Date(), +3);
          return;
        }
        scope.tasks.sort(function(a, b) {
          return a.endDate - b.endDate;
        });
        scope.timeDomainEnd = scope.tasks[scope.tasks.length - 1].endDate;
        scope.tasks.sort(function(a, b) {
          return a.startDate - b.startDate;
        });
        scope.timeDomainStart = scope.tasks[0].startDate;
      };

      var keyFunction = function(d) {
        d = d || {};
        return d.startDate + d.taskName + d.endDate;
      };

      var draw = function(){
        var width = d3.select(elem[0])[0][0].offsetWidth - margin.left - margin.right;

        if(width < 0){
          return;
        }

        scope.x  = d3.time.scale().range([ 0, width ]).clamp(true);
        scope.x2 = d3.time.scale().range([0, width ]).clamp(true);
        scope.y  = d3.scale.ordinal().rangeRoundBands([0, height], 0.1);
        scope.y2 = d3.scale.ordinal().rangeRoundBands([0, height2], 0.1);

        scope.xAxis = d3.svg.axis().scale(scope.x).orient("bottom");
        scope.xAxis2 = d3.svg.axis().scale(scope.x2).orient("bottom");

        var display = function(){
          scope.x.domain(scope.brush.empty() ? scope.x2.domain() : scope.brush.extent());
          var s = scope.x.domain();

          var visItems = scope.tasks.filter(function(d){return d.startDate < s[1] || d.endDate > s[0];});

          focus.select(".x.axis").call(scope.xAxis);

          var bar = focus.selectAll('.gantt-rect').data(visItems, keyFunction)
          .attr("x", function(d){return scope.x(d.startDate);})
          .attr("width", function(d){return scope.x(d.endDate) - scope.x(d.startDate);});

          bar.enter().append('rect')
          .attr('class', function(d){return 'gantt-rect ' + d.type ;})
          .attr("x", function(d){return scope.x(d.startDate);})
          .attr("y", function(d){return scope.y(d.taskName);})
          .attr("height", function(d) { return scope.y.rangeBand(); })
          .attr("width", function(d){
            return scope.x(d.endDate) - scope.x(d.startDate);
          });

          bar.exit().remove();

        }

        scope.brush = d3.svg.brush().x(scope.x2).on("brush", display);

        var svg = d3.select(elem[0]).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

        svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

        var focus = svg.append("g").attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var context = svg.append("g").attr("class", "focus")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

        initTimeDomain(scope.tasks);
        scope.x.domain([scope.timeDomainStart, scope.timeDomainEnd]);
        scope.y.domain(scope.taskTypes);
        scope.x2.domain(scope.x.domain());
        scope.y2.domain(scope.y.domain());


        focus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(scope.xAxis);

        var bar2 = context.selectAll('.gg').data(scope.tasks, keyFunction).enter()
        .append("g")
        .attr('class', 'gg');

        bar2.append('rect')
        .attr('class', function(d){return 'gantt-rect ' + d.type ;})
        .attr("y", 0)
        .attr("transform", function(d){
          return "translate(" + scope.x2(d.startDate) + "," + scope.y2(d.taskName) + ")";
        })
        .attr("height", function(d) { return scope.y2.rangeBand(); })
        .attr("width", function(d){
          return scope.x2(d.endDate) - scope.x2(d.startDate);
        });

        context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(scope.xAxis2);

        context.append("g")
        .attr("class", "x brush")
        .call(scope.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

        display();
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
