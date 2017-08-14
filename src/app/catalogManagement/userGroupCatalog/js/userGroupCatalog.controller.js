angular.module('orderCloud')
    .controller('UserGroupCatalogCtrl', UserGroupCatalogController)
;

function UserGroupCatalogController($exceptionHandler, $stateParams, toastr, 
    ocCatalogCategories, SelectedUserGroup, SelectedCatalog, CatalogAssignment, Tree) {
    var vm = this;
    vm.viewAllCategories = CatalogAssignment.ViewAllCategories;
    vm.viewAllProducts = CatalogAssignment.ViewAllProducts;
    vm.selectedCatalog = SelectedCatalog;
    vm.tree = Tree;
    
    vm.updateAssignment = function(node) {
        if (node.Assigned) {
            node.loading = ocCatalogCategories.Assignments.Save($stateParams.catalogid, node.ID, $stateParams.buyerid, $stateParams.usergroupid)
                .then(function() {
                    toastr.success('Category ' + node.Name + ' was assigned to ' + SelectedUserGroup.Name);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    node.Assigned = false;
                })
        } else {
            node.loading = ocCatalogCategories.Assignments.Delete($stateParams.catalogid, node.ID, $stateParams.buyerid, $stateParams.usergroupid)
                .then(function() {
                    toastr.success('Category ' + node.Name + ' was unassigned from ' + SelectedUserGroup.Name);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    node.Assigned = true;
                })
        }
    }
}