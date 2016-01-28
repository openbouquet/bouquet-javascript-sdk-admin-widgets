(function (root, factory) {
    root.squid_api.view.ProjectModelManagementWidget = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.BaseModelManagementWidget.extend({
        formEvents: function() {
            var me = this;
            this.formContent.on('dbDriverName:change', function(form) {
                me.resetSchemas(form);
                if (form.fields.dbDriverName.getValue() == "postgresql" || form.fields.dbDriverName.getValue() == "greenplum") {
                    form.fields.dbPort.setValue("5432");
                }
                if (form.fields.dbDriverName.getValue() == "redshift") {
                    form.fields.dbPort.setValue("5439");
                }
                if (form.fields.dbDriverName.getValue() == "redshift") {
                    form.fields.dbPort.setValue("5439");
                }
            });
            this.formContent.on('dbPassword:change', function(form) {
                me.resetSchemas(form);
            });
            this.formContent.on('dbUser:change', function(form) {
                me.resetSchemas(form);
            });

            // populate database driver names
            $.getJSON(squid_api.apiURL + "/status" + "?access_token=" + squid_api.model.login.get("accessToken"), function( data ) {
                var drivers = [];
                for (var driver in data) {
                    drivers.push(driver.toLowerCase());
                }
                me.formContent.fields.dbDriverName.editor.setOptions(drivers);
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
