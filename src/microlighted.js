/**
 * @fileoverview microlighted - syntax highlightning library
 * @version 0.1.0
 *
 * @license MIT, see http://github.com/dasmurphy/microlighted
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports'], factory);
	} else if (typeof exports !== 'undefined') {
		factory(exports);
	} else {
		factory((root.microlight = {}));
	}
}(this, function (exports) {
	"use strict";

	var highlight = function(element) {
		var text = element.textContent;
		var pos = 0;
		var next1 = text[0];
		var chr = 1;
		var lf = 0;
		var prev1;
		var prev2;
		var lastToken;
		var lastTokenType;
		var lastStruct;
		var multichar;
		var node;
		var tokens = [];
		var braces = [];
		var braceCount = 0;
		var bracesOpen = 0;
		var bracesClose = 0;
		var isPhp = false;

		// current token type:
		// - anything else (whitespaces / newlines)
		// - linefeed (disabled for now)
		// comment types
		// - xml comment  <!-- -->
		// - multiline comment /* */
		// - single-line comment starting with two slashes //
		// - single-line comment starting with hash #
		// other
		// - operator
		// - opening braces
		// - closing braces (after which '/' is division not regex)
		// - (key)word (html, javascript, other)
		// strings and regex
		// - regex
		// - string starting with "
		// - string starting with '
		// numbers
		// - numbers with optional trailing characters
		// - hex number with # and minimum of 3 characters
		var tokenTypesCount = 0;
		var tokenTypes = {
			whitespace: tokenTypesCount++,
			// linefeed: tokenTypesCount++,
			operator: tokenTypesCount++,
			operator2: tokenTypesCount++,
			openbrace: tokenTypesCount++,
			closebrace: tokenTypesCount++,
			keyword: tokenTypesCount++,
			regex: tokenTypesCount++,
			stringdouble: tokenTypesCount++,
			stringsingle: tokenTypesCount++,
			xmlcomment: tokenTypesCount++,
			slashcomment: tokenTypesCount++,
			slashstarcomment: tokenTypesCount++,
			hashcomment: tokenTypesCount++,
			number: tokenTypesCount++,
			hexnumber: tokenTypesCount++,
			none: tokenTypesCount++
		}
		// TODO add classes from string lists in keywords

		var token = '';
		var tokenType = 0;

		// clear content
		element.innerHTML = '';

		while (prev2 = prev1,
			   // escaping if needed (with except for comments)
			   // pervious character will not be therefore
			   // recognized as a token finalize condition
			   prev1 = ((tokenType<7)&&(prev1=='\\'))?1:chr // TODO tokenType abfrage anpassen
		) {
			chr = next1;
			next1=text[++pos];
			multichar = token.length>1;
			if (/\n/.test(chr)) lf++;

			if (!chr|| // end of content
				// single-line comments end with a newline
				(([tokenTypes.slashcomment,tokenTypes.hashcomment].indexOf(tokenType)>-1)&&(chr=='\n'))||
				// finalize conditions for other token types
				({
					// whitespaces
					whitespace: /\S/.test(chr),  // merged together
					// linefeed: 1, // consist of a single character
					// xml comment
					xmlcomment: text[pos-4]+prev2+prev1 == '-->',
					// multiline comment
					slashstarcomment: prev2+prev1 == '*/',
					// single line comment
					slashcomment: false,
					// hash comment
					hashcomment: false,
					// operators
					operator: 1, // consist of a single character
					operator2: 1, // consist of a single character
					// braces
					openbrace: 1, // consist of a single character
					closebrace: 1, // consist of a single character
					// (key)word
					keyword: !/[$\w]/.test(chr),
					// regex
					regex: (prev1 == '/' || prev1 == '\n') && multichar,
					// string with "
					stringdouble: prev1 == '"' && multichar,
					// string with '
					stringsingle: prev1 == "'" && multichar,
					// number end
					number: !/^\d+[a-z%]*$/.test(token+chr), // FIXME only html types at end...
					// hex number
					hexnumber: !/^#[0-9a-fA-F]+$/.test(token+chr)
				}[Object.keys(tokenTypes)[tokenType]])) {

				if (token) {
					var tokenStruct = {
						token: token,
						tokenType: tokenType,
						// multichar: multichar,
						// pos: pos-1,
						key: Object.keys(tokenTypes)[tokenType], // for debugging
						class: [],
						data: {}
					};
					tokens.push(tokenStruct);
					if (tokenStruct.token=='.') {
						lastStruct = tokenStruct;
						lastStruct.index = tokens.length-1;
					}
					// easy class creation
					var value = {
						xmlcomment: 'comment',
						hashcomment: 'comment',
						slashcomment: 'comment',
						slashstarcomment: 'comment',
						operator: 'operator',
						operator2: 'operator2',
						openbrace: 'brace',
						closebrace: 'brace',
						keyword: 'keyword',
						regex: 'string',
						stringsingle: 'string',
						stringdouble: 'string',
						number: 'number',
						hexnumber: 'number'
					}[tokenStruct.key];
					if (value!=undefined) tokenStruct.class.push(value);

					// whitespace
					// if (tokenType==tokenTypes.whitespace) {
					// 	if (token[0]=='\n') {
					// 		tokenStruct.data.newline = 'true';
					// 	}
					// }

					// bracket handling
					if (tokenType==tokenTypes.openbrace) {
						// push open brace
						braces.push(tokens.length-1);
						braceCount++;
						bracesOpen++;
					}
					if (tokenType==tokenTypes.closebrace) {
						bracesClose++;
						// check open brace and set operator if it does not match
						if (braces.length>0) {
							// console.log(lf,'close found: ',token,braces)
							var structIndex = braces.pop();
							lastStruct = tokens[structIndex];
							lastStruct.index = structIndex;
							var closeBrace = '';
							// if (lastStruct.token=='(') closeBrace = ')';
							// if (lastStruct.token=='{') closeBrace = '}';
							// if (lastStruct.token=='[') closeBrace = ']';
							if (lastStruct.token=='<') closeBrace = '>';

							if ((token!=closeBrace)&&(lastStruct.token=='<')) {
								braces.push(structIndex);
								lastStruct.tokenType = tokenTypes.operator;
								lastStruct.class = ['operator'];
								braceCount--;
								bracesOpen--;
								// console.log(lf,'< found: ',token)
							} else if ((token!=closeBrace)&&(token=='>')) {
								braces.push(structIndex);
								tokenStruct.tokenType = tokenTypes.operator;
								tokenStruct.class = ['operator'];
								bracesClose--;
								// console.log(lf,'> found: ',lastStruct.token,braces)
							} else {
								braceCount--;
							}
						} else {
							// console.log(lf,'<> found: ',token,braces)
							// edge case: no bracket open -> is operator
							tokenStruct.tokenType = tokenTypes.operator;
							tokenStruct.class = ['operator'];
						}
					}

					// general tokens
					if (/^(a(bstract|lias|nd|rguments|rray|s(m|sert)?|uto)|b(ase|egin|ool(ean)?|reak|yte)|c(ase|atch|har|hecked|lass|lone|ompl|onst|ontinue)|de(bugger|cimal|clare|f(ault|er)?|init|l(egate|ete)?)|do|double|e(cho|ls?if|lse(if)?|nd|nsure|num|vent|x(cept|ec|p(licit|ort)|te(nds|nsion|rn)))|f(allthrough|alse|inal(ly)?|ixed|loat|or(each)?|riend|rom|unc(tion)?)|global|goto|guard|i(f|mp(lements|licit|ort)|n(it|clude(_once)?|line|out|stanceof|t(erface|ernal)?)?|s)|l(ambda|et|ock|ong)|m(icrolight|odule|utable)|NaN|n(amespace|ative|ext|ew|il|ot|ull)|o(bject|perator|r|ut|verride)|p(ackage|arams|rivate|rotected|rotocol|ublic)|r(aise|e(adonly|do|f|gister|peat|quire(_once)?|scue|strict|try|turn))|s(byte|ealed|elf|hort|igned|izeof|tatic|tring|truct|ubscript|uper|ynchronized|witch)|t(emplate|hen|his|hrows?|ransient|rue|ry|ype(alias|def|id|name|of))|u(n(checked|def(ined)?|ion|less|signed|til)|se|sing)|v(ar|irtual|oid|olatile)|w(char_t|hen|here|hile|ith)|xor|yield)$/.test(token)) {
						tokenStruct.class.push('token');
					}

					// html colors in curly brackets
					// FIXME seems to be broken a little bit...
					if (/^(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgrey|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|grey|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgrey|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/.test(token)&&
						(braces.length>0)&&(tokens[braces[braces.length-1]].token=='{')) {
						// console.log(braces,braces.length,tokens[braces[braces.length-1]].token);
						tokenStruct.class.push('color');
						tokenStruct.data.color = token;

						// see http://stackoverflow.com/a/16948730/207691 how to add attr rules
					}

					if (tokenStruct.tokenType==tokenTypes.hexnumber) {
						tokenStruct.class.push('hex');

						if (token.length==7) {
							tokenStruct.class.push('color');
							tokenStruct.data.color = token;
						}
					}

					// html and /html items
					if ((token=='>')&&lastStruct&&(lastStruct.token=='<')) { // check for more
						var i = lastStruct.index;
						// check for validity
						for (var j = i;j<tokens.length;j++) {
							if (tokens[j].tokenType==tokenTypes.operator2) {
								i = 0;
								break;
							}
						}

						if (i>0) {
							if ((tokens[i+1].token=='!')||
								(tokens[i+1].token=='/')) {
								tokens[i+1].class = ['brace'];
							}

							var lastKeywordIndex = 0,
								htmlTagged = false;
							while (i<tokens.length) {
								if (tokens[i].tokenType==tokenTypes.keyword) {
									lastKeywordIndex = i;
									tokens[i].class = ['keyword'];
									if (!htmlTagged) {
										tokens[i].class.push('html');
										htmlTagged = true;
									} else {
										tokens[i].class.push('attributes');
									}
								}
								i++;
							}
						}
					}

					// function calling js
					if ((token=='(')&&lastStruct&&(lastStruct.token=='.')) {
						if ((tokens[lastStruct.index-1].tokenType == tokenTypes.keyword)&&
							(tokens[lastStruct.index+1].tokenType == tokenTypes.keyword)) {
							tokens[lastStruct.index+1].class.push('functions');
						}
					}

					if ((token=='true')||
						(token=='false')) {
						tokenStruct.class.push('boolean');
					}

					// php detection support
					if ((token=='php')&&
						(tokens[tokens.length-2].token=='?')&&
						(tokens[tokens.length-3].token=='<')) {
						tokens[tokens.length-2].class = ['brace'];
						tokenStruct.class = ['keyword']; // not html
						isPhp = true;
					}

					if (isPhp&&
						(token=='>')&&
						(tokens[tokens.length-2].token=='?')) {
						tokens[tokens.length-2].class = ['brace'];
						tokenStruct.class = ['brace'];
						isPhp = false;
					};
				}

				// FIXME the last tokens...
				lastTokenType = /*(tokenType&&(tokenType>=10))?*/tokenType;//:lastTokenType;
				lastToken = /*(tokenType&&(tokenType>=10))?*/token.trim();//:lastToken;
				token = '';

				// determining the new token type (going up the
				// list until matching a token type start
				// condition)
				tokenType = tokenTypesCount;
				while (!{
					// whitespace
					whitespace: 1,
					// linefeed
					// linefeed: /\n/.test(chr),
					// xml comment
					xmlcomment: chr+next1+text[pos+1]+text[pos+2] == '<!--',
					// multiline comment
					slashstarcomment: chr+next1 == '/*',
					// single-line comment
					slashcomment: chr+next1 == '//',
					// hash-style comment
					hashcomment: chr == '#',
					// operator
					operator: /[\/\-+*=:|\\.,?!&@~]/.test(chr), // ; is removed
					// operator2
					operator2: /;/.test(chr),
					// openning braces
					openbrace: /[\[(<{}]/.test(chr),
					// closing braces
					closebrace: /[\])>}]/.test(chr),
					// (key)word
					keyword: /[$\w]/.test(chr),
					// regex
					regex: (chr=='/')&&
						// previous token was an opening brace or an operator
						// (otherwise division, not a regex)
						([tokenTypes.openbrace,tokenTypes.operator].indexOf(lastTokenType)>-1)&&
						// workaround for xml closing tags
						(prev1!='<'),
					// string with "
					stringdouble: chr=='"',
					// string with '
					stringsingle: chr=="'",
					// numbers
					number: /^[0-9]$/.test(chr),
					// hex number min. 3 with #
					hexnumber: /^#([0-9a-fA-F]){3}$/.test(chr+next1+text[pos+1]+text[pos+2])
				}[Object.keys(tokenTypes)[--tokenType]]) {
					// console.log(tokenType);
					if (tokenType==0) break; // in case of an error ;)
				};
				// console.log(tokenType,Object.keys(tokenTypes)[tokenType],chr);
			}

			token += chr;
			// break;
		}

		// console.log(tokens);

		// TODO rebuild for creating text without appendChild etc. Plain JS
		for (var i=0;i<tokens.length;i++) {
			var token = tokens[i];
			// console.log(token);
			var node;
			if (token.class.length>0) {
				element.appendChild(
					node = document.createElement('span')
				).setAttribute('class',token.class.join(' '));
				node.appendChild(document.createTextNode(token.token));
			} else {
				element.appendChild(
					// node = document.createElement('span')
					node = document.createTextNode(token.token)
				)
				// node.appendChild(document.createTextNode(token.token));
			}
			// set all data content
			for (var key in token.data) {
				if (!token.data.hasOwnProperty(key)) continue;
				node.setAttribute('data-'+key,token.data[key]);
			}
		}
	}

	var highlightElements = function(elements) {
		var element;
		for (var i = 0; element = elements[i++];) {
			highlight(element);
		}
	}

	var highlightClass = function(cls) {
		var elements = document.getElementsByClassName(cls||'microlighted');

		highlightElements(elements);
	}

	// new methods
	exports.highlight = highlight;
	exports.highlightElements = highlightElements;
	exports.highlightClass = highlightClass;
}));
