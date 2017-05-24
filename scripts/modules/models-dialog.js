define(["backbone", 'hyprlive'], function(Backbone, Hypr) {

    var modalDialog = Backbone.Model.extend({
        defaults:{
           
        },
        closeDialog: function(){
            this.trigger('closeDialog');
        },
        openDialog: function(){
            this.trigger('openDialog');
        },
        saveDialog: function(){
            this.trigger('saveDialog');
        }
    })
    return modalDialog;
});
