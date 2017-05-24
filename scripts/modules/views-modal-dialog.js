define(['modules/jquery-mozu','underscore',"modules/backbone-mozu",'hyprlive', 'modules/modal-dialog'], function($, _, Backbone, Hypr, Dialog) {
    var ModalDialog = Backbone.MozuView.extend({
            templateName: 'modules/common/modal-dialog',
            initialize: function() {
                var self = this;
                
                self.listenTo(this.model, 'openDialog', function () {
                    self.handleDialogOpen();
                });
                self.listenTo(this.model, 'saveDialog', function () {
                    self.handleDialogSave();
                });
                self.listenTo(this.model, 'closeDialog', function () {
                    self.handleDialogClose();
                });
            },
            initDialog: function(){
                if(!this.modalDialog){
                    this.modalDialog = new Dialog();
                    this.modalDialog.init({
                        elementId: "mzModalDialog"
                    });
                }
            },
            handleDialogSave: function(){
                this.model.trigger('dialogSave');
                this.handleDialogClose();
            },
            handleDialogClose: function(){
                this.model.trigger('dialogClose');
                modalDialog.close();
            },
            handleDialogOpen: function(){
                modalDialog.open();
            },
            render: function() {
                var self = this;
                Backbone.MozuView.prototype.render.apply(this, arguments);

                this.initDialog(); 
            }
        });
    return ModalDialog;

});