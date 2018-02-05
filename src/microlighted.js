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
		var bracesOpenS = '';
		var bracesCloseS = '';
		var bracesS = '';

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
		// console.log(tokenTypes);

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
						bracesOpenS+=token;
						bracesS+=token;
					}
					if (tokenType==tokenTypes.closebrace) {
						bracesClose++;
						bracesCloseS+=token;
						bracesS+=token;
						// check open brace and set operator if it does not match
						if (braces.length>0) {
							console.log(lf,'close found: ',token,braces)
							var structIndex = braces.pop();
							/*var*/ lastStruct = tokens[structIndex];
							lastStruct.index = structIndex;
							var closeBrace = '';
							// console.log(braces,lastStruct);
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
								bracesCloseS+=' ';
								console.log(lf,'< found: ',token)
							} else if ((token!=closeBrace)&&(token=='>')) {
								braces.push(structIndex);
								tokenStruct.tokenType = tokenTypes.operator;
								tokenStruct.class = ['operator'];
								bracesClose--;
								bracesOpenS+=' ';
								console.log(lf,'> found: ',lastStruct.token,braces)
							} else {
								braceCount--;
							}
						} else {
							console.log(lf,'<> found: ',token,braces)
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

					// html and /html items (buggy)
					// FIXME does not work when attributes are there...
					if ((token=='>')&&
						(tokens[tokens.length-2].tokenType==tokenTypes.keyword)&&
						(((tokens[tokens.length-3].token=='/')&&
						  (tokens[tokens.length-4].token=='<'))||
						 (tokens[tokens.length-3].token=='<'))
					) {
						if (tokens[tokens.length-3].token=='/') { // make slash to a brace
							tokens[tokens.length-3].class = ['brace'];
						}
						// tokens[tokens.length-3].class.push('htmlbrace');
						tokens[tokens.length-2].class.push('html');
						// tokens[tokens.length-1].class.push('htmlbrace');
					}

					if ((token=='true')||
						(token=='false')) {
						tokenStruct.class.push('boolean');
					}

					// if ((token=='php')&&
					// 	(tokens[tokens.length-2].token=='?')&&
					// 	(tokens[tokens.length-3].token=='<')) {
					// 	tokens[tokens.length-2].class = ['brace'];
					// 	tokenStruct.class = ['html'];
					// }
					// console.log(tokenStruct);
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

		console.log(tokens,braceCount,bracesOpen,bracesClose,bracesOpenS,bracesCloseS);
		console.log(bracesOpenS);
		console.log(bracesCloseS);
		console.log(bracesS);
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

	var reset = function(cls) {
		// nodes to highlight
		var microlighted = document.getElementsByClassName(cls||'microlight');
		var el;

		for (var i = 0; el = microlighted[i++];) {
			var text  = el.textContent,
				pos   = 0,		// current position
				next1 = text[0], // next character
				chr   = 1,		// current character
				prev1,			// previous character
				prev2,			// the one before the previous
				token =	'',		// current token content
				// lastTokenWithoutSpaces =

				// current token type:
				//  0: anything else (whitespaces / newlines)
				//  1: operator or brace
				//  2: closing braces (after which '/' is division not regex)
				//  3: (key)word
				//  4: regex
				//  5: string starting with "
				//  6: string starting with '
				//  7: xml comment  <!-- -->
				//  8: multiline comment /* */
				//  9: single-line comment starting with two slashes //
				// 10: single-line comment starting with hash #
				// 11: numbers with optional trailing characters
				// 12: hex number with # and minimum of 3 characters
				tokenType = 0,

				// kept to determine between regex and division
				lastToken,
				lastTokenType,
				// flag determining if token is multi-character
				multichar,
				node;

			el.innerHTML = '';  // (and cleaning the node)

			// running through characters and highlighting
			while (prev2 = prev1,
				   // escaping if needed (with except for comments)
				   // pervious character will not be therefore
				   // recognized as a token finalize condition
				   prev1 = tokenType < 7 && prev1 == '\\' ? 1 : chr
			) {
				chr = next1;
				next1=text[++pos];
				multichar = token.length > 1;

				// checking if current token should be finalized
				if (!chr  || // end of content
					// types 9-10 (single-line comments) end with a
					// newline
					(tokenType > 8 && chr == '\n') ||
					[ // finalize conditions for other token types
						// 0: whitespaces
						/\S/.test(chr),  // merged together
						// 1: operators
						1,				// consist of a single character
						// 2: braces
						1,				// consist of a single character
						// 3: (key)word
						!/[$\w]/.test(chr),
						// 4: regex
						(prev1 == '/' || prev1 == '\n') && multichar,
						// 5: string with "
						prev1 == '"' && multichar,
						// 6: string with '
						prev1 == "'" && multichar,
						// 7: xml comment
						text[pos-4]+prev2+prev1 == '-->',
						// 8: multiline comment
						prev2+prev1 == '*/',
						// 9: single line comment
						false,
						// 10: hash comment
						false,
						// 11: number end
						!/^\d+[a-z%]*$/.test(token+chr), // FIXME only html types at end...
						// 12: hex number
						!/^#[0-9a-fA-F]+$/.test(token+chr)
					][tokenType]
				) {
					// appending the token to the result
					if (token) {
						// remapping token type into style
						// (some types are highlighted similarly)
						el.appendChild( // TODO create only when a class will be assigned
							node = document.createElement('span')
						).setAttribute('class', [ // TODO add tokens and functions and more
							// 0: not formatted
							'',
							// 1: keywords
							'keywords',
							// 2: punctuation
							'punctuation',
							// 3: strings and regexps
							'strings',
							// 4: comments
							'comments',
							// 5: numbers
							'numbers',
							// 6: token (html)
							'tokens html'
						][
							// not formatted
							!tokenType ? 0 :
							// punctuation
							tokenType < 3 ? 2 :
							// numbers
							(tokenType == 11)||(tokenType == 12) ? 5 :
							// comments
							tokenType > 6 ? 4 :
							// regex and strings
							tokenType > 3 ? 3 :
							// otherwise tokenType == 3, (key)word
							// (1 if regexp matches, 0 otherwise)
							+ /^(a(bstract|lias|nd|rguments|rray|s(m|sert)?|uto)|b(ase|egin|ool(ean)?|reak|yte)|c(ase|atch|har|hecked|lass|lone|ompl|onst|ontinue)|de(bugger|cimal|clare|f(ault|er)?|init|l(egate|ete)?)|do|double|e(cho|ls?if|lse(if)?|nd|nsure|num|vent|x(cept|ec|p(licit|ort)|te(nds|nsion|rn)))|f(allthrough|alse|inal(ly)?|ixed|loat|or(each)?|riend|rom|unc(tion)?)|global|goto|guard|i(f|mp(lements|licit|ort)|n(it|clude(_once)?|line|out|stanceof|t(erface|ernal)?)?|s)|l(ambda|et|ock|ong)|m(icrolight|odule|utable)|NaN|n(amespace|ative|ext|ew|il|ot|ull)|o(bject|perator|r|ut|verride)|p(ackage|arams|rivate|rotected|rotocol|ublic)|r(aise|e(adonly|do|f|gister|peat|quire(_once)?|scue|strict|try|turn))|s(byte|ealed|elf|hort|igned|izeof|tatic|tring|truct|ubscript|uper|ynchronized|witch)|t(emplate|hen|his|hrows?|ransient|rue|ry|ype(alias|def|id|name|of))|u(n(checked|def(ined)?|ion|less|signed|til)|se|sing)|v(ar|irtual|oid|olatile)|w(char_t|hen|here|hile|ith)|xor|yield)$/.test(token)
							// html5 tokens
							+ (/^(a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdi|bdo|bgsound|big|blink|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|command|content|data|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|element|em|embed|fieldset|figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|image|img|input|ins|isindex|kbd|keygen|label|legend|li|link|listing|main|map|mark|marquee|menu|menuitem|meta|meter|multicol|nav|nobr|noembed|noframes|noscript|object|ol|optgroup|option|output|p|param|picture|plaintext|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|shadow|slot|small|source|spacer|span|strike|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/.test(token)&&((lastToken=='<')||(lastToken=='/')))*6
						]);

						if ((tokenType>0)&&(el.appendChild(node).className!='')) {
							el.appendChild(node).className += ' tokentype'+tokenType;
						}
						node.appendChild(document.createTextNode(token));
					}

					// saving the previous token type
					// (skipping whitespaces and comments)
					lastTokenType =
						(tokenType && tokenType < 7) ?
						tokenType : lastTokenType;

					// initializing a new token and save old token
					// lastToken = token.trim();
					lastToken = (tokenType && tokenType < 7) ?
						token.trim() : lastToken;
					token = '';

					// determining the new token type (going up the
					// list until matching a token type start
					// condition)
					tokenType = 13;
					while (![
						1,						//  0: whitespace
												//  1: operator or braces
						/[\/{[(\-+*=<:;|\\.,?!&@~]/.test(chr),
						/[\])>}]/.test(chr),	//  2: closing braces
						/[$\w]/.test(chr),		//  3: (key)word
						chr == '/' &&			//  4: regex
							// previous token was an
							// opening brace or an
							// operator (otherwise
							// division, not a regex)
							(lastTokenType < 2) &&
							// workaround for xml
							// closing tags
							prev1 != '<',
						chr == '"',				//  5: string with "
						chr == "'",				//  6: string with '
												//  7: xml comment
						chr+next1+text[pos+1]+text[pos+2] == '<!--',
						chr+next1 == '/*',		//  8: multiline comment
						chr+next1 == '//',		//  9: single-line comment
						chr == '#',				// 10: hash-style comment
												// 11: numbers
						/^[0-9]$/.test(chr),
												// 12: hex number min. 3 with #
						/^#([0-9a-fA-F]){3}$/.test(chr+next1+text[pos+1]+text[pos+2])
					][--tokenType]);

					// console.log(chr,next1,tokenType,lastToken);
				}

				token += chr;
				// console.log(token);
			}
		}
	}

	// old method
	exports.reset = reset;

	// new methods
	exports.highlight = highlight;
	exports.highlightElements = highlightElements;
	exports.highlightClass = highlightClass;

	// if (document.readyState == 'complete') {
	// 	reset();
	// } else {
	// 	window.addEventListener('load', function(){reset()}, 0);
	// }
}));
