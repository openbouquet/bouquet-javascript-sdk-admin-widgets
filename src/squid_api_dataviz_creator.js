(function (root, factory) {
    root.squid_api.view.DataVizCreator = factory(root.Backbone, root.squid_api, squid_api.template.squid_api_dataviz_creator);

}(this, function (Backbone, squid_api, template) {

    var View = Backbone.View.extend({
        template: null,
        model: null,

        initialize: function(options) {
            this.config = squid_api.model.config;
            this.status = squid_api.model.status;
            if (options.template) {
                this.template = options.template;
            } else {
                this.template = template;
            }
            if (options.model) {
                this.model = options.model;
            } else {
                console.warn("no analysis model passed to the widget");
            }
            this.listenTo(this.config,"change", this.renderCreator);
            this.listenTo(this.model,"change:results", this.renderPreview);

            this.renderBase();
        },

        events: {
            'click .apply': function() {
                this.saveViz();
                this.renderPreview();
            }
        },

        saveViz: function() {
            var body = this.editor.getSession().getValue();
            var model = this.model;

            if (model) {
                model.trigger("change:results", model);

                // set config
                var dataViz = this.config.get("dataviz");
                var arr = [];
                var length = 0;
                if (dataViz) {
                    arr = dataViz;
                    length = dataViz.length;
                }
                arr.push({id : "squid-dataviz-" + (length + 1), body: body});
                this.config.set("dataviz", arr);
            }
        },

        defaultVisulisation: function(analysis) {
            // remove any existing tables created
            d3.select('#squid-api-dataviz-creator-preview table').remove();
            console.log(analysis);
            // specify the rendering div
            var container = d3.select('#squid-api-dataviz-creator-preview');

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
        },

        renderPreview: function() {
            var body = this.editor.getSession().getValue();
            /*jslint evil: true */
            if (this.model.get("results")) {
                new Function('analysis', body)(this.model);
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
