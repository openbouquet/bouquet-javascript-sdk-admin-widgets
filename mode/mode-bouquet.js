define("ace/mode/bouquet",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
	"use strict";

	var oop = require("../lib/oop");
	var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
	var TextMode = require("ace/mode/text").Mode;

	var HighlightRules = function() {
		var keywords = "ADD_MONTHS|ASC|CEIL|COSH|CURRENT|DAILY|DATE|DATE_ADD|DATE_INTERVAL|DATE_SUB|DATE_TRUNCATE|DAY|DAY_OF_WEEK|DAY_OF_YEAR|DEGREES|DESC|FLOOR|FOLLOWING|FROM_EPOCH|GREATEST|HOUR|HOURLY|JSON_ARRAY_LENGTH|JSON_EXTRACT_ARRAY_ELEMENT_TEXT|JSON_EXTRACT_PATH_TEXT|LEAST|LENGTH|LOWER|LPAD|LTRIM|MD5|MINUTE|MONTH|MONTHLY|MONTHS_BETWEEN|MONTLY|NULL|POSITION|POWER|PRECEDING|RADIANS|RAND|RANK|REGEXP_COUNT|REGEXP_INSTR|REGEXP_REPLACE|REGEXP_SUBSTR|REPLACE|REVERSE|ROUND|ROWNUMBER|ROWS|RPAD|RTRIM|SECOND|SIGN|SINH|SPLIT_PART|SUBSTRING|TANH|TO_CHAR|TO_DATE|TO_EPOCH|TO_INTEGER|TO_NUMBER|TO_TIMESTAMP|TRANSLATE|TRIM|TRUNC|UNBOUNDED|UNDEFINED|UPPER|WEEKLY|YEAR|YEARLY|and|begin|day|define|dimension|domain|end|goto|if|input|month|output|project|set|signal|state|token|week|year";
		this.$rules = {
			"start": [
				{token: "comment", regex: "\\/\\/.*$"},
				{token: "comment", regex: "\\/\\*", next : "comment"},
				{token: "string", regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'},
				{token: "string", regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"},
				{token: "constant.numeric", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"},
				{token: "lparen", regex: "[\\[(]"},
				{token: "rparen", regex: "[\\])]"},
				{token: "keyword", regex: "\\b(?:" + keywords + ")\\b"}
			],
			"comment": [
				{token: "comment", regex: ".*?\\*\\/", next : "start"},
				{token: "comment", regex: ".+"}
			]
		};
	};
	oop.inherits(HighlightRules, TextHighlightRules);
	
	var Mode = function() {
		this.HighlightRules = HighlightRules;
	};
	oop.inherits(Mode, TextMode);
	Mode.prototype.$id = "bouquet";
	Mode.prototype.getCompletions = function(state, session, pos, prefix) {
		return [];
	};
	
	return {
		Mode: Mode
	};
});
