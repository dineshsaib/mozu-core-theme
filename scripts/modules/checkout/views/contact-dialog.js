define(['modules/jquery-mozu','underscore', 'modules/views-modal-dialog'], function($, _, Backbone, Hypr, ModalDialogView) {
	var contactModal = new ModalDialogView({
		"template" : "modules/ship-to-checkout/modal-contact"
	});

	return contactModal;

});

