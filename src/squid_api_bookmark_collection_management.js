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
			 * Limitation: selected items from a config don't include the facet name, this is why we use oid in case the facet comes from a sub domain
			 * @return a facet from its name or oid
			 */
			getFacetByName: function (facets, facetName, oid) {
				if (facets) {
					for (var i=0; i<facets.length;i++) {
						if ((facets[i].id.split("@").length - 1) === 2 && facets[i].dimension.name === facetName) {   //Can compare dimension name only if not a lookup table as we don't have the facet name
							return facets[i];
						} else if (oid && facets[i].dimension.oid === oid) {
							return facets[i];
						} else if (facets[i].id === "__segments" && facets[i].dimension.id.domainId === facetName) {
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
				//Simplification of code
				/*	if (facet.dimension.type === "CONTINUOUS" && facet.dimension.valueType === "DATE") {
	    			facetName = "__Period__";
	    		}*/
				//Segments have to be handled at a domain level
				if (facet.id === "__segments") {
	    			facetName = facet.dimension.id.domainId;
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

										var bookmarkFacet = me.getFacetByName(currentBookmark.get("config").selection.facets, facetName, availableFacet.dimension.oid);
										facetForItems = me.getFacetByName(currentSelection.facets, facetName, availableFacet.dimension.oid);

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
												var periodFacet = me.getFacetByName(newConfig.selection.facets, facetName, newFacet.dimension.oid); 
												if (periodFacet) {
													complementFacetItems = periodFacet.selectedItems;
												}// when renaming a child dimension, the dimension name in the bookmark is not updated
											}
										} else {
											var savedSelection = me.customAddedFacets.get(facetName);
											var deletedSelection = me.customDeletedFacets.get(facetName);
											var bookmarkSelection = me.getFacetByName(newConfig.selection.facets, facetName, newFacet.dimension.oid); // when renaming a child dimension, the dimension name in the bookmark is not updated
											var lastSelection = me.getFacetByName(savedNewConfig.selection.facets, facetName, newFacet.dimension.oid);
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

(function (root, factory) {
	root.squid_api.view.BookmarkCollectionManagementWidget = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_bookmark_collection_management_widget);

}(this, function (Backbone, squid_api, template) {

	var View = squid_api.view.BaseCollectionManagementWidget.extend({
		template: template,
		type : "Bookmark",
		typeLabel : "Bookmark",
		typeLabelPlural : "Bookmarks",
		configSelectedId : "bookmark",
		modelView : null,
		configParentId : "project",
		headerText : null,
		filteredPaths: null,
		filteredOids: null,
		onChangeHandler : null,
		descriptionHover : null,
		hierarchialList: null,

		init : function(options) {
			var me = this;
			this.modelView = squid_api.view.BookmarkModelManagementWidget;

			if (options.headerText) {
				this.headerText = options.headerText;
			}
			if (options.filteredPaths) {
				this.filteredPaths = options.filteredPaths;
			}
			if (options.filteredOids) {
				this.filteredOids = options.filteredOids;
			}
			if (options.onChangeHandler) {
				this.onChangeHandler = options.onChangeHandler;
			}
			if (options.descriptionHover) {
				this.descriptionHover = options.descriptionHover;
			}
			if (options.hierarchialList) {
				this.hierarchialList = options.hierarchialList;
			}
		},

		loadCollection : function(parentId) {
			return squid_api.getCustomer().then(function(customer) {
				return customer.get("projects").load(parentId).then(function(project) {
					return project.get("bookmarks").load();
				});
			});
		},

		createModel : function() {
			var model = new this.collection.model();
			// set config to current state
			var config = this.config.toJSON();
			delete config.bookmark;
			delete config.project;
			model.set("config",config);
			return model;
		},

		eventSelect : function(event) {
			var value = $(event.target).parents("li").attr("data-attr");
			if (! value) {
				value = $(event.target).attr("data-attr");
			}
			//Callback to keep filters selection on Counter apps for ex
			if (this.onChangeHandler) {
				if (this.onChangeHandler.changeReportHandler) {
					this.onChangeHandler.changeReportHandler(value ,this.collection);
				} else {
					//Legacy with older apps (Inkwell, Counter)
					this.onChangeHandler(value ,this.collection);
				}
			}
			else {
				squid_api.setBookmarkId(value);
				if (this.onSelect) {
					this.onSelect.call();
				}
			}
		},

		filterCollection: function(text) {
			var collection = this.jsonData.collection;
			for (i=0; i<collection.length; i++) {
				var item = this.jsonData.collection[i];
				for (ix=0; ix<item.bookmarks.length; ix++) {
					if (item.bookmarks[ix].label.toLowerCase().indexOf(text.toLowerCase()) >= 0) {
						item.bookmarks[ix].visible = true;
					} else {
						item.bookmarks[ix].visible = false;
					}
				}
				this.jsonData.collection[i] = item;
			}
			return this.jsonData;
		},

		eventSearch: function(event) {
			// obtain search box text
			var text = $(event.currentTarget).val();
			// filter collection
			var filteredCollection = this.filterCollection(text);
			// update list
			var listHtml = $(this.template(filteredCollection)).find(".list").last().html();
			this.$el.find(".list").last().html(listHtml);

			// this.bookmarkFolderStateCheck();
			if (text.length > 0) {
				this.templateWidgets("open");
			} else {
				this.templateWidgets();
			}
			if (this.afterRender) {
				this.afterRender.call(this);
			}
		},

		eventCreate : function() {
			var me = this;
			// create a new model
			var model = new this.collection.model();
			model.set("id", this.collection.parent.get("id"));
			var config = this.config.toJSON();
			delete config.bookmark;
			delete config.project;
			model.set("config",config);

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

		events : {
			"click .select" : function(event) {
				this.eventSelect(event);
			},
			"click .create" : function(event) {
				this.eventCreate(event);
			},
			"input .search" : function(event) {
				this.eventSearch(event);
			},
			'mouseenter tr': function(event) {
				this.eventMouseEnter(event);
			},
			'mouseleave tr': function(event) {
				this.eventMouseLeave(event);
			},
			"click .edit": function(event) {
				this.eventEdit(event);
			},
			"click .branch": function(event) {
				var path = $(event.currentTarget).attr("data-value");
				this.render(path);
			},
			"click .refresh": function(event) {
				this.eventRefresh(event);
			},
			"click .delete": function(event) {
				this.eventDelete(event);
			}
		},

		getSelectedModel : function(event) {
			var id = $(event.target).parents("li").attr("data-attr");
			var model = this.collection.get(id);
			return model;
		},

		getCreateRole: function() {
			// anyone can create a bookmark
			return true;
		},

		getPathLabel : function(model) {
			var path = model.get("path");
			if (path) {
				var user = path.indexOf("/USER/");
				if (user === 0) {
					path = path.substring(6);
					var userId;
					if (path.indexOf("/") > -1) {
						userId = path.substring(0,path.indexOf("/"));
						path = path.substring(path.indexOf("/"));
					} else {
						userId = path;
						path = "";
					}
					if (userId === squid_api.model.login.get("oid")) {
						// self
						path = "/My Bookmarks"+path;
					} else {
						path = "/Others Bookmarks"+path;
					}
				} else {
					var shared = path.indexOf("/SHARED");
					if (shared === 0) {
						if (path.length>7) {
							path = "/Shared Bookmarks/"+path.substring(8);
						} else {
							path = "/Shared Bookmarks";
						}
					}
				}
			}
			return path;
		},

		getModelLabel : function(model) {
			var name = model.get("name");
			var path = getPathLabel(model);
			if (path) {
				name = path +"/"+ name;
			}
			return name;
		},
		bookmarkFolderStateSet: function(item, action) {
			var project = this.config.get("project");
			var bookmarkFolderState = $.extend(true, {}, this.config.get("bookmarkFolderState"));
			if (action == "show") {
				if (bookmarkFolderState) {
					bookmarkFolderState[project] = item;
				} else {
					var obj = {};
					obj[project] = item;
					bookmarkFolderState = obj;
				}
			} else if (action == "hidden") {
				if (bookmarkFolderState) {
					delete bookmarkFolderState[project];
				}
			}
			this.config.set("bookmarkFolderState", bookmarkFolderState);
		},
		bookmarkFolderStateCheck: function() {
			var bookmarkFolderState = this.config.get("bookmarkFolderState");
			var project = this.config.get("project");
			// open folder if stored in config
			if (bookmarkFolderState) {
				if (bookmarkFolderState[project]) {
					this.$el.find("#" + bookmarkFolderState[project]).collapse('toggle');
				}
			}
		},
		render: function(activePath) {
			console.log("render CollectionManagementWidget "+this.type);
			var project = this.config.get("project");
			var bookmarkFolderState = this.config.get("bookmarkFolderState");

			this.jsonData = {
					collectionLoaded : !this.collectionLoading,
					collection : this.collection,
					roles : null,
					createRole : null,
					typeLabel : this.typeLabel,
					typeLabelPlural : this.typeLabelPlural,
					hierarchialList : this.hierarchialList,
					modalHtml : true,
					type : this.type
			};
			if (this.headerText) {
				this.jsonData.typeLabelPlural = this.headerText;
			}
			if (this.collection) {
				var collection = [];
				var models = [];
				var paths = [];
				this.jsonData.collection = {};
				this.jsonData.createRole = this.getCreateRole();

				var selectedId = this.config.get(this.configSelectedId);

				// store model data
				for (i=0; i<this.collection.size(); i++) {
					var item = this.collection.at(i);
					var validPath = false;
					if (this.filteredPaths === null) {
						validPath = true;
					} else {
						for (j=0; j<this.filteredPaths.length; j++) {
							if (this.filteredPaths[j] === item.get("path")) {
								validPath = true;
							}
						}
					}
					var validOid = false;
					if (this.filteredOids === null) {
						validOid = true ;
					} else {
						for (j=0; j<this.filteredOids.length; j++) {
							if (this.filteredOids[j] === item.get("oid")) {
								validOid = true;
							}
						}
					}
					if (validOid && validPath) {
						var bookmark = {
								label : item.get("name"),
								description : item.get("description")
						};

						//var existingPath = this.getModelLabel(item);
						var path =  this.getPathLabel(item);
						if (path) {
							var friendlyPath = path;

							// if multiple levels exist, remove the first folder from friendlypath
							if (friendlyPath.split("/").length > 1) {
								friendlyPath = friendlyPath.slice(friendlyPath.search(/.\//i) + 2);
							}

							// replace all '/' with '>'
							friendlyPath = friendlyPath.replace(/\//g, ' > ');

							// split friendlyPath to wrap styling divs
							var obj = friendlyPath.split(" ");
							var tmpString = "";
							for (var str in obj) {
								if (obj[str] == ">") {
									tmpString += "<span>" + obj[str] + "</span>";
								} else {
									tmpString += " " + obj[str];
								}
							}

							friendlyPath = tmpString;

							// see if path already exists
							var pathExists = false;
							for (ix=0; ix<collection.length; ix++) {
								if (collection[ix].path.value === path) {
									pathExists = true;
								}
							}
							if (! pathExists) {
								// store different paths
								paths.push(path);
								collection.push({
									"path" : {
										"value" : path,
										"userFriendlyName" : friendlyPath,
										"type" : path.substr(1).split(" ", 1)[0]
									},
									"bookmarks" : []
								});
							}

							// update collection models
							for (var x in collection) {
								if (collection[x].path.value == path) {
									if (bookmark.label !== null) {
										// copy model attributes
										for (var att in item.attributes) {
											bookmark[att] = item.get(att);
										}
										bookmark.roles = this.getModelRoles(item);
										bookmark.selected = (bookmark.oid === selectedId);
										bookmark.visible = true;
										bookmark.userFriendlyName = friendlyPath;
									}
									// store active folder
									if (activePath === collection[x].path.value) {
										collection[x].active = true;
									}
									collection[x].bookmarks.push(bookmark);
								}
							}
						}
					}
				}

				if (_.where(collection, {active: true}).length === 0 && collection.length > 0) {
					collection[0].active = true;
				}

				// sort bookmarks by label
				for (ix=0; ix<collection.length; ix++) {
					collection[ix].bookmarks = _.sortBy(collection[ix].bookmarks, 'label');
				}

				// store model view data
				collection.sort(function(a, b) {
					if (a.path.type==("Shared")) {
						if (b.path.type!=("Shared")) {
							return -1;
						}
					}
					if (b.path.type==("Shared")) {
						if (a.path.type!=("Shared")) {
							return 1;
						}
					}
					var textA = a.path.value.replace(/\//g, '').replace(/ /g, '').toUpperCase();
					var textB = b.path.value.replace(/\//g, '').replace(/ /g, '').toUpperCase();
					return (textA > textB) ? 1 : (textA < textB) ? -1 : 0;
				});
				this.jsonData.collection = collection;
				console.log(paths);
			}

			// render template
			var html = this.template(this.jsonData);
			this.$el.html(html);

			this.$el.find("input.search").focus();

			this.bookmarkFolderStateCheck();
			this.templateWidgets();

			return this;
		},
		templateWidgets: function(collapseState) {
			// hoverover
			if (this.descriptionHover) {
				this.$el.find("li").tooltip({
					placement: "top",
					trigger: "hover"
				});
			}
			// accordion & events
			this.$el.find(".collapse").on('hidden.bs.collapse', { context: this }, function (event) {
				var item = $(this).attr("id");
				event.data.context.bookmarkFolderStateSet(item, "hidden");
			});
			this.$el.find(".collapse").on('show.bs.collapse', { context: this }, function (event) {
				var item = $(this).attr("id");
				event.data.context.bookmarkFolderStateSet(item, "show");
			});

			if (collapseState == "open") {
				var folders = this.$el.find(".collapse");
				for (var i=0; i<folders.length; i++) {
					if ($(folders[i]).find("li").length > 0) {
						$(folders[i]).collapse('toggle');
					}
				}
			}
		}
	});

	return View;
}));
