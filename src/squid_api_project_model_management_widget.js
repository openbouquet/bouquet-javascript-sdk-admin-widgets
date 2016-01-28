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
            // construct jdbc url jdbc:[driver_name]://[host]:[port]/{[database]}{options}
            data.dbUrl = "jdbc:" + data.dbDriverName + "://" + data.dbHost + ":" + data.dbPort + "/" + data.dbDatabase + data.dbOptions;
            delete data.dbDriverName;
            delete data.dbHost;
            delete data.dbPort;
            delete data.dbDatabase;
            delete data.dbOptions;
            return data;
        },
        
        onSave : function(model) {
            // TODO: when saving a new project kraken should return the project role (T713)
            model.set({"_role" : "OWNER"}, {silent : true});
            // set new project as current
            this.config.set("project", model.get("id").projectId);
        }
    });

    return View;
}));
