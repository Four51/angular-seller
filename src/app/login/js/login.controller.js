angular.module('orderCloud')
    .controller('LoginCtrl', LoginController)
;

function LoginController($state, $stateParams, $exceptionHandler, OrderCloud, LoginService, ocRolesService, sdkOrderCloud, clientid, scope) {
    var vm = this;
    vm.credentials = {
        Username: null,
        Password: null
    };
    vm.token = $stateParams.token;
    vm.form = vm.token ? 'reset' : 'login';
    vm.setForm = function(form) {
        vm.form = form;
    };
    vm.rememberStatus = false;

    vm.submit = function() {
        vm.loading = sdkOrderCloud.Auth.Login(vm.credentials.Username, vm.credentials.Password, clientid, scope)
            .then(function(data) {
                sdkOrderCloud.SetToken(data.access_token);
                //TODO: restore refresh token storage
                //vm.rememberStatus ? OrderCloud.Refresh.SetToken(data['refresh_token']) : angular.noop();
                //OrderCloud.Auth.SetToken(data['access_token']);
                var roles = ocRolesService.Set(data.access_token);
                if (roles.length == 1 && roles[0] == 'PasswordReset') {
                    vm.token = data.access_token;
                    vm.form = 'resetByToken';
                } else {
                    $state.go('home');
                }
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.forgotPassword = function() {
        vm.loading = LoginService.SendVerificationCode(vm.credentials.Email)
            .then(function() {
                vm.setForm('verificationCodeSuccess');
                vm.credentials.Email = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.resetPasswordByToken = function() {
        vm.loading = sdkOrderCloud.Me.ResetPasswordByToken({NewPassword:vm.credentials.NewPassword})
            .then(function(data) {
                vm.setForm('resetSuccess');
                vm.credentials = {
                    Username:null,
                    Password:null
                }
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            })
    };

    vm.resetPassword = function() {
        vm.loading = LoginService.ResetPassword(vm.credentials, vm.token)
            .then(function() {
                vm.setForm('resetSuccess');
                vm.token = null;
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            });
    };
}