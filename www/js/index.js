var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, true);
        document.addEventListener('backbutton', this.disableBackButton, false );
    },

    onDeviceReady: function() {
        angular.element(document).ready(function() {
            angular.bootstrap(document, ['duckducktech']);
        });
    },

    disableBackButton: function (e) {
        e.preventDefault();
    }
};

(function (window, angular) {

    var TEMPLATE_URL = "views/";

    var DDT = angular.module('duckducktech', [
        'ngRoute'
    ]);
    DDT.config(["$compileProvider", "$routeProvider", function ($compileProvider, $routeProvider) {

        let redirectTo = function () {
            var hideSplash = window.localStorage.getItem('showSplash');

            return hideSplash? '/feeds': '/splash';
        };

                $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);

        $routeProvider
        .when('/splash', {
            templateUrl: TEMPLATE_URL + 'splash.html'
        })
        .when('/feeds', {
            templateUrl: TEMPLATE_URL + 'feed.html',
            controller: 'feedController'
        })
        .when('/profile', {
            templateUrl: TEMPLATE_URL + 'profile.html',
            controller: 'profileController'
        })
        .otherwise({
            redirectTo: redirectTo()
        })
    }]);

    DDT.factory("ddtServices", ["$http", "$q", function ($http, $q) {

        var API_ENDPOINT = "http://127.0.0.1:5000/feeds/articles/";

        var AJAX = function (URL, METHOD, DATA) {
            var deferred = $q.defer();
            $http({
                url: URL,
                method: METHOD,
                data: DATA
            }).then(function (response) {
                deferred.resolve(response);
            }, function (rejection) {
                deferred.reject(rejection);
            });

            return deferred.promise;
        };

        return {
            getFeedsList: function (args) {
                var URL = API_ENDPOINT + args,
                    METHOD = 'GET';
                return AJAX(URL, METHOD, undefined);
            },
            getArticle: function (entityId) {
                var URL = API_ENDPOINT + entityId,
                    METHOD = 'GET';
                return AJAX(URL, METHOD, undefined);
            },
            getFeedsByUrl: function (url) {
                var URL = url,
                    METHOD = 'GET';
                return AJAX(URL, METHOD, undefined);
            }
        }
    }]);

    DDT.controller("feedController", ['$window', '$scope', '$location', '$timeout','ddtServices', function ($window, $scope, $location, $timeout, ddtServices) {

                let FEED_NEW = 'filter?item=10&page=1&news=latest';
        let FEED_HOT = 'filter?item=10&page=1&news=hot';
        let FEED_TOP = 'filter?item=10&page=1&news=top';


        $scope.feedsList = [];
        $scope.feedsListPagination = {};
        $scope.feedData = {};
        $scope.loadingFeeds = true;
        $scope.getClass = function (path) {
            return ($location.path().substr(0, path.length) === path);
        }

        $scope.getRandomVal = function () {
            return parseInt(Math.round((Math.random() * (3 - 1) + 1)));
        }

        $timeout(function () {
            console.log('Feed api called');
            ddtServices
            .getFeedsList(FEED_TOP)
            .then(function (response) {
                $scope.feedsList = response.data.data;
                $scope.feedsListPagination = response.data.meta.pagination.links;

                $scope.loadingFeeds = false;
            }, function (rejection) {
                console.log('Error fetching feeds!');
                navigator.notification.alert('Error fetching feeds '+ rejection.status, function () {}, 'Error', 'OK');
                $scope.loadingFeeds = false;
            });
        }, 2000);

        var previousListItem = undefined;
        var articleCollapseHeight = undefined;
        var articleExpandedHeight = undefined;
        $scope.currentFeed = {};
        var oldScrollTop = $('.feed-content').scrollTop();
        $scope.getArticle = function (event, feed) {
            if(event.target.id === 'artLnk') {
                return;
            }

            console.log('get article', event, previousListItem);

            $scope.currentFeed = feed;

            if(previousListItem && previousListItem.currentTarget == event.currentTarget) {
                closeArticle(event, feed);
            } 
            else if(previousListItem && previousListItem.currentTarget != event.currentTarget) {
                closeArticle(previousListItem, feed, true);
                $timeout(function () {
                    openArticle(event, feed, true);
                }, 210);
            } 
            else {
                openArticle(event, feed);
            }
        };

        var openArticle = function (event, feed, otherScroll) {
            var articleImg = $(event.currentTarget).find('.article-img');
            var articleContent = $(event.currentTarget).find('.article-content');
            var articleCol = $(event.currentTarget).find('.column');

                        if(!otherScroll) {
                oldScrollTop = $('.feed-content').scrollTop();
            }

            ddtServices
            .getArticle(feed.id)
            .then(function (response) {
                $scope.feedData[feed.id] = response.data.data;
            }, function (rejection) {
                console.log('Error fetching article!');
            });

            previousListItem = event;
            animateArticleImg(articleImg);
            articleCol.addClass('margin-256');
            articleContent.removeClass('ng-hide').animate({}, 500);
            $('.feed-content').animate({
                scrollTop: -($('.feed-list-group').offset().top - $(event.currentTarget).position().top)
            }, 200);
        };

        var closeArticle = function (event, feed, stopScroll) {
            var articleImg = $(event.currentTarget).find('.article-img');
            var articleCol = $(event.currentTarget).find('.column');
            var articleContent = $(event.currentTarget).find('.article-content');

            animateArticleImg(articleImg);
            articleContent.addClass('ng-hide');
            articleCol.removeClass('margin-256');

            previousListItem = undefined;
            $scope.currentFeed = {};

            if(!stopScroll) {
                $('.feed-content').animate({
                    scrollTop: oldScrollTop
                }, 200);
            } else {
                oldScrollTop = $('.feed-content').scrollTop() - $(event.currentTarget).innerHeight() - 113;
            }
        };

        var animateArticleImg = function (el) {
            if(el.hasClass('expand-article')) {
                el.removeClass('expand-article');
            } else {
                el.addClass('expand-article');
            }
        };

        var isLoadingFeeds = false;

        angular.element('.feed-content').on('scroll', function() {
            console.log('scroll ', $(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight);
            if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                console.log('end reached', $scope.feedsListPagination.next_page);
                if($scope.feedsListPagination.next_page && !isLoadingFeeds) {
                    console.log('api called');
                    isLoadingFeeds = true;
                    ddtServices.getFeedsByUrl($scope.feedsListPagination.next_page).then(function (response) {
                        $scope.feedsListPagination = response.data.meta.pagination.links;
                        $timeout(function() {
                            $scope.feedsList = $scope.feedsList.concat(response.data.data);
                            isLoadingFeeds = false;
                        }, 2000);
                    }, function (reject) {
                        console.log('Error fetching feeds!');
                        isLoadingFeeds = false;
                    });
                }
            }
        });

        $scope.getDuckScore = function (duckRank) {
            console.log('duckrank = ', Math.round(duckRank/20));
            var mArray = [];
            for(var i = 0; i < Math.round(duckRank/20); i++ ) {
                mArray.push(i);
            }
            return mArray;
        };
    }]);

    DDT.controller("profileController", ['$scope', function ($scope) {
        $scope.profile = {};
        $scope.loginWEmail = true;
        $scope.signWEmail = false;
        $scope.isLoggedIn = false;

        $scope.loginEmail = function () {
            $scope.signWEmail = false;
            $scope.loginWEmail = true;
        };

        $scope.signUpForm = function () {
            $scope.loginWEmail = false;
            $scope.signWEmail = true;
        };
    }]);

    DDT.controller("tabsController", ['$scope', '$location', function ($scope, $location) {
        $scope.getClass = function (path) {
            return ($location.path().substr(0, path.length) === path);
        };

        $scope.featureRequest = function () {
            navigator.notification.confirm('Would you like personalized feeds in future?', function () {
            }, 'Coming Soon', ['Yes', 'Not Really']);
        };
    }])

    DDT.filter('momentAgo', [function () {
        return function (item) {
            return moment(parseInt(item)).fromNow();
        }
    }]);

    DDT.directive('lazyLoadImage',[function () {
        return {
            restrict: 'A',
            link: function (scope, ele, attrs) {
                ele.addClass('ng-hide');
                ele.on('load', function () {
                    angular.element(this).removeClass('ng-hide');
                    angular.element(this).css('animation-delay', 200 * (parseInt(attrs.lazyLoadImage)%10) + 'ms');
                });
            }
        }
    }]);

    DDT.directive('animateDelay',[function () {
        return {
            restrict: 'A',
            link: function (scope, ele, attrs) {
                ele.css('animation-delay', 50 * (parseInt(attrs.animateDelay)%10) + 'ms');
            }
        }
    }]);

    DDT.directive('badger', [function () {
        return {
            restrict: 'C',
            link: function (scope, ele, attrs) {
                var num = parseInt(Math.round((Math.random() * (3 - 1) + 1)));
                var mclassName = 'badge-primary';
                switch(num) {
                    case 1:
                        mclassName = 'badge-warning';
                        break;
                    case 2:
                        mclassName = 'badge-info';
                        break;
                    case 3:
                        mclassName = 'badge-primary';
                        break;
                }

                ele.addClass(mclassName);
            }
        }
    }])
}(window, angular));