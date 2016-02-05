(function (root, factory) {
    root.squid_api.view.ProjectModelManagementWidget = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.BaseModelManagementWidget.extend({
        formEvents: function() {
            var me = this;
            this.formContent.on('dbUrl:change', function(form) {
                me.resetSchemas(form);
            });
            this.formContent.on('dbPassword:change', function(form) {
                me.resetSchemas(form);
            });
            this.formContent.on('dbUser:change', function(form) {
                me.resetSchemas(form);
            });
        },

        resetSchemas: function(form) {
            form.$el.find(".squid-api-check-db-connection button").removeClass("btn-danger");
            form.$el.find(".squid-api-check-db-connection button").removeClass("btn-success");
            form.$el.find('.dbSchemas').hide();
            form.$el.find(".squid-api-check-db-connection button").removeClass("btn-warning");
        },

        customDataManipulation: function(data) {
            if (data.dbCheckConnection) {
                delete data.dbCheckConnection;
            }
            return data;
        },
        
        onSave : function(previousAttributes, model) {
            var me = this;
            // TODO: when saving a new project kraken should return the project role (T713)
            model.set({"_role" : "OWNER"}, {silent : true});
            if (this.config.get("domain") && (previousAttributes.dbSchemas && model.get("dbSchemas"))) {
                if (previousAttributes.dbSchemas[0] !== model.get("dbSchemas")[0]) {
                    squid_api.getCustomer().then(function(customer) {
                        customer.get("projects").load(me.config.get("project"), true).then(function(project) {
                            me.config.set({
                                "bookmark" : null,
                                "domain" : null,
                                "period" : null,
                                "chosenDimensions" : [],
                                "chosenMetrics" : [],
                                "orderBy" : null,
                                "selection" : {
                                    "domain" : null,
                                    "facets": []
                                }
                            });
                            me.config.trigger("change:project", me.config);
                            //project.get("domains").load(null, true);
                        });
                    });
                }
            }
            // set new project as current if one isn't already set
            if (! this.config.get("project")) {
                this.config.set("project", model.get("id").projectId);
            }
        }
    });

    return View;
}));
