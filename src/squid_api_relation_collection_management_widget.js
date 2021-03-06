(function (root, factory) {
    root.squid_api.view.RelationCollectionManagementWidget = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_relation_collection_management_widget);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.BaseCollectionManagementWidget.extend({
        type : "Relation",
        typeLabel : "Relation",
        typeLabelPlural : "Relations",
        modelView : null,
        template: template,
        configParentId : "domain",

        init: function(options) {
            var me = this;

            this.modelView = squid_api.view.RelationModelManagementWidget;

            // init the relations collection
            var projectId = this.config.get("project");
            if (projectId) {
                this.modelValue = options.modelValue;

                this.loadCollection(options.modelValue).done(function(collection) {
                    me.collection = collection;
                    me.render();
                }).fail(function() {
                    me.render();
                });
            } else {
                // listen for config change
                this.listenTo(this.config,"change", function () {
                    var parentChanged = this.config.hasChanged(me.configParentId);
                    var selectionChanged = this.config.hasChanged(me.configSelectedId) || (this.config.get(me.configSelectedId) && ! this.selectedModel);
                    this.initModel(this.config, parentChanged, selectionChanged);
                    if (this.config.hasChanged("domain")) {
                        me.modelValue = this.config.get("domain");
                    }
                });
            }
        },

        loadCollection : function(parentId) {
            var me = this;
            var project = this.config.get("project");

            if (project) {
                // load the project's relations
                return squid_api.getCustomer().then(function(customer) {
                    return customer.get("projects").load(me.config.get("project")).then(function(project) {
                        return project.get(me.typeLabelPlural.toLowerCase()).load();
                    });
                });
            }
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
            },
            "click .cancel": function() {
                // reset parent view if cancel button clicked
                if (this.cancelCallback) {
                    this.cancelCallback.call();
                }
            }
        },

        viewData: function() {
            var filteredModels = [];
            for (i=0; i<this.collection.size(); i++) {
                if (this.collection.at(i).get("leftId") && this.collection.at(i).get("rightId")) {
                    var collection = this.collection.at(i);
                    if (this.collection.at(i).get("rightId").domainId == this.modelValue) {
                        collection.set("isRight", true);
                    }
                    if (this.collection.at(i).get("leftId").domainId == this.modelValue || this.collection.at(i).get("rightId").domainId == this.modelValue) {
                        filteredModels.push(collection);
                    }
                }
            }
            var models = [];
            for (ix=0; ix<filteredModels.length; ix++) {
                var obj = {};
                obj.oid = filteredModels[ix].get("oid");
                obj.leftName = filteredModels[ix].get("leftName");
                obj.rightName = filteredModels[ix].get("rightName");
                obj.roles = this.getModelRoles(filteredModels[ix]);
                obj.isRight = filteredModels[ix].get("isRight");

                // set cardinality booleans for handlebar display
                var leftCardinality = filteredModels[ix].get("leftCardinality");
                var rightCardinality = filteredModels[ix].get("rightCardinality");
                if (leftCardinality == "MANY") {
                    obj.leftMany = true;
                } else if (leftCardinality == "ZERO_OR_ONE") {
                    obj.leftZeroOrOne = true;
                } else if (leftCardinality == "ONE") {
                    obj.leftOne = true;
                }
                if (rightCardinality == "MANY") {
                    obj.rightMany = true;
                } else if (rightCardinality == "ZERO_OR_ONE") {
                    obj.rightZeroOrOne = true;
                } else if (rightCardinality == "ONE") {
                    obj.rightOne = true;
                }
                models.push(obj);
            }

            return models;
        },

        render: function() {
            // store models
            if (this.collection) {
                var jsonData = {
                    models : this.viewData(),
                    createRole : this.getCreateRole(),
                    roles : null,
                    typeLabelPlural : this.typeLabelPlural,
                    type : this.type,
                    modalHtml : true
                };

                // print template
                var html = this.template(jsonData);
                this.$el.html(html);
            }
        }
    });

    return View;
}));
