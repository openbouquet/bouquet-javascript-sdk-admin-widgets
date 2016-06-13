(function (root, factory) {
    root.squid_api.view.ColumnCollectionManagementWidget = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api) {

    var View = squid_api.view.BaseCollectionManagementWidget.extend({
        type : null,
        typeLabel : null,
        typeLabelPlural : null,
        configParentId : "domain",

        init : function(options) {
            var me = this;

            // set column type
            if (options) {
                if (options.type) {
                    this.type = options.type;
                }
            }

            this.typeLabel = this.type;
            this.typeLabelPlural = this.type + "s";

            this.modelView = squid_api.view.BaseModelManagementWidget;

            if (this.type === "Dimension") {
                this.modelView = squid_api.view.DimensionModelManagementWidget;
            }
        },

        loadCollection : function(parentId) {
            var me = this;
            return squid_api.getCustomer().then(function(customer) {
                return customer.get("projects").load(me.config.get("project")).then(function(project) {
                    return project.get("domains").load(parentId).then(function(domain) {
                        return domain.get(me.typeLabelPlural.toLowerCase()).load();
                    });
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
