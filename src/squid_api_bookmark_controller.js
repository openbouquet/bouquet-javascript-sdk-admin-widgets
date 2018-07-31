/*! Squid Core API Bookmark Controller V1.0 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD.
		define(['Backbone', '_', 'squid_api'], factory);
	} else {
		factory(root.Backbone, _, root.squid_api);
	}
}(this, function (Backbone, _, squid_api) {

	// Enhance Squid API controller
	var Controller = {

			savedAnalysesConfig: new Map(),
			customAddedFacets: new Map(),
			customDeletedFacets: new Map(),

			/**
			 * Function allowing to reset the whole user navigation (for ex when changing the project)
			 */
			resetAll: function() {
				Controller.savedAnalysesConfig = new Map();
				Controller.customAddedFacets = new Map();
				Controller.customDeletedFacets = new Map();
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

					//JTH 2016-08-24 add dynamic flag
					filters.set("includeDynamic", false);

					console.log("compute (initFilters)");
					squid_api.controller.facetjob.compute(filters).then(function() {
						// search for time facets
						var sel = filters.get("selection");
						//JTH 2016-08-24 copy facets
						/**/
						var facets;
						if (sel && sel.facets) {
							facets=  sel.facets;
						}
						dfd.resolve(facets);
						/**/
						/* remove the new code for the moment
						var selFacets = [];
                        var facets = sel.facets;
                        for (i = 0; i < facets.length; i++) {
                            var facet = facets[i];
                            var selFacet = {
                                    "id" : facet.id,
                                    "name" : facet.name ? facet.name : facet.dimension.name,
                                    "items" : [],
                            		"dimension" : facet.dimension
                            };
                            var selectedItems = facet.selectedItems;
                            for (ix = 0; ix < selectedItems.length; ix++) {
                                selFacet.selectedItems.push({
                                        "id" : selectedItems[ix].id,
                                        "name" : selectedItems[ix].value
                                });
                            }
                            var items = facet.items;
                            for (ix = 0; ix < items.length; ix++) {
                                selFacet.items.push({
                                        "id" : items[ix].id,
                                        "name" : items[ix].value
                                });
                            }
                            selFacet.available = (facet.dimension.type === "CATEGORICAL" || facet.dimension.type === "SEGMENTS" || (facet.dimension.type === "CONTINUOUS" && facet.dimension.valueType === "DATE") || selFacet.items.length > 0);
                            if (selFacet.available) {
                            	selFacets.push(selFacet);
                            }
                        }
                        dfd.resolve(selFacets);
						 */
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
			 * Remove the current domain id to get only the relations path up to the the facet
			 */
			getRelationPath: function (id) {
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
						if (Controller.normalyzeFacetName(facets[i]) === Controller.normalyzeFacetName(facet)) {
							return facets[i];
						}
					}
				}
			},

			/**
			 * @return name from the dimension of the facet as selected items from a config don't include the facet name
			 */
			normalyzeFacetName: function (facet) {
				var facetName = facet.name;
				//Segments have to be handled at a domain level
				if (facet.id === "__segments") {
					facetName = facet.dimension.id.domainId;
					//} else if ((facet.id.split("@").length - 1) > 2){ //In case of relations, we use the relations path as name to deduplicate the same facet used through multiple paths
					//	facetName = this.getRelationPath(facet.id);
				} else if (facetName === false) {
					facetName = facet.dimension.name;
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
								if (Controller.containsSelection(availableItems,item)) {
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
			 * @return if an item is contained in an array through ids or names
			 */
			containsSelection: function (a, obj) {
				var i = a.length;
				while (i--) {
					if (!a[i].name && !obj.name) {
						if (a[i].id === obj.id) {
							return true;
						}
					} else if (a[i].name === obj.name) {
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
					cleanedItems = Controller.cleanItems(customSelections.get(facetName), availableItems);
					if (cleanedItems && cleanedItems.length>=1) {
						customSelections.set(facetName, cleanedItems);
					} else {
						customSelections.delete(facetName);
					}
				} else {
					 */						
					customSelections.delete(facetName);
					/*					}
					 */				
				}
			},

			/**
			 * Build a clean list of custom items (not present in the list of all available items from the facet
			 * @param items: the list of items to consider
			 * @param availableItems: the list of all available items from the facet
			 */
			cleanItems: function(items, availableItems) {
				var cleanedItems = [];
				for (var i=0; i<items.length; i++) {
					if (Controller.containsSelection(availableItems, items[i]) === false) {
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
				if (forcedSelection && !savedSelection) {
					toAdd = segments.concat(forcedSelection.selectedItems);
				} else if (bookmarkSelection && bookmarkSelection.selectedItems){
					toAdd  = segments.concat(bookmarkSelection.selectedItems);
				}

				//remove recently deleted items if any
				for (var f=0; f<toAdd.length; f++) {
					if (!deletedSelection) {
						segments.push(toAdd[f]);					 
					} else if (Controller.containsSelection(deletedSelection, toAdd[f]) === false) {
						segments.push(toAdd[f]);			
					}
				}

				//Apply custom items if possible
				if (savedSelection) {
					for (var i=0; i<savedSelection.length; i++) {
						var segment = savedSelection[i];
						var add = true;
						/*//Remove this as we don't initalize anymore from forced selection
                        //Do we remove because it is already in the forced config?
                        if (forcedSelection) {
                            for (var j=0; j<forcedSelection.selectedItems.length; j++) {
                                if (segment.value && forcedSelection.selectedItems[j].value && segment.value === forcedSelection.selectedItems[j].value) {
                                    add=false;
                                }
                            }
                        }
						 */
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
			 * Setup the facet name in selected items from the domain facets
			 */
			addNameToSelectedFacets: function(domainFacets, selectedFacets) {
				for (var i=0; i<selectedFacets.length; i++) {
					selectedFacets[i].name = Controller.getSelectedFacetName(domainFacets, selectedFacets[i]);
				}
			},

			/**
			 * return the facet name from the domain'facet itself instead of the selection
			 */
			getSelectedFacetName: function(facets, selectedFacet) {
				for (var j=0; j<facets.length; j++) {
					if (facets[j].id === selectedFacet.id) {
						return facets[j].name;
					}
				}
			},


			/**
			 * Handle the construction of the new configuration when switching from one bookmark to another one, applying filters change operated by the user
			 * @param bookmarkId
			 * @param bookmarksCollection
			 * @returns the new configuration
			 */
			setBookmarkAction: function(bookmark, forcedConfig, attributes) {
				if (!squid_api.model.config.get("bookmark")) {
					// first time opening a bookmark
					squid_api.setBookmark(bookmark, forcedConfig, attributes);
				} else {
					var me = Controller;
					var bookmarkId = bookmark.id;
					var config = squid_api.model.config;
					var copyConfig = $.extend(true, {}, config);

					var oldFacets = Controller.loadFacets(copyConfig.get("project"), copyConfig.get("domain"));
					var newBookmark = bookmark;
					var newFacets = Controller.loadFacets(copyConfig.get("project"), newBookmark.get("config").domain);

					var cleanedItems;
					if (squid_api.model.config.get("bookmark") === bookmarkId && (
							typeof attributes === 'undefined')) {
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
							squid_api.setBookmark(bookmark, forcedConfig, attributes);
						});
					} else {
						// get the previous Bookmark
						squid_api.getCustomer().then(function(customer) {
							customer.get("projects").load(copyConfig.get("project")).then(function(project) {
								project.get("bookmarks").load(copyConfig.get("bookmark")).done(function(previousBookmark) {

									//Get list of available facets for each domains
									$.when(oldFacets, newFacets).done(function(oldFacets, newFacets) {
										console.log("merge filters from bookmarks");
										var forcedConfig = function(newConfig) {
											newConfig.project = project.get("oid");
											newConfig.bookmark = bookmarkId;

											me.addNameToSelectedFacets(newFacets, newConfig.selection.facets);
											var oldSelection = copyConfig.get("selection");
											if (oldSelection && oldSelection.facets)  {
												me.addNameToSelectedFacets(oldFacets, oldSelection.facets);
											}
											var facetName;
											var facetForItems;

											if (previousBookmark && previousBookmark.id) {
												me.savedAnalysesConfig.set(copyConfig.get("bookmark"), copyConfig.attributes);
											}

											//Get the latest config used on the new bookmark used if any
											var savedNewConfig = me.savedAnalysesConfig.get(newBookmark.id);
											//In case it is the first bookmark selected
											if (!savedNewConfig || !savedNewConfig.selection) {
												savedNewConfig = newConfig;
											} else {
												//V3 compatibility: initialize dimensions, metrics & order by from last saved state for the same bookmark
												newConfig.chosenDimensions = savedNewConfig.chosenDimensions;
												newConfig.chosenMetrics = savedNewConfig.chosenMetrics;
												newConfig.orderBy = savedNewConfig.orderBy;
											}
											var forcedSelection = { "compareTo" : [], "facets" : [], "rootFacets" : []};
											if (newConfig.selection.rootFacets && newConfig.selection.rootFacets) {
												forcedSelection.rootFacets =  newConfig.selection.rootFacets;
											}
											if (oldSelection && oldSelection.facets) {
												//Save/update any facet selected
												if (oldFacets) {
													//We put back the names in the selected items from the domain's facets
													me.addNameToSelectedFacets(oldFacets, previousBookmark.get("config").selection.facets);

													for (var k=0; k<oldFacets.length; k++) {
														var availableFacet = oldFacets[k];
														var existsInNewConfig = me.containsSelection(newFacets, availableFacet);
														facetName = me.normalyzeFacetName(availableFacet);
														var selectedItems = [];
														var deletedItems = [];

														facetForItems = me.findFacetByName(oldSelection.facets, availableFacet);

														var availableItems = null;
														if (facetForItems && facetForItems.selectedItems) {
															if (facetForItems.id === "__segments" && me.getSegmentFacet(newFacets)) {
																availableItems = me.getSegmentFacet(newFacets).items;
															} 
															//else {
															selectedItems = facetForItems.selectedItems;
															//}
														} 

														var bookmarkFacet = me.findFacetByName(previousBookmark.get("config").selection.facets, availableFacet);
														var diffItems = [];
														if (bookmarkFacet) {
															diffItems = me.getCustomSelection(selectedItems, bookmarkFacet.selectedItems);   
														} else {
															diffItems = selectedItems;
														}

														if (diffItems && diffItems.length>0) {
															selectedItems=diffItems;
														}
														/* T1778 - non needed code but may be useful at some points
                                                        if (previousBookmark.get("config").domain === newConfig.domain && newConfig.period) {
                                                        	if (Object.keys(newConfig.period) && Object.keys(previousBookmark.get("config").period)) {
                                                        		if (facetForItems.id === previousBookmark.get("config").period[newConfig.domain] && 
                                                        				newConfig.period[newConfig.domain] !== previousBookmark.get("config").period[newConfig.domain]) {
                                                        			selectedItems = [];
                                                        			if (savedNewConfig.selection.facets && savedNewConfig.selection.facets.length) {
                                                        				for (var l=0; l<savedNewConfig.selection.facets.length; l++) {
                                                        					if (savedNewConfig.selection.facets[l].id === newConfig.period[newConfig.domain] && savedNewConfig.selection.facets[l].selectedItems) {
                                                        						selectedItems = savedNewConfig.selection.facets[l].selectedItems;
                                                        					}
                                                        				}
                                                        			}
                                                        		}
                                                        	}
                                                        }
														 */
														//Now we clean deleted items if segments as it is shared among bookmarks on same domain
														if (availableFacet.id === "__segments" && me.customDeletedFacets.get(facetName) && diffItems.length>0) {
															me.customDeletedFacets.set(facetName, me.cleanItems(me.customDeletedFacets.get(facetName), diffItems));
														}

														//diffItems = me.getCustomSelection(bookmarkFacet.selectedItems, selectedItems, availableItems);

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

														if (diffItems && diffItems.length>0) {
															me.customAddedFacets.set(facetName, diffItems);
														} else {
															if (me.customAddedFacets.get(facetName)) {
																deletedItems =  me.customAddedFacets.get(facetName);
															}
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

															if (oldSelection.compareTo && oldSelection.compareTo.length === 1) {
																var bookmarkCompare = null;
																if (previousBookmark.get("config").selection) {
																	bookmarkCompare = previousBookmark.get("config").selection.compareTo;
																	if (bookmarkCompare.length === 1 && bookmarkCompare[0].selectedItems && bookmarkCompare[0].selectedItems.length ===1 &&oldSelection.compareTo[0].selectedItems && oldSelection.compareTo[0].selectedItems.length ===1) {
																		if (newConfig.selection && bookmarkCompare[0].id === oldSelection.compareTo[0].id && bookmarkCompare[0].selectedItems[0].lowerBound === oldSelection.compareTo[0].selectedItems[0].lowerBound && bookmarkCompare[0].selectedItems[0].upperBound === oldSelection.compareTo[0].selectedItems[0].upperBound) {
																			forcedSelection.compareTo = newConfig.selection.compareTo;
																		} else {
																			bookmarkCompare = null;
																		}
																	} else {
																		bookmarkCompare = null;
																	}
																}
																if (bookmarkCompare === null) {
																	var savedNewCompare = $.extend(true, {}, newFacet);
																	savedNewCompare.selectedItems = $.extend(true, [], oldSelection.compareTo[0].selectedItems);
																	forcedSelection.compareTo.push(savedNewCompare);
																}
															} else {
																forcedSelection.compareTo = null;
																if (newConfig.selection && newConfig.selection.compareTo) {
																	forcedSelection.compareTo = newConfig.selection.compareTo;
																}
																/*We don't copy anymore the new compare
                                                                if (savedNewConfig.selection.compareTo) {
                                                                    forcedSelection.compareTo = $.extend(true, [], savedNewConfig.selection.compareTo);
                                                                }
																 */
															}
															complementFacetItems = me.customAddedFacets.get(facetName);
															if (!complementFacetItems) {
																var periodFacet = me.findFacetByName(newConfig.selection.facets, newFacet); 
																if (periodFacet) {
																	complementFacetItems = periodFacet.selectedItems;
																}// when renaming a child dimension, the dimension name in the bookmark is not updated
															}
															//T1778
															if (complementFacetItems && newConfig.period) {
																if (newFacet.id !== newConfig.period[newConfig.domain]) {
																	complementFacetItems = null;
																}
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

										squid_api.setBookmark(bookmark, forcedConfig, null);           
									});
								});
							});
						});
					}
				}
			}
	};

	squid_api.controller.Bookmark = Controller;

	return squid_api;
}));
