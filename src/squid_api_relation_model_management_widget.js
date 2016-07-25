(function (root, factory) {
    root.squid_api.view.RelationModelManagementWidget = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_base_model_management_widget);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.BaseModelManagementWidget.extend({

        model : null,
        collectionPluralLabel : null,

        dataManipulation: function(data) {
            for (var x in data) {
                if (typeof(data[x]) == "object") {
                    for (var y in data[x]) {
                        if (data[x][y] !== null) {
                            if (data[x][y].length === 0) {
                                data[x][y] = null;
                            }
                        }
                    }
                } else if (data[x].length === 0) {
                    data[x] = null;
                }
            }

            data = this.cardinalityManipulate(data);

            return data;
        },

        beforeRender: function() {
            var leftCardinality = this.model.get("leftCardinality");
            var rightCardinality = this.model.get("rightCardinality");

            if (leftCardinality === "MANY" && rightCardinality === "ZERO_OR_ONE") {
                this.model.set("cardinality", "many to zero or one");
            }
            if (leftCardinality === "ZERO_OR_ONE" && rightCardinality === "MANY") {
                this.model.set("cardinality", "zero or one to many");
            }
            if (leftCardinality === "ONE" && rightCardinality === "ONE") {
                this.model.set("cardinality", "one to one");
            }
            if (leftCardinality === "ONE" && rightCardinality === "MANY") {
                this.model.set("cardinality", "one to many");
            }
            if (leftCardinality === "MANY" && rightCardinality === "ONE") {
                this.model.set("cardinality", "many to one");
            }
            if (leftCardinality === "ZERO_OR_ONE" && rightCardinality === "ONE") {
                this.model.set("cardinality", "zero or one to one");
            }
            if (leftCardinality === "ONE" && rightCardinality === "ZERO_OR_ONE") {
                this.model.set("cardinality", "one to zero or one");
            }
        },

        afterRender: function() {
            var currentDomain = this.config.get("domain");
            if (this.formContent.getValue("rightId").domainId === currentDomain) {
                this.formContent.fields.leftId.$el.show();
                this.formContent.fields.rightId.$el.hide();
            } else {
                this.formContent.fields.leftId.$el.hide();
            }
        },

        cardinalityManipulate: function(data) {
            var cardinality = data.cardinality;
            if (cardinality === "many to zero or one") {
                data.leftCardinality = "MANY";
                data.rightCardinality = "ZERO_OR_ONE";
            }
            if (cardinality === "zero or one to many") {
                data.leftCardinality = "ZERO_OR_ONE";
                data.rightCardinality = "MANY";
            }
            if (cardinality === "one to one") {
                data.leftCardinality = "ONE";
                data.rightCardinality = "ONE";
            }
            if (cardinality === "one to many") {
                data.leftCardinality = "ONE";
                data.rightCardinality = "MANY";
            }
            if (cardinality === "many to one") {
                data.leftCardinality = "MANY";
                data.rightCardinality = "ONE";
            }
            if (cardinality === "zero or one to one") {
                data.leftCardinality = "ZERO_OR_ONE";
                data.rightCardinality = "ONE";
            }
            if (cardinality === "one to zero or one") {
                data.leftCardinality = "ONE";
                data.rightCardinality = "ZERO_OR_ONE";
            }
            delete data.cardinality;
            return data;
        },

        customDataManipulation: function(data) {
            return data;
        },

        events: {
            "click .btn-cancel": function() {
                // reset parent view if cancel button clicked
                if (this.cancelCallback) {
                    this.cancelCallback.call();
                }
            },
            "click .btn-save-form" : function() {
                var me = this;
                var error = this.formContent.validate();
                if (! error) {
                    // global data manipulation
                    var data = this.dataManipulation(this.formContent.getValue());

                    // for any custom model manipulation before save
                    data = this.customDataManipulation(data);

                    // save model
                    this.model.save(data, {
                        wait: true,
                        success: function(model) {
                            // status update
                            if (me.cancelCallback) {
                                me.cancelCallback.call();
                            }
                            // call once saved
                            if (me.onSave) {
                                me.onSave(model);
                            }
                            me.status.set("message", "Sucessfully saved");
                        },
                        error: function(xhr) {
                            me.status.set("error", xhr);
                        }
                    });

                }
            },
            "mouseover .rightId select" : function(e) {
                this.updateDomains(e);
            },
            "mouseover .leftId select" : function(e) {
                this.updateDomains(e);
            }
        },

        updateDomains: function(e) {
            if ($(e.currentTarget).find("option").length === 1) {
                var optionsAsString = "";
                for(var i=0; i<this.domainList.length; i++) {
                    if (this.domainList[i].val !== $(e.currentTarget).val()) {
                        optionsAsString += "<option value='" + this.domainList[i].val + "'>" + this.domainList[i].label + "</option>";
                    } 
                }
                $(e.currentTarget).append(optionsAsString);
            }
        },

        onSave: function(model) {
            // reload filters
            this.config.trigger("change:selection");
        },
        formEvents: function() {
            var me = this;

            // set base values
            if (this.model.isNew()) {
                // automatically populate leftId
                this.formContent.fields.leftId.setValue({
                    "projectId": this.config.get("project"),
                    "domainId": this.config.get("domain")
                });
                // automatically populate rightId
                this.formContent.fields.rightId.setValue({
                    "projectId": this.config.get("project"),
                    "domainId" : this.formContent.fields.rightId.schema.subSchema.domainId.options[0].val
                });
                // auto select default form fields
                this.formContent.fields.leftName.setValue(this.formContent.fields.leftId.getValue().domainId);
                this.formContent.fields.rightName.setValue(this.formContent.fields.rightId.getValue().domainId);
                this.formContent.fields.cardinality.setValue(this.formContent.fields.cardinality.schema.options[0]);
            }

            // additional events
            this.formContent.on('leftId:change', function(form) {
                var rightText = form.$el.find(".leftId").find("select option:selected").text();
                form.$el.find(".leftName input").val(rightText);
            });
            this.formContent.on('rightId:change', function(form) {
                var rightText = form.$el.find(".rightId").find("select option:selected").text();
                form.$el.find(".rightName input").val(rightText);
            });
            this.formContent.on('leftCardinality:change', function(form) {
                if (form.fields.leftCardinality.getValue() == "MANY" && form.fields.rightCardinality.getValue() == "MANY") {
                    form.fields.leftCardinality.setValue("ZERO_OR_ONE");
                    squid_api.model.status.set("message", "cannot set the cardinality many to many");
                }
            });
            this.formContent.on('rightCardinality:change', function(form) {
                if (form.fields.leftCardinality.getValue() == "MANY" && form.fields.rightCardinality.getValue() == "MANY") {
                    form.fields.rightCardinality.setValue("ZERO_OR_ONE");
                    squid_api.model.status.set("message", "cannot set the cardinality many to many");
                }
            });
        },

        setSchema: function() {
            var dfd = $.Deferred();
            var schema = this.model.schema;
            var me = this;
            var project = this.model.get("id").projectId;
            squid_api.getCustomer().then(function(customer) {
                customer.get("projects").load(project).then(function(project) {
                    project.get("domains").load().then(function(domains) {
                        var domainList = [];

                        var currentLeftDomain = [];
                        var currentRightDomain = [];

                        for (i=0; i<domains.size(); i++) {
                            var domain = domains.at(i);

                            obj = {};
                            obj.val = domain.get("oid");
                            obj.label = domain.get("name");

                            // push for widget scope array
                            domainList.push(obj);

                            // current domains
                            if (me.model.get("leftId")) {
                                if (domain.get("oid") === me.model.get("leftId").domainId) {
                                    currentLeftDomain.push(obj);
                                }

                            }
                            if (me.model.get("rightId")) {
                                if (domain.get("oid") === me.model.get("rightId").domainId) {
                                    currentRightDomain.push(obj);
                                }
                            }  
                        } 

                        schema.leftId.subSchema.domainId.options = currentLeftDomain;
                        schema.rightId.subSchema.domainId.options = currentRightDomain;
                        me.domainList = domainList.sort(me.comparator);

                        dfd.resolve(schema);
                    });
                });
            });
            return dfd;
        }
    });

    return View;
}));
