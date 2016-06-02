(function (root, factory) {
    root.squid_api.view.ProjectModelManagementWidget = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api, template) {
    
    squid_api.model.ProjectModel.prototype.definition = "Project";
    squid_api.model.ProjectModel.prototype.ignoredAttributes = [
                                                                'accessRights', 'config', 'relations', 'domains' ];
    squid_api.model.ProjectModel.prototype.schema = {
            "name" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "name"
            },
            "description" : {
                "type" : "TextArea",
                "editorClass" : "form-control",
                "fieldClass" : "description"
            },
            "dbUrl" : {
                "title" : "Database URL",
                "type" : "Text",
                "editorClass" : "form-control",
                "position" : 1,
                "help" : "jdbc:[driver_name]://[host]:[port]/{[database]}{options}",
                "fieldClass" : "dbUrl"
            },
            "dbUser" : {
                "title" : "Database User",
                "type" : "Text",
                "editorClass" : "form-control",
                "position" : 2,
                "fieldClass" : "dbUser"
            },
            "dbPassword" : {
                "title" : "Database Password",
                "type" : "Password",
                "editorClass" : "form-control",
                "position" : 3,
                "fieldClass" : "dbPassword"
            },
            "dbCheckConnection" : {
                "type" : "DbCheckConnection",
                "fieldClass" : "squid-api-check-db-connection",
                "editorClass" : "form-control",
                "position" : 4
            },
            "dbSchemas" : {
                "title" : "Database Schemas",
                "type" : "Checkboxes",
                "editorClass" : " ",
                "options" : [],
                "position" : 5,
                "fieldClass" : "dbSchemas checkbox"
            },
            "id" : {
                "title" : "Object ID",
                "type" : "ProjectObjectID",
                "editorClass" : "form-control",
                "fieldClass" : "object-id"
            }
    };
    

    // Define "objectIDEditor" Custom Editor
    var projectObjectIDEditor = Backbone.Form.editors.Text.extend({

        setValue: function(value) {
            this.value = value;
            this.$el.val(value.projectId);
        },

        getValue: function() {
            var val = this.$el.val();
            return {
                projectId : val
            };
        },

        render: function() {
            if (this.value.bookmarkId) {
                // editing not enabled
                this.$el.attr("disabled", true);
                this.$el.removeClass("form-control");
            } else {
                this.$el.removeAttr("disabled");
            }
            this.setValue(this.value);
            return this;
        }
    });

    Backbone.Form.editors.ProjectObjectID = projectObjectIDEditor;

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
        
        onSave : function(model) {
            // TODO: when saving a new project kraken should return the project role (T713)
            model.set({"_role" : "OWNER"}, {silent : true});
            // set new project as current
            this.config.set("project", model.get("id").projectId);
        },
        afterRender: function() {
            var formValues = this.formContent.getValue();
            // check connection immediately after rending (only if the form value dbUrl exists)
            if (formValues.dbUrl) {
                this.formContent.fields.dbCheckConnection.editor.checkConnection();
            }
        }
    });

    return View;
}));
