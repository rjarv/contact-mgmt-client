function ContactModel(){
	var self = this;
	
	self.id = ko.observable();
	self.first_name = ko.observable();
	self.middle_name = ko.observable();
	self.last_name = ko.observable();
	self.address1 = ko.observable();
	self.address2 = ko.observable();
	self.city = ko.observable();
	self.st_province = ko.observable();
	self.country = ko.observable('USA');
	self.zip_code = ko.observable();
}

function ContactsViewModel() {
	var self = this;
	/**
	 *  Data 
	 */
	self.searchFields = ko.observable({
		first_name: ko.observable(''),
		last_name: ko.observable(''),
		city: ko.observable(''),
		zip_code: ko.observable(''),
		st_province: ko.observable('')
	});
	
	/* ViewState Data */
	self.searchedContactInfo = ko.observable({});
	self.contactsArray = ko.computed(function() {
		if (self.searchedContactInfo()){
			var cArray = self.searchedContactInfo()['Contacts'] || [];
			if (cArray.length > 0) {
				cArray = cArray.sort(function(left, right) {
					return left.last_name+left.first_name == right.last_name+right.first_name ?
						0 : (left.last_name+left.first_name < right.last_name+right.first_name ? -1 : 1);
				});
			}
			return cArray;
		} return [];
	});
	
	self.newContactData = ko.observable(new ContactModel());
	
	self.isTableVisible = ko.observable(false);
	self.dashboardVisible = ko.observable(true);
	self.editContactVisible = ko.observable(false);
	
	self.filterData = ko.computed(function() {
		var filters = {};
		for (var i in self.searchFields()){
			var filterVal = self.searchFields()[i]();
			if (filterVal.length > 0) filters[i] = filterVal;
		}
		return filters;
	}, self);
	
	/**
	 * 	Behaviors 
	 */
	self.getContacts = function() {
		$.get('http://127.0.0.1:8080/api/contacts', self.filterData(), self.searchedContactInfo);
	};
	
	self.goToContact = function(contact) {
		$.get('http://127.0.0.1:8080/api/contacts',
			{id: contact.id},
			function(results){
				if(results.Contacts.length > 0){
					for (var f in results.Contacts[0]){
						if (self.newContactData()[f]){
							var value = results.Contacts[0][f];
							self.newContactData()[f](value);
						}
					}
					self.newContact();
				}
			});
	};
	
	self.addContact = function() {
		var requestPayload = {};
		for (var p in self.newContactData()){
			if (self.newContactData()[p]() == '') self.newContactData()[p](null);
			requestPayload[p] = self.newContactData()[p]();
		}
		$.ajax({
		    beforeSend: function(xhrObj){
		        xhrObj.setRequestHeader("Content-Type","application/json");
		        xhrObj.setRequestHeader("Accept","application/json");
		    },
		    type: "POST",
		    url: 'http://127.0.0.1:8080/api/contacts',       
		    data: JSON.stringify(requestPayload),               
		    dataType: "json",
		    success: function(json){
		    	console.log(json);
		    	if (!json.success){
		    		alert(json.error_message + '\r\n\r\nCheck logs for more info.');
		    		return;
		    	}
		    	self.getContacts();
		    	self.cancelEdit();
		    },
		    error: function(xhr, status, message){
		    	console.log(message);
		    }
		});
	};
	
	self.updateContact = function(){
		var requestPayload = {};
		for (var p in self.newContactData()){
			if (self.newContactData()[p]() == '') self.newContactData()[p](null);
			requestPayload[p] = self.newContactData()[p]();
		}
		$.ajax({
		    beforeSend: function(xhrObj){
		        xhrObj.setRequestHeader("Content-Type","application/json");
		        xhrObj.setRequestHeader("Accept","application/json");
		    },
		    type: "PUT",
		    url: 'http://127.0.0.1:8080/api/contacts?id=' + requestPayload.id,
		    data: JSON.stringify(requestPayload),               
		    dataType: "json",
		    success: function(json){
		    	console.log(json);
		    	if (!json.success){
		    		alert(json.error_message + '\r\n\r\nCheck logs for more info.');
		    		return;
		    	}
		    	self.getContacts();
		    	self.cancelEdit();
		    },
		    error: function(xhr, status, message){
		    	console.log(message);
		    }
		});
	};
	
	self.deleteContact = function(contact) {
		if(!confirm("Are you sure you want to delete this contact? Doing so cannot be undone."))return;
		console.log('deleting contact ' + contact.id());
		$.ajax({
			type: "DELETE",
			url: 'http://127.0.0.1:8080/api/contacts?id=' + contact.id(),
			success: function(json){
				console.log(json);
				if (!json.success){
		    		alert(json.error_message + '\r\n\r\nCheck logs for more info.');
		    		return;
		    	}
				self.getContacts();
				self.cancelEdit();
			}
		});
	};
	
	self.clearFilters = function(){
		for (var i in self.searchFields()){
			self.searchFields()[i]('');
		}
		self.getContacts();
	};
	
	self.exportExcel = function() {
		self.isTableVisible(true);
	    window.open('data:application/vnd.ms-excel,' +
	    	encodeURIComponent($('#contacts-table-wrapper').html()));
	    self.isTableVisible(false);
	};
	
	self.newContact = function(contactInfo) {
		self.dashboardVisible(false);
		self.editContactVisible(true);
	};
	
	self.saveContact = function(contact) {
		if (contact.id()) {
			self.updateContact();
			return;
		}
		self.addContact();
	};
	
	self.cancelEdit = function() {
		self.newContactData(new ContactModel());
		self.editContactVisible(false);
		self.dashboardVisible(true);
	};
	
	self.getContacts();
};

ko.applyBindings(new ContactsViewModel());