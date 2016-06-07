(function (root, factory) {
    factory(root.Backbone, root.squid_api);
}(this, function (Backbone, squid_api) {

    /*jshint multistr: true */

    squid_api.model.DomainModel.prototype.definition = "Domain";
    squid_api.model.DomainModel.prototype.ignoredAttributes = [
                                                               'accessRights', 'dimensions', 'metrics' ];
    squid_api.model.DomainModel.prototype.schema = {
            "id" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "hidden"
                    },
                    "domainId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control"
                    }
                },
                "editorClass" : "hidden",
                "fieldClass" : "id"
            },
            "name" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "name"
            },
            "description" : {
                "type" : "TextArea",
                "editorClass" : "form-control",
                "fieldClass" : "description"
            },
            "subject" : {
                "type" : "Object",
                "title" : "",
                "subSchema" : {
                    "value" : {
                        "title" : "Subject Value",
                        "type" : "DomainExpressionEditor",
                        "editorClass" : "form-control suggestion-box"
                    }
                },
                "position" : 1,
                "fieldClass" : "subject"
            }
    };

    squid_api.model.RelationModel.prototype.definition = "Relation";
    squid_api.model.RelationModel.prototype.ignoredAttributes = [ 'accessRights' ];
    squid_api.model.RelationModel.prototype.schema = {
            "id" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "title" : " ",
                        "editorClass" : "hidden"
                    },
                    "relationId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control"
                    }
                },
                "editorClass" : "hidden",
                "fieldClass" : "id"
            },
            "leftId" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "title" : " ",
                        "editorClass" : "hidden"
                    },
                    "domainId" : {
                        "options" : [],
                        "type" : "Select",
                        "editorClass" : "form-control",
                        "title" : "Left Domain"
                    }
                },
                "fieldClass" : "leftId"
            },
            "leftCardinality" : {
                "type" : "Select",
                "editorClass" : "form-control",
                "options" : [ "ZERO_OR_ONE", "ONE", "MANY" ],
                "fieldClass" : "leftCardinality"
            },
            "rightCardinality" : {
                "type" : "Select",
                "editorClass" : "form-control",
                "options" : [ "ZERO_OR_ONE", "ONE", "MANY" ],
                "fieldClass" : "rightCardinality"
            },
            "rightId" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "title" : " ",
                        "editorClass" : "hidden"
                    },
                    "domainId" : {
                        "options" : [],
                        "type" : "Select",
                        "editorClass" : "form-control",
                        "title" : "Right Domain"
                    }
                },
                "fieldClass" : "rightId"
            },
            "leftName" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "leftName"
            },
            "rightName" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "rightName"
            },
            "joinExpression" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "value" : {
                        "title" : "Join Expression",
                        "type" : "RelationExpressionEditor",
                        "editorClass" : "form-control suggestion-box"
                    }
                },
                "fieldClass" : "joinExpression"
            }
    };

    squid_api.model.DimensionModel.prototype.definition = "Dimension";
    squid_api.model.DimensionModel.prototype.ignoredAttributes = [
                                                                  'options', 'accessRights', 'dynamic', 'attributes',
                                                                  'valueType' ];
    squid_api.model.DimensionModel.prototype.schema = {
            "id" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "hidden"
                    },
                    "domainId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control"
                    },
                    "dimensionId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control"
                    }
                },
                "editorClass" : "hidden",
                "fieldClass" : "id"
            },
            "name" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "name"
            },
            "description" : {
                "type" : "TextArea",
                "editorClass" : "form-control",
                "fieldClass" : "description"
            },
            "type" : {
                "type" : "Checkboxes",
                "editorClass" : " ",
                "options" : [ {
                    "val" : "CATEGORICAL",
                    "label" : "Indexed"
                }, {
                    "val" : "CONTINUOUS",
                    "label" : "Period"
                } ],
                "position" : 1,
                "fieldClass" : "type checkbox"
            },
            "parentId" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "hidden",
                        "fieldClass" : "hidden"
                    },
                    "domainId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control",
                        "fieldClass" : "hidden"
                    },
                    "dimensionId" : {
                        "options" : [{val : null, label : " "}],
                        "type" : "Select",
                        "editorClass" : "form-control",
                        "title" : "Parent Dimension"
                    }
                },
                "position" : 2,
                "fieldClass" : "parentId"
            },
            "expression" : {
                "type" : "Object",
                title : "",
                "subSchema" : {
                    "value" : {
                        "type" : "DimensionExpressionEditor",
                        "editorClass" : "form-control suggestion-box",
                        "title" : "Expression Value",
                        "validators": ['required']
                    }
                },
                "position" : 3,
                "fieldClass" : "expression"
            }
    };

    squid_api.model.MetricModel.prototype.definition = "Metric";
    squid_api.model.MetricModel.prototype.schema = {
            "id" : {
                "title" : " ",
                "type" : "Object",
                "subSchema" : {
                    "projectId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "hidden"
                    },
                    "domainId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control"
                    },
                    "metricId" : {
                        "options" : [],
                        "type" : "Text",
                        "editorClass" : "form-control"
                    }
                },
                "editorClass" : "hidden",
                "fieldClass" : "id"
            },
            "dynamic" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "dynamic hidden"
            },
            "name" : {
                "type" : "Text",
                "editorClass" : "form-control",
                "fieldClass" : "name"
            },
            "description" : {
                "type" : "TextArea",
                "editorClass" : "form-control",
                "fieldClass" : "description"
            },
            "expression" : {
                "title" : "",
                "type" : "Object",
                "subSchema" : {
                    "value" : {
                        "title" : "Expression Value",
                        "type" : "MetricExpressionEditor",
                        "editorClass" : "form-control suggestion-box"
                    }
                },
                "position" : 1,
                "fieldClass" : "expression"
            }
    };

    // Define "dbCheckConnection" Custom Editor
    var dbCheckConnection = Backbone.Form.editors.Base.extend({

        tagName: 'button',
        defaultValue : "Check Connection",

        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);

            this.status = squid_api.model.status;
            this.config = squid_api.model.config;
            this.login = squid_api.model.login;
        },
        events: {
            "click" : "checkConnection"
        },

        checkConnection: function(event) {
            var me = this;

            // prevent redirect
            if (event) {
                event.preventDefault();
            }

            // add class for spinning wheel
            this.$el.addClass("in-progress");
            // collect prerequisites
            var dburl = this.form.fields.dbUrl.getValue();
            var dbPassword =  this.form.fields.dbPassword.getValue();
            var dbUser = this.form.fields.dbUser.getValue();
            var id = this.form.fields.id.getValue();
            var url = squid_api.apiURL + "/connections/validate" + "?access_token="+this.login.get("accessToken")+"&url="+dburl+"&username="+ dbUser +"&password=" + encodeURIComponent(dbPassword);
            if (id && id.projectId) {
                url = url + "&projectId="+id.projectId;
            }

            $.ajax({
                type: "GET",
                url: url,
                dataType: 'json',
                contentType: 'application/json',
                success: function (response) {
                    me.status.set({"error":null});
                    me.$el.removeClass("in-progress");
                    me.$el.removeClass("btn-danger");
                    me.$el.addClass("btn-success");
                    me.form.fields.dbSchemas.editor.setOptions(response.definitions);
                    me.form.fields.dbSchemas.$el.show();
                },
                error: function(xhr, textStatus, error){
                    me.status.set({"error":xhr});
                    me.$el.removeClass("in-progress");
                    me.$el.removeClass("btn-success");
                    me.$el.addClass("btn-danger");
                    me.form.fields.dbSchemas.$el.hide();
                }

            });
        },
        render: function() {
            this.setValue(this.value);

            return this;
        },

        getValue: function() {
            return this.$el.html();
        },

        setValue: function(value) {
            this.$el.html(value);
        }
    });

    // Define "baseExpressionEditor" Custom Editor
    var baseExpressionEditor = Backbone.Form.editors.Base.extend({
        tagName: 'textarea',
        modelId: null,

        events: {
            'keyup' : 'renderDialog',
            'click' : 'renderDialog'
        },

        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            if (options.schema.modelId) {
                this.modelId = options.schema.modelId;
            }
        },

        getValue: function() {
            return this.$el.val();
        },

        setValue: function(value) {
            this.$el.val(value);
        },

        render: function() {
            this.setValue(this.value);

            return this;
        },

        performRequest: function(url, data) {
            var me = this;
            var request = $.ajax({
                type: "GET",
                url: url,
                dataType: 'json',
                data: data,
                success:function(response) {
                    // remove any existing suggestions dialogs
                    me.$el.parents().find(".squid-api-pre-suggestions").dialog("destroy").remove();
                    // detemine if there is an error or not
                    if (response.validateMessage.length === 0) {
                        me.$el.removeClass("invalid-expression").addClass("valid-expression");
                    } else {
                        me.$el.removeClass("valid-expression").addClass("invalid-expression");
                    }
                    // append box if definitions exist
                    if (response.suggestions && response.suggestions.length > 0) {
                        // store offset
                        var beginRange = me.$el.prop("selectionStart");
                        var endRange = me.$el.prop("selectionEnd")-1;
                        if (response.beginInsertPos !== undefined && response.endInsertPos !== undefined) {
                            if (response.beginInsertPos<beginRange) {
                                beginRange = response.beginInsertPos;
                            }
                            if (endRange<response.endInsertPos) {
                                endRange = response.endInsertPos;
                            }
                        }
                        // append div
                        me.$el.after("<div class='squid-api-pre-suggestions squid-api-dialog'><ul></ul></div>");
                        var suggestionList = me.$el.siblings(".squid-api-pre-suggestions").find("ul");
                        for (i=0; i<response.suggestions.length; i++) {
                            var suggestionDisplay = response.suggestions[i].suggestion;
                            if (response.suggestions[i].display) {
                                suggestionDisplay = response.suggestions[i].display;
                            }
                            var item = $("<li class=\"" + response.suggestions[i].objectType.toString() + " " + response.suggestions[i].valueType.toLowerCase() + "\"><span class='suggestion'>" +  suggestionDisplay + "</span><span class='valueType'>(" + response.suggestions[i].valueType.toLowerCase() + ")</span></li>");
                            item.data("suggestion-value",response.suggestions[i].suggestion);
                            item.appendTo(suggestionList);
                        }
                        me.$el.siblings(".squid-api-pre-suggestions").find("li").click(me, function(event) {
                            var item;
                            if ($(event.target).is("li")) {
                                item = $(event.target).data("suggestion-value");
                            } else {
                                item = $(event.target).closest("li").data("suggestion-value");
                            }
                            var value = me.$el.val();
                            var str = value.substring(0, beginRange);
                            str += item;
                            var newPos = str.length;
                            str += value.substring(endRange+1);
                            me.setValue(str);
                            me.renderDialog();
                            me.$el[0].setSelectionRange(newPos,newPos);
                        });
                        me.$el.siblings(".squid-api-pre-suggestions").dialog({
                            dialogClass: "squid-api-suggestion-dialog squid-api-dialog",
                            width: "auto",
                            position: { my: "left top", at: "left bottom", of: me.$el },
                            open: function() {
                                $(this).width($(me.el).width());
                            },
                            clickOutside: true, // clicking outside the dialog will close it
                            clickOutsideTrigger: me.$el, // Element (id or class) that triggers the dialog opening
                        });
                    } else {
                        // set message
                        squid_api.model.status.set("message", response.validateMessage);
                    }
                    me.$el.focus();
                },
                error: function(response) {
                    if (response.responseJSON.error) {
                        squid_api.model.status.set({'message' : response.responseJSON.error});
                    } else {
                        squid_api.model.status.set({'error' : response});
                    }
                }
            });
        }
    });

    var AceExpressionEditor = Backbone.Form.editors.Base.extend({
        tagName: 'textarea',
        modelId: null,
        edit: null,
        type: null,

        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            if (options.schema.modelId) {
                this.modelId = options.schema.modelId;
            }
            this.template = options.template || this.constructor.template;
        },

        getValue: function() {
            return this.edit.getValue();
        },

        setValue: function(value) {
            this.edit.setValue(value);
        },

        uniq: function(a) {
            var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

            return a.filter(function(item) {
                var type = typeof item;
                if(type in prims)
                    return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
                else
                    return objs.indexOf(item) >= 0 ? false : objs.push(item);
            });
        },

        editor: function() {
            this.edit = ace.edit("expression-editor");
            this.edit.$blockScrolling = Infinity;
            if(this.value !== null){
                this.edit.setValue(""+this.value);
            }

            this.edit.getSession().setMode("ace/mode/bouquet");

            var me = this;
            var langTools = ace.require("ace/ext/language_tools");
            this.edit.setOptions({ enableBasicAutocompletion: true, enableLiveAutocompletion:true, enableSnippets:true});
            var bouquetCompleter = {
                getCompletions: function (editor, session, pos, prefix, callback) {
                    if (prefix.length === 0) {
                        //By default look for ID
                        prefix="'";
                    }
                    squid_api.getSelectedProject().then(function (project) {

                        if (me.type === null || me.type === "domains") {
                            me.url = squid_api.apiURL + "/projects/" + project.id + "/domains-suggestion?access_token=" + squid_api.model.login.get("accessToken") + "&expression=" + encodeURIComponent(prefix);
                            $.getJSON(
                                me.url,

                                function (suggestionList) {
                                    //{"suggestions":[{"display":"POWER(Numeric n,Numeric exponent)","description":"Function that take two arguments: a number and an exponent","caption":"POWER(Numeric n,Numeric exponent)","suggestion":"POWER(${1:n},${2:p})","objectType":"FORMULA","valueType":"NUMERIC"}],"definitions":["POWER(${1:n},${2:p})"],"validateMessage":"failed to parse expression:\n---\nPOWE\n\n---\n at token 'POWE' \n caused by Encountered \"<EOF>\" at line 1, column 4.\nWas expecting:\n    \"(\" ...\n    ","filterIndex":0,"beginInsertPos":0,"endInsertPos":2,"filter":"POW"}
                                    callback(null, me.uniq( suggestionList.suggestions.map(function (ea) {
                                        return {
                                            name: ea.display,
                                            caption: ea.caption,
                                            value: ea.suggestion,
                                            snippet: ea.suggestion,
                                            description: ea.description,
                                            score: ea.ranking,
                                            meta: ea.valueType,
                                            className: ea.objectType.toUpperCase()+ " ."+ea.valueType.toLowerCase()
                                        };
                                    }) )) ;
                                }
                            );
                        } else {
                            squid_api.getSelectedDomain().then(function (domain) {
                                me.url = squid_api.apiURL + "/projects/" + project.id + "/domains/" + domain.id + "/" + me.type + "-suggestion?access_token=" + squid_api.model.login.get("accessToken") + "&expression=" + encodeURIComponent(prefix);
                                $.getJSON(
                                    me.url,

                                    function (suggestionList) {
                                        //{"suggestions":[{"display":"POWER(Numeric n,Numeric exponent)","description":"Function that take two arguments: a number and an exponent","caption":"POWER(Numeric n,Numeric exponent)","suggestion":"POWER(${1:n},${2:p})","objectType":"FORMULA","valueType":"NUMERIC"}],"definitions":["POWER(${1:n},${2:p})"],"validateMessage":"failed to parse expression:\n---\nPOWE\n\n---\n at token 'POWE' \n caused by Encountered \"<EOF>\" at line 1, column 4.\nWas expecting:\n    \"(\" ...\n    ","filterIndex":0,"beginInsertPos":0,"endInsertPos":2,"filter":"POW"}
                                        callback(null, me.uniq( suggestionList.suggestions.map(function (ea) {
                                            return {
                                                name: ea.display,
                                                caption: ea.caption,
                                                value: ea.suggestion,
                                                snippet: ea.suggestion,
                                                description: ea.description,
                                                score: ea.ranking,
                                                meta: ea.valueType,
                                                className: ea.objectType.toUpperCase()+ " ."+ea.valueType.toLowerCase()
                                            };
                                        })));
                                    }
                                );
                            });
                        }

                        });

                },
                getDocTooltip: function(item) {
                    if (!item.docHTML) {
                        if(item.description !== null && item.name !== null)
                            item.docHTML = [
                                "<b>", /*lang.escapeHTML*/item.name, "</b>", "<hr></hr>",
                                /*lang.escapeHTML*/item.description
                            ].join("");
                    }
                },
                identifierRegexps: [/[a-zA-Z_0-9\$\#\@\'\.\-\:\_]/]
            };
            langTools.addCompleter(bouquetCompleter);
            //Overriding the complters;
            me.edit.completers=[bouquetCompleter];
        },

        onSave: function(model) {
            console.log(this.value);
        },


        render: function() {
            var me = this;

            var $el = $(this.template());
            this.setElement($el);


            setTimeout(function() {
                me.editor();
            }, 0);

            return this;
        },

        performRequest: function(url, data) {
            console.log("perform");
        }
    }, {
        template: _.template('<div id="expression-editor" style="height: 50px;"></div>', null, this.templateSettings)
    });

    var MetricExpressionEditor = AceExpressionEditor.extend({
        type: 'metrics'
    });

    var DimensionDomainExpressionEditor = AceExpressionEditor.extend({
        type: 'dimensions'
    });




    var domainExpressionEditor = AceExpressionEditor.extend({
        renderDialog: function() {
            var url = squid_api.apiURL + "/projects/" + this.$el.parents("form").find(".id input[name='projectId']").val() + "/domains-suggestion";
            var data = {"expression" : this.$el.val(), "offset" : this.$el.prop("selectionStart") + 1, "access_token" : squid_api.model.login.get("accessToken")};
            this.performRequest(url, data);

        }
    });
    var dimensionExpressionEditor = DimensionDomainExpressionEditor.extend({
        renderDialog: function() {
            var url = squid_api.apiURL + "/projects/" + this.$el.parents("form").find(".id input[name='projectId']").val() + "/domains/" + this.$el.parents("form").find(".id input[name='domainId']").val() + "/dimensions-suggestion";
            var data = {"expression" : this.$el.val(), "offset" : this.$el.prop("selectionStart") + 1, "access_token" : squid_api.model.login.get("accessToken")};
            data.dimensionId = this.modelId;
            this.performRequest(url, data);

        }
    });
    var metricExpressionEditor = MetricExpressionEditor.extend({
        renderDialog: function() {
            var url = squid_api.apiURL + "/projects/" + this.$el.parents("form").find(".id input[name='projectId']").val() + "/domains/" + this.$el.parents("form").find(".id input[name='domainId']").val() + "/metrics-suggestion";
            var data = {"expression" : this.$el.val(), "offset" : this.$el.prop("selectionStart") + 1, "access_token" : squid_api.model.login.get("accessToken")};
            this.performRequest(url, data);

        }
    });
    var relationExpressionEditor = baseExpressionEditor.extend({
        renderDialog: function() {
            var url = squid_api.apiURL + "/projects/" + this.$el.parents("form").find(".id input[name='projectId']").val() + "/relations-suggestion";
            var data = {"expression" : this.$el.val(), "offset" : this.$el.prop("selectionStart") + 1, "access_token" : squid_api.model.login.get("accessToken")};
            data.leftDomainId = this.$el.parents("form").find(".leftId select[name='domainId']").val();
            data.rightDomainId = this.$el.parents("form").find(".rightId select[name='domainId']").val();
            this.performRequest(url, data);

        }
    });

    // Register custom editors
    Backbone.Form.editors.DomainExpressionEditor = domainExpressionEditor;
    Backbone.Form.editors.DimensionExpressionEditor = dimensionExpressionEditor;
    Backbone.Form.editors.MetricExpressionEditor = metricExpressionEditor;
    Backbone.Form.editors.RelationExpressionEditor = relationExpressionEditor;
    Backbone.Form.editors.DbCheckConnection = dbCheckConnection;
}));
