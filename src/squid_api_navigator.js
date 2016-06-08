(function (root, factory) {
    root.squid_api.view.Navigator = factory(root.Backbone, root.squid_api);
}(this, function (Backbone, squid_api) {

    View = Backbone.View.extend( {

        template : squid_api.template.squid_api_navigator,
        config : null,
        hierarchy : {},
        filter : null,

        initialize : function(options) {
            
            // setup options
            if (options) {
                if (options.template) {
                    this.template = options.template;
                }
                if (options.config) {
                    this.config = options.config;
                }
                if (options.filter) {
                    this.filter = options.filter;
                }
            }
            // listeners
            if (!this.config) {
                this.config = squid_api.model.config;
            }
            if (this.model) {
                this.model.on('change', this.loadHierarchy, this);
                this.loadHierarchy();
            }
            
        },

        setModel : function(model) {
            this.model = model;
            this.initialize();
        },
                
        loadNode : function(parent, node, filter) {
            var me = this;
            if (filter) {
                var children = Object.keys(filter);
                if (children) {
                    parent.nodes = [];
                    for (var i = 0; i < children.length; i++) {
                        var childName = children[i];
                        var newNode = {
                            "name" : childName,
                            "nodes" : []
                        };
                        parent.nodes.push(newNode);
                        filter = filter[childName];
                        this.loadCollection(newNode, node, childName, filter);
                    }
                }
            }
        },
        
        loadHierarchy : function() {
            var me = this;
            this.hierarchy = {};
            me.loadNode(me.hierarchy, this.model, me.filter);
        },
        
        loadCollection : function(parent, node, child, filter) {
            var me = this;
            node.get(child).load().then(function(childCollection) {
                for (var i1=0; i1<childCollection.length; i1++) {
                    var childNode = childCollection.at(i1);
                    var id = childNode.get("id");
                    var newNode = {
                            "id" : id,
                            "name" : childNode.get("name"),
                            "description" : childNode.get("description"),
                            "url" : squid_api.utils.idToPath(id)
                    };
                    parent.nodes[i1] = newNode;
                    me.render();
                    me.loadNode(newNode, childNode, filter);
                }
            });
        },

        render : function() {
            this.$el.html(this.template(this.hierarchy));
            return this;
        }

    });

    return View;
}));
