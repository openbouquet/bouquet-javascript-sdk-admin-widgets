(function (root, factory) {
    root.squid_api.view.BookmarkSelectorButton = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_button_view);

}(this, function (Backbone, squid_api, template) {

    var View = squid_api.view.BookmarkCollectionManagementWidget.extend({

        displayName: false,
        displayPath: false,

        init : function(options) {
            if (options) {
                if (options.displayName) {
                    this.displayName = options.displayName;
                }
                if (options.displayPath) {
                    this.displayPath = options.displayPath;
                }
            }
            var me = this;
            this.listenTo(this.config,"change", this.renderButtonState);
        },
        
        render: function() {
            var label = this.typeLabelPlural;
            var jsonData = {
                label : label,
                usable : false,
                collectionLoaded : !this.collectionLoading,
                collection : this.collection,
                typeLabel : this.typeLabel,
                typeLabelPlural : this.typeLabelPlural
            };
            if (this.collection) {
                jsonData.usable = true;
            }

            this.$el.html(this.template(jsonData));

            this.renderButtonState();

            return this;
        },

        renderButtonState: function() {
            /* add a class when the current config matches the selected models config */
            if (this.selectedModel) {
                var match = true;
                var selectedModelConfig = this.selectedModel.get("config");
                var currentConfig = _.omit(this.config.toJSON(), "project", "bookmark");
                // ignore the order of the two configurations
                for (var x in currentConfig) {
                    if (JSON.stringify(selectedModelConfig[x]) !== JSON.stringify(currentConfig[x])) {
                        match = false;
                    }
                }
                if (this.displayName) {
                    this.$el.find(".squid-api-button-view").text(this.selectedModel.get("name"));
                }
                if (this.displayPath) {
                    var path = this.selectedModel.get("path").split("/");
                    var display = "";
                    for (i=2; i<path.length; i++) {
                        if (path[i].length > 0) {
                            display += path[i];
                            if (i !== path.length) {
                                display += " > ";
                            }
                        }
                    }
                    display += this.selectedModel.get("name");
                    this.$el.find("button").text(display);
                }
                if (match) {
                    this.$el.find("button").addClass("match");
                } else {
                    this.$el.find("button").removeClass("match");
                }
            }
        }

    });

    return View;
}));
