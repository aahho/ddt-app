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

        initAd();
    },

    disableBackButton: function (e) {
        e.preventDefault();
    }
};


function initAd(){
    if ( window.plugins && window.plugins.AdMob ) {
        var ad_units = {
            android : {
                banner: 'ca-app-pub-0503054612740442/5621811907'		
            },
            web: {

            },
            ios: {
                banner: 'ca-app-pub-0503054612740442/5621811907'
            }
        };
        var admobid = ( /(android)/i.test(navigator.userAgent) ) ? ad_units.android : ad_units.ios;

        window.plugins.AdMob.setOptions( {
            publisherId: admobid.banner,
            interstitialAdId: admobid.interstitial,
            adSize: window.plugins.AdMob.AD_SIZE.SMART_BANNER,	
            bannerAtTop: false, 
            overlap: false, 
            offsetTopBar: false, 
            isTesting: true, 
            autoShow: false 
        });

        registerAdEvents();

    } else {
        console.log( 'admob plugin not ready' ); 
    }
}

function registerAdEvents() {
    document.addEventListener('onReceiveAd', function(){});
    document.addEventListener('onFailedToReceiveAd', function(data){});
    document.addEventListener('onPresentAd', function(){});
    document.addEventListener('onDismissAd', function(){ });
    document.addEventListener('onLeaveToAd', function(){ });
}

function showBannerFunc(){
    console.log('called showbanner func');
    window.plugins.AdMob.createBannerView();
}



function showToast(message) {
    window.plugins.toast.showShortBottom(message);
}



(function (window, angular) {

    var TEMPLATE_URL = "views/";
    let APP_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfbmFtZSI6ImRkdCJ9.jybDUB8JHJ1rd1mGizFReZcL2aYJ8SIhP9O7tPhdcUw';

    var DDT = angular.module('duckducktech', [
        'ngRoute',
        'ngTagsInput'
    ]);
    DDT.config(["$compileProvider", "$routeProvider", "$httpProvider", function ($compileProvider, $routeProvider, $httpProvider) {

        let redirectTo = function () {
            var hideSplash = window.localStorage.getItem('hideSplash');

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
        .when('/settings', {
            templateUrl: TEMPLATE_URL + 'settings.html',
            controller: 'settingsController'
        })
        .when('/saved', {
            templateUrl: TEMPLATE_URL + 'saved_feeds.html',
            controller: 'savedFeedController'
        })
        .when('/personal', {
            templateUrl: TEMPLATE_URL + 'personal_feeds.html',
            controller: 'personalFeedController'
        })
        .otherwise({
            redirectTo: redirectTo()
        });

        $httpProvider.interceptors.push("interceptor");
    }]);

    DDT.run([ "$rootScope", "$window",
        function ($rootScope, $window) {
            $rootScope.$on('$routeChangeStart', function (event, next, current) {
                console.log('route change', event, next, current);
                if(next && next.$$route && next.$$route.originalPath !== '/splash') {
                    try {
                        window.plugins.AdMob.destroyBannerView();
                    } catch(e) {
                        console.log('admob error');
                    }
                    showBannerFunc();
                }
            });

            $rootScope.hideSplashScreen = $window.localStorage.hideSplash;
        }
    ]);

    DDT.factory("interceptor", ["$q", function ($q) {
        return {
            'request': function(config) {
                if(config && config.headers) {
                    config.headers['app-token'] = APP_TOKEN;
                }
                return config;
            },

            'requestError': function(rejection) {
                if (canRecover(rejection)) {
                    return responseOrNewPromise
                }
                return $q.reject(rejection);
            },


            'response': function(response) {
                return response;
            },

            'responseError': function(rejection) {
                if (canRecover(rejection)) {
                    return responseOrNewPromise
                }
                return $q.reject(rejection);
            }
        }
    }]);

    DDT.factory("ddtServices", ["$http", "$q", function ($http, $q) {

        var API_ENDPOINT = "http://127.0.0.1:5000/";

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
            },
            userSignup: function (entity) {
                var URL = 'users/register'
            },
            googleLogin: function (entityId) {
                var URL = 'users/google?token='+entityId;
                var METHOD = 'GET';
                return AJAX(URL, METHOD, undefined);
            }
        }
    }]);

    DDT.controller("appController", ["$rootScope", "$scope", function ($rootScope, $scope) {

                $scope.showFilterSection = false;
        $scope.keywordsInput = '';

                $scope.toggleFilters = function($event) {
            $scope.showFilterSection = !$scope.showFilterSection;

            if($scope.showFilterSection) {
            }
        };
    }]);

    DDT.controller("feedController", ['$window', '$scope', '$location', '$timeout','ddtServices', function ($window, $scope, $location, $timeout, ddtServices) {

                let FEED_NEW = 'feeds/articles/filter?item=10&page=1&d_min=0&d_max=1';
        let FEED_HOT = 'feeds/articles/filter?item=10&page=1&d_min=0&d_max=2';
        let FEED_TOP = 'feeds/articles/filter?item=10&page=1&d=0';
        let FEED_TEMP = 'feeds/articles/filter?item=10&page=1&d_min=0&d_max=30';

        $window.localStorage.hideSplash = true;

        showBannerFunc();

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
            .getFeedsList(FEED_TEMP)
            .then(function (response) {
                $scope.feedsList = response.data.data;
                $scope.feedsListPagination = response.data.meta.pagination.links;

                $scope.loadingFeeds = false;
            }, function (rejection) {
                console.log('Error fetching feeds!');
                navigator.notification.alert('Error fetching feeds '+ rejection.status, function () {}, 'Error', 'OK');
                $scope.loadingFeeds = false;
            });
        }, 100);

        var previousListItem = undefined;
        var articleCollapseHeight = undefined;
        var articleExpandedHeight = undefined;
        $scope.currentFeed = {};
        var oldScrollTop = angular.element('.feed-content').scrollTop();
        $scope.getArticle = function (event, feed) {
            if(event.target.id === 'artLnk') {
                return;
            }

            console.log('get article', event, previousListItem);

            $scope.currentFeed = feed;

            if(previousListItem && previousListItem.currentTarget == event.currentTarget) {
                closeArticle(event, feed);
                $scope.currentFeed = {};
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
            var articleImg = angular.element(event.currentTarget).find('.article-img');
            var articleContent = angular.element(event.currentTarget).find('.article-content');
            var articleCol = angular.element(event.currentTarget).find('.column');

                        if(!otherScroll) {
                oldScrollTop = angular.element('.feed-content').scrollTop();
            }

            ddtServices
            .getArticle('feeds/articles/' + feed.id)
            .then(function (response) {
                $scope.feedData[feed.id] = response.data.data;
            }, function (rejection) {
                console.log('Error fetching article!');
            });

            previousListItem = event;
            animateArticleImg(articleImg);
            articleCol.addClass('margin-256');
            articleContent.removeClass('ng-hide').animate({}, 500);
            angular.element('.feed-content').animate({
                scrollTop: -(angular.element('.feed-list-group').offset().top - angular.element(event.currentTarget).position().top)
            }, 200);
        };

        var closeArticle = function (event, feed, stopScroll) {
            var articleImg = angular.element(event.currentTarget).find('.article-img');
            var articleCol = angular.element(event.currentTarget).find('.column');
            var articleContent = angular.element(event.currentTarget).find('.article-content');

            animateArticleImg(articleImg);
            articleContent.addClass('ng-hide');
            articleCol.removeClass('margin-256');

            previousListItem = undefined;
            $scope.currentFeed = {};

            if(!stopScroll) {
                angular.element('.feed-content').animate({
                    scrollTop: oldScrollTop
                }, 200);
            } else {
                oldScrollTop = angular.element('.feed-content').scrollTop() - angular.element(event.currentTarget).innerHeight() - 113;
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
            console.log('scroll ', angular.element(this).scrollTop() + angular.element(this).innerHeight() >= angular.element(this)[0].scrollHeight);
            if(angular.element(this).scrollTop() + angular.element(this).innerHeight() >= angular.element(this)[0].scrollHeight) {
                console.log('end reached', $scope.feedsListPagination.next_page);
                if($scope.feedsListPagination.next_page && !isLoadingFeeds) {
                    console.log('api called');
                    isLoadingFeeds = true;
                    ddtServices.getFeedsByUrl($scope.feedsListPagination.next_page).then(function (response) {
                        $scope.feedsListPagination = response.data.meta.pagination.links;
                        $timeout(function() {
                            $scope.feedsList = $scope.feedsList.concat(response.data.data);
                            isLoadingFeeds = false;
                        }, 100);
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

    DDT.controller("profileController", ['$window', '$scope', 'ddtServices', function ($window, $scope, ddtServices) {
        $scope.profile = $window.localStorage.user ? $window.localStorage.user : {};
        $scope.loginWEmail = true;
        $scope.signWEmail = false;
        $scope.isLoggedIn = false;



        $scope.googleSignIn = function ($event) {
            console.log('google sign in', $event, arguments);
            var signInOptions = {
                'scopes': 'profile email openid'
            };
            if(( /(android)/i.test(navigator.userAgent) ) ) {
                signInOptions.webClientId = '211475890836-u1nlglvheakv7o16qtndh785udtv4942.apps.googleusercontent.com'; 
                signInOptions.offline = true;
            }
            window.plugins.googleplus.login(
                signInOptions,
                function (obj) {
                    $scope.profile = obj; 

                                        $scope.isLoggedIn = true; 

                    ddtServices.googleLogin(obj.idToken).then(function (response) {
                        showToast('Logged in successfully');
                        $window.localStorage.user = obj;
                        $scope.isLoggedIn = true;
                    }, function (rejection) {
                        navigator.notification.alert('There was a server side error - '+ rejection.status, function () {}, 'Error', 'Close');
                    });
                },
                function (msg) {
                    navigator.notification.alert('Error: ' + msg, function () {}, 'Google Sign In Error', 'Close');
                }
            );
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
    }]);

    DDT.controller("settingsController", ['$scope', '$location', function ($scope, $location) {

            }]);

    DDT.controller("savedFeedController", ['$scope', '$location', function ($scope, $location) {

            }]);

    DDT.controller("personalFeedController", ['$scope', '$location', function ($scope, $location) {

            }]);

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
    }]);
}(window, angular));