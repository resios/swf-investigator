//= require angular
//= require ui-bootstrap-tpls-0.11.2
//= require gantt-chart-d3
//
//= require file-service
//

(function(){
    var app = angular.module('SwfInvestigator',['ui.bootstrap','SwfHelpers','Gantt']);

    app.controller('MainCtrl',[
      '$scope', 'FileReader', 'HistoryTransformer', 'EventTransformer',
      function($scope, fileReader, historyTransformer, eventTransformer){
        $scope.ctx = { inputHistory: '', history: [] };
        var tasks =
          [{"startDate":new Date("Sun Dec 09 01:36:45 EST 2012"),"endDate":new Date("Sun Dec 09 02:36:45 EST 2012"),"taskName":"E Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 04:56:32 EST 2012"),"endDate":new Date("Sun Dec 09 06:35:47 EST 2012"),"taskName":"A Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 06:29:53 EST 2012"),"endDate":new Date("Sun Dec 09 06:34:04 EST 2012"),"taskName":"D Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 05:35:21 EST 2012"),"endDate":new Date("Sun Dec 09 06:21:22 EST 2012"),"taskName":"P Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 05:00:06 EST 2012"),"endDate":new Date("Sun Dec 09 05:05:07 EST 2012"),"taskName":"D Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 03:46:59 EST 2012"),"endDate":new Date("Sun Dec 09 04:54:19 EST 2012"),"taskName":"P Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 04:02:45 EST 2012"),"endDate":new Date("Sun Dec 09 04:48:56 EST 2012"),"taskName":"N Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 03:27:35 EST 2012"),"endDate":new Date("Sun Dec 09 03:58:43 EST 2012"),"taskName":"E Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 01:40:11 EST 2012"),"endDate":new Date("Sun Dec 09 03:26:35 EST 2012"),"taskName":"A Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 03:00:03 EST 2012"),"endDate":new Date("Sun Dec 09 03:09:51 EST 2012"),"taskName":"D Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 01:21:00 EST 2012"),"endDate":new Date("Sun Dec 09 02:51:42 EST 2012"),"taskName":"P Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 01:08:42 EST 2012"),"endDate":new Date("Sun Dec 09 01:33:42 EST 2012"),"taskName":"N Job","status":"FAILED"},
            {"startDate":new Date("Sun Dec 09 00:27:15 EST 2012"),"endDate":new Date("Sun Dec 09 00:54:56 EST 2012"),"taskName":"E Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 00:29:48 EST 2012"),"endDate":new Date("Sun Dec 09 00:44:50 EST 2012"),"taskName":"D Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 07:39:21 EST 2012"),"endDate":new Date("Sun Dec 09 07:43:22 EST 2012"),"taskName":"P Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 07:00:06 EST 2012"),"endDate":new Date("Sun Dec 09 07:05:07 EST 2012"),"taskName":"D Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 08:46:59 EST 2012"),"endDate":new Date("Sun Dec 09 09:54:19 EST 2012"),"taskName":"P Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 09:02:45 EST 2012"),"endDate":new Date("Sun Dec 09 09:48:56 EST 2012"),"taskName":"N Job","status":"RUNNING"},
            {"startDate":new Date("Sun Dec 09 08:27:35 EST 2012"),"endDate":new Date("Sun Dec 09 08:58:43 EST 2012"),"taskName":"E Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 08:40:11 EST 2012"),"endDate":new Date("Sun Dec 09 08:46:35 EST 2012"),"taskName":"A Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 08:00:03 EST 2012"),"endDate":new Date("Sun Dec 09 08:09:51 EST 2012"),"taskName":"D Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 10:21:00 EST 2012"),"endDate":new Date("Sun Dec 09 10:51:42 EST 2012"),"taskName":"P Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sun Dec 09 11:08:42 EST 2012"),"endDate":new Date("Sun Dec 09 11:33:42 EST 2012"),"taskName":"N Job","status":"FAILED"},
            {"startDate":new Date("Sun Dec 09 12:27:15 EST 2012"),"endDate":new Date("Sun Dec 09 12:54:56 EST 2012"),"taskName":"E Job","status":"SUCCEEDED"},
            {"startDate":new Date("Sat Dec 08 23:12:24 EST 2012"),"endDate":new Date("Sun Dec 09 00:26:13 EST 2012"),"taskName":"A Job","status":"KILLED"}];
        var taskNames = [ "D Job", "P Job", "E Job", "A Job", "N Job", "default" ];
        $scope.tasks = {tasks: tasks, taskTypes: taskNames, taskNames: taskNames};
        $scope.loadInput = function(files){

            fileReader.readAsText(files[0], $scope).then(function(data){
              $scope.ctx.inputHistory = data;
              // parse and show history
              $scope.ctx.history = historyTransformer.fromJson(data);
              $scope.tasks = eventTransformer.fromHistory($scope.ctx.history);
              $scope.activities = eventTransformer.extractActivities($scope.tasks);
            })
        }
        $scope.updateDetails = function(index){
          if(index == $scope.ctx.currentIndex){
            $scope.ctx.currentIndex = null;
            $scope.ctx.currentEvent = null;
          } else {
            $scope.ctx.currentIndex = index;
            $scope.ctx.currentEvent = $scope.ctx.history[index];
          }
        }
    }]);

  app.directive('swfTimestamp', function(){
    return {
      restrict: 'AE',
      replace: true,
      scope: {timestamp: "=swfTimestamp"},
      template: "<span class='timestamp' data-millis='{{timestamp}}'> {{timestamp | date:'yyyy-MM-ddTHH:mm:ssZ':'UTC'}}</span>"
    }
  });

  app.directive('swfEvent', function(){
    return {
      restrict: 'AE',
      replace: true,
      scope: {type: "=swfEvent"},
      template: "<span class='swf-event swf-event-{{type|lowercase}}'> {{type}}</span>"
    }
  });
})();
