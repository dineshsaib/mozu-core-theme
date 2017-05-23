define(["modules/jquery-mozu", 
    "underscore", 
    "hyprlive", 
    "modules/backbone-mozu", 
    'hyprlivecontext',
    "modules/checkout/views-checkout-step",
    'modules/editable-view'], 
    function ($, _, Hypr, Backbone, HyprLiveContext, CheckoutStepView, EditableView) {
        var SingleShippingAddressView = CheckoutStepView.extend({
                templateName: 'modules/checkout/step-shipping-address',
                autoUpdate: [
                    'firstName',
                    'lastNameOrSurname',
                    'address.address1',
                    'address.address2',
                    'address.address3',
                    'address.cityOrTown',
                    'address.countryCode',
                    'address.stateOrProvince',
                    'address.postalOrZipCode',
                    'address.addressType',
                    'phoneNumbers.home',
                    'contactId',
                    'email'
                ],
                renderOnChange: [
                    'address.countryCode',
                    'contactId'
                ],
                beginAddContact: function () {
                    this.model.set('contactId', 'new');
                }
        });

        var ShippingDestinationItemView = Backbone.MozuView.extend({
            templateName: 'modules/multi-ship-checkout/shipping-destinations-item',
            additionalEvents: {
                    "change [data-mz-destination-quantity]": "handleChangeQuantity",
                    "change [data-mz-fulfillment-contact]": "handleChangeDestinationAddress"
            },
            renderOnChange: [
                'fulfillmentInfoId',
                'fulfillmentContactId'
            ],
            handleChangeQuantity: function(e){
                var self = this;
                var $target = $(e.currentTarget);

                var update = _.debounce(function(){
                        self.model.updateDestinationQuanitiy($target.val());
                        self.render();
                    }, 300);
                update();
            },
            handleChangeDestinationAddress: function(e){
                var self = this;
                var $target = $(e.currentTarget);

                self.model.changeDestinationAddress($target.val());
                self.render();

            },
            handleNewContact: function(e){
                var self = this;
            },
            handleEditContact: function(e){
                var self = this;
            },
            handleAddNewDestination: function(e){
                var $target = $(e.currentTarget),
                    itemId = $target.parents('[data-mz-shipping-destinations-item]').data('mzItemId');
                 if(this.model.get('fulfillmentContactId')){
                    this.model.addNewDestination();
                }
            },
            handleRemoveDestination: function(e){
                var $target = $(e.currentTarget),
                    itemId = $target.parents('[data-mz-shipping-destinations-item]').data('mzItemId');

                this.model.removeDestination();
            },
            initialize: function(){
                var self = this;

            }
        });

        var ShippingDestinationView = Backbone.MozuView.extend({
                templateName: 'modules/multi-ship-checkout/shipping-destinations-items',
                initialize: function(){
                    var self = this;
                    this.listenTo(this.model, 'addedNewDestination', function() {
                        self.render();
                    });
                    this.listenTo(this.model, 'changeDestination', function() {
                        self.render();
                    });
                },
                childSelector :function(){

                },
                render : function() {
                    var self = this;
                    Backbone.MozuView.prototype.render.apply(this, arguments);

                    $.each(this.$el.find('[data-mz-shipping-destinations-item]'), function(index, val) {

                        var modelId = $(this).data('mzModelId');
                        var fulfillmentId = $(this).data('mzFulfillmentContactId');
                        var shippingDestinationItem = self.model.get('items').findWhere({fulfillmentContactId: fulfillmentId});
                        var shippingDestinationItemView = new ShippingDestinationItemView({
                            el: $(this),
                            model: shippingDestinationItem
                        });
                        shippingDestinationItemView.render();
                    });  
                }
        });

        var MultiShippingAddressView = CheckoutStepView.extend({
                templateName: 'modules/multi-ship-checkout/step-shipping-destinations',
                render: function(){
                    var self = this;
                    this.$el.removeClass('is-new is-incomplete is-complete is-invalid').addClass('is-' + this.model.stepStatus());
                    EditableView.prototype.render.apply(this, arguments);
                    this.resize();

                    $.each(this.$el.find('[data-mz-shipping-destinations-items]'), function(index, val) {

                        var lineId = $(this).data('mzLineId');
                        var shippingDestination = self.model.get('items').get(lineId);
                        var shippingDestinationView = new ShippingDestinationView({
                            el: $(this),
                            model: shippingDestination
                        });
                        shippingDestinationView.render();
                    });
                }
        });


        return MultiShippingAddressView;
});