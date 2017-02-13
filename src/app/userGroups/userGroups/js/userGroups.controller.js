angular.module('orderCloud')
    .controller('UserGroupsCtrl', UserGroupsController)
;

function UserGroupsController($state, $stateParams, toastr, ocUserGroups, OrderCloud, OrderCloudParameters, UserGroupList, Parameters) {
    var vm = this;
    vm.list = UserGroupList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.UserGroups.List(vm.parameters.search, 1, vm.parameters.pageSize, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters, vm.parameters.buyerid)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.UserGroups.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.createGroup = function() {
        ocUserGroups.Create($stateParams.buyerid)
            .then(function(newUserGroup) {
                toastr.success(newUserGroup.Name + ' was created.', 'Success!');
                $state.go('userGroup.detail', {usergroupid:newUserGroup.ID});
            })
    };

    vm.deleteGroup = function(scope) {
        ocUserGroups.Delete(scope.userGroup, $stateParams.buyerid)
            .then(function() {
                toastr.success(scope.userGroup.Name + ' was deleted.', 'Success!');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
            })
    };
}