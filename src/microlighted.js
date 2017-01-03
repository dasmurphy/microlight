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

    // for better compression
    var test          = 'test',
        // bracket       = 0,

        i,
        microlighted,
        el;  // current microlighted element to run through

    var reset = function(cls) {
        // nodes to highlight
        microlighted = document.getElementsByClassName(cls||'microlight');

        for (i = 0; el = microlighted[i++];) {
            var text  = el.textContent,
                pos   = 0,       // current position
                next1 = text[0], // next character
                chr   = 1,       // current character
                prev1,           // previous character
                prev2,           // the one before the previous
                token =          // current token content
                // lastTokenWithoutSpaces =
                el.innerHTML = '',  // (and cleaning the node)

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
                node,

                // calculating the colors for the style templates
                colorArr = /(\d*\, \d*\, \d*)(, ([.\d]*))?/g.exec(
                    window.getComputedStyle(el).color
                ),
                pxColor = 'px rgba('+colorArr[1]+',',
                alpha = colorArr[3]||1;

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
                        /\S/[test](chr),  // merged together
                        // 1: operators
                        1,                // consist of a single character
                        // 2: braces
                        1,                // consist of a single character
                        // 3: (key)word
                        !/[$\w]/[test](chr),
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
                        !/^\d+[a-z%]*$/[test](token+chr), // FIXME only html types at end...
                        // 12: hex number
                        !/^#[0-9a-fA-F]+$/[test](token+chr)
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
                            + /^(a(bstract|lias|nd|rguments|rray|s(m|sert)?|uto)|b(ase|egin|ool(ean)?|reak|yte)|c(ase|atch|har|hecked|lass|lone|ompl|onst|ontinue)|de(bugger|cimal|clare|f(ault|er)?|init|l(egate|ete)?)|do|double|e(cho|ls?if|lse(if)?|nd|nsure|num|vent|x(cept|ec|p(licit|ort)|te(nds|nsion|rn)))|f(allthrough|alse|inal(ly)?|ixed|loat|or(each)?|riend|rom|unc(tion)?)|global|goto|guard|i(f|mp(lements|licit|ort)|n(it|clude(_once)?|line|out|stanceof|t(erface|ernal)?)?|s)|l(ambda|et|ock|ong)|m(icrolight|odule|utable)|NaN|n(amespace|ative|ext|ew|il|ot|ull)|o(bject|perator|r|ut|verride)|p(ackage|arams|rivate|rotected|rotocol|ublic)|r(aise|e(adonly|do|f|gister|peat|quire(_once)?|scue|strict|try|turn))|s(byte|ealed|elf|hort|igned|izeof|tatic|tring|truct|ubscript|uper|ynchronized|witch)|t(emplate|hen|his|hrows?|ransient|rue|ry|ype(alias|def|id|name|of))|u(n(checked|def(ined)?|ion|less|signed|til)|se|sing)|v(ar|irtual|oid|olatile)|w(char_t|hen|here|hile|ith)|xor|yield)$/[test](token)
                            // html5 tokens
                            + (/^(a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdi|bdo|bgsound|big|blink|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|command|content|data|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|element|em|embed|fieldset|figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|image|img|input|ins|isindex|kbd|keygen|label|legend|li|link|listing|main|map|mark|marquee|menu|menuitem|meta|meter|multicol|nav|nobr|noembed|noframes|noscript|object|ol|optgroup|option|output|p|param|picture|plaintext|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|shadow|slot|small|source|spacer|span|strike|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/[test](token)&&((lastToken=='<')||(lastToken=='/')))*6
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
                        1,                   //  0: whitespace
                                             //  1: operator or braces
                        /[\/{[(\-+*=<:;|\\.,?!&@~]/[test](chr),
                        /[\])>}]/[test](chr),//  2: closing braces
                        /[$\w]/[test](chr),  //  3: (key)word
                        chr == '/' &&        //  4: regex
                            // previous token was an
                            // opening brace or an
                            // operator (otherwise
                            // division, not a regex)
                            (lastTokenType < 2) &&
                            // workaround for xml
                            // closing tags
                            prev1 != '<',
                        chr == '"',          //  5: string with "
                        chr == "'",          //  6: string with '
                                             //  7: xml comment
                        chr+next1+text[pos+1]+text[pos+2] == '<!--',
                        chr+next1 == '/*',   //  8: multiline comment
                        chr+next1 == '//',   //  9: single-line comment
                        chr == '#',          // 10: hash-style comment
                                             // 11: numbers
                        /^[0-9]$/[test](chr),
                                             // 12: hex number min. 3 with #
                        /^#([0-9a-fA-F]){3}$/[test](chr+next1+text[pos+1]+text[pos+2])
                    ][--tokenType]);

                    // console.log(chr,next1,tokenType,lastToken);
                }

                token += chr;
                // console.log(token);
            }
        }
    }

    exports.reset = reset;

    if (document.readyState == 'complete') {
        reset();
    } else {
        window.addEventListener('load', function(){reset()}, 0);
    }
}));
