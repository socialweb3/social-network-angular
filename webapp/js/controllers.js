var app = angular.module('benchmates');

app.controller('tabController', ['$q', '$scope', '$route', '$location', 'UserService', 'MessageService',
    function ($q, $scope, $route, $location, UserService, MessageService) {

        $scope.accountId = 1;

        $scope.tabs = [{
            link: 'profile',
            name: 'profile',
            title: 'Profile',
            visible: true
        }, {
            link: 'friends',
            name: 'friends',
            title: 'Friends',
            visible: true
        }, {
            link: 'users',
            name: 'users',
            title: 'Users',
            visible: true
        }, {
            link: 'messages',
            name: 'messages',
            title: 'Messages',
            visible: true
        }, {
            link: 'dialogs',
            name: 'messages',
            title: 'Dialogs',
            visible: false
        }, {
            link: 'settings',
            name: 'profile',
            title: 'Settings',
            visible: false
        }];

        var path = $location.$$path.split('/')[1];
        $scope.tabs.forEach(function (tab) {
            if (path === tab.link) {
                $scope.activeTab = tab.name;
            }
        });
        if ($scope.activeTab === undefined || $scope.activeTab === '') {
            $scope.activeTab = 'profile';
        }

        // TODO Solve synchronous wait problem
        UserService.loadUsers().then(function () {
            p4 = UserService.loadAvatars();
            $scope.account = UserService.getUserById($scope.accountId);
        });

        $scope.onClickTab = function (name) {
            $scope.activeTab = name;
        };

    }]);

app.controller('profileController', ['UserService', '$http', '$scope', '$routeParams',
    function (UserService, $http, $scope, $routeParams) {

        var id = $routeParams.profileId === undefined ? $scope.accountId : parseInt($routeParams.profileId);
        $scope.profile = UserService.getUserById(id);

    }]);

app.controller('settingsController', ['UserService', '$http', '$scope',
    function (UserService, $http, $scope) {

        // Disable weekend selection
        function disabled(data) {
            var date = data.date,
                mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.editableAccount = Object.assign({}, $scope.account);

        $scope.updateAccount = function () {
            $scope.account.update($scope.editableAccount);
            $scope.$broadcast('show-errors-reset');
        };

        $scope.chooseBirthDate = function () {
            $scope.birthDate.opened = true;
        };

        $scope.birthDate = {
            opened: false
        };

        $scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(),
            minDate: new Date(1900, 1, 1),
            startingDay: 1
        };

    }]);

app.controller('friendsController', ['UserService', 'filterFilter', '$http', '$scope', '$route', '$location',
    function (UserService, filterFilter, $http, $scope, $route, $location) {

        $scope.userList = [];

        $scope.$on('loadFriendsSucceed', getFriends);
        $scope.$on('loadFriendsDoneBefore', getFriends);

        function getFriends() {
            $scope.userList = UserService.getFriends($scope.account);
        }

        UserService.loadFriends();

        $scope.addFriend = function (friendId) {
            $scope.account.addFriend(friendId);
            getFriends($scope.account);
        };

        $scope.removeFriend = function (friendId) {
            $scope.account.removeFriend(friendId);
            getFriends($scope.account);
        };

        // pagination controls
        $scope.currentPage = 1;
        $scope.totalItems = $scope.userList.length;
        $scope.entryLimit = 15; // items per page
        $scope.noOfPages = Math.ceil($scope.totalItems / $scope.entryLimit);

        // $watch search to update pagination
        $scope.$watch('userSearch', function (newVal, oldVal) {
            $scope.filtered = filterFilter($scope.userList, newVal);
            $scope.totalItems = $scope.filtered.length;
            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.entryLimit);
            $scope.currentPage = 1;
        }, true);

    }]);

app.controller('usersController', ['UserService', 'filterFilter', '$http', '$scope', '$route', '$location',
    function (UserService, filterFilter, $http, $scope, $route, $location) {

        function getUsers() {
            $scope.userList = UserService.getUsers();
        }

        getUsers();

        $scope.addFriend = function (friendId) {
            $scope.account.addFriend(friendId);
        };

        $scope.removeFriend = function (friendId) {
            $scope.account.removeFriend(friendId);
        };

        // pagination controls
        $scope.currentPage = 1;
        $scope.totalItems = $scope.userList.length;
        $scope.entryLimit = 15; // items per page
        $scope.noOfPages = Math.ceil($scope.totalItems / $scope.entryLimit);

        // $watch search to update pagination
        $scope.$watch('userSearch', function (newVal, oldVal) {
            $scope.filtered = filterFilter($scope.userList, newVal);
            $scope.totalItems = $scope.filtered.length;
            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.entryLimit);
            $scope.currentPage = 1;
        }, true);

    }]);

app.filter('startFrom', function () {
    return function (input, start) {
        if (input) {
            start = +start;
            return input.slice(start);
        }
        return [];
    };
});

app.filter('dateOrTime', function ($filter) {
    return function (input) {
        if (input === null) {
            return "";
        }
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (input.getTime() >= today.getTime()) {
            return $filter('date')(new Date(input), "HH:mm");
        }
        return $filter('date')(new Date(input), "dd.MM.yyyy");
    };
});

app.controller('messagesController', ['UserService', 'MessageService', '$http', '$scope',
    function (UserService, MessageService, $http, $scope) {

        $scope.$on('loadMessagesSucceed', getLastMessages);
        $scope.$on('loadMessagesDoneBefore', getLastMessages);

        function getLastMessages() {
            $scope.messageList = MessageService.getLastMessages($scope.accountId);
            MessageService.scrollElement("chat");
        }

        MessageService.loadMessages();

    }]);

app.controller('dialogController', ['UserService', 'MessageService', '$http', '$scope', '$routeParams',
    function (UserService, MessageService, $http, $scope, $routeParams) {

        $scope.$on('loadMessagesSucceed', getDialogMessages);
        $scope.$on('loadMessagesDoneBefore', getDialogMessages);

        function getDialogMessages() {
            $scope.messageList = MessageService.getDialogMessages($scope.accountId, $scope.profile.id);
            MessageService.scrollElement("chat");
        }

        var id = $routeParams.profileId === undefined ? $scope.accountId : parseInt($routeParams.profileId);
        $scope.profile = UserService.getUserById(id);

        MessageService.loadMessages();

        $scope.sendMessage = function () {
            var message = MessageService.addMessage($scope.accountId, $scope.profile.id, $scope.messageText);
            $scope.messageList.push(message);
            $scope.messageText = "";
            MessageService.scrollElement("chat");
        };

    }]);
