define([
    'modules/jquery-mozu',
    'underscore',
    'hyprlive',
    'modules/backbone-mozu',
    'modules/api',
    'hyprlivecontext',
    'modules/models-customer',
    'modules/checkout/models-checkout-step'
],
function ($, _, Hypr, Backbone, api, HyprLiveContext, CustomerModels, CheckoutStep) {

    var ShippingDestinationItem = Backbone.MozuModel.extend({
        //validation: CustomerModels.Contact.prototype.validation,
        dataTypes: {
            fulfillmentInfoId: function(val) {
                    return (val === 'new') ? val : Backbone.MozuModel.DataTypes.Int(val);
                },
            fulfillmentContactId: function(val) {
                    return (val === 'new') ? val : Backbone.MozuModel.DataTypes.Int(val);
                }
        },
        helpers: ['fulfillmentContacts'],
        idAttribute: "fulfillmentContactId",
        validation: {
            'fulfillmentContactId': function (value) {
                    if (!value || typeof value !== "number") return Hypr.getLabel('passwordMissing');
                }

        },
        initialize: function(){
            var self = this;

            //TO-DO : Remove
            //TEMP
            //Placeholder for fulfillmentContactID
            
            self.set('fulfillmentContactId', 'new');

            //Placeholder for fulfillmentInfoID
            //
            //self.set('fulfillmentInfoId', _.uniqueId());
        },
        
        decreaseQuanitiyByOne: function(){
            var quantity = this.get('quantity');
            if(quantity > 1) {
                this.updateDestinationQuanitiy(quantity - 1);
            }
        },
        fulfillmentContacts : function(){
           return this.collection.parent.fulfillmentContacts();
        },
        /**
         * Calls the SDK to update the checkout qunaity for that item. 
         * Returning a new checkout model containing updated quantity and price info
         */
        updateDestinationQuanitiy: function(quantity){
            var self = this;
            self.set('quantity', quantity);
            return this;
        },
        /**
         * Sets the checkout items fulfillmentInfoId and saves this via the SDK 
         * 
         */
        toggleSelectedContact :function(fulfillmentId){
            var self = this;
            var contact = _.findWhere(self.fulfillmentContacts(), {id: Number(fulfillmentId)});
            if(contact)
                contact.selected = (contact.selected) ? false : true; 
        },
        changeDestinationAddress: function(fulfillmentId){
            var self = this;
            self.toggleSelectedContact(self.get('fulfillmentContactId'));
            self.toggleSelectedContact(fulfillmentId);
            self.set({fulfillmentContactId: fulfillmentId});
            self.collection.parent.trigger('changeDestination');
        },
        /**
         * Gets the apporperate fulfillmentContact and fires the [] event to 
         * open our fulfillmentContact modal editor.
         */
        editSavedContact: function(){
            this.get('fulfillmentContactId'); 
        },
        addNewDestination: function(){
            if(!this.validate())
                this.collection.parent.addNewDestination();
        },
        removeDestination: function(){
            this.collection.parent.removeDestination(this.get('lineId'), this.get('id'));
        }

    });
    //
    // [{lineId: int, items: []}]
    // 
    var ShippingDestination = Backbone.MozuModel.extend({
        relations: {
            items: Backbone.Collection.extend({
                model: ShippingDestinationItem
            })
        },
        idAttribute: "lineId",
        validation: {
            ShippingDestinationItem : "shippingDestinationItem"
        },
        shippingDestinationItem : function(){
            var itemValidations =[];
            this.get('items').each(function(item,idx){
                var validation = item.validate();
                if(validation) itemValidations.push(validation);
            })
           
            return itemValidations;
        },
        getCheckout : function(){
            return this.collection.parent.parent;
        },
        getCustomerInfo : function(){
            return this.getCheckout().get('customer');
        },
        fulfillmentContacts : function(){
            if(!this._selectorFulfillmentContacts)
                this._selectorFulfillmentContacts = this.getCustomerInfo().get('contacts').toJSON();
           return this._selectorFulfillmentContacts;
        },
        //validation: CustomerModels.Contact.prototype.validation,
        initialize: function(){
            // var self = this;
            // _.each(self, function(item, idx){
            //     var existingDestination = self.findWhere({fulfillmentId: self.fulfillmentId});
            //     if(existingDestination){
            //         existingDestination.get('items').add(new ShippingDestinationAddress(item));    
            //     } else {
            //         self.get('destinations').add(new ShippingDestination(item));
            //     }
            // })
        },
        addNewDestination : function(){
            var self = this,
            newItem = self.get('items').toJSON(); 


            var destinationToSubtractFrom = self.get('items').find(function(destination){
                if(destination.get('quantity') > 1){
                    return true;
                }
                return false;
            });

            if(destinationToSubtractFrom){
                destinationToSubtractFrom.decreaseQuanitiyByOne();
            }

            newItem[0].quantity = 1;
            newItem[0].fulfillmentContactId = 'new';
            if(newItem[0])
            self.get('items').add(new ShippingDestinationItem(newItem[0]));


            self.trigger('addedNewDestination');
        },
        selectedFulfillmentAddress : function(){
            var self = this;
            return self.collection.pluck("id");
        },
        removeDestination: function(lineId, id){
            var self = this;
            self.get(lineId).get('items').remove(id);
        },
        savedAddresses: function(){

        }
    });

    var ShippingStep = CheckoutStep.extend({
        relations : {
            items : Backbone.Collection.extend({
                model: ShippingDestination
            })
        },
        validation: {
            ShippingDestination : "validateShippingDestination"
        },
        initSet : function(){
           var self = this;
            var orderItems = self.parent.get('items');
            var groupedOrderItems = _.groupBy(orderItems, 'lineId');
            _.each(groupedOrderItems, function(value, key){
                self.get('items').add(new ShippingDestination({ lineId: key, items: value }));
            }); 
        },
        validateShippingDestination : function(value, attr, computedState){
            var itemValidations =[];
            this.get('items').each(function(item,idx){
                var validation = item.validate();
                if(validation.ShippingDestinationItem.length) itemValidations = itemValidations.concat(validation.ShippingDestinationItem);
            })
            return (itemValidations.length) ? itemValidations : null;
        },
        toJSON: function() {
                if (this.requiresFulfillmentInfo() || this.requiresDigitalFulfillmentContact()) {
                    return CheckoutStep.prototype.toJSON.apply(this, arguments);
                }
            },
            //Rename for clear
        isDigitalValid: function() {
                var email = this.get('email');
                return (!email) ? false : true;
            },
        calculateStepStatus: function() {
                if (!this.requiresFulfillmentInfo() && this.requiresDigitalFulfillmentContact()) {
                    this.validation = this.digitalOnlyValidation;
                }

                if (!this.requiresFulfillmentInfo() && !this.requiresDigitalFulfillmentContact()) return this.stepStatus('complete');
                return CheckoutStep.prototype.calculateStepStatus.apply(this);
            },
        validateModel: function() {
                var validationObj = this.validate();

                if (validationObj) {
                    Object.keys(validationObj.ShippingDestination).forEach(function(key) {
                        Object.keys(validationObj.ShippingDestination[key]).forEach(function(keyLevel2) {
                            this.trigger('error', {
                                message: validationObj.ShippingDestination[key][keyLevel2]
                            });
                        }, this);
                    }, this);

                    return false;
                }
                return true;
            },
        validateAddresses: function() {
                var self = this,
                    order = this.getOrder(),
                    addr = this.get('address'),
                    deferredValidate = api.defer(),
                    isAddressValidationEnabled = HyprLiveContext.locals.siteContext.generalSettings.isAddressValidationEnabled,
                    allowInvalidAddresses = HyprLiveContext.locals.siteContext.generalSettings.allowInvalidAddresses;

                var promptValidatedAddress = function() {
                    order.syncApiModel();
                    self.isLoading(false);
                    // Redundent
                    //parent.isLoading(false);
                    self.stepStatus('invalid');
                };

                if (!isAddressValidationEnabled) {
                    deferredValidate.resolve();
                } else {
                    if (!addr.get('candidateValidatedAddresses')) {
                        var methodToUse = allowInvalidAddresses ? 'validateAddressLenient' : 'validateAddress';
                        addr.syncApiModel();
                        addr.apiModel[methodToUse]().then(function(resp) {
                            if (resp.data && resp.data.addressCandidates && resp.data.addressCandidates.length) {
                                if (_.find(resp.data.addressCandidates, addr.is, addr)) {
                                    addr.set('isValidated', true);
                                    deferredValidate.resolve();
                                    return;
                                }
                                addr.set('candidateValidatedAddresses', resp.data.addressCandidates);
                                promptValidatedAddress();
                            } else {
                                deferredValidate.resolve();
                            }
                        }, function(e) {
                            if (allowInvalidAddresses) {
                                // TODO: sink the exception.in a better way.
                                order.messages.reset();
                                deferredValidate.reject();
                            } else {
                                order.messages.reset({
                                    message: Hypr.getLabel('addressValidationError')
                                });
                            }
                        });
                    } else {
                        deferredValidate.reject();
                    }
                }
                return deferredValidate.promise;
            },
            // Breakup for validation
            // Break for compelete step
            next: function() {
                var self = this;
                if (!self.requiresFulfillmentInfo() && self.requiresDigitalFulfillmentContact()) {
                    return self.nextDigitalOnly();
                }

                if (!self.validateModel()) return false;

                var order = self.getOrder(),
                    fulfillmentInfo = order.get('fulfillmentInfo');

                self.isLoading(false);

                var completeStep = function() {
                    order.messages.reset();
                    order.syncApiModel();
                    fulfillmentInfo.shippingInfoUpdated();
                    self.calculateStepStatus();
                    //
                    // Remove getShippingMethodsFromContact, move to shipping Fulfillment as call to refresh
                    // Saves Fulfillment Info and Returns Shipping Methods 
                    //
                    // order.apiModel.getShippingMethodsFromContact().then(function (methods) {
                    //     return parent.refreshShippingMethods(methods);
                    // }).ensure(function () {
                    //     addr.set('candidateValidatedAddresses', null);
                    //     self.isLoading(false);
                    //     //Redundent
                    //     //parent.isLoading(false);
                    //     self.calculateStepStatus();
                    //     //Redundent
                    //     //parent.calculateStepStatus();
                    // });                  
                };
                completeStep();

            }
    });

    

    var FulfillmentContact = Backbone.Collection.extend({
            relations: CustomerModels.Contact.prototype.relations,
            validation: CustomerModels.Contact.prototype.validation,
            digitalOnlyValidation: {
                'email': {
                    pattern: 'email',
                    msg: Hypr.getLabel('emailMissing')
                }
            },
            dataTypes: {
                contactId: function(val) {
                    return (val === 'new') ? val : Backbone.MozuModel.DataTypes.Int(val);
                }
            },
            helpers: ['contacts'],
            /**
             * [getOrder] Gets the Parent Checkout Model. Fulfillment Contact is child of Fulfillment Info and must go 1 more level up.
             * @return {CheckoutStep} 
             * 
             */
            getOrder: function() {
                return this.parent.parent;
            },
            contacts: function() {
                var contacts = this.getOrder().get('customer').get('contacts').toJSON();
                return contacts && contacts.length > 0 && contacts;
            },
            initialize: function() {
                var self = this;
                //
                // Remove Event Listener for Change Contact Id, Add call to change
                //
                // this.on('change:contactId', function (model, newContactId) {
                //     if (!newContactId || newContactId === 'new') {
                //         model.get('address').clear();
                //         model.get('phoneNumbers').clear();
                //         model.unset('id');
                //         model.unset('firstName');
                //         model.unset('lastNameOrSurname');
                //     } else {
                //         model.set(model.getOrder().get('customer').get('contacts').get(newContactId).toJSON(), {silent: true});
                //     }
                // });
            },
            setNewContact: function() {
                var self = this;
                self.set('contactId', 'new');
                self.get('address').clear();
                self.get('phoneNumbers').clear();
                self.unset('id');
                self.unset('firstName');
                self.unset('lastNameOrSurname');
            },
            updateContact: function(contactId) {
                var self = this;
                self.set('contactId', contactId);
                if (!contactId || contactId === 'new') {
                    self.setNewContact();
                    return;
                }
                self.get('address').clear();
                self.set(self.getOrder().get('customer').get('contacts').get(contactId).toJSON(), {
                    silent: true
                });
            }
        });
        return ShippingStep;
});