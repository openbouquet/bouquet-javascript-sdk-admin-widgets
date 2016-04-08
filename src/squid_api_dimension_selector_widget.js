(function (root, factory) {
    root.squid_api.view.DimensionSelector = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_dimension_selector_widget);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({
        template : null,
        filters: null,
        available : null,
        chosen : "chosenDimensions",
        selected : "selectedDimensions",
        afterRender : null,
        singleSelect : false,
        singleSelectIndex : 0,
        configurationEnabled : false,
        updateMultiQuantity : null,


        initialize: function(options) {
            var me = this;

            // setup options
            if (options) {
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
                if (options.chosen) {
                    this.chosen = options.chosen;
                }
                if (options.available) {
                    this.available = options.available;
                }
                if (options.dimensionIdList) {
                    this.dimensionIdList = options.dimensionIdList;
                }
                if (options.dimensionIndex !== null) {
                    this.dimensionIndex = options.dimensionIndex;
                }
                if (options.afterRender) {
                    this.afterRender = options.afterRender;
                }
                if (options.singleSelect) {
                    this.singleSelect = options.singleSelect;
                }
                if (options.singleSelectIndex) {
                    this.singleSelectIndex = options.singleSelectIndex;
                }
                if (options.updateMultiQuantity) {
                    this.updateMultiQuantity = options.updateMultiQuantity;
                }
                if (options.configurationEnabled) {
                    this.configurationEnabled = options.configurationEnabled;
                }
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

            // listen for selection change as we use it to get dimensions
            this.listenTo(this.filters,"change:selection", this.render);

            if (this.available) {
                // listen config change as we use it to get available dimensions
                this.listenTo(this.config,"change:"+this.available, this.render);
            }
            
            if (this.configurationEnabled === true) {
                // initialize dimension collection for management view
                this.collectionManagementView = new squid_api.view.DimensionColumnsManagementWidget();
            }
            if (! this.singleSelect) {
                this.events = squid_api.view.CollectionSelectorUtils.events;
            }

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

            if (this.singleSelect) {
                // add an empty (none selected) option
                jsonData.options.push({"label" : "-"});
            }

            // iterate through all filter facets
            var selection = this.filters.get("selection");
            if (selection) {
                var facets = selection.facets;
                if (facets) {
                    var facetList = [];
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
                                    facetList[idx] = facet;
                                }
                            } else if (this.available) {
                                // check this facet is available
                                var availableArray = this.config.get(this.available);
                                if (availableArray && availableArray.indexOf(facet.id) > -1) {
                                    facetList.push(facet);
                                }
                            } else {
                                // default unordered behavior
                                facetList.push(facet);
                            }
                        }

                        // avoid holes
                        if (!facetList[i]) {
                            facetList[i] = null;
                        }
                    }
                    var noneSelected = true;
                    var dimIdx;
                    for (dimIdx=0; dimIdx<facetList.length; dimIdx++) {
                        var facet1 = facetList[dimIdx];
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
                            var option = {"label" : name, "value" : facet1.id, "selected" : selected, "error" : facetList[dimIdx].error};
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
                        if (! me.updateMultiQuantity) {
                            return 'Dimensions';
                        } else {
                            return 'Dimensions (' + me.$el.find("option:selected").length + ')';
                        }
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

        events: {
            "change": function() {
                var oid = this.$el.find("select option:selected");

                var chosen = this.config.get(this.chosen);
                var chosenNew;

                if (this.singleSelect) {
                    chosenNew = _.clone(chosen);
                    if (oid.val()) {
                        chosenNew[this.singleSelectIndex] = oid.val();
                    } else {
                        chosenNew.splice(this.singleSelectIndex, 1);
                    }
                } else {
                    var selected = [];

                    // build the selection array
                    for (i = 0; i < oid.length; i++) {
                        var selectedOid = $(oid[i]).val();
                        selected.push(selectedOid);
                    }

                    // check for additions
                    chosenNew = _.intersection(_.union(chosen, selected), selected);
                }

                // Update
                if (this.onChangeHandler) {
                    this.onChangeHandler.call(this);
                } else {
                    this.config.set(this.chosen,chosenNew);
                }
            }
        },

        showConfiguration: squid_api.view.CollectionSelectorUtils.showConfiguration,

        sort: squid_api.view.CollectionSelectorUtils.sort,

        isChosen : function(facet) {
            var selected = false;
            var dimensions = this.config.get(this.chosen);
            if (this.singleSelect === true) {
                if (dimensions[this.singleSelectIndex] === facet.id) {
                    selected = true;
                }
            } else {
                if (dimensions) {
                    for (var j=0; j<dimensions.length; j++) {
                        if (facet.id === dimensions[j]) {
                            selected = true;
                        }
                    }
                }
            }
            return selected;
        }

    });

    return View;
}));
