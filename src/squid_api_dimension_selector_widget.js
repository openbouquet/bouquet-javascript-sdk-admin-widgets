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
        displayAll : null,
        singleSelect : false,
        singleSelectIndex : null,
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
                if (options.displayAll) {
                    this.displayAll = options.displayAll;
                }
                if (options.afterRender) {
                    this.afterRender = options.afterRender;
                }
                if (options.singleSelect) {
                    this.singleSelect = options.singleSelect;
                }
                if (options.singleSelectIndex || options.singleSelectIndex === 0) {
                    this.singleSelectIndex = options.singleSelectIndex;
                }
                if (options.updateMultiQuantity) {
                    this.updateMultiQuantity = options.updateMultiQuantity;
                }
                if (options.configurationEnabled) {
                    this.configurationEnabled = options.configurationEnabled;
                }
            }

            // setup the models
            if (this.model) {
                this.config = this.model;
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
            // listen config change as we use it to get chosen dimensions
            this.listenTo(this.config,"change:"+this.chosen, this.render);

            if (this.configurationEnabled === true) {
                // initialize dimension collection for management view
                this.collectionManagementView = new squid_api.view.DimensionColumnsManagementWidget();
            }
            if (! this.singleSelect) {
                this.events = squid_api.view.CollectionSelectorUtils.events;
            }

            if (this.displayAll) {
                this.listenTo(this.config,"change:domain", this.fetchCollection);
            }
            this.listenTo(this.status,"change:status", this.enable);
        },

        fetchCollection: function() {
            var me = this;
            this.loadCollection().done(function(collection) {
                me.dimensionCollection = collection;
                me.render();
            }).fail(function() {
                console.error("Error Fetching Dimensions");
            });
        },

        loadCollection : function(parentId) {
            var me = this;
            return squid_api.getCustomer().then(function(customer) {
                return customer.get("projects").load(squid_api.model.config.get("project")).then(function(project) {
                    return project.get("domains").load(squid_api.model.config.get("domain")).then(function(domain) {
                        return domain.get("dimensions").load();
                    });
                });
            });
        },

        enableDisplay: function() {
            this.$el.attr("disabled", false);
        },

        disableDisplay: function() {
            this.$el.attr("disabled", true);
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

            var noneLabel = "None";
            if (typeof $.i18n !== "undefined") {
            	noneLabel=$.i18n.t("none_label");
            }
            if (this.singleSelect) {
                // add an empty (none selected) option
                jsonData.options.push({"label" : noneLabel, "value":"none"});
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
                                if (!availableArray) {
                                    // use chosen
                                    availableArray = this.config.get(this.chosen);
                                }
                                if ((!availableArray) || (availableArray.length === 0)) {
                                    // use all facets
                                    facetList.push(facet);
                                } else {
                                    var addToArray = true;
                                    // don't allow dimension reselection if using a singleSelectIndex
                                    if (this.singleSelectIndex || this.singleSelectIndex === 0) {
                                        var chosenArray = this.config.get(this.chosen);
                                        var index = _.indexOf(chosenArray, facet.id);
                                        if (index > -1 && index !== this.singleSelectIndex) {
                                            addToArray = false;
                                        }
                                    }
                                    if (! this.config.get(this.available) && addToArray) {
                                        facetList.push(facet);
                                    } else if (addToArray && (this.config.get(this.available) && (this.config.get(this.available).indexOf(facet.id) > -1))) {
                                        facetList.push(facet);
                                    }
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
                            var option = {"label" : name, "value" : facet1.id, "selected" : selected, "error" : facetList[dimIdx].error, "oid" : facet1.dimension.oid};
                            jsonData.options.push(option);
                        }
                    }
                }

                // check if empty
                if (jsonData.options.length === 0) {
                    jsonData.empty = true;
                }

                if (this.displayAll) {
                    if (this.dimensionCollection) {
                        var notFound = [];
                        var dims = this.dimensionCollection.models;
                        for (var d=0; d<dims.length; d++) {
                            var model = this.dimensionCollection.at(d);
                            var found = false;
                            for(var c=0; c<selection.facets.length; c++) {
                                if (selection.facets[c].dimension.oid == model.get("oid")) {
                                    found = true;
                                    break;
                                }
                            }
                            if (! found) {
                                // jsonData.options.push({
                                //     "label" : model.get("name"),
                                //     "value" : "@'" + this.config.get("domain") + ".@'" + model.get("oid") + "'",
                                //     "selected" : this.isChosen(model),
                                //     "error" : model.get("error")
                                // });
                                notFound.push({
                                    "id" : model.get("oid"),
                                    "name" : model.get("name"),
                                    "valueType" : model.get("valueType")
                                });
                            }    
                        }
                        for (ix1=0; ix1<notFound.length; ix1++) {
                            console.log(notFound[ix1].name + " with id " + notFound[ix1].id + " is not found with valueType: " + notFound[ix1].valueType);
                        }
                    }
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

                    // re-delegate events if external widget is used in callback
                    this.delegateEvents();
                }
            }
        },

        renderView: function(jsonData) {
            var me = this;

            var selectAllText= "Select all",
            filterPlaceholder= "Search",
            nonSelectedText= "None selected",
            nSelectedText= "selected",
            allSelectedText= "All selected",
            resetText= "Reset";
            if (typeof $.i18n !== "undefined") {
            	selectAllText= $.i18n.t("selectAllText");
                filterPlaceholder= $.i18n.t("filterPlaceholder");
                nonSelectedText= $.i18n.t("nonSelectedText");
                nSelectedText= $.i18n.t("nSelectedText");
                allSelectedText= $.i18n.t("allSelectedText");
                resetText= $.i18n.t("resetText");
            }
           if (this.$el.find("select").length === 0) {
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
                    this.$el.find("select").multiselect("setOptions",{
                        selectAllText: selectAllText,
                        filterPlaceholder: filterPlaceholder,
                        nonSelectedText: nonSelectedText,
                        nSelectedText: nSelectedText,
                        allSelectedText: allSelectedText,
                        resetText: resetText});
                    this.$el.find("select").multiselect('rebuild');
                }
            } else {
                if (typeof $.i18n !== "undefined") {
                    this.$el.find("select").multiselect("setOptions",{
                        selectAllText: selectAllText,
                        filterPlaceholder: filterPlaceholder,
                        nonSelectedText: nonSelectedText,
                        nSelectedText: nSelectedText,
                        allSelectedText: allSelectedText,
                        resetText: resetText});
                    this.$el.localize();
	            }
                this.$el.find("select").multiselect('dataprovider', jsonData.options);
                this.$el.find("select").multiselect('rebuild');
            }

            this.enable();

            return this;
        },

        events: {
            "change": function(one, two) {
                var oid = this.$el.find("select option:selected");

                var chosen = this.config.get(this.chosen);
                var chosenNew;
                var orderByList = _.clone(this.config.get("orderBy"));

                if (this.singleSelect) {
                    chosenNew = _.clone(chosen);
                    var value = oid.val();
                    if (value && value !== "none") {
                        if (! chosenNew.includes(value)) {
                            chosenNew[this.singleSelectIndex] = value;
                        } else {
                            this.$el.find("select").val("");
                        }
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
                //Handle order by silently 
                var oldValues = _.difference(chosen, chosenNew);
                if (typeof orderByList !== "undefined" && orderByList && oldValues && oldValues.length>0) {
                	for (var ix=oldValues.length-1; ix>=0; ix--) {
                		var oldValue = oldValues[ix];
                    	for (var jx=orderByList.length-1; jx>=0; jx--) {
                    		if (orderByList[jx].expression !== "undefined" ) {
                    			if ( typeof orderByList[jx].expression.value !== "undefined") {
                    				if (orderByList[jx].expression.value === oldValue) {
                    					orderByList.splice(jx, 1);
                    				}
                    			}
                    		}
                    	}
                	}             	
                	this.config.attributes.orderBy = orderByList;
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
                if (dimensions) {
                    if (dimensions[this.singleSelectIndex] === facet.id) {
                        selected = true;
                    }
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
