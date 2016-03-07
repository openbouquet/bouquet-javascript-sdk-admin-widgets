(function (root, factory) {
    root.squid_api.view.MetricSelectorView = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_metric_selector_widget);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.MetricCollectionWidget.extend({
        template : null,
        chosen : "chosenMetrics",
        selected : "selectedMetrics",
        configurationEnabled : null,
        onChangeHandler : null,
        filterBy : null,
        buttonText : null,

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
                if (options.metricIndex !== null) {
                    this.metricIndex = options.metricIndex;
                }
                if (options.configurationEnabled) {
                    this.configurationEnabled = options.configurationEnabled;
                }
                if (options.filterBy) {
                    this.filterBy = options.filterBy;
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
            if (!this.config) {
                this.config = squid_api.model.config;
            }

            this.collectionManagementView = new squid_api.view.MetricColumnsManagementWidget();
            
            this.listenTo(this.config,"change:chosenMetrics", this.updateView);

            // listen for global status change
            this.listenTo(this.status,"change:status", this.enable);

            this.render();
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
                    
                    // check dynamic rules
                    if ((domain.get("dynamic") === true) || (item.get("dynamic") === false)) {
                        if (this.filterBy) {
                            if (_.contains(this.filterBy, item.get("oid"))) {
                                jsonData.options.push(option);
                            }
                        } else {
                            jsonData.options.push(option);
                        }
                    }
                }

                // Alphabetical Sorting
                jsonData.options = me.sort(jsonData.options);

                // check if empty
                if (jsonData.options.length === 0) {
                    jsonData.empty = true;
                }

                // update dropdown content
                this.$el.find("select").multiselect("dataprovider", jsonData.options);
            }
            return this;
        },

        render: function() {
            var me = this;
            var html = this.template();
            this.$el.html(html);

            // Initialize plugin
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

            if (this.afterRender) {
                this.afterRender.call(this);
            }

            // Remove Button Title Tag
            this.$el.find("button").removeAttr('title');

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
