define(["modules/jquery-mozu", 
    "underscore", 
    "hyprlive", 
    "modules/backbone-mozu", 
    'hyprlivecontext',
    "modules/checkout/views-checkout-step"], 
    function ($, _, Hypr, Backbone, HyprLiveContext, CheckoutStepView) {
        var ShippingInfoView = CheckoutStepView.extend({
            templateName: 'modules/checkout/step-shipping-method',
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

        return ShippingInfoView;
});