var ebayApp = angular.module('ebayApp', ['ngRoute']);

ebayApp.config(function($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'auction-list.html',
        controller: 'EbayCtrl'
    }).
    when('/auctionDetails/:auctionId', {
        templateUrl: 'auction-details.html',
        controller: 'AuctionDetailsCtrl'
    }).
    otherwise({
        redirectTo: '/'
    });
});

ebayApp.factory('ebayServices', function($http) {
    return {
        loadAuctionList: function(callback) {
            $http.get("/auctions").then(callback);
        },

        getSingleAuction : function(auctionId, callback) {
            $http.get("/auctions/" + auctionId).then(callback);
        },

        loginUser: function(userObj, callback, error) {
            $http.post("/login", userObj).then(callback, error);
        },

        bid: function(bidObj, callback, error) {
            $http.post("/bid", bidObj).then(callback, error);
        },

        createNewAuction: function(auctionObj, callback, error) {
            $http.post("/auction", auctionObj).then(callback, error);
        }
    };
});            

ebayApp.controller('EbayCtrl', function($scope, ebayServices) {

    $scope.getAuctionList = function() {
        ebayServices.loadAuctionList(function(result) {                  
            $scope.auctionList = result.data;
        }, function() {
            console.log("Something went wrong.");
        });                    
    };

    $scope.auctionList = $scope.getAuctionList();
    $scope.auctionList = setInterval(function() {
        $scope.getAuctionList();
    }, 5000);

    $scope.login = function() {

        var userObj = {
            "username" : $scope.username
        }


        ebayServices.loginUser(userObj, function(result) {
            $scope.user = result.data;
            $scope.loginError = false;
        }, function() {
            $scope.loginError = true;
        });
    };

    $scope.logout = function() {
        $scope.username = "";
            $scope.user = null;
    };                

    $scope.openBidDialog = function(auction) {
        var that = this;
            var bidDialog = $("#bidDialog").dialog({
                title: auction.title,
                buttons: {
                    "Submit Bid": function() {
                        if ($("#bidAmount").val() <= auction.currentBid) {
                            $("#bidErrorMessage").show();
                        } else {
                            $("#bidErrorMessage").hide();
                            $scope.submitBid($scope.user.rowid, auction, $("#bidAmount").val());
                            bidDialog.dialog("close");
                        }

                    },
                    Cancel: function() {
                        $("#bidErrorMessage").hide();
                        bidDialog.dialog( "close" );
                    }                      
                }
            });
            $("#currentBidValue").text(auction.currentBid > auction.startingBid ? auction.currentBid : auction.startingBid);
            $("#bidDialog").dialog("open");                
    };

    $scope.submitBid = function(userId, auction, bidValue) {
        that = this;
        var bidObj = {
            "userId" : userId,
            "auctionId" : auction.rowid,
            "bidValue" : bidValue
        };

        ebayServices.bid(bidObj, function(result) {
                $scope.getAuctionList();
        }, function(err) {
            $scope.loginError = true;
        });                    
            
    };

    $scope.openNewAuctionDialog = function() {
            var newAuctionDialog = $("#newAuctionDialog").dialog({
                title: "Create New Auction",
                buttons: {
                    "Submit Auction": function() {
                            $scope.submitNewAuction($scope.user.rowid, $("#title").val(), $("#description").val(), $("#startingBid").val(), $("#duration").val());
                            newAuctionDialog.dialog("close");
                        },

                    "Cancel": function() {
                        newAuctionDialog.dialog("close");
                    }                      
                }
            });
            $("#title").val("");
            $("#description").val("");
            $("#startingBid").val("");
            $("#duration").val("");                        
            $("#newAuctionDialog").dialog("open");
    };

    $scope.submitNewAuction = function(userId, title, description, startingBid, duration) {

        var auctionObj = {
            "userId" : userId,
            "title" : title,
            "description" : description,
            "startingBid" : startingBid,
            "duration" : duration
        };

        ebayServices.createNewAuction(auctionObj, function(result) {
                $scope.getAuctionList();
        }, function(err) {
            $scope.loginError = true;
        });                         
    };

    $scope.showTimeRemaining = function(date_future) {
        var date_now = new Date();

        if (date_now > date_future) {
            return 0;
        }
        var delta = Math.abs(date_future - date_now) / 1000;
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        var seconds = Math.floor(delta % 60) % 60;

        if (days === 0) {
            if (hours === 0) {
                return minutes + "m " + seconds + "s ";
            } else {
                return  hours + "h " + minutes + "m ";
            }
            
        } else {
            return days + " days, " + hours + "h ";
        }
    };

    $scope.endingSoon = function(date_future) {
        var date_now = new Date();

        if (date_now > date_future) {
            return false;
        }

        var delta = Math.abs(date_future - date_now) / 1000;
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        var hours = Math.floor(delta / 3600) % 24;

       return (days === 0 && hours === 0);
    };    

});



$(document).ready(function() {
    var bidDialog = $("#bidDialog").dialog({
        
            autoOpen: false,
            height: 300,
            width: 400,
            modal: true,
            open: function(event, ui) {
                $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
                $("#bidAmount").val("");
            }
                    
        });

    var newAuctionDialog = $("#newAuctionDialog").dialog({
        
            autoOpen: false,
            height: 300,
            width: 450,
            modal: true,
            open: function(event, ui) {
                $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
                //$("#bidAmount").val("");
            }         
        });            
});

ebayApp.controller('AuctionDetailsCtrl', function($scope, $routeParams, ebayServices) {
       
        ebayServices.getSingleAuction($routeParams.auctionId, function(result) {                  
            $scope.auctionDetails = result.data;
        }, function() {
            console.log("Something went wrong.");
        }); 
});