(function (root, factory) {
    root.squid_api.view.BaseCollectionManagementWidget = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_base_collection_management_widget);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({
        template : template,
        collection : null,
        selectedModel : null,
        config : null,
        type : null,
        typeLabel : null,
        typeLabelPlural : null,
        configSelectedId : null,
        comparator : null,
        parentType : null,
        modelView : null,
        cancelCallback : null,
        collectionLoading : false,
        afterRender : null,

        initialize: function(options) {
            this.config = squid_api.model.config;
            this.status = squid_api.model.status;
            var me = this;

            if (options) {
                if (options.type) {
                    this.type = options.type;
                }
                if (options.comparator) {
                    this.comparator = options.comparator;
                } else {
                    // default sorting
                    this.comparator =  squid_api.utils.defaultComparator;
                }
                if (options.cancelCallback) {
                    this.cancelCallback = options.cancelCallback;
                }
                if (options.onSelect) {
                    this.onSelect = options.onSelect;
                }
                if (options.afterRender) {
                    this.afterRender = options.afterRender;
                }
                if (options.template) {
                    this.template = options.template;
                }
            }

            this.init(options);

            this.initModel(this.config, true, false);
            // listen for config change
            this.listenTo(this.config,"change", function () {
                var parentChanged = this.config.hasChanged(me.configParentId);
                var selectionChanged = this.config.hasChanged(me.configSelectedId);
                this.initModel(this.config, parentChanged, selectionChanged);
            });

            //this.render();
        },

        /**
         * Init the Model : selectedModel, collection and listeners
         */
        initModel : function(config, loadParent, loadSelection) {
            var me = this;
            var selectedId = config.get(me.configSelectedId);

            if (me.configParentId) {
                if (loadParent) {
                    // parent has changed
                    var parentId = config.get(me.configParentId);
                    me.render();
                    if (parentId) {
                        // set the collection to listen to
                        if (me.collection) {
                            me.stopListening(me.collection);
                        }
                        me.collectionLoading = true;
                        me.loadCollection(parentId).done(function(collection) {
                            me.collection = collection;
                            me.listenTo(me.collection, "sync remove add", me.render);
                            me.collectionLoading = false;
                            if (loadSelection) {
                                // selected also changed
                                me.setSelectedModel(selectedId);
                            } else {
                                me.render();
                            }
                        }).fail(function() {
                            me.collection = null;
                            me.collectionLoading = false;
                            me.setSelectedModel(null);
                        });
                    }
                } else if (loadSelection) {
                    // selection only has changed
                    me.setSelectedModel(selectedId);
                }
            } else if (loadSelection) {
                // no parent but selection has changed
                me.collectionLoading = true;
                me.render();
                // set collection
                if (me.collection) {
                    me.stopListening(me.collection);
                }
                me.loadCollection(null).done(function(collection) {
                    me.collection = collection;
                    // listen to collection fetch or removed element
                    me.listenTo(me.collection, "sync remove add", me.render);
                    me.collectionLoading = false;
                    me.setSelectedModel(selectedId);
                }).fail(function() {
                    me.collection = null;
                    me.collectionLoading = false;
                    me.render();
                });
            }
        },

        /**
         * Set the selectedModel attribute.
         * Loads the corresponding Model object and listen for its changes.
         */
        setSelectedModel : function(modelId) {
            var me = this;
            if (this.selectedModel) {
                this.stopListening(me.selectedModel);
            }
            if (me.collection && modelId) {
                me.collection.load(modelId).done(function(model) {
                    me.selectedModel = model;
                    me.render();
                    me.listenTo(me.selectedModel, "change", me.render);
                }).fail(function() {
                    me.render();
                });
            } else {
                me.selectedModel = null;
                me.render();
            }
        },

        init: function(options) {
            // may be overridden
        },

        /**
         * Load main collection
         * @return Promise
         */
        loadCollection : function() {
            console.error("loadCollection must be overridden");
        },

        alphaNameComparator : function(a,b) {
            var va;
            var vb;
            if (a.name && b.name) {
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
            } else if (a.label && b.label) {
                va = a.label.toLowerCase();
                vb = b.label.toLowerCase();
            }
            if (va < vb) {
                return -1;
            }
            if (va > vb) {
                return 1;
            }
            return 0;
        },

        dynamicComparator : function(a,b) {
            var da = a.dynamic;
            var db = b.dynamic;
            return (da === db) ? 0 : da ? 1 : -1;
        },

        getSelectedModel : function(event) {
            var id = $(event.target).parents('tr').data("attr");
            var model = this.collection.get(id);
            return model;
        },

        eventSelect :  function(event) {
            var model = this.getSelectedModel(event);
            this.config.set(this.configSelectedId, model.get("oid"));
            if (this.onSelect) {
                this.onSelect.call();
            }
        },

        eventCreate : function() {
            var me = this;
            // create a new model
            var model = new this.collection.model();
            model.set("id", this.collection.parent.get("id"));
            
            this.renderModelView(new this.modelView({
                model : model,
                cancelCallback : function() {
                    me.render();
                },
                onSave : function(model) {
                    me.collection.add(model);
                    // call any super onSave
                    me.modelView.prototype.onSave.call(me, model);
                    me.render();
                }
            }));
        },

        eventRefresh : function(event) {
            var me = this;
            var model = this.getSelectedModel(event);
            var objectType = model.get("objectType");
            var url = squid_api.apiURL + "/projects/" + model.get("id").projectId;
            if (objectType === "Project") {
                url = url + "/refreshDatabase";
            } else if (objectType === "Domain") {
                url = url + "/domains/" + model.get("id").domainId + "/cache/refresh";
            }
            url = url + "?access_token=" + squid_api.model.login.get("accessToken");
            if (model) {
                var request = $.ajax({
                    type: "GET",
                    url: url,
                    dataType: 'json',
                    contentType: 'application/json'
                });
                request.done(function () {
                    squid_api.model.status.set("message", objectType + " successfully refreshed");
                });
                request.fail(function () {
                    squid_api.model.status.set("message", objectType + " refresh failed");
                    squid_api.model.status.set("error", "error");
                });
            }
        },

        eventEdit : function(event) {
            var me = this;
            var model = this.getSelectedModel(event);
            // listen for model changes (TODO check this code)
            if (model) {
                me.listenTo(model, "change", function() {
                    me.render();
                });
                this.renderModelView(new this.modelView({
                    model : model,
                    cancelCallback : function() {
                        me.render();
                    }
                }));
            }
        },

        eventDelete : function(event) {
            var me = this;
            var model = this.getSelectedModel(event);
            if (model) {
                if (confirm("are you sure you want to delete the " + model.definition.toLowerCase() + " '" + model.get("name") + "'?")) {
                    if (true) {
                        model.destroy({
                            wait : true,
                            success:function(model) {
                                // set status
                                var name = model.get("name");
                                var reference = model.get("oid");
                                if (name) {
                                    reference = name;
                                }
                                var message = model.get("objectType") + " '" + reference + "' has been successfully deleted";
                                me.status.set({'message' : message});

                                // call once saved
                                if (me.onDelete) {
                                    me.onDelete(model);
                                }
                            },
                            error : function(collection, response) {
                                me.status.set({'error' : response});
                            }
                        });
                    }
                }
            }
        },

        eventMouseEnter : function(event) {
            // hide all (as sometimes when moving fast, some may still be visible)
            var elements = [$(event.target).parent('tr').find(".collection-option i"), $(event.target).parent('tr').find(".collection-option svg")];
            for (i=0; i<elements.length; i++) {
                elements[i].show();
            }
        },

        eventMouseLeave : function(event) {
            var elements = [$(event.target).parent('tr').parent().find(".collection-option i"), $(event.target).parent('tr').parent().find(".collection-option svg")];
            for (i=0; i<elements.length; i++) {
                elements[i].hide();
            }
        },

        events: {
            'mouseenter tr': function(event) {
                this.eventMouseEnter(event);
            },
            'mouseleave tr': function(event) {
                this.eventMouseLeave(event);
            },
            'input .search' : function(event) {
                this.eventSearch(event);
            },
            "click .create" : function(event) {
                this.eventCreate(event);
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

        eventSearch: function(event) {
            // obtain search box text
            var text = $(event.currentTarget).val();
            // filter collection
            var filteredCollection = this.filterCollection(text);
            // update list
            var listHtml = $(this.template(filteredCollection)).find(".list").html();
            this.$el.find(".list").html(listHtml);
        },

        filterCollection: function(text) {
            if (this.jsonData.collection) {
                if (this.jsonData.collection.models) {
                    var models = this.jsonData.collection.models;
                    for (i=0; i<models.length; i++) {
                        var item = this.jsonData.collection.models[i];
                        if (item.label.toLowerCase().indexOf(text.toLowerCase()) >= 0) {
                            item.visible = true;
                        } else {
                            item.visible = false;
                        }
                        this.jsonData.collection.models[i] = item;
                    }
                }
                return this.jsonData;
            }
        },

        getCreateRole: function() {
            var role = false;
            if (this.collection) {
                if (this.collection.parent) {
                    var parentRole = this.collection.parent.get("_role");
                    // write role
                    if (parentRole === "OWNER" || parentRole === "WRITE") {
                        role = true;
                    }
                }
            }
            return role;
        },

        onDelete: function(model) {
            // to be overridden from other collection management widgets
        },

        getModelRoles: function(model) {
            var roles;
            var role = model.get("_role");
            if (!role || (role === "OWNER" || role === "WRITE")) {
                roles = {"edit" : true, "delete" : true, "refresh" : true};
            } else {
                roles = {"edit" : false, "delete" : false, "refresh" : false};
            }
            return roles;
        },

        /**
         * Method called to get displayed label for a model.
         * If null is returned, this model not be displayed.
         */
        getModelLabel: function(model) {
            var label = model.get("name");
            if (!label) {
                label = model.get("oid");
            }
            return label;
        },

        renderModelView: function(modelView) {
            this.$el.html(modelView.el);
            // focus on first element
            this.$el.find('input[type=text],textarea,select').filter(":visible:first").focus();
        },

        render: function() {
            console.log("render CollectionManagementWidget "+this.type);
            this.jsonData = {
                collectionLoaded : !this.collectionLoading,
                collection : this.collection,
                roles : null,
                createRole : null,
                typeLabel : this.typeLabel,
                typeLabelPlural : this.typeLabelPlural,
                modalHtml : true
            };
            if (this.collection) {
                var models = [];
                this.jsonData.collection = {};
                this.jsonData.createRole = this.getCreateRole();

                var selectedId = this.config.get(this.configSelectedId);

                // store model data
                for (i=0; i<this.collection.size(); i++) {
                    var item = this.collection.at(i);
                    var model = {};
                    model.label = this.getModelLabel(item);
                    if (model.label !== null) {
                        // copy model attributes
                        for (var att in item.attributes) {
                            model[att] = item.get(att);
                        }
                        model.visible = true;
                        model.roles = this.getModelRoles(item);
                        model.selected = (model.oid === selectedId);
                        models.push(model);
                    }
                }

                // sort model data
                models.sort(this.comparator);

                // store model view data
                this.jsonData.collection.models = models;

                var html = this.template(this.jsonData);
                this.$el.html(html);

                this.$el.find("input.search").focus();

                if (this.afterRender) {
                    this.afterRender.call(this);
                }
            }

            return this;
        }
    });

    return View;
}));
