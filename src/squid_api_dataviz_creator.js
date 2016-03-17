(function (root, factory) {
    root.squid_api.view.DataVizCreator = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_dataviz_creator);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({
        template: null,
        model: null,
        bookmarks: null,
        onEditorToggleChange: null,
        dataVizEl : "squid-api-dataviz-creator-preview",

        initialize: function(options) {
            this.config = squid_api.model.config;
            this.status = squid_api.model.status;
            if (options.template) {
                this.template = options.template;
            } else {
                this.template = template;
            }
            if (options.bookmarks) {
                this.bookmarks = options.bookmarks;
            } else {
                this.bookmarks = new squid_api.view.BookmarkCollectionManagementWidget({

                });
            }
            if (options.onEditorToggleChange) {
                this.onEditorToggleChange = options.onEditorToggleChange;
            }
            if (options.model) {
                this.model = options.model;
            } else {
                console.warn("no analysis model passed to the widget");
            }

            this.listenTo(this.config,"change:bookmark", this.widgetToggle);
            this.listenTo(this.config,"change:dataviz", this.renderCreator);
            this.listenTo(this.model,"change:results", this.renderPreview);

            this.renderBase();
        },

        events: {
            'click .apply': function(event) {
                this.renderPreview();
            },
            'click .editor-toggle': function() {
                // store editor / preview div's
                var editor = this.$el.find(".editor-container #squid-api-dataviz-creator-editor");
                var applyBtn = this.$el.find(".editor-container .apply");
                var preview = this.$el.find(".preview-container");
                var button = $(event.currentTarget).find("button.editor-toggle");
                var buttonText;
                var hidden = false;

                // manipulate divs
                if (! editor.hasClass("hidden")) {
                    hidden = true;
                    editor.addClass("hidden");
                    applyBtn.addClass("hidden");

                    // expand preview to 100%
                    preview.removeClass("col-md-6");
                    preview.addClass("col-md-12");

                    buttonText = "Show Editor";
                } else {
                    editor.removeClass("hidden");
                    applyBtn.removeClass("hidden");

                    // revert to 50/50
                    preview.removeClass("col-md-12");
                    preview.addClass("col-md-6");

                    buttonText = "Hide Editor";
                }

                if (this.onEditorToggleChange) {
                    this.onEditorToggleChange.call(this, hidden);
                }

                // update button text
                button.text(buttonText);
            },
            'click .save': function(event) {
                this.saveViz(event);
            }
        },

        widgetToggle: function() {
            var bookmark = this.config.get("bookmark");
            if (bookmark) {
                this.$el.find(".overlay").remove();
            } else {
                this.$el.find(".squid-api-dataviz-creator").append("<div class='overlay'></div>'");
            }
        },

        afterSave: function() {

        },

        saveViz: function(e) {
            var me = this;

            var bookmarkCollection = this.bookmarks;
            var bookmark = this.config.get("bookmark");

            var editorBody = this.editor.getSession().getValue();
            var vizName = this.$el.find(".viz-name").val();

            if (vizName.length !== 0 && bookmark) {
                if (bookmarkCollection) {
                    var bookmarkModel = bookmarkCollection.collection.where({oid : bookmark})[0];
                    var bookmarkModelConfig = $.extend(true, {}, bookmarkModel.get("config"));
                    var bookmarkName = bookmarkModel.get("name") + "_" + vizName;

                    // disable button
                    $(e.currentTarget).attr("disabled", true);

                    // store bookmark
                    var arr = [{id : vizName, body: editorBody}];
                    bookmarkModelConfig.dataviz = arr;

                    if (bookmarkModel.get("config").dataviz) {
                        // dataviz exists
                        if (_.where(bookmarkModel.get("config").dataviz, {id : vizName}).length > 0) {
                            // overwrite existing dataviz
                            bookmarkModel.save({"config" : bookmarkModelConfig}, {success: function(m) {
                                me.status.set("message", vizName + " has been updated within bookmark '" + m.get("name") + "'");
                                // enable button
                                $(e.currentTarget).attr("disabled", false);
                            }});
                        } else {
                            // create a new bookmark with the new dataviz inside
                            var newBookmarkModel = new squid_api.model.BookmarkModel();
                            newBookmarkModel.set({
                                "id" : {
                                    projectId: this.config.get("project")
                                },
                                "name" : bookmarkName,
                                "config" : bookmarkModelConfig
                            });
                            newBookmarkModel.save({"config" : bookmarkModelConfig}, {success: function(m) {
                                me.bookmarks.collection.add(m);
                                // set new bookmark as current one
                                squid_api.setBookmarkId(m.get("oid"));
                                
                                me.status.set("message", bookmarkName + " has been saved as a new bookmark");
                                // enable button
                                $(e.currentTarget).attr("disabled", false);
                            }});
                        }
                    } else {
                        // save in current bookmark
                        bookmarkModel.save({"config" : bookmarkModelConfig}, {success: function(m) {
                            me.bookmarks.collection.add(m);
                            me.status.set("message", vizName + " has been saved to bookmark '" + m.get("name") + "'");
                            // enable button
                            $(e.currentTarget).attr("disabled", false);
                        }});
                    }

                    // set config
                    this.config.set("dataviz", arr);
                }
            } else {
                this.status.set("message", "please specify a name for your visulisation");
            }
        },

        defaultVisulisation: function(analysis) {
            // remove any existing tables created
            d3.select('#'+el+' table').remove();
            console.log(analysis);
            // specify the rendering div
            var container = d3.select('#'+el);

            // create table & append table headers
            container.append('table')
                .append('thead')
                .append('tr');

            // store our created table
            var table = container.select('table');

            // insert table header data
            table.select("thead tr")
                .selectAll("th")
                .data(analysis.get("results").cols)
                .enter()
                .append("th")
                .text(function(d) {
                    return d.name;
                });

            // insert table body
            table.append('tbody');

            // insert table body data
            table.select("tbody")
                .selectAll("tr")
                .data(analysis.get("results").rows)
                .enter()
                .append("tr").selectAll("td")
                .data(function(d) {
                    return d.v;
                })
                .enter()
                .append("td")
                .text(function(d) {
                    return d;
                });
        },

        editorContents: function(dataviz) {
            var entire = this.defaultVisulisation.toString();
            var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
            if (dataviz) {
                body = dataviz;
            }
            return body;
        },

        renderBase: function() {
            this.$el.html(this.template());
            this.renderCreator();
        },

        renderPreview: function() {
            var body = this.editor.getSession().getValue();

            // empty existing dataviz
            $("#" + this.dataVizEl).empty();

            /*jslint evil: true */
            if (this.model.get("results")) {
                new Function('analysis', 'el', body)(this.model, this.dataVizEl);
            }
        },

        renderCreator: function() {
            // set up editor
            this.editor = ace.edit("squid-api-dataviz-creator-editor");
            var body = null;
            this.editor.getSession().setMode("ace/mode/javascript");
            if (this.config.get("dataviz")) {
                body = this.config.get("dataviz")[0].body;
            }
            this.editor.getSession().setValue(this.editorContents(body));

            return this;
        }
    });

    return View;
}));
