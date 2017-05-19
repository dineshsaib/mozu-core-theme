define(["modules/jquery-mozu", 
    "underscore", 
    "hyprlive", 
    "modules/backbone-mozu", 
    'hyprlivecontext',
    "modules/checkout/views-checkout-step"], 
    function ($, _, Hypr, Backbone, HyprLiveContext, CheckoutStepView) {
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
                    "change [data-mz-destination-quantity]": "handleChangeQuantity"
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
            // handleChangeDestinationAddress: function(e){
            //     var self = this;
            //     var $target = $(e.currentTarget),
            //     selectedFulfillmentId = $target.val();
            
            //     if(selectedFulfillmentId){
            //         self.changeDestinationAddress(selectedFulfillmentId);    
            //     }
            // },
            handleNewContact: function(e){
                var self = this;
            },
            handleEditContact: function(e){
                var self = this;
            },
            handleAddNewDestination: function(e){
                var $target = $(e.currentTarget),
                    itemId = $target.parents('[data-mz-shipping-destinations-item]').data('mzItemId');

                this.model.addNewDestination();
                this.render();
            },
            handleRemoveDestination: function(e){
                var $target = $(e.currentTarget),
                    itemId = $target.parents('[data-mz-shipping-destinations-item]').data('mzItemId');

                this.model.removeDestination();
                this.render();
            },
            initialize: function(){
                var self = this;

            }
        });

        var ShippingDestinationView = Backbone.MozuView.extend({
                templateName: 'modules/multi-ship-checkout/shipping-destinations-items',
                initialize: function(){

                    // this.listenTo(this.model, 'change:fulfillmentInfoId', function (destination, scope) {
                    //     this.render();
                    // }, this);
                },
            //     parentShippingDestination: function(target){
            //         var $target = $(target);
            //         return $target.parents('[data-mz-shipping-destinations-item]');
            //     },
            //     parentShippingDestinationModel: function(target){
            //         var modelId = this.parentShippingDestination(target).data('mzModelId');
            //         return this.model.get('items').get({ cid:modelId});
            //     },
            //     handleChangeQuantity: function(e){
            //     var self = this;
            //     var model = self.parentShippingDestinationModel(e.currentTarget);
            //     var update = _.debounce(function(){
            //             model.updateDestinationQuanitiy(quantity);
            //             self.render();
            //         }, 300);
            //     update();
            // },
            // handleChangeDestinationAddress: function(e){
            //     var self = this;
            //     var $target = $(e.currentTarget),
            //     selectedFulfillmentId = $target.val();
            
            //     if(selectedFulfillmentId){
            //         self.parentShippingDestinationModel(target).changeDestinationAddress(selectedFulfillmentId);    
            //     }
            // },
            // handleNewContact: function(e){
            //     var self = this;
            // },
            // handleEditContact: function(e){
            //     var self = this;
            // },
            // handleAddNewDestination: function(e){
            //     var $target = $(e.currentTarget),
            //         itemId = $target.parents('[data-mz-shipping-destinations-item]').data('mzItemId');

            //     this.model.addNewDestination();
            //     this.render();
            // },
            // handleRemoveDestination: function(e){
            //     var $target = $(e.currentTarget),
            //         itemId = $target.parents('[data-mz-shipping-destinations-item]').data('mzItemId');

            //     this.model.removeDestination(itemId);
            //     this.render();
            // },
                
                render : function() {
                   var self = this;
                    Backbone.MozuView.prototype.render.apply(this, arguments);

                    $.each(this.$el.find('[data-mz-shipping-destinations-item]'), function(index, val) {

                        var modelId = $(this).data('mzModelId');
                        var fulfillmentId = $(this).data('mzFulfillmentInfoId');
                        var shippingDestinationItem = self.model.get('items').findWhere({fulfillmentInfoId: fulfillmentId});
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
                    Backbone.MozuView.prototype.render.apply(this, arguments);

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