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
                this.onChangeHandler(value ,this.collection);
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
            var listHtml = $(this.template(filteredCollection)).find(".list").html();
            this.$el.find(".list").html(listHtml);

            //this.bookmarkFolderStateCheck();
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
            var bookmarkFolderState = this.config.get("bookmarkFolderState");
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
        render: function() {
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
                                    collection[x].bookmarks.push(bookmark);
                                }
                            }
                        }
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
                for (i=0; i<folders.length; i++) {
                    if ($(folders[i]).find("li").length > 0) {
                        $(folders[i]).collapse('toggle');
                    }
                }
            }
        }
    });

    return View;
}));
