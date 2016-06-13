(function (root, factory) {
    root.squid_api.view.DimensionCollectionManagementWidget = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api) {

    var View = squid_api.view.BaseCollectionManagementWidget.extend({
        type : "Dimension",
        typeLabel : "Dimension",
        typeLabelPlural : "Dimensions",
        modelView : null,
        collectionLoading : false,
        configParentId : "project",

        init : function() {
            var me = this;
            this.modelView = squid_api.view.BaseModelManagementWidget;
        },

        loadCollection : function(parentId) {
            return squid_api.getCustomer().then(function(customer) {
                return customer.get("projects").load(parentId).then(function(project) {
                    return project.get("domains").load();
                });
            });
        },

        events: {
            'mouseenter tr': function(event) {
                this.eventMouseEnter(event);
            },
            'mouseleave tr': function(event) {
                this.eventMouseLeave(event);
            },
            "click .create" : function(event) {
                this.eventCreate(event);
            },
            'input .search' : function(event) {
                this.eventSearch(event);
            },
            "click .edit": function(event) {
                this.eventEdit(event);
            },
            "click .refresh": function(event) {
                this.eventRefresh(event);
            },
            "click .delete": function(event) {
                this.eventDelete(event);
            },
            "click .select": function(event) {
                this.eventSelect(event);
            }
        },

        getModelLabel: function(model) {
            if (model.get("dynamic")) {
                return "~ " + model.get("name");
            } else {
                return model.get("name");
            }
        },

        getModelRoles : function(model) {
            var roles = squid_api.view.BaseCollectionManagementWidget.prototype.getModelRoles.call(this, model);
            return roles;
        }

    });

    return View;
}));
