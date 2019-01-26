/*jshint esversion: 6 */
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
        excludedPaths: null,
        excludedOids: null,
        onChangeHandler : null,
        descriptionHover : null,
        returnPaths: null,
        hierarchialList: false,
        disableRightClickOnSelect: null,
        searchText: "",

        init : function(options) {
            var me = this;
            this.modelView = squid_api.view.BookmarkModelManagementWidget;

            if (options.headerText) {
                this.headerText = options.headerText;
            }
            if (options.config) {
                this.config = options.config;
            }
            if (options.configSelectedId) {
                this.configSelectedId = options.configSelectedId;
            }
            if (options.filteredPaths) {
                this.filteredPaths = options.filteredPaths;
            }
            if (options.filteredOids) {
                this.filteredOids = options.filteredOids;
            }
            if (options.excludedPaths) {
                this.excludedPaths = options.excludedPaths;
            }
            if (options.excludedOids) {
                this.excludedOids = options.excludedOids;
            }
            if (options.onChangeHandler) {
                this.onChangeHandler = options.onChangeHandler;
            }
            if (options.returnPaths) {
                this.returnPaths = options.returnPaths;
            }
            if (options.descriptionHover) {
                this.descriptionHover = options.descriptionHover;
            }
            if (options.hierarchialList) {
                this.hierarchialList = options.hierarchialList;
            }
            if (options.disableRightClickOnSelect) {
                this.disableRightClickOnSelect = options.disableRightClickOnSelect;
            }
        },

        loadCollection : function(parentId) {
            return squid_api.getCustomer().then(function(customer) {
                return customer.get("projects").load(parentId).then(function(project) {
                    return project.get("bookmarks").load();
                });
            });
        },

        statusUpdate: function() {
            var status = this.status.get("status");
            if (status === "RUNNING") {
                this.$el.find("a").addClass("disabled");
            } else {
                this.$el.find("a").removeClass("disabled");
            }
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
        select : function(value) {
            if (this.onChangeHandler) {
                if (squid_api.model.config && value != squid_api.model.config.get("bookmark")) {
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
        eventSelect : function(event) {
            if (! $(event.target).hasClass("disabled")) {
                var value = $(event.target).parents("li").attr("data-attr");
                if (! value) {
                    value = $(event.target).attr("data-attr");
                }
                //Callback to keep filters selection on Counter apps for ex
                this.select(value);
            } else {
                event.preventDefault();
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
        	var me = this;
        	//setTimeout(function() {
                me.searchText = $(event.currentTarget).val();
                // filter collection
                var filteredCollection = me.filterCollection(me.searchText);
            	if (me.hierarchialList) {
                    // update list
            		me.render();
                    if (me.searchText.length > 0) {
	            		filteredCollection = $("#bookmark-tree").treeview('search', me.searchText, {
	                    	  ignoreCase: true,     // case insensitive
	                    	  exactMatch: false,    // like or equals
	                    	  revealResults: true,  // reveal matching nodes
	                    	});   
	            		if (filteredCollection.length === 0) {
	                    	me.render();
	            		}
                   }
            	} else {
                    var listHtml = $(me.template(filteredCollection)).find(".list").last().html();
                    me.$el.find(".list").last().html(listHtml);

                    if (me.searchText.length > 0) {
                    	me.templateWidgets("open");
                    } else {
                    	me.templateWidgets();
                    }
                    if (me.afterRender) {
                    	me.afterRender.call(me);
                    }
            	}
        	//}, 500);
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
        bookmarkFolderState: function(item) {
            if (item || item === 0) {
                this.$el.find("#bookmark-collapse-" + item).collapse('toggle');
            }
        },
        selectTree: function(data) {
        	if (typeof data.parentId !== "undefined") {
        		this.selectTree($("#bookmark-tree").treeview("getParent", data.nodeId));
        	}
        	data.state.selected=false;
    		$("#bookmark-tree").treeview("expandNode", [ data.nodeId, { silent: true } ]);
        },
        onNodeSelected: function(data) {
        	if (data.id) {
            	this.select(data.id);
            	window.location.href=data.href;
        	} else {
        		var expanded = data.state.expanded;
        		$("#bookmark-tree").treeview("collapseAll", { silent: true });
    			this.selectTree(data);
    			if (expanded === true) {
            		$("#bookmark-tree").treeview("collapseNode", [ data.nodeId, { silent: true } ]);
        		}
        	}
        },
        render: function(activePath) {
        	var me=this;
            console.log("render CollectionManagementWidget "+this.type);
            var project = this.config.get("project");
            var currentBookmark = this.config.get("bookmark");
            var selectedId = this.configSelectedId;
            if (this.config.has("bookmark") && this.configSelectedId === "bookmark") {
            	selectedId = currentBookmark;
            }
        	var hierarchy = [];
            var indexToOpen = 0;

            this.jsonData = {
                collectionLoaded : !this.collectionLoading,
                collection : this.collection,
                roles : null,
                createRole : null,
                typeLabel : this.typeLabel,
                typeLabelPlural : this.typeLabelPlural,
                hierarchialList : this.hierarchialList,
                modalHtml : true,
                type : this.type,
                searchText: this.searchText
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
                var types = [];

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
                    if (this.excludedPaths !== null) {
                        for (j=0; j<this.excludedPaths.length; j++) {
                            if (this.excludedPaths[j] === item.get("path")) {
                                validPath = false;
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
                    if (this.excludedOids !== null) {
                        for (j=0; j<this.excludedOids.length; j++) {
                            if (this.excludedOids[j] === item.get("oid")) {
                                 validOid = false;
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
                                const bbType = path.substr(1).split(" ", 1)[0];
	                    		var test = types.find(
	                    				elt => elt === bbType
	                    		);
	                    		if (typeof test === "undefined") {
	                    			types.push(bbType);
	                    		}
                                collection.push({
                                    "path" : {
                                        "value" : path,
                                        "userFriendlyName" : friendlyPath,
                                        "type" : bbType
                                    },
                                    "bookmarks" : [],
                                    "currentBookmarkInside": false,
                                    "active": false
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
                                    if (currentBookmark === bookmark.oid) {
                                        collection[x].currentBookmarkInside = true;
                                    }
                                    collection[x].bookmarks.push(bookmark);
                                }
                            }
                        }
                    }
                }
                if (collection) {
                    // if no active collection, open the parent folder of currently selected bookmark
                    if (typeof activePath === "undefined" || ! activePath) {
                    	indexToOpen = _.indexOf(_.pluck(collection, 'currentBookmarkInside'), true);
                        if (indexToOpen === -1) {
                            indexToOpen = 0;
                        }
                        collection[indexToOpen].active=true;
                        activePath = collection[indexToOpen].path.value;
                    }
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
                if (_.where(collection, {active: true}).length === 0 && collection.length > 0) {
                    collection[0].active = true;
                }
                if (this.hierarchialList === true)  {
                    for (i=0; i<collection.length; i++) {
                    	var collectionPaths = collection[i].path.value.split("/");
                    	var current = hierarchy;
                    	var node;
                    	var localPath = "";
                    	var fullPath = "";
                    	var skip = (types.length <= 1?1:0);
                    	for (j=0; j<collectionPaths.length; j++) {
                    		const col = collectionPaths[j];
                    		if ("" !== col && skip === 0) {
 	                    		node = current.find(
	                    				elt => elt.text === col
	                    		);
	                    		var test1 = activePath.indexOf(fullPath + "/" + col);
	                    		localPath = localPath + "/" + col;
	                    		if (typeof node === "undefined") {
	                    			current.push({ 
	                    				text: col, 
	                    				value: localPath, 
	                    				type: collection[i].path.type,
	                    				nodes:[],
		                    			path: fullPath,
                                	    selectable: false,
		                    			state: {
		                                	    checked: false,
		                                	    disabled: false,
		                                	    expanded: activePath.indexOf(fullPath + "/" + col) === 0,
		                                	    selected: false
		                                	}
	                    				});
	                    			current = current[current.length-1].nodes;
	                    		} else {
	                    			current = node.nodes;
	                    		}
                    		}
                   			if ("" !== col && skip>0) {
                				skip--;
                			}
                   			if ("" !== col) {
                   				fullPath = fullPath + "/" + col;
                   			}	
                    	} 
                    	for (j=0; j<collection[i].bookmarks.length; j++) {
                    		current.push({
                    			text: collection[i].bookmarks[j].name, 
                    			href: "#analytics/projects/"+collection[i].bookmarks[j].id.projectId+"/bookmarks/"+collection[i].bookmarks[j].id.bookmarkId,
                    			id: collection[i].bookmarks[j].id.bookmarkId,
                    			path: fullPath,
                    			state: {
                                	    checked: false,
                                	    disabled: false,
                                	    expanded: activePath.indexOf(fullPath) === 0 ,
                                	    selected: collection[i].bookmarks[j].id.bookmarkId === currentBookmark
                                	}
                    		});
                    	}                    	
                    }

                }
                this.jsonData.collection = collection;
                if (this.returnPaths) {
                    this.returnPaths.call(paths);
                }
            }

            // render template
            var html = this.template(this.jsonData);
            this.$el.html(html);
            if (this.hierarchialList === true)  {
            	var tree = this.$("#bookmark-tree");
            	tree.treeview({
            		data: hierarchy,
            		collapseIcon: "glyphicon glyphicon-folder-open",
            		expandIcon: "glyphicon glyphicon-folder-close",
            		selectedColor: "#ee7914",
            		selectedBackColor: "transparent",
            		searchResultColor: "#800000",
            		emptyIcon: "glyphicon glyphicon-chevron-right",
            		backColor: "transparent",
            		showBorder: false,
            		onNodeSelected: function(event, data) {
                        if (me.onNodeSelected) {
                            me.onNodeSelected(data);
                        }
                    },
            		onNodeUnselected: function(event, data) {
                        if (me.onNodeSelected) {
                            me.onNodeSelected(data);
                        }
                    }         	

            	});
            }
 
            this.$el.find("input.search").val("").focus();
            this.$el.find("input.search").val(this.searchText);

            this.statusUpdate();

            if (this.jsonData.collection) {
                this.bookmarkFolderState(indexToOpen);
                this.templateWidgets();
            }
            if (typeof $.i18n !== "undefined") {
            	this.$el.localize();
            }
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
