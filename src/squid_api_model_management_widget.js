(function (root, factory) {
    root.squid_api.view.ModelManagementView = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_model_management_widget);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({

        successHandler: null,
        errorHandler: null,
        modalElementClassName : "squid-api-admin-widgets-modal-form",
        buttonLabel : null,

        initialize: function(options) {
            var me = this;

            // setup options
            if (options.template) {
                this.template = options.template;
            } else {
                this.template = template;
            }
            if (options.successHandler) {
                this.successHandler = options.successHandler;
            }
            if (options.errorHandler) {
                this.errorHandler = options.errorHandler;
            }
            if (options.buttonLabel) {
                this.buttonLabel = options.buttonLabel;
            }

            // Set Form Schema
            this.setSchema();
        },

        manipulateData : function(data) {
            var me = this;
            var project = squid_api.model.project.get("id");
            
            // manipuldate data before save
            if (this.model.get("id")) {
                data.id = {};
                data.id[this.model.definition.toLowerCase() + "Id"] = parseInt(this.model.get("id")[this.model.definition.toLowerCase() + "Id"]);
            } else {
                var id = data.id;
                data.id = {};
                data.id[this.model.definition.toLowerCase() + "Id"] = parseInt(id);
            }

            // add project id
            if (project) {
                if (project.projectId && me.model.definition !== "Project") {
                    data.id.projectId = project.projectId;
                }
            }

            return data;
        },

        getDbSchemas : function(collection) {
            var me = this;

            // 1. obtain schemas, set schemas for form & hide id field
            var request = $.ajax({
                type: "GET",
                url: squid_api.apiURL + "/projects/" + collection.id + "/schemas-suggestion?access_token=" + squid_api.model.login.get("accessToken"),
                dataType: 'json',
                success:function(collection) {
                    squid_api.model.status.set('message', 'please set a db schema');
                    me.schema.dbSchemas.options = collection.definitions;
                    me.renderForm();
                },
                error: function() {
                    squid_api.model.status.set('message', 'error fetching project database schemas');
                }
            });
        },

        saveForm : function(formContent) {
            var me = this;

            /*
                1. validate form (if errors, display them & keep modal open)
                2. save data
            */

            var validForm = formContent.validate();
            if (validForm) {
                me.formModal.preventClose();
            } else {
                var data = me.manipulateData(formContent.getValue());
                me.model.save(data, {
                    success: function (collection, response) {
                        var msg = response.objectType + " successfully saved with name " + response.name;
                        squid_api.model.status.set('message', msg);
                        // project exception 
                        if (me.model.definition == "Project") {
                            me.schema.id.type = "Hidden";
                            if (me.model.definition == "Project" && me.schema.dbSchemas.options.length === 0) {
                                me.getDbSchemas(collection);
                            }
                        } else {
                            if (me.successHandler) {
                                me.successHandler.call(collection);
                            } 
                        }
                    },
                    error: function (collection, response) {
                        var msg = response.objectType + " error saving with name " + response.name;
                        squid_api.model.status.set('message', msg);

                        if (me.errorHandler) {
                            me.errorHandler.call(collection);
                        }
                    }
                });
            }
        },

        renderForm : function() {
            var me = this;

            // instantiate a new backbone form with an empty model & predefined schema
            var formContent = new Backbone.Form({
                schema: me.schema,
                model: me.model
            }).render();

            // render form content
            var formView = Backbone.View.extend({
                render: function() {
                    this.$el.html(formContent.el);
                    return this;
                }
            });

            // automatically open a new bootstrap modal
            this.formModal = new Backbone.BootstrapModal({ 
                content: new formView(),
                animate: true,
            }).open();

            // modal wrapper class
            $(this.formModal.el).addClass(this.modalElementClassName);

            // modal definition class
            $(this.formModal.el).find(".modal-dialog").addClass(me.model.definition);

            // ok button click on form
            this.formModal.on('ok', function() {
                me.saveForm(formContent);
            });
        },

        events: {
            "click button" : function() {
                // visually render form
                this.renderForm();
            }
        },

        getPropertyType: function(type) {
            switch(type) {
                case "string":
                    return "Text";
                case "int32":
                    return "Number";
                case "array":
                    return "Checkboxes";
                default:
                    return "Text";
            }
        },

        setSchema: function(property) {
            var me = this;
            
            squid_api.getSchema().done(function(data) {
                var schema = {};
                var modelData = {};
                var definition = data.definitions[me.model.definition];
                var properties = definition.properties;

                // replace properties with non ignored properties
                if (me.model.ignoredAttributes) {
                    var ignoredAttributes = me.model.ignoredAttributes;
                    var updatedProperties = {};
                    for (var ix in properties) {
                        var count = 0;
                        for (i=0; i<ignoredAttributes.length; i++) {
                            if (ignoredAttributes[i] == ix) {
                                count++;
                            }
                        }
                        if (count === 0) {
                            updatedProperties[ix] = properties[ix];
                        }
                    }
                    properties = updatedProperties;
                }

                // create schema
                for (var property in properties) {
                    if (properties[property].readOnly !== true) {
                        schema[property] = {};
                        if (properties[property].items && properties[property].items.$ref) {
                            var nestedModel = {};
                            // obtain reference values
                            var refValue = properties[property].items.$ref;
                            var ref = properties[property].items.$ref.substr(refValue.lastIndexOf("/") + 1);
                            var subProp = data.definitions[ref].properties;

                            // apply sub-properties (if exist)
                            for (var subProperty in subProp) {
                                nestedModel[subProperty] = {};
                                if (subProp[subProperty].enum) {
                                    nestedModel[subProperty].type = "Text";
                                    nestedModel[subProperty].options = subProp[subProperty].enum;
                                } else {
                                    nestedModel[subProperty].type = me.getPropertyType(subProp[subProperty].type);
                                }
                                nestedModel[subProperty].editorClass = "form-control";
                                nestedModel[subProperty].disabled = true;
                            }
                            
                            schema[property].type = "List";
                            schema[property].itemType = "Object";
                            schema[property].subSchema = nestedModel;
                        } else {
                            type = me.getPropertyType(properties[property].type);
                            schema[property].type = type;
                        }

                        // if select
                        if (schema[property].type == "Checkboxes") {
                            schema[property].options = [];
                        } else {
                            schema[property].editorClass = "form-control";
                        }
                    }
                }

                // validation
                var required;
                if (data.definitions[me.model.definition].required) {
                    required = data.definitions[me.model.definition].required;
                }
                for (i=0; i<required.length; i++) {
                    schema[required[i]].validators = ['required'];
                }

                // set schema
                me.schema = schema;

                // Render View
                me.render();
            });
        },

        render: function(currentView) {
            var me = this;
            var jsonData = {"view" : "squid-api-admin-widgets-" + me.model.definition, "definition" : me.model.definition, "buttonLabel" : me.buttonLabel};

            // Print Template
            this.$el.html(this.template(jsonData));
        }
    });

    return View;
}));
