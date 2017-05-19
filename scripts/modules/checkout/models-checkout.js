define([
    'modules/checkout/models/models-checkout-step',
    'modules/checkout/models/model-fulfillment-info',
    'modules/checkout/models/model-fulfillment-contact',
    'modules/checkout/models/models-shipping-destinations',
    'modules/checkout/models/models-payment'
],
function (CheckoutStep, FulfillmentInfo, FulfillmentContact, ShippingDestinations, BillingInfo) {
    return {
        CheckoutStep : CheckoutStep,
        FulfillmentInfo : FulfillmentInfo,
        BillingInfo :  BillingInfo,
        ShippingDestinations : ShippingDestinations
    }
})