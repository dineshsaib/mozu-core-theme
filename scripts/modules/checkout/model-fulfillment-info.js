define([
    'modules/jquery-mozu',
    'underscore',
    'hyprlive',
    'modules/backbone-mozu',
    'modules/api',
    'hyprlivecontext',
    'modules/checkout/models-checkout-step',
    'modules/checkout/model-fulfillment-contact'
],
function ($, _, Hypr, Backbone, api, HyprLiveContext, CheckoutStep, FulfillmentContact) {

    var FulfillmentInfoItem = Backbone.MozuModel.extend({
        relations: {
            fulfillmentContact: FulfillmentContact
        },
        validation: {
            shippingMethodCode: {
                required: true,
                msg: Hypr.getLabel('chooseShippingMethod')
            }
        },
        getOrder: function() {
                return this.collection.parent.parent;
            },
        compareShippingMethods: function(newMethods){
            var self = this;
            return _.isMatch(self.get('availableShippingMethods'), newMethods);
        },
        getShippingMethodsFromContact: function(){
                var self = this;
                self.isLoading(true);
                self.getOrder().apiModel.getShippingMethodsFromContact().then(function (methods) {
                    if(!self.compareShippingMethods(methods)) {
                        self.refreshShippingMethods(methods);
                        self.chooseDefaultShippingMethod();
                    }
                }).ensure(function () {
                    //addr.set('candidateValidatedAddresses', null);
                    self.isLoading(false);
                    //Redundent
                    //parent.isLoading(false);
                    self.calculateStepStatus();
                    //Redundent
                    //parent.calculateStepStatus();
                });  
            },
            refreshShippingMethods: function (methods) {
                this.set({
                    availableShippingMethods: methods
                });

                //Side Affect, Refresh should refresh nothing more
                // //always make them choose again
                //_.each(['shippingMethodCode', 'shippingMethodName'], this.unset, this);
                
                //Side Affect, Refresh should refresh nothing more
                // //after unset we need to select the cheapest option
                //this.updateShippingMethod();
            },
            chooseDefaultShippingMethod : function(){
                _.each(['shippingMethodCode', 'shippingMethodName'], this.unset, this);
                //after unset we need to select the cheapest option
                this.updateShippingMethod();
            },
            calculateStepStatus: function () {
                // If no shipping required, we're done.
                if (!this.requiresFulfillmentInfo()) return this.stepStatus('complete');

                // If there's no shipping address yet, go blank.
                if (this.parent.get('shippingDestinations').stepStatus() !== 'complete') {
                    return this.stepStatus('new');
                }

                // Incomplete status for shipping is basically only used to show the Shipping Method's Next button,
                // which does nothing but show the Payment Info step.
                var billingInfo = this.parent.get('billingInfo');
                if (!billingInfo || billingInfo.stepStatus() === 'new') return this.stepStatus('incomplete');

                // Payment Info step has been initialized. Complete status hides the Shipping Method's Next button.
                return this.stepStatus('complete');
            },
            updateShippingMethod: function (code, resetMessage) {
                var available = this.get('availableShippingMethods'),
                    newMethod = _.findWhere(available, { shippingMethodCode: code }),
                    lowestValue = _.min(available, function(ob) { return ob.price; }); // Returns Infinity if no items in collection.

                if (!newMethod && available && available.length && lowestValue) {
                    newMethod = lowestValue;
                }
                if (newMethod) {
                    this.set(newMethod);
                    this.applyShipping(resetMessage);
                }
            },
            applyShipping: function(resetMessage) {
                if (this.validate()) return false;
                var me = this;
                this.isLoading(true);
                var order = this.getOrder();
                if (order) {
                    order.apiModel.update({ fulfillmentInfo: me.toJSON() })
                        .then(function (o) {
                            var billingInfo = me.parent.get('billingInfo');
                            if (billingInfo) {
                                billingInfo.loadCustomerDigitalCredits();
                                // This should happen only when order doesn't have payments..
                                billingInfo.updatePurchaseOrderAmount();
                            }
                        })
                        .ensure(function() {
                            me.isLoading(false);
                            me.calculateStepStatus();
                            me.parent.get('billingInfo').calculateStepStatus();
                            if(resetMessage) {
                                me.parent.messages.reset(me.parent.get('messages'));
                            }
                        });
                }
            }
    })

    var FulfillmentInfo = CheckoutStep.extend({ 
            relations: {
                items: Backbone.Collection.extend({
                    model : FulfillmentInfoItem
                })
            },
            validation: {

            },
            initSet : function(){
                var self = this;
                self = this;
                this.items.reset();
                _.each(self.unquieFulfillmentContactsOnOrders(), function(id){
                    self.createFulfillmentItem(id);
                }) 
            },
            getOrder: function() {
                return this.parent;
            },
            unquieFulfillmentContactsOnOrders : function(){
                var self =this,
                    contactIds = []
               self.getOrder().get('shippingDestinations').get('items').each(function(destination){
                    contactIds = contactIds.concat(destination.get('items').pluck('fulfillmentContactId'));
                })
                return _.uniq(contactIds);
            },
            createFulfillmentItem: function(contactId){
                var contact = this.getOrder().get('customer').get('contacts').findWhere({contactId : contactId}); 
                this.get('items').add(new FulfillmentInfoItem({fulfillmentContact: contact.toJSON()}));
            },
            shippingInfoUpdated: function(){
                this.trigger('shippingInfoUpdated');
            },
            next: function () {
                this.stepStatus('complete');
                this.parent.get('billingInfo').calculateStepStatus();
            }
        });
    return FulfillmentInfo;
});