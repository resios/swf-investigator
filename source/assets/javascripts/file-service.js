(function(){
    var helpers = angular.module('SwfHelpers',[])
    helpers.factory('FileReader',['$q', function($q){
        var onLoad = function(reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };

        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };

        var onProgress = function(reader, scope) {
            return function (event) {
//                 scope.$broadcast("fileProgress",
//                                  {
//                                      total: event.total,
//                                      loaded: event.loaded
//                                  });
            };
        };

        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };

        var read = function (file, scope, method) {
            var deferred = $q.defer();

            var reader = getReader(deferred, scope);
            reader[method](file);

            return deferred.promise;
        };

        var readAsDataURL = function (file, scope){
            return read(file, scope, 'readAsDataURL');
        }

        var readAsText = function (file, scope){
            return read(file, scope, 'readAsText');
        }

        return {
            readAsDataURL: readAsDataURL,
            readAsText: readAsText
        }
    }]);

    helpers.factory('HistoryTransformer',[function(){
      var transform = function(obj) {
        for (var key in obj) {
          var value = obj[key];
          if (angular.isArray(value) && value.length == 2 && typeof value[0] === 'string' ) {
            obj[key] = transform(value[1]);
          } else if (typeof value === 'object') {
            transform(value);
          }
        }
        return obj;
      };

      var fromJson = function(history){
        var parsed = angular.fromJson(history);
        return transform(parsed[1]);
      }
      return {
        fromJson: fromJson
      }
    }]);

    helpers.factory('EventTransformer',[function(){
      var EVENT_TYPE = {
        'ActivityTaskScheduled': 'activity',
        'DecisionTaskScheduled': 'decision',
        'TimerStarted': 'timer',
        'WorkflowExecutionSignaled': 'signal'
      };
      var fromHistory = function(history){
        // return an array of event objects that can be drawn on the screen
        // events group multiple SWF events (at most three)
        // they have start, end, type, parameters
        var events = {};
        if(angular.isArray(history)){
          for(var e in history){
            e = history[e];
            var attributeName = e.eventType[0].toLowerCase() + e.eventType.slice(1) + "EventAttributes";
            var attributes = e[attributeName] || {};
            var event = null;
            var eventDate = new Date(e.eventTimestamp);
            if(/(scheduled|timerStarted)$/i.test(e.eventType)){
              //event is scheduled add new event
              events[e.eventId] = {startDate: eventDate, label: e.eventType, type: EVENT_TYPE[e.eventType], scheduled: e};
            } else if(/started$/i.test(e.eventType)){
              //event is started
              event = events[attributes.scheduledEventId];
              if(event){
                event.endDate = eventDate;
                event.started = e;
              }
            } else if(/(completed|timedout)$/i.test(e.eventType)){
              event = events[attributes.scheduledEventId];
              if(event){
                event.endDate = eventDate;
                event.completed = e;
              }
            } else if(/timer(fired|canceled)$/i.test(e.eventType)){
              event = events[attributes.startedEventId];
              if(event){
                event.endDate = eventDate;
                event.completed = e;
              }
            } else if(/workflowExecutionSignaled/i.test(e.eventType)){
              events[e.eventId] = {startDate: eventDate, endDate: eventDate, label: e.eventType, type: EVENT_TYPE[e.eventType], scheduled: e};
            }
          }
        }

        var result = [];
        for(var k in events){
          result.push(events[k]);
        }

        result.sort(function(a, b) {
          return a.endDate - b.endDate;
        });
        var endDate = result[result.length - 1].endDate || new Date();
        result.sort(function(a, b) {
          return a.startDate - b.startDate;
        });
        var lanes = [];
        var taskNames = [];
        for(var i in result){
          var interval = result[i];
          interval.endDate = interval.endDate || endDate;
          var assigned = false;
          for(var l = 0; l < lanes.length; l++){
            if(interval.startDate > lanes[l]){
              assigned = true;
              interval.taskName = 'L' + (l + 1);
              lanes[l] = interval.endDate;
              break;
            }
          }
          if(!assigned){
            lanes.push(interval.endDate);
            interval.taskName = 'L' + lanes.length;
            taskNames.push(interval.taskName);
          }
        }

        return {tasks: result, taskNames: taskNames, taskTypes: taskNames};
      }
      var merge = function(source, destination){
        for(var attr in source){
          destination[attr] = source[attr];
        }
        return destination;
      }

      var extractActivity = function(event){
        var activity = {};
        var scheduled = event.scheduled;
        var attrs = null;

        if(event.scheduled){
          attrs = event.scheduled.activityTaskScheduledEventAttributes;
          activity = merge(attrs, activity);
          activity.scheduleDate = event.scheduled.eventTimestamp;
        }

        if(event.started){
          attrs = event.started.activityTaskStartedEventAttributes;
          activity = merge(attrs, activity);
          activity.startDate = event.started.eventTimestamp;
        }
        if(event.completed){
          attrs = event.completed.activityTaskCompletedEventAttributes;
          activity = merge(attrs, activity);
          activity.endDate = event.completed.eventTimestamp;
        }

        return activity;
      }

      var extractActivities = function(events){
        var activities = [];
        if(events && events.tasks.length > 0){
          for(var i=0; i< events.tasks.length; i++){
            var event = events.tasks[i];
            if("activity" === event.type){
              activities.push(extractActivity(event));
            }
          }
        }
        return activities;
      }

      return {
        fromHistory: fromHistory,
        extractActivities: extractActivities
      }
    }]);

    helpers.filter('dateFormatter', function(){
      return function(obj){
        return new Date(obj).toGMTString();
      }
    });

    helpers.directive('eventView', [function(){
      var transform = function(obj) {
        for (var key in obj) {
          var value = obj[key];
          if (value === null) {
            delete obj[key];
          } else if (typeof value === 'object') {
            transform(value);
          }
        }
      };

      var syntaxHighlight = function(json) {
        if (typeof json != 'string') {
          json = JSON.stringify(json, undefined, 2);
        }
        if(!json){
          return null;
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          var cls = 'number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key';
            } else {
              cls = 'string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean';
          } else if (/null/.test(match)) {
            cls = 'null';
          }
          return '<span class="js-' + cls + '">' + match + '</span>';
        });
      }

      var linker = function(scope, elem, attrs){
        scope.$watch('obj', function(newVal, oldVal){
          if(newVal){
            var copy = angular.copy(newVal);
            transform(copy)
            var html = syntaxHighlight(copy);
            elem.html(html);
          }
        });
      }

      return {
        restric: 'E',
        replace: false,
        scope: {obj: '='},
        link: linker
      };

    }]);

})();
