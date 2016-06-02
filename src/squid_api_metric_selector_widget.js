(function (root, factory) {
    root.squid_api.view.MetricSelectorView = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_metric_selector_widget);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.MetricCollectionWidget.extend({
        template : null,
        available : null,
        chosen : "chosenMetrics",
        selected : "selectedMetrics",
        configurationEnabled : null,
        onChangeHandler : null,
        filterBy : null,
        buttonText : null,
        customView : null,

        init: function(options) {

            // setup options
            if (options) {
                if (options.template) {
                    this.template = options.template;
                } else {
                    this.template = template;
                }
                if (options.metricIdList) {
                    this.metricIdList = options.metricIdList;
                }
                if (options.chosen) {
                    this.chosen = options.chosen;
                }
                if (options.available) {
                    this.available = options.available;
                }
                if (options.metricIndex !== null) {
                    this.metricIndex = options.metricIndex;
                }
                if (options.configurationEnabled) {
                    this.configurationEnabled = options.configurationEnabled;
                }
                if (options.filterBy) {
                    this.filterBy = options.filterBy;
                }
                if (options.customView) {
                    this.customView = options.customView;
                }
                if (options.buttonText) {
                    this.buttonText = options.buttonText;
                }
                if (options.onChangeHandler) {
                    this.onChangeHandler = options.onChangeHandler;
                }
            } else {
                this.template = template;
            }

            // setup the models
            if (this.model) {
                this.config = this.model;
            } else {
                this.config = squid_api.model.config;
            }

            this.collectionManagementView = new squid_api.view.MetricColumnsManagementWidget();

            this.listenTo(this.config,"change:"+this.chosen, this.updateView);

            // listen for global status change
            this.listenTo(this.status,"change:status", this.enable);

            this.renderBase();
        },

        applyUserAttention: function() {
            if (this.userAttention) {
                this.$el.find("button").addClass("user-attention");
            } else {
                this.$el.find("button").removeClass("user-attention");
            }
        },

        activateUserAttention: function() {
            this.userAttention = true;
            this.applyUserAttention();
        },

        removeUserAttention: function() {
            this.userAttention = false;
            this.applyUserAttention();
        },

        enable: function() {
            if (this.status.get("status") !== "DONE") {
                this.$el.find("button").prop("disabled", true);
            } else {
                this.$el.find("button").prop("disabled", false);
            }
        },

        updateView: function() {
            var me = this, isMultiple = true;
            var jsonData = {"selAvailable" : true, "options" : [], "multiple" : isMultiple};

            if (this.collection) {

                // iterate through all domains items
                var items = this.collection;
                var domain = this.collection.parent;
                var noneSelected = true;
                for (var idx=0; idx<items.models.length; idx++) {
                    var item = items.models[idx];

                    // check dynamic rules
                    var add = false;
                    if ((domain.get("dynamic") === true) || (item.get("dynamic") === false)) {
                        if (this.filterBy) {
                            if (_.contains(this.filterBy, item.get("oid"))) {
                                add = true;
                            }
                        } else {
                            add = true;
                        }
                    }

                    if ((add === true) && (this.available || this.chosen)) {
                        // check this metric is available (or chosen)
                        var availableArray = this.config.get(this.available);
                        var chosenArray = this.config.get(this.chosen);
                        if ((availableArray && availableArray.indexOf(item.get("oid")) < 0) && (chosenArray && chosenArray.indexOf(item.get("oid")) < 0)) {
                            add = false;
                        }
                    }

                    if (add === true) {
                        // check if selected
                        var selected = me.isChosen(item);
                        if (selected === true) {
                            noneSelected = false;
                        }
                        var option = {
                                "label" : item.get("name"),
                                "value" : item.get("oid"),
                                "selected" : selected
                        };
                        jsonData.options.push(option);
                    }
                }

                // Alphabetical Sorting
                jsonData.options = me.sort(jsonData.options);

                // check if empty
                if (jsonData.options.length === 0) {
                    jsonData.empty = true;
                }

                if (this.customView) {
                    this.renderBase(jsonData.options);
                } else {
                    // update dropdown content
                    this.$el.find("select").multiselect("dataprovider", jsonData.options);
                    this.$el.find("select").multiselect("rebuild");
                    if (this.configurationEnabled) {
                        this.showConfiguration();
                    }
                }
                this.applyUserAttention();
            }
            return this;
        },

        renderBase: function(data) {
            if (this.$el.find("select").length === 0) {
                var html = this.template({options : data});
                this.$el.html(html);
                if (this.afterRender) {
                    this.afterRender.call(this);

                    // re-delegate events if external widget is used in callback
                    this.delegateEvents();
                }
            } else {
                this.$el.find("select").multiselect("dataprovider", data);
                this.$el.find("select").multiselect("rebuild");
            }
        },

        render: function() {
            var me = this;

            // Initialize plugin
            if (! this.customView) {
                this.$el.find("select").multiselect({
                    "buttonContainer": '<div class="squid-api-data-widgets-metric-selector-open" />',
                    "buttonText": function() {
                        var label = "Metrics";
                        if (me.buttonText) {
                            label = me.buttonText;
                        }
                        return label;
                    },
                    enableHTML: true,
                    "onDropdownShown": function() {
                        if (me.configurationEnabled) {
                            me.showConfiguration();
                        }
                    }
                });

                // Remove Button Title Tag
                this.$el.find("button").removeAttr('title');
            }

            // update view data if render is called after the metric change event
            this.updateView();
        },

        events: squid_api.view.CollectionSelectorUtils.events,

        showConfiguration: squid_api.view.CollectionSelectorUtils.showConfiguration,

        sort: squid_api.view.CollectionSelectorUtils.sort,

        isChosen : squid_api.view.CollectionSelectorUtils.isChosen

    });

    return View;
}));
