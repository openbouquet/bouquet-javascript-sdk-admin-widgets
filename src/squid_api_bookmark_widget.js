(function (root, factory) {
    root.squid_api.view.BookmarkWidget = factory(root.Backbone, root.squid_api);

}(this, function (Backbone, squid_api) {

    var View = Backbone.View.extend({

        initialize: function() {
            var bookmarkCollection = new squid_api.view.BookmarkCollectionManagementWidget({
                onSelect: function() {
                    bookmarkModal.close();
                }
            });

            var bookmarkModal = new squid_api.view.ModalView({
                view : bookmarkCollection
            });

            var bookmarkButton = new squid_api.view.BookmarkSelectorButton({
                el : this.$el
            });

            bookmarkButton.$el.click(function() {
                bookmarkModal.render();
            });
        }
    });

    return View;
}));
