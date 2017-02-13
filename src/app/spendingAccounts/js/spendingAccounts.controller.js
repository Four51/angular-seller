angular.module('orderCloud')
    .controller('SpendingAccountsCtrl', SpendingAccountsController)
;

function SpendingAccountsController($exceptionHandler, $state, $stateParams, toastr, OrderCloud, OrderCloudParameters, ocSpendingAccounts, CurrentAssignments, SpendingAccountList, Parameters) {
    var vm = this;
    vm.list = SpendingAccountList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    vm.userGroupID = $stateParams.usergroupid;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.SpendingAccounts.List(vm.parameters.search, 1, vm.parameters.pageSize, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters, vm.parameters.buyerid)
            .then(function(data) {
                vm.list = ocSpendingAccounts.Assignments.Map(CurrentAssignments, data);
                vm.searchResults = vm.parameters.search.length > 0;

                selectedCheck();
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
        return OrderCloud.SpendingAccounts.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.where(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocSpendingAccounts.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.usergroupid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.spendingAccount.Assigned) vm.allItemsSelected = false;
        vm.selectedCount = _.where(vm.list.Items, {Assigned:true}).length;

        changedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocSpendingAccounts.Assignments.Map(CurrentAssignments, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocSpendingAccounts.Assignments.Update(CurrentAssignments, vm.changedAssignments, $stateParams.buyerid)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;

                changedCheck();
                selectedCheck();

                toastr.success('Spending account assignments updated.', 'Success!');
            })
    };

    vm.createSpendingAccount = function() {
        ocSpendingAccounts.Create($stateParams.buyerid)
            .then(function(newSpendingAccount) {
                if ($stateParams.usergroupid) {
                    var newAssignment = {
                        SpendingAccountID: newSpendingAccount.ID,
                        UserGroupID: $stateParams.usergroupid
                    };

                    //Automatically assign the new user to this user group
                    vm.searchLoading = OrderCloud.SpendingAccounts.SaveAssignment(newAssignment, $stateParams.buyerid)
                        .then(function() {
                            newSpendingAccount.Assigned = true;
                            CurrentAssignments.push(newAssignment);
                            _updateList(newSpendingAccount);
                        })
                        .catch(function() {
                            newSpendingAccount.Assigned = false;
                            _updateList(newSpendingAccount);
                        });
                } else {
                    newSpendingAccount.Assigned = false;
                    _updateList(newSpendingAccount);
                }
            });

        function _updateList(n) {
            vm.list.Items.push(n);
            vm.list.Meta.TotalCount++;
            vm.list.Meta.ItemRange[1]++;
            toastr.success(n.Name + ' was created.', 'Success!');
        }
    };

    vm.editSpendingAccount = function(scope) {
        ocSpendingAccounts.Edit(scope.spendingAccount, $stateParams.buyerid)
            .then(function(updatedSpendingAccount) {
                updatedSpendingAccount.Assigned = vm.list.Items[scope.$index].Assigned;
                vm.list.Items[scope.$index] = updatedSpendingAccount;
                if (updatedSpendingAccount.ID != scope.spendingAccount.ID) {
                    _.map(CurrentAssignments, function(assignment) {
                        if (assignment.SpendingAccountID == scope.spendingAccount.ID) assignment.SpendingAccountID = updatedSpendingAccount.ID;
                        return assignment;
                    });

                    changedCheck();
                }
                toastr.success(updatedSpendingAccount.Name + ' was updated.', 'Success!');
            })
    };

    vm.deleteSpendingAccount = function(scope) {
        ocSpendingAccounts.Delete(scope.spendingAccount, $stateParams.buyerid)
            .then(function() {
                toastr.success(scope.spendingAccount.Name + ' was deleted.', 'Success!');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;

                changedCheck();
            })
    };
}