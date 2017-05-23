define(["modules/jquery-mozu", 
    "underscore", 
    "hyprlive", 
    "modules/backbone-mozu", 
    'hyprlivecontext',
    "modules/checkout/views-checkout-step",
    'modules/editable-view'], 
    function ($, _, Hypr, Backbone, HyprLiveContext, CheckoutStepView, EditableView) {
        var SingleShippingInfoView = CheckoutStepView.extend({
            templateName: 'modules/multi-ship-checkout/shipping-methods',
            renderOnChange: [
                'availableShippingMethods'
            ],
            additionalEvents: {
                "change [data-mz-shipping-method]": "updateShippingMethod"
            },
            updateShippingMethod: function (e) {
                this.model.updateShippingMethod(this.$('[data-mz-shipping-method]:checked').val());
            }
        });

        var MultiShippingInfoView = CheckoutStepView.extend({
            templateName: 'modules/multi-ship-checkout/step-shipping-methods',
            renderOnChange: [
                'availableShippingMethods'
            ],
            additionalEvents: {
                "change [data-mz-shipping-method]": "updateShippingMethod"
            },
             initialize: function(){
                var self = this;
                this.listenTo(this.model, 'shippingInfoUpdated', function() {
                    self.render();
                });
            },
            updateShippingMethod: function (e) {
                this.model.updateShippingMethod(this.$('[data-mz-shipping-method]:checked').val());
            },
            render: function(){
                var self = this;
                this.$el.removeClass('is-new is-incomplete is-complete is-invalid').addClass('is-' + this.model.stepStatus());
                this.model.initSet();

                EditableView.prototype.render.apply(this, arguments);    
                this.resize();
            }
        });

        return MultiShippingInfoView;
});