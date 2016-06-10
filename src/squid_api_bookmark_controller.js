/*! Squid Core API User Navigation Controller V1.0 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['Backbone', '_', 'squid_api'], factory);
    } else {
        factory(root.Backbone, _, root.squid_api);
    }
}(this, function (Backbone, _, squid_api) {

    // Enhance Squid API controller
    var controller= {

            savedAnalysesConfig: new Map(),
            customAddedFacets: new Map(),
            customDeletedFacets: new Map(),

            /**
             * Function allowing to reset the whole user navigation (for ex when changing the project)
             */
            resetAll: function() {
                this.savedAnalysesConfig = new Map();
                this.customAddedFacets = new Map();
                this.customDeletedFacets = new Map();
            },

            /**
             * @return available facets from a domain
             */
            loadFacets: function (projectId, domainId) {
                var dfd = new $.Deferred();
                if (domainId) {
                    var filters = new squid_api.model.FiltersJob();
                    filters.set("id", {
                        "projectId": projectId
                    });
                    filters.set("engineVersion", "2");
                    filters.setDomainIds([domainId]);

                    console.log("compute (initFilters)");
                    squid_api.controller.facetjob.compute(filters).then(function() {
                        // search for time facets
                        var sel = filters.get("selection");
                        var facets;
                        if (sel && sel.facets) {
                            facets=  sel.facets;
                        }
                        dfd.resolve(facets);
                    });
                } else {
                    dfd.resolve();
                }
                return dfd;
            },

            /**
             * @return the facet related to segments
             */
            getSegmentFacet: function (facets) {
                if (facets) {
                    for (var i=0; i<facets.length;i++) {
                        if (facets[i].id === "__segments") {
                            return facets[i];
                        }
                    }
                }
            },

            /**
             * Remove the current domain id to get the full path up to the dimension
             */
            getSubRelationsFromFacet: function (id) {
            	var splitted = id.split("@");
            	var result = '';
            	if (splitted.length > 3) {
	            	for (var i=2; i < splitted.length; i++) {
	            		result = result + splitted[i];
	            	}    
            	}
            	return result;
            },

            /**
             * Limitation: selected items from a config don't include the facet name, this is why we use oid in case the facet comes from a sub domain
             * @return a facet from its name or oid
             */
            findFacetByName: function (facets, facet) {
                if (facets) {
                    for (var i=0; i<facets.length;i++) {
                    	if (this.normalyzeFacetName(facets[i]) === this.normalyzeFacetName(facet)) {
                            return facets[i];
                        }
                    }
                }
            },
            
            /**
             * @return name from the dimension of the facet as selected items from a config don't include the facet name
             */
            normalyzeFacetName: function (facet) {
                var facetName = facet.dimension.name;
                //Segments have to be handled at a domain level
                if (facet.id === "__segments") {
                    facetName = facet.dimension.id.domainId;
                } else if ((facet.id.split("@").length - 1) > 2){ //In case of multiple relations, we use the relations path as name to deduplicate the same facet used through multiple path
                    facetName = this.getSubRelationsFromFacet(facet.id);
                }
                return facetName;
            },

            /**
             * @return a custom selection of items (not defined in a reference such as a bookmark)
             */
            getCustomSelection: function (currentItems, referenceItems, availableItems) {
                var segmentItems = [];
                if (currentItems) {
                    for (var i=0; i<currentItems.length; i++) {
                        var item = currentItems[i];
                        var add=true;
                        if (referenceItems) {
                            for (var j=0; j<referenceItems.length; j++) {
                                var referenceItem = referenceItems[j];
                                if (item.type && referenceItem.type && item.type === referenceItem.type && item.id && referenceItem.id && item.id === referenceItem.id) {
                                    add=false;
                                }
                            }
                        }
                        if (add) {
                            if (availableItems) {
                                if (this.containsSelection(availableItems,item)) {
                                    segmentItems.push(item);
                                }
                            } else {
                                segmentItems.push(item);
                            }
                        }
                    }
                }
                return segmentItems;
            },

            /**
             * @return if an item is contained in an array through ids
             */
            containsSelection: function (a, obj) {
                var i = a.length;
                while (i--) {
                    if (a[i].id === obj.id) {
                        return true;
                    }
                }
                return false;
            },

            /**
             * Remove/clean from a custom selection items 
             * Remove an facet when no more custom items are present
             * the commented code is an attempt to strengthen with all available items from the facet if they can be sent
             * @param customSelections: array of all custom selection facets
             * @param facetName: the facet name to look at
             * @param availableItems: the list of all available items from the facet
             */
            cleanCustomSelection: function(customSelections, facetName, availableItems) {
                if (customSelections.has(facetName)) {
                    /*					if (availableItems) {
						cleanedItems = this.cleanItems(customSelections.get(facetName), availableItems);
						if (cleanedItems && cleanedItems.length>=1) {
							customSelections.set(facetName, cleanedItems);
						} else {
							customSelections.delete(facetName);
						}
					} else {
                     */						
                    customSelections.delete(facetName);
                    /*					}
                     */				}
            },

            /**
             * Build a clean list of custom items (not present in the list of all available items from the facet
             * @param items: the list of items to consider
             * @param availableItems: the list of all available items from the facet
             */
            cleanItems: function(items, availableItems) {
                var cleanedItems = [];
                for (var i=0; i<items.length; i++) {
                    if (this.containsSelection(availableItems, items[i]) === false) {
                        cleanedItems.push(items[i]);
                    }
                }
                return cleanedItems;
            },

            /**
             * Merge several list of items into a new list, used to define the new selection from user's interaction
             * @param savedSelection: custom items selected by the user
             * @param forcedSelection: last selection known on the same bookmark
             * @param facetForItems: list of facet's item (optional) for strengthening 
             * @param bookmarkSelection: selected items defined in the bookmark
             * @param deletedSelection: custom items recently deleted by the user
             * @return the merged list of selected items
             */
            mergeSelection: function (savedSelection, forcedSelection, facetForItems, bookmarkSelection, deletedSelection) {
                var segments = [];
                var toAdd = [];

                //Define starting point depending if the user has already used or not the bookmark
                if (forcedSelection && savedSelection) {
                    toAdd = segments.concat(forcedSelection.selectedItems);
                } else if (bookmarkSelection && bookmarkSelection.selectedItems){
                    toAdd  = segments.concat(bookmarkSelection.selectedItems);
                }

                //remove recently deleted items if any
                for (var f=0; f<toAdd.length; f++) {
                    if (!deletedSelection || this.containsSelection(deletedSelection, toAdd[f]) === false) {
                        segments.push(toAdd[f]);			
                    }
                }

                //Apply custom items if possible
                if (savedSelection) {
                    for (var i=0; i<savedSelection.length; i++) {
                        var segment = savedSelection[i];
                        var add = true;
                        //Do we remove because it is already in the forced config?
                        if (forcedSelection) {
                            for (var j=0; j<forcedSelection.selectedItems.length; j++) {
                                if (segment.value && forcedSelection.selectedItems[j].value && segment.value === forcedSelection.selectedItems[j].value) {
                                    add=false;
                                }
                            }
                        }
                        //Do we remove because it is not all segments from the domain (strengthen)
                        if (add === true) {
                            var addItem = false;
                            if (facetForItems) {
                                for (var k=0; k<facetForItems.items.length; k++) {
                                    if (segment.value && facetForItems.items[k].value && segment.value === facetForItems.items[k].value) {
                                        addItem=true;
                                        segment = facetForItems.items[k];
                                    }
                                }
                            } else {
                                //Items not provided (because list too long), set true as default
                                addItem=true;
                            }
                            add = addItem;
                        }
                        //Do we remove because it is a segment defined in the bookmark?
                        if (add === true) {
                            if (bookmarkSelection) {
                                for (var l=0; l<bookmarkSelection.selectedItems.length; l++) {
                                    if (segment.value && bookmarkSelection.selectedItems[l].value && segment.value === bookmarkSelection.selectedItems[l].value) {
                                        add=false;
                                    }
                                }
                            }
                        }
                        if (add === true) {
                            segments.push(segment);
                        }
                    }
                }
                return segments;
            },

            /**
             * Handle the construction of the new configuration when switching from one bookmark to another one, applying filters change operated by the user
             * @param bookmarkId
             * @param bookmarksCollection
             * @returns the new configuration
             */
            changeReportHandler: function(bookmarkId, bookmarksCollection) {

                var me = this;
                var config = squid_api.model.config;
                var copyConfig = $.extend(true, {}, config);

                var oldFacets = this.loadFacets(copyConfig.get("project"), copyConfig.get("domain"));
                var newBookmark = bookmarksCollection.get(bookmarkId);
                var newFacets = this.loadFacets(copyConfig.get("project"), newBookmark.get("config").domain);

                var cleanedItems;
                if (squid_api.model.config.get("bookmark") === bookmarkId) {
                    // force bookmark reset
                    $.when(oldFacets).done(function(oldFacets)  {
                        if (oldFacets) {
                            for (var k=0; k<oldFacets.length; k++) {
                                var availableFacet = oldFacets[k];
                                var facetName = me.normalyzeFacetName(availableFacet);
                                var availableItems = null;
                                if (availableFacet.id === "__segments") {
                                    availableItems = availableFacet.items;
                                }
                                me.cleanCustomSelection(me.customAddedFacets, facetName, availableItems);
                                me.cleanCustomSelection(me.customDeletedFacets, facetName, availableItems);
                            }
                        }

                    });
                    squid_api.setBookmarkId(bookmarkId);
                } else {
                    //Get list of available facets for each domains
                    $.when(oldFacets, newFacets).done(function(oldFacets, newFacets) {
                        console.log("merge filters from bookmarks");
                        var forcedConfig = function(newConfig) {
                            newConfig.bookmark = bookmarkId;
                            var facetName;
                            var facetForItems;
                            //Find bookmarks
                            var currentBookmark = bookmarksCollection.get(copyConfig.get("bookmark"));
                            if (currentBookmark && currentBookmark.id) {
                                me.savedAnalysesConfig.set(copyConfig.get("bookmark"), copyConfig.attributes);
                            }

                            //Get the latest config used on the new bookmark used if any
                            var savedNewConfig = me.savedAnalysesConfig.get(newBookmark.id);
                            //In case it is the first bookmark selected
                            if (!savedNewConfig || !savedNewConfig.selection) {
                                savedNewConfig = newConfig;
                            }
                            var forcedSelection = { "compareTo" : [], "facets" : []};
                            var currentSelection = copyConfig.get("selection");

                            if (currentSelection && currentSelection.facets) {
                                //Save/update any facet selected
                                if (oldFacets) {
                                    for (var k=0; k<oldFacets.length; k++) {
                                        var availableFacet = oldFacets[k];
                                        var existsInNewConfig = me.containsSelection(newFacets, availableFacet);
                                        facetName = me.normalyzeFacetName(availableFacet);
                                        var selectedItems = [];
                                        var deletedItems = [];

                                        var bookmarkFacet = me.findFacetByName(currentBookmark.get("config").selection.facets, availableFacet);
                                        facetForItems = me.findFacetByName(currentSelection.facets, availableFacet);

                                        var availableItems = null;
                                        if (facetForItems && facetForItems.selectedItems) {
                                            if (facetForItems.id === "__segments") {
                                                availableItems = me.getSegmentFacet(newFacets).items;
                                            }
                                            if (bookmarkFacet) {
                                                var diffItems = me.getCustomSelection(facetForItems.selectedItems, bookmarkFacet.selectedItems);   
                                                if (diffItems && diffItems.length>0) {
                                                    selectedItems=diffItems;
                                                }		
                                                //Now we clean deleted items if segments as it is shared among bookmarks on same domain
                                                if (availableFacet.id === "__segments" && me.customDeletedFacets.get(facetName) && diffItems.length>0) {
                                                    me.customDeletedFacets.set(facetName, me.cleanItems(me.customDeletedFacets.get(facetName), diffItems));
                                                }

                                                diffItems = me.getCustomSelection(bookmarkFacet.selectedItems, facetForItems.selectedItems, availableItems);

                                                //Now we copy back remaining deleted items if segments as it is shared among bookmarks on same domain
                                                if (availableFacet.id === "__segments" && me.customDeletedFacets.get(facetName)) {
                                                    diffItems = diffItems.concat(me.customDeletedFacets.get(facetName));
                                                }

                                                //No need for period as it is a single selection
                                                if ((availableFacet.dimension.type === "CONTINUOUS" && availableFacet.dimension.valueType === "DATE") === false) {
                                                    if (diffItems && diffItems.length>0) {
                                                        deletedItems=diffItems;
                                                    }		
                                                }
                                            } else {
                                                selectedItems = facetForItems.selectedItems;
                                            }
                                        }
                                        if (selectedItems && selectedItems.length>0) {
                                            me.customAddedFacets.set(facetName, selectedItems);
                                        } else {
                                            me.cleanCustomSelection(me.customAddedFacets, facetName, availableItems);
                                        }
                                        if (deletedItems && deletedItems.length>0) {
                                            me.customDeletedFacets.set(facetName, deletedItems);
                                        } else if (me.customDeletedFacets.has(facetName)) {
                                            me.cleanCustomSelection(me.customDeletedFacets, facetName, availableItems);
                                        }
                                    }
                                }

                                //We add new selected facets on other dashboards
                                if (newFacets) {
                                    for (var f=0; f<newFacets.length; f++) {
                                        var newFacet = newFacets[f];
                                        facetName = me.normalyzeFacetName(newFacet);
                                        var complementFacetItems = null;
                                        if (newFacet.dimension.type === "CONTINUOUS" && newFacet.dimension.valueType === "DATE") {
                                            //For dates there is only one selection item
                                            if (currentSelection.compareTo && currentSelection.compareTo.length === 1) {
                                                var savedNewCompare = $.extend(true, {}, newFacet);
                                                savedNewCompare.selectedItems = $.extend(true, [], currentSelection.compareTo[0].selectedItems);
                                                forcedSelection.compareTo.push(savedNewCompare);
                                            } else {
                                                if (savedNewConfig.selection.compareTo) {
                                                    forcedSelection.compareTo = $.extend(true, [], savedNewConfig.selection.compareTo);
                                                }
                                            }
                                            complementFacetItems = me.customAddedFacets.get(facetName);
                                            if (!complementFacetItems) {
                                                var periodFacet = me.findFacetByName(newConfig.selection.facets, newFacet); 
                                                if (periodFacet) {
                                                    complementFacetItems = periodFacet.selectedItems;
                                                }// when renaming a child dimension, the dimension name in the bookmark is not updated
                                            }
                                        } else {
                                            var savedSelection = me.customAddedFacets.get(facetName);
                                            var deletedSelection = me.customDeletedFacets.get(facetName);
                                            var bookmarkSelection = me.findFacetByName(newConfig.selection.facets, newFacet); // when renaming a child dimension, the dimension name in the bookmark is not updated
                                            var lastSelection = me.findFacetByName(savedNewConfig.selection.facets, newFacet);
                                            facetForItems = null;
                                            if (newFacet.id === "__segments") {
                                                facetForItems = me.getSegmentFacet(newFacets);
                                            }
                                            complementFacetItems = me.mergeSelection(savedSelection, lastSelection, facetForItems, bookmarkSelection, deletedSelection);
                                        }
                                        if (complementFacetItems && complementFacetItems.length>0) {
                                            var copiedFacet = {
                                                    dimension: newFacet.dimension,
                                                    id: newFacet.id,
                                                    selectedItems: complementFacetItems
                                            };
                                            forcedSelection.facets.push(copiedFacet);
                                        }
                                    }
                                }

                                //Set then next config from selected facets
                                newConfig.selection = forcedSelection;
                            }

                            return newConfig;
                        };

                        squid_api.setBookmarkId(bookmarkId, forcedConfig, null);           
                    });
                }
            }


    };

    squid_api.controller.UserNavigation = controller;

    return squid_api;
}));
