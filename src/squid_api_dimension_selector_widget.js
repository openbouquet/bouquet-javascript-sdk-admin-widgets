(function (root, factory) {
    root.squid_api.view.DimensionSelector = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_dimension_selector_widget);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({
        template : null,
        filters: null,
        chosen : "chosenDimensions",
        selected : "selectedDimensions",
        afterRender : null,
        singleSelect : false,
        configurationEnabled : true,

        initialize: function(options) {
            var me = this;

            // setup options
            if (options.template) {
                this.template = options.template;
            } else {
                this.template = template;
            }

            if (options.filters) {
                this.filters = options.filters;
            } else {
                this.filters = squid_api.model.filters;
            }

            if (options.dimensionIdList) {
                this.dimensionIdList = options.dimensionIdList;
            }
            if (options.dimensionIndex !== null) {
                this.dimensionIndex = options.dimensionIndex;
            }
            if (this.config) {
                this.config = options.model;
            } else {
            	this.config = squid_api.model.config;
            }
            if (this.status) {
            	this.status = options.status;
            } else {
            	this.status = squid_api.model.status;
            }
            if (options.afterRender) {
                this.afterRender = options.afterRender;
            }
            if (options.singleSelect) {
                this.singleSelect = options.singleSelect;
            }
            if (! options.configurationEnabled) {
                this.configurationEnabled = options.configurationEnabled;
            }
            // listen for selection change as we use it to get dimensions
            this.listenTo(this.filters,"change:selection", this.render);

            // initilize dimension collection for management view
            this.collectionManagementView = new squid_api.view.DimensionColumnsManagementWidget();

            // listen for global status change
            this.listenTo(this.status,"change:status", this.enable);

            this.renderView();
        },

        hide: function() {
            this.$el.hide();
        },

        show: function() {
            this.$el.show();
        },

        enable: function() {
            if (this.status.get("status") == "RUNNING") {
                this.$el.find("button").prop("disabled", true);
            } else {
                this.$el.find("button").prop("disabled", false);
            }
        },

        singleMultiSwitcher: function(single) {
           if (single) {
               this.singleSelect = true;
           } else {
               this.singleSelect = false;
           }
           this.render();
        },

        render: function() {
            var isMultiple = ! this.singleSelect;
            var me = this;

            var jsonData = {"selAvailable" : true, "options" : [], "multiple" : isMultiple};

            // iterate through all filter facets
            var selection = this.filters.get("selection");
            if (selection) {
                var facets = selection.facets;
                if (facets) {
                    this.dimensions = [];
                    for (var i=0; i<facets.length; i++){
                        var facet = facets[i];
                        var isBoolean = false;
                        if (facet.dimension.type === "SEGMENTS") {
                            isBoolean = true;
                        }
                        if (facet.items) {
                            if ((facet.items.length === 1) && (facet.items[0].value === "true")) {
                                isBoolean = true;
                            }
                        }
                        // do not display boolean dimensions
                        if (!isBoolean) {
                            if (this.dimensionIdList) {
                                // insert and sort
                                var idx = this.dimensionIdList.indexOf(facet.dimension.oid);
                                if (idx >= 0) {
                                    this.dimensions[idx] = facet;
                                }
                            } else {
                                // default unordered behavior
                                this.dimensions.push(facet);
                            }
                        }
                        // avoid holes
                        if (!this.dimensions[i]) {
                            this.dimensions[i] = null;
                        }
                    }
                    var noneSelected = true;
                    var dimIdx;
                    for (dimIdx=0; dimIdx<this.dimensions.length; dimIdx++) {
                        var facet1 = this.dimensions[dimIdx];
                        if (facet1) {
                            // check if selected
                            var selected = this.isChosen(facet1);
                            if (selected === true) {
                                noneSelected = false;
                            }
                            // add to the list
                            var name;
                            if (facet1.name) {
                                name = facet1.name;
                            } else {
                                name = facet1.dimension.name;
                            }
                            var option = {"label" : name, "value" : facet1.id, "selected" : selected, "error" : this.dimensions[dimIdx].error};
                            jsonData.options.push(option);
                        }
                    }
                }


                jsonData.options = this.sort(jsonData.options);

                // check if empty
                if (jsonData.options.length === 0) {
                    jsonData.empty = true;
                }

                this.renderView(jsonData);

                // error tooltips
                for (var i2=0; i2<jsonData.options.length; i2++) {
                    var facet2 = jsonData.options[i2];
                    if (facet2.error) {
                        var input = this.$el.find(".squid-api-data-widgets-dimension-selector li:nth-child("+(i2+1)+") label");
                        input.tooltip({"title" : "Facet computation failed"});
                    }
                }

                // Remove Button Title Tag
                this.$el.find("button").removeAttr('title');

                if (this.afterRender) {
                    this.afterRender.call(this);
                }
            }
        },

        renderView: function(jsonData) {
            var me = this;
            var html = this.template(jsonData);
            this.$el.html(html);

            // Initialize plugin
            if (! this.singleSelect) {
                this.$el.find("select").multiselect({
                    buttonContainer: '<div class="squid-api-data-widgets-dimension-selector" />',
                    buttonText: function() {
                        return 'Dimensions';
                    },
                    buttonClass: "form-control",
                    onDropdownShown: function() {
                        if (me.configurationEnabled) {
                            me.showConfiguration();
                        }
                    }
                });
            }

            return this;
        },

        events: squid_api.view.CollectionSelectorUtils.events,

        showConfiguration: squid_api.view.CollectionSelectorUtils.showConfiguration,

        sort: squid_api.view.CollectionSelectorUtils.sort,

        isChosen : function(facet) {
            var selected = false;

            var dimensions = this.config.get("chosenDimensions");

            if (dimensions) {
                for (var j=0; j<dimensions.length; j++) {
                    if (facet.id === dimensions[j]) {
                        selected = true;
                    }
                }
            }
            return selected;
        }

    });

    return View;
}));
