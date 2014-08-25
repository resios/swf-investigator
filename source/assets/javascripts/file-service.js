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
                scope.$broadcast("fileProgress",
                                 {
                                     total: event.total,
                                     loaded: event.loaded
                                 });
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

    helpers.filter('prettyPrint', ['$sce', function($sce){
      var transform = function(obj) {
        for (var key in obj) {
          var value = obj[key];
          if (value == null) {
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


      return function(obj){
        var copy = angular.copy(obj);
        transform(copy);
        return $sce.trustAsHtml(syntaxHighlight(copy));
      }

    }]);

})();
