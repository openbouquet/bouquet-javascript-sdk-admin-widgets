(function (root, factory) {
    root.squid_api.view.BaseModelManagementWidget = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_base_model_management_widget);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({

        model : null,
        collectionPluralLabel : null,
        onFormContentsChange: null,
        afterRenderCallback: null,
        externalCollection: null,

        initialize: function(options) {
            this.status = squid_api.model.status;
            this.config = squid_api.model.config;

            if (options.model) {
                this.model = options.model;
            }
            // setup options
            if (options.template) {
                this.template = options.template;
            } else {
                this.template = template;
            }
            if (options.cancelCallback) {
                this.cancelCallback = options.cancelCallback;
            }
            if (options.onSave) {
                this.onSave = options.onSave;
            }
            if (options.openModelCallback) {
                this.openModelCallback = options.openModelCallback;
            }
            if (options.afterRenderCallback) {
                this.afterRenderCallback = options.afterRenderCallback;
            }
            if (options.onFormContentsChange) {
                this.onFormContentsChange = options.onFormContentsChange;
            }
            if (options.externalCollection) {
                this.externalCollection = options.externalCollection;
            }
            if (options.comparator) {
                this.comparator = options.comparator;
            } else {
                // default is : sort by alpha name and dynamic last
                this.comparator =  squid_api.utils.defaultComparator;
            }
            this.render();
        },

        dataManipulation: function(data) {
            for (var x in data) {
                if (typeof(data[x]) == "object") {
                    for (var y in data[x]) {
                        if (data[x][y] !== null) {
                            if (!data[x][y] || (data[x][y].length === 0)) {
                                data[x][y] = null;
                            }
                        }
                    }
                } else if (!data[x] || (data[x].length === 0)) {
                    data[x] = null;
                }
            }
            return data;
        },

        customDataManipulation: function(data) {
            return data;
        },

        events: {
            "click .open-model": function() {
                if (this.openModelCallback) {
                    this.openModelCallback(this);
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
                    
                    var isNewModel = this.model.isNew();
                    
                    // prevent from saving children collections
                    var modelClone = this.model.clone();
                    var children = this.model.get("_children");
                    if (children) {
                        for (var i=0; i<children.length; i++) {
                            modelClone.set(children[i], []);
                        }
                    }

                    // save model
                    modelClone.save(data, {
                        wait: true,
                        success: function() {
                            // update the original model with non-children attributes
                            var excluded = children;
                            var attributes = modelClone.attributes;
                            for (var att in attributes) {
                                if (!excluded || (excluded.indexOf(att)<0)) {
                                    me.model.set(att, modelClone.get(att));
                                }
                            }
                            
                            // status update
                            if (me.cancelCallback) {
                                me.cancelCallback.call();
                            }

                            // allow an externalCollection to be updated
                            if (me.externalCollection) {
                                if (isNewModel) {
                                    me.externalCollection.collection.add(me.model);
                                    me.externalCollection.collection.trigger('add');
                                } else {
                                    me.externalCollection.collection.set(me.model,{remove: false});
                                    me.externalCollection.collection.trigger('sync');
                                }
                            }

                            // call once saved
                            if (me.onSave) {
                                me.onSave(me.model);
                            }

                            me.status.set("message", "Sucessfully saved");
                        },
                        error: function(xhr) {
                            me.status.set("error", xhr);
                        }
                    });
                }
            },
            "click .btn-cancel-form": function() {
                this.formContent.render();
                this.$el.find(".modal-body").html(this.formContent.el);
                // reset parent view if cancel button clicked
                if (this.cancelCallback) {
                    this.cancelCallback.call();
                }
            },
            "click .copy-id": function() {
                var clipboard = new Clipboard(".copy-id");
                clipboard.on('success', function(e) {
                    squid_api.model.status.set("message", e.text + " has been copied to the clipboard");
                });
            }
        },

        onSave: function(model) {
            // to be overridden from other model management widgets
        },

        formEvents: function() {
            // to be overridden from other model management widgets
        },

        setSchema: function() {
            var dfd = $.Deferred();
            // to be overridden from other model management widgets
            return dfd.resolve(this.schema);
        },

        removeView: function() {
            // Unbind view completely
            this.undelegateEvents();
            this.$el.removeData().unbind();
        },

        afterRender: function() {
            // to be overridden from other model management widgets
        },

        beforeRender: function() {
            // to be overridden from other model management widgets
        },

        render: function() {
            var me = this;
            var jsonData = {modelDefinition : "unknown"};

            // add type to view data
            if (this.model.definition) {
                jsonData.modelDefinition = this.model.definition.toLowerCase();
            }

            if (this.model.isNew()) {
                jsonData.headerLabel = "Creating a new " + this.model.definition.toLowerCase();
            } else {
                jsonData.headerLabel = "Editing " + this.model.definition.toLowerCase() + " " +this.model.get("name");
            }

            jsonData.footerLabel = "<div class='object-id'><label>Object ID</label> <br /> <input data-clipboard-text='" + this.model.get("oid") + "' class='copy-id' value='" + this.model.get("oid") + "' /></div>";

            this.setSchema().then(function(schema) {
                me.beforeRender();

                // create form
                me.formContent = new Backbone.Form({
                    schema: schema,
                    model: me.model
                }).render();

                // append save buttons
                me.$el.html(me.template(jsonData));

                // expression editor to be updated
                // me.originalFormContent = me.formContent.getValue();

                me.formContent.on("change", function() {

                    if (me.onFormContentsChange) {
                        me.onFormContentsChange.call(me);
                    }

                    // if (me.formContent.getValue() !== me.originalFormContent) {
                    //     saveBtn.fadeIn();
                    // } else {
                    //     saveBtn.fadeOut();
                    // }
                });

                // place the form into a backbone view
                me.$el.find(".modal-body").html(me.formContent.el);

                // form events
                me.formEvents();

                // after render handler
                me.afterRender();

                if (me.afterRenderCallback) {
                    me.afterRenderCallback(me);
                }

                if (me.model.isNew()) {
                    me.$el.find(".object-id").hide();
                }
            });

            return this;
        }

    });

    return View;
}));
