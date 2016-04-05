(function (root, factory) {
    root.squid_api.view.BookmarkSaveWidget = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_bookmark_save_widget);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.BookmarkCollectionManagementWidget.extend({

        init : function(options) {
            var me = this;
            if (! options.template) {
                this.template = template;
            }
            this.listenTo(this.config,"change", this.render);
        },

        events: {
            "click .save": function(event) {
                this.saveBookmark();
            }
        },

        saveBookmark: function() {
            var me = this;
            var bookmark = this.config.get("bookmark");
            var collectionFiltered = this.collection.where({oid : bookmark});
            if (collectionFiltered.length > 0) {
                var bookmarkModel = collectionFiltered[0];
                bookmarkModel.set("config", this.config.toJSON());
                bookmarkModel.save({}, {
                    success: function() {
                        me.status.set({"message" : "Bookmark successfully saved"});
                    },
                    error: function() {
                        me.status.set('message', model.responseJSON.error);
                    }
                });
            }
        },

        render: function() {
            var jsonData = {
                usable : false
            };
            if (this.collection) {
                jsonData.usable = true;
            }

            this.$el.html(this.template(jsonData));

            return this;
        }
    });

    return View;
}));
