// require bootstrap
//= require angular
//= require angular-sanitize
//
//=  require_tree .
//

(function(){
    var app = angular.module('SwfInvestigator',['SwfHelpers']);

    app.controller('MainCtrl',[
      '$scope', 'FileReader', 'HistoryTransformer'
      ,function($scope, fileReader, historyTransformer){
        $scope.ctx = { inputHistory: '', history: [] };
        $scope.loadInput = function(files){

            fileReader.readAsText(files[0], $scope).then(function(data){
                $scope.ctx.inputHistory = data;
                // parse and show history
                $scope.ctx.history = historyTransformer.fromJson(data);
            })
        }
        $scope.updateDetails = function(index){
          $scope.currentEvent = $scope.ctx.history[index];
        }


    }]);
})();
