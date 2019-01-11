(function (root, factory) {
    root.squid_api.view.CollectionSelectorUtils = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api) {

    /**
     * Utility class to provide common methods collection selectors
     */
    var Utils = {

        handleStatus: function() {
            var select = this.$el.find("select");
            var multiSelectDropdown = this.$el.find(".multiselect-container");
            if (select) {
                var isMultiple = true;
                var running = (squid_api.model.status.get("status") !== squid_api.model.status.STATUS_DONE);
                if (running) {
                    // computation is running : disable input
                    select.attr("disabled","disabled");
                    if (isMultiple) {
                        select.multiselect('disable');
                        multiSelectDropdown.append("<div class='dropdownDisabled'></div>");
                    }
                } else {
                    // computation is done : enable input
                    select.removeAttr("disabled");
                    if (isMultiple) {
                        select.multiselect('enable');
                        multiSelectDropdown.find(".dropdownDisabled").remove();
                    }
                }
            }
        },

        events: {
            "change": function() {
                var oid;
                if (this.$el.find("select").length > 0) {
                    oid = this.$el.find("select option:selected");
                } else if (this.$el.find("input").length > 0) {
                    oid = this.$el.find("input:checked");
                }

                // Remove Button Title Tag
                this.$el.find("button").removeAttr('title');

                var chosen = this.config.get(this.chosen);
                var selected = [];

                // build the selection array
                for (i = 0; i < oid.length; i++) {
                    var val = $(oid[i]).val();
                    if (val.length > 0) {
                        var selectedOid = $(oid[i]).val();
                        selected.push(selectedOid);
                    }
                }

                // check for additions
                chosenNew = _.intersection(_.union(chosen, selected), selected);
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
                    this.onChangeHandler.call(this, chosenNew);
                } else {
                    this.config.set(this.chosen,chosenNew);
                }
            }
        },

        showConfiguration: function() {
            var me = this;
            squid_api.getSelectedProject().done( function(project) {
                if (project.get("_role") === "WRITE" || project.get("_role") === "OWNER") {

                    // place dimension collection in modal view
                    if (! me.columnConfigurationModal) {
                        me.columnConfigurationModal = new squid_api.view.ModalView({
                            view : me.collectionManagementView
                        });
                    }

                    me.$el.find("ul").prepend("<li class='configure'> configure</option>");
                    me.$el.find("li").first().on("click", function() {
                        // trigger dimension management view
                       me.columnConfigurationModal.render();
                    });
                }
            });
        },

        sort: function(items) {
            return items.sort(function(a, b) {
                var labelA=a.label.toLowerCase(), labelB=b.label.toLowerCase();
                if (labelA < labelB) {
                    return -1;
                }
                if (labelA > labelB) {
                    return 1;
                }
                return 0; // no sorting
            });
        },

        isChosen : function(item) {
            var selected = false;
            var items = this.config.get(this.chosen);

            if (items) {
                for (var j=0; j<items.length; j++) {
                    if (item.get("oid") === items[j]) {
                        selected = true;
                    }
                }
            }
            return selected;
        },

        renderButton: function() {
            var label = this.typeLabelPlural;
            var jsonData = {
                label : label,
                usable : false,
                collectionLoaded : !this.collectionLoading,
                collection : this.collection,
                typeLabelPlural : this.typeLabelPlural
            };
            if (this.collection || this.collectionLoading) {
                jsonData.usable = true;
                if (this.selectedModel) {
                    if (this.selectedModel.get("oid")) {
                        jsonData.label = this.selectedModel.get("name");
                        jsonData.selectedModel = true;
                    }
                }

                if (this.afterRender) {
                    this.afterRender.call(this);
                }
            }

            this.$el.html(this.template(jsonData));

            return this;
        }

    };

    return Utils;
}));
