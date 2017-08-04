require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0]
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.text(escape(this.smartypants(cap[0])));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
	// explicitly match decimal, hex, and named HTML entities 
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  sanitizer: null,
  mangle: true,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
"use strict";

/********************************************************************
 * This is the API client, wrapping around access to API endpoints. *
 ********************************************************************/
module.exports = function (url) {
    var state = {
        url: url || "https://did-api-alpha.deranged.dk",
        user: { id: null, authKey: null }
    };
    var r = request.bind(undefined, state);
    return {
        asUser: function asUser(id, authKey) {
            return setUser(state, id, authKey);
        },
        getCurrentUserId: function getCurrentUserId() {
            return state.user.id;
        },
        user: {
            get: function get(callback) {
                return r("GET", "/user", callback);
            }
        },
        users: {
            get: function get(callback) {
                return r("GET", "/users", callback);
            },
            create: function create(data, callback) {
                return r("POST", "/users", data, callback);
            }
        },
        circles: {
            create: function create(data, callback) {
                return r("POST", "/circles", data, callback);
            },
            update: function update(id, data, callback) {
                return r("PUT", "/circles/" + id, data, callback);
            },
            get: function get(id, callback) {
                return r("GET", "/circles/" + id, callback);
            },
            getAll: function getAll(callback) {
                return r("GET", "/circles", callback);
            },
            members: {
                invite: function invite(circleId, userId, callback) {
                    return r("POST", "/circles/" + circleId + "/members", { userId: userId }, callback);
                },
                remove: function remove(circleId, userId, callback) {
                    return r("DELETE", "/circles/" + circleId + "/members/" + userId, callback);
                }
            },
            topics: {
                create: function create(circleId, data, callback) {
                    return r("POST", "/circles/" + circleId + "/topics", data, callback);
                },
                update: function update(circleId, id, data, callback) {
                    return r("PUT", "/circles/" + circleId + "/topics/" + id, data, callback);
                },
                get: function get(circleId, id, callback) {
                    return r("GET", "/circles/" + circleId + "/topics/" + id, callback);
                },
                getAll: function getAll(circleId, callback) {
                    return r("GET", "/circles/" + circleId + "/topics", callback);
                }
            }
        }
    };
};

function setUser(state, id, authKey) {
    state.user.id = id;
    state.user.authKey = authKey;
}

function request(state, method, path, data, callback) {
    if (!callback) {
        callback = data;
        data = undefined;
    }

    var req = new XMLHttpRequest();
    req.open(method, state.url + path);
    req.setRequestHeader("Authorization", "Basic " + btoa(state.user.id + ":" + state.user.authKey));
    req.responseType = "json";

    req.onreadystatechange = function () {
        if (req.readyState != 4) {
            return;
        }
        if (req.status >= 200 && req.status < 300) {
            if (!req.response && (req.responseType == "" || req.responseType == "document")) {
                var response = null;
                try {
                    response = JSON.parse(req.responseText);
                } catch (e) {
                    return callback({
                        trace: new Error("API responded in something that was not JSON and could not be parsed as JSON."),
                        status: req.statusText,
                        responseType: req.responseType,
                        response: req.responseText
                    });
                }
                console.warn("[did/api-client] Got response from API that was not automatically JSON from " + method + " " + path + ". Managed to parse it anyway.", response);
                return callback(null, response);
            }
            return callback(null, req.response);
        }
        callback({
            trace: new Error("API call failed."),
            status: req.statusText,
            responseType: req.responseType,
            response: req.response
        });
    };

    if (data) {
        req.setRequestHeader("Content-Type", "application/json");
        return req.send(JSON.stringify(data));
    }
    req.send();
}

},{}],3:[function(require,module,exports){
"use strict";

var getOverlay = require("../getFormOverlay");
var setUpMemberInviteSelect = require("../setUpMemberInviteSelect");
var prefillFields = require("../prefillFields");

module.exports = function (api, integration) {
    return function (opts) {
        return {
            renderIn: function renderIn(container) {
                container.innerHTML = "<form class=\"did-circle-form did-form\"> <div class=\"did-form-row\"> <label for=\"title\"> Title <input name=\"title\" type=\"text\"> </label> <label for=\"vision\"> Vision <textarea class=\"did-markdown-field\" name=\"vision\"></textarea> </label> <label for=\"mission\"> Mission <textarea class=\"did-markdown-field\" name=\"mission\"></textarea> </label> <label for=\"aim\"> Aim <textarea class=\"did-markdown-field\" name=\"aim\"></textarea> </label> </div> <div class=\"did-form-row\"> <label for=\"fullState\"> Open to more members? <select name=\"fullState\"> <option value=\"lookingForMore\">Looking for more</option> <option value=\"openForMore\">Open for more</option> <option value=\"full\">Full</option> </select> </label> <label for=\"expectationsForMembers\"> Expectations for members <textarea class=\"did-markdown-field\" name=\"expectationsForMembers\"></textarea> </label> <label for=\"inviteMembers\"> Invite members to circle? <select name=\"inviteMembers\"> <option>Loading users...</option> </select> </label> <div class=\"did-invited-members-list\"></div> </div> <button>Create circle</button> <div class=\"did-overlay\"> <div class=\"did-overlay-message did-overlay-message-loading\">Loading form...</div> <div class=\"did-overlay-message did-overlay-message-posting\">Creating circle...</div> <div class=\"did-overlay-message did-overlay-message-failure\">Failed to create circle.</div> <div class=\"did-overlay-message did-overlay-message-success\">Circle created!</div> </div> </form> ";
                var form = container.querySelector("form.did-circle-form");

                if (opts) {
                    if (opts.fill) {
                        prefillFields(form, opts.fill);
                    }
                }

                var invites = [];
                var membersSelect = form.querySelector("[name=inviteMembers]");
                var membersList = form.querySelector(".did-invited-members-list");

                api.users.get(function (error, data) {
                    if (error) {
                        return console.error("Failed to load users.", error);
                    }

                    var options = data.users.filter(function (user) {
                        return user.userId != api.getCurrentUserId();
                    }).sort(function (a, b) {
                        if (a.name == b.name) return 0;
                        if (a.name < b.name) return -1;
                        return 1;
                    }).map(function (user) {
                        return "<option value=\"" + user.userId + "\">" + user.name + "</option>";
                    }).join("");
                    membersSelect.innerHTML = "<option></option>" + options;

                    setUpMemberInviteSelect(membersSelect, membersList, {
                        invite: function invite(id, callback) {
                            invites.push(id);setTimeout(callback);
                        },
                        remove: function remove(id, callback) {
                            invites = invites.filter(function (invitedId) {
                                return invitedId != id;
                            });setTimeout(callback);
                        }
                    });
                });

                form.addEventListener("submit", function (e) {
                    e.preventDefault();
                    sendCreateCircleRequest(api, integration, form, invites);
                    return false;
                });
            }
        };
    };
};

function sendCreateCircleRequest(api, integration, form, invitedMembers) {
    var validation = validateData(form, invitedMembers);
    if (!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    var overlay = getOverlay(form);
    overlay.posting();
    api.circles.create(validation.data, function (error, result) {
        if (error) {
            overlay.failure();
            return console.error("Failed to create circle.", error);
        }
        overlay.success(function () {
            return integration.circles.view(result.circle.circleId);
        });
    });
}

function validateData(form, invitedMembers) {
    var getValue = function getValue(name) {
        return form[name].value;
    };

    var valid = true;
    var errors = {};
    var name = getValue("title");
    var vision = getValue("vision");
    var mission = getValue("mission");
    var aim = getValue("aim");
    var fullState = getValue("fullState");
    var expectationsForMembers = getValue("expectationsForMembers");
    var invited = invitedMembers;

    //TODO: actually validate

    if (valid) {
        return {
            valid: true,
            data: { name: name, vision: vision, mission: mission, aim: aim, fullState: fullState, expectationsForMembers: expectationsForMembers, invited: invited }
        };
    }
    return { valid: valid, errors: errors };
}

},{"../getFormOverlay":8,"../prefillFields":11,"../setUpMemberInviteSelect":13}],4:[function(require,module,exports){
"use strict";

var getOverlay = require("../getFormOverlay");
var parallel = require("../../tiny-parallel");
var createRemovableMemberElement = require("../createRemovableMemberElement");
var setUpMemberInviteSelect = require("../setUpMemberInviteSelect");

module.exports = function (api, integration) {
    return function (opts) {
        return {
            renderIn: function renderIn(container) {
                container.innerHTML = "<form class=\"did-circle-form did-form\"> <div class=\"did-form-row\"> <label for=\"title\"> Title <input name=\"title\" type=\"text\"> </label> <label for=\"contactPerson\"> Contact person <select name=\"contactPerson\"> <option>Loading users...</option> </select> </label> <label for=\"vision\"> Vision <textarea class=\"did-markdown-field\" name=\"vision\"></textarea> </label> <label for=\"mission\"> Mission <textarea class=\"did-markdown-field\" name=\"mission\"></textarea> </label> <label for=\"aim\"> Aim <textarea class=\"did-markdown-field\" name=\"aim\"></textarea> </label> </div> <div class=\"did-form-row\"> <label for=\"fullState\"> Open to more members? <select name=\"fullState\"> <option value=\"lookingForMore\">Looking for more</option> <option value=\"openForMore\">Open for more</option> <option value=\"full\">Full</option> </select> </label> <label for=\"expectationsForMembers\"> Expectations for members <textarea class=\"did-markdown-field\" name=\"expectationsForMembers\"></textarea> </label> <label for=\"members\"> Members </label> <div class=\"did-members-list\"></div> <label for=\"inviteMembers\"> Invite members to circle? <select name=\"inviteMembers\"> <option>Loading users...</option> </select> </label> <div class=\"did-invited-members-list\"></div> </div> <div class=\"did-form-row\"> <h2>Procedures</h2> <label for=\"roleElectionProcedure\"> Meeting Procedure for Election of Roles <textarea class=\"did-markdown-field\" name=\"roleElectionProcedure\"></textarea> </label> <label for=\"roleEvaluationProcedure\"> Meeting Procedure for Evaluation of Roles <textarea class=\"did-markdown-field\" name=\"roleEvaluationProcedure\"></textarea> </label> <label for=\"taskMeetingProcedure\"> Meeting Procedure for Operational Meetings (tasks) <textarea class=\"did-markdown-field\" name=\"taskMeetingProcedure\"></textarea> </label> <label for=\"topicExplorationStageProcedure\"> Meeting Procedure - Topics at Exploration Stage <textarea class=\"did-markdown-field\" name=\"topicExplorationStageProcedure\"></textarea> </label> <label for=\"topicPictureFormingStageProcedure\"> Meeting Procedure - Topics at Picture Forming Stage <textarea class=\"did-markdown-field\" name=\"topicPictureFormingStageProcedure\"></textarea> </label> <label for=\"topicProposalShapingStageProcedure\"> Meeting Procedure - Topics at Proposal Shaping Stage <textarea class=\"did-markdown-field\" name=\"topicProposalShapingStageProcedure\"></textarea> </label> <label for=\"topicDecisionMakingStageProcedure\"> Meeting Procedure - Topics at Decision Making Stage <textarea class=\"did-markdown-field\" name=\"topicDecisionMakingStageProcedure\"></textarea> </label> <label for=\"topicAgreementStageProcedure\"> Meeting procedure: Topics at Agreement Stage <textarea class=\"did-markdown-field\" name=\"topicAgreementStageProcedure\"></textarea> </label> <label for=\"agreementEvaluationProcedure\"> Meeting procedure - Evaluation of agreement <textarea class=\"did-markdown-field\" name=\"agreementEvaluationProcedure\"></textarea> </label> </div> <button>Update circle</button> <div class=\"did-overlay\"> <div class=\"did-overlay-message did-overlay-message-loading\">Loading form...</div> <div class=\"did-overlay-message did-overlay-message-posting\">Updating circle...</div> <div class=\"did-overlay-message did-overlay-message-failure\">Failed to update circle.</div> <div class=\"did-overlay-message did-overlay-message-success\">Circle updated!</div> </div> </form> ";
                var form = container.querySelector("form.did-circle-form");

                var overlay = getOverlay(form);
                overlay.loading();

                if (!opts || !opts.id) {
                    throw new Error("Missing circle ID for circleEdit include. You should provide `id` as an option when creating the include.");
                }

                var inviteMembersSelect = form.querySelector("[name=inviteMembers]");
                var inviteMembersList = form.querySelector(".did-invited-members-list");
                var membersList = form.querySelector(".did-members-list");

                parallel({
                    usersRequest: function usersRequest(callback) {
                        return api.users.get(callback);
                    },
                    circleRequest: function circleRequest(callback) {
                        return api.circles.get(opts.id, callback);
                    }
                }, function (error, result) {
                    if (error) {
                        return console.error("Failed to load data", error);
                    }
                    var users = result.usersRequest.users;
                    var circle = result.circleRequest.circle;

                    if (circle.members.indexOf(api.getCurrentUserId()) === -1) {
                        return console.error("Cannot edit this form. Not a member.");
                    }

                    var setValue = function setValue(name, value) {
                        return form[name].value = value;
                    };
                    var transferValueByName = function transferValueByName(name) {
                        return setValue(name, circle[name]);
                    };
                    var transferValuesByName = function transferValuesByName(names) {
                        return names.forEach(transferValueByName);
                    };
                    setValue("title", circle.name);
                    transferValuesByName(["vision", "mission", "aim", "fullState", "expectationsForMembers",
                    //Procedures:
                    "roleElectionProcedure", "roleEvaluationProcedure", "taskMeetingProcedure", "topicExplorationStageProcedure", "topicPictureFormingStageProcedure", "topicProposalShapingStageProcedure", "topicDecisionMakingStageProcedure", "topicAgreementStageProcedure", "agreementEvaluationProcedure"]);

                    var otherUsers = users.filter(function (user) {
                        return user.userId != api.getCurrentUserId();
                    }).sort(function (a, b) {
                        if (a.name == b.name) return 0;
                        if (a.name < b.name) return -1;
                        return 1;
                    });

                    var invitableUsers = otherUsers.filter(function (user) {
                        return circle.invited.indexOf(user.userId) === -1 && circle.members.indexOf(user.userId) === -1;
                    });
                    var invitedUsers = otherUsers.filter(function (user) {
                        return circle.invited.indexOf(user.userId) !== -1;
                    });
                    var memberUsers = users.filter(function (user) {
                        return circle.members.indexOf(user.userId) !== -1;
                    });

                    var inviteOptions = invitableUsers.map(function (user) {
                        return "<option value=\"" + user.userId + "\">" + user.name + "</option>";
                    }).join("");
                    inviteMembersSelect.innerHTML = "<option></option>" + inviteOptions;

                    var contactPersonOptions = users.map(function (user) {
                        return "<option value=\"" + user.userId + "\">" + user.name + "</option>";
                    }).join("");
                    var contactPersonSelect = form.contactPerson;
                    contactPersonSelect.innerHTML = contactPersonOptions;
                    contactPersonSelect.value = circle.contactPerson;

                    addRemovableMemberElementsToList(api, opts.id, memberUsers, inviteMembersSelect, membersList);
                    addRemovableMemberElementsToList(api, opts.id, invitedUsers, inviteMembersSelect, inviteMembersList);

                    setUpMemberInviteSelect(inviteMembersSelect, inviteMembersList, {
                        invite: function invite(userId, callback) {
                            return api.circles.members.invite(opts.id, userId, callback);
                        },
                        remove: function remove(userId, callback) {
                            return api.circles.members.remove(opts.id, userId, callback);
                        }
                    });

                    overlay.hide();
                });

                form.addEventListener("submit", function (e) {
                    e.preventDefault();
                    sendUpdateCircleRequest(api, integration, opts.id, form);
                    return false;
                });
            }
        };
    };
};

function addRemovableMemberElementsToList(api, circleId, users, membersSelect, membersList) {
    users.map(function (user) {
        return createRemovableMemberElement(user.userId, user.name, membersSelect, membersList, function (userId, callback) {
            return api.circles.members.remove(circleId, userId, callback);
        });
    }).forEach(function (memberElement) {
        return membersList.appendChild(memberElement);
    });
}

function sendUpdateCircleRequest(api, integration, id, form) {
    var validation = validateData(form);
    if (!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    var overlay = getOverlay(form);
    overlay.posting();
    api.circles.update(id, validation.data, function (error, result) {
        if (error) {
            overlay.failure();
            return console.error("Failed to update circle.", error);
        }
        overlay.success(function () {
            return integration.circles.view(result.circle.circleId);
        });
    });
}

function validateData(form) {
    var getValue = function getValue(name) {
        return form[name].value;
    };

    var valid = true;

    var errors = {};
    var name = getValue("title");
    var vision = getValue("vision");
    var mission = getValue("mission");
    var aim = getValue("aim");
    var fullState = getValue("fullState");
    var expectationsForMembers = getValue("expectationsForMembers");
    var contactPerson = getValue("contactPerson");

    var roleElectionProcedure = getValue("roleElectionProcedure");
    var roleEvaluationProcedure = getValue("roleEvaluationProcedure");
    var taskMeetingProcedure = getValue("taskMeetingProcedure");
    var topicExplorationStageProcedure = getValue("topicExplorationStageProcedure");
    var topicPictureFormingStageProcedure = getValue("topicPictureFormingStageProcedure");
    var topicProposalShapingStageProcedure = getValue("topicProposalShapingStageProcedure");
    var topicDecisionMakingStageProcedure = getValue("topicDecisionMakingStageProcedure");
    var topicAgreementStageProcedure = getValue("topicAgreementStageProcedure");
    var agreementEvaluationProcedure = getValue("agreementEvaluationProcedure");

    //TODO: actually validate

    if (valid) {
        return {
            valid: true,
            data: { name: name, vision: vision, mission: mission, aim: aim, fullState: fullState, expectationsForMembers: expectationsForMembers, contactPerson: contactPerson,
                roleElectionProcedure: roleElectionProcedure, roleEvaluationProcedure: roleEvaluationProcedure, taskMeetingProcedure: taskMeetingProcedure, topicExplorationStageProcedure: topicExplorationStageProcedure,
                topicPictureFormingStageProcedure: topicPictureFormingStageProcedure, topicProposalShapingStageProcedure: topicProposalShapingStageProcedure, topicDecisionMakingStageProcedure: topicDecisionMakingStageProcedure,
                topicAgreementStageProcedure: topicAgreementStageProcedure, agreementEvaluationProcedure: agreementEvaluationProcedure }
        };
    }
    return { valid: valid, errors: errors };
}

},{"../../tiny-parallel":18,"../createRemovableMemberElement":7,"../getFormOverlay":8,"../setUpMemberInviteSelect":13}],5:[function(require,module,exports){
"use strict";

var parallel = require("../../tiny-parallel");
var getOverlay = require("../getViewOverlay");
var createDomNode = require("../createDomNode");
var renderMembers = require("../renderMembers");

module.exports = function (api, integration, marked) {
    return function (opts) {
        return {
            renderIn: function renderIn(container) {
                container.innerHTML = "<div class=\"did-view\"> <div class=\"did-view-row did-view-row-double\"> <a class=\"did-edit-link\" href=\"#edit-circle\">Edit circle</a> </div> <div class=\"did-view-row\"> <div class=\"did-view-label did-view-label-title\"> Title <div class=\"did-view-value did-view-value-title\"></div> </div> <div class=\"did-view-label did-view-label-contactPerson\"> Contact person <div class=\"did-view-value did-view-value-contactPerson\"></div> </div> <div class=\"did-view-label did-view-label-vision\"> Vision <div class=\"did-view-value did-view-value-vision\"></div> </div> <div class=\"did-view-label did-view-label-mission\"> Mission <div class=\"did-view-value did-view-value-mission\"></div> </div> <div class=\"did-view-label did-view-label-aim\"> Aim <div class=\"did-view-value did-view-value-aim\"></div> </div> </div> <div class=\"did-view-row\"> <div class=\"did-view-label did-view-label-fullState\"> Open to more members? <div class=\"did-view-value did-view-value-fullState\"> <div class=\"did-view-value-fullState-lookingForMore\" style=\"display:none\">Looking for more</div> <div class=\"did-view-value-fullState-openForMore\" style=\"display:none\">Open for more</div> <div class=\"did-view-value-fullState-full\" style=\"display:none\">Full</div> </div> </div> <div class=\"did-view-label did-view-label-expectationsForMembers\"> Expectations for members <div class=\"did-view-value did-view-value-expectationsForMembers\"></div> </div> <div class=\"did-view-label did-view-label-members\"> Members <div class=\"did-view-value did-view-value-members\"></div> </div> <div class=\"did-view-label did-view-label-invited\"> Invited <div class=\"did-view-value did-view-value-invited\"></div> </div> </div> <div class=\"did-view-row did-view-row-double\"> <a class=\"did-add-topic-link did-btn\" href=\"#add-topic\">Add topic</a> <div class=\"did-circle-items-container\"> <a class=\"did-circle-items-container-tab\" href=\"#roles-tab\" data-didtab=\"roles\">Roles</a> <a class=\"did-circle-items-container-tab\" href=\"#tasks-tab\" data-didtab=\"tasks\">Tasks</a> <a class=\"did-circle-items-container-tab\" href=\"#topics-tab\" data-didtab=\"topics\">Topics</a> <a class=\"did-circle-items-container-tab\" href=\"#agreements-tab\" data-didtab=\"agreements\">Agreements</a> <div class=\"did-circle-items-container-item-list\"> <div class=\"did-spinner\"></div> </div> </div> </div> <div class=\"did-view-row did-view-row-double did-procedures-container\"> <a class=\"did-show-procedures-link\" href=\"#expand-procedures\">Show procedures</a> <a class=\"did-hide-procedures-link\" href=\"#hide-procedures\" style=\"display:none\">Hide procedures</a> <h2>Procedures</h2> <p>Procedures describe how items (topics, tasks, agreements and roles) are evaluated or handled during a meeting.</p> <div class=\"did-view-label did-view-label-roleElectionProcedure\"> Meeting Procedure for Election of Roles <div class=\"did-view-value did-view-value-roleElectionProcedure\"></div> </div> <div class=\"did-view-label did-view-label-roleEvaluationProcedure\"> Meeting Procedure for Evaluation of Roles <div class=\"did-view-value did-view-value-roleEvaluationProcedure\"></div> </div> <div class=\"did-view-label did-view-label-taskMeetingProcedure\"> Meeting Procedure for Operational Meetings (tasks) <div class=\"did-view-value did-view-value-taskMeetingProcedure\"></div> </div> <div class=\"did-view-label did-view-label-topicExplorationStageProcedure\"> Meeting Procedure - Topics at Exploration Stage <div class=\"did-view-value did-view-value-topicExplorationStageProcedure\"></div> </div> <div class=\"did-view-label did-view-label-topicPictureFormingStageProcedure\"> Meeting Procedure - Topics at Picture Forming Stage <div class=\"did-view-value did-view-value-topicPictureFormingStageProcedure\"></div> </div> <div class=\"did-view-label did-view-label-topicProposalShapingStageProcedure\"> Meeting Procedure - Topics at Proposal Shaping Stage <div class=\"did-view-value did-view-value-topicProposalShapingStageProcedure\"></div> </div> <div class=\"did-view-label did-view-label-topicDecisionMakingStageProcedure\"> Meeting Procedure - Topics at Decision Making Stage <div class=\"did-view-value did-view-value-topicDecisionMakingStageProcedure\"></div> </div> <div class=\"did-view-label did-view-label-topicAgreementStageProcedure\"> Meeting procedure: Topics at Agreement Stage <div class=\"did-view-value did-view-value-topicAgreementStageProcedure\"></div> </div> <div class=\"did-view-label did-view-label-agreementEvaluationProcedure\"> Meeting procedure - Evaluation of agreement <div class=\"did-view-value did-view-value-agreementEvaluationProcedure\"></div> </div> </div> <div class=\"did-overlay\"> <div class=\"did-overlay-message did-overlay-message-loading\">Loading circle...</div> </div> </div> ";
                var view = container.querySelector(".did-view");

                var overlay = getOverlay(container);
                overlay.loading();

                if (!opts || !opts.id) {
                    throw new Error("Missing circle ID for circleView include. You should provide `id` as an option when creating the include.");
                }

                parallel({
                    usersRequest: function usersRequest(callback) {
                        return api.users.get(callback);
                    },
                    circleRequest: function circleRequest(callback) {
                        return api.circles.get(opts.id, callback);
                    }
                }, function (error, result) {
                    if (error) {
                        return console.error("Failed to get users or circle to display", error);
                    }

                    var selectValueField = function selectValueField(name) {
                        return view.querySelector(".did-view-value-" + name);
                    };
                    var setValue = function setValue(name, value) {
                        var field = selectValueField(name);
                        if (value) field.innerText = value;else field.innerHTML = "&mdash;";
                    };
                    var setMarkdownValue = function setMarkdownValue(name, value) {
                        var field = selectValueField(name);
                        field.innerHTML = value ? marked(value) : "&mdash;";
                    };

                    var users = result.usersRequest.users;
                    var circle = result.circleRequest.circle;

                    selectValueField("fullState-" + circle.fullState).style = "";

                    setValue("title", circle.name);
                    setMarkdownValue("vision", circle.vision);
                    setMarkdownValue("mission", circle.mission);
                    setMarkdownValue("aim", circle.aim);
                    setMarkdownValue("expectationsForMembers", circle.expectationsForMembers);

                    var insertDomElements = function insertDomElements(name, elements) {
                        var field = selectValueField(name);
                        elements.forEach(function (e) {
                            field.appendChild(e);
                            field.appendChild(createDomNode("br"));
                        });
                    };
                    insertDomElements("members", renderMembers(circle.members, users, integration));
                    insertDomElements("invited", renderMembers(circle.invited, users, integration));
                    insertDomElements("contactPerson", renderMembers([circle.contactPerson], users, integration));

                    var editLink = view.querySelector(".did-edit-link");
                    if (circle.members.indexOf(api.getCurrentUserId()) !== -1) {
                        editLink.addEventListener("click", function (e) {
                            e.preventDefault();
                            integration.circles.edit(opts.id);
                            return false;
                        });
                    } else {
                        view.removeChild(editLink);
                    }

                    //Procedures
                    setMarkdownValue("roleElectionProcedure", circle.roleElectionProcedure);
                    setMarkdownValue("roleEvaluationProcedure", circle.roleEvaluationProcedure);
                    setMarkdownValue("taskMeetingProcedure", circle.taskMeetingProcedure);
                    setMarkdownValue("topicExplorationStageProcedure", circle.topicExplorationStageProcedure);
                    setMarkdownValue("topicPictureFormingStageProcedure", circle.topicPictureFormingStageProcedure);
                    setMarkdownValue("topicProposalShapingStageProcedure", circle.topicProposalShapingStageProcedure);
                    setMarkdownValue("topicDecisionMakingStageProcedure", circle.topicDecisionMakingStageProcedure);
                    setMarkdownValue("topicAgreementStageProcedure", circle.topicAgreementStageProcedure);
                    setMarkdownValue("agreementEvaluationProcedure", circle.agreementEvaluationProcedure);

                    var proceduresBox = view.querySelector(".did-procedures-container");
                    var showProceduresLink = view.querySelector(".did-show-procedures-link");
                    var hideProceduresLink = view.querySelector(".did-hide-procedures-link");
                    showProceduresLink.addEventListener("click", function (e) {
                        e.preventDefault();
                        proceduresBox.style = "height:auto;box-shadow:none;";
                        showProceduresLink.style = "display:none;";
                        hideProceduresLink.style = "";
                        return false;
                    });
                    hideProceduresLink.addEventListener("click", function (e) {
                        e.preventDefault();
                        proceduresBox.style = "";
                        hideProceduresLink.style = "display:none;";
                        showProceduresLink.style = "";
                        return false;
                    });

                    var addTopicLink = view.querySelector(".did-add-topic-link");
                    addTopicLink.addEventListener("click", function (e) {
                        e.preventDefault();
                        integration.topics.create(opts.id);
                        return false;
                    });

                    //Set up item tabs
                    var itemList = view.querySelector(".did-circle-items-container-item-list");
                    var tabs = view.querySelectorAll(".did-circle-items-container-tab");
                    var selectedTab = tabs[0];
                    var selectTab = function selectTab(tab) {
                        selectedTab.classList = "did-circle-items-container-tab";
                        tab.classList += " selected";
                        selectedTab = tab;
                    };
                    var itemLoaders = { //TODO: Only call an item loader once (cache result if success)
                        "roles": function roles(callback) {
                            return callback(null, []);
                        },
                        "tasks": function tasks(callback) {
                            return callback(null, []);
                        },
                        "topics": function topics(callback) {
                            return api.circles.topics.getAll(opts.id, function (error, result) {
                                if (error) return callback(error);
                                callback(null, result.topics.map(function (topic) {
                                    var node = createDomNode("a", { class: "did-circle-item" });
                                    node.innerHTML = "\n                                <div class=\"did-circle-item-description\">\n                                    <h1>" + topic.title + "</h1>\n                                    " + marked(previewMarkdown(topic.why)) + "\n                                </div>\n                                <div class=\"did-circle-item-stats\">\n                                    <div>In " + topic.stage + " stage</div>\n                                    <div>" + topic.comments.length + " comments</div>\n                                    <div>" + topic.attachments.length + " attacments</div>\n                                </div>\n                            "; // TODO: Make "stage", "comments" and "attachments" localized
                                    node.href = "#view-topic";
                                    node.addEventListener("click", function (e) {
                                        e.preventDefault();
                                        integration.topics.view(opts.id, topic.title);
                                        return false;
                                    });
                                    return node;
                                }));
                            });
                        },
                        "agreements": function agreements(callback) {
                            return callback(null, []);
                        }
                    };
                    Array.prototype.forEach.call(tabs, function (tab) {
                        tab.addEventListener("click", function (e) {
                            e.preventDefault();
                            selectTab(tab);
                            itemList.innerHTML = "<div class=\"did-spinner\"></div>";
                            itemLoaders[tab.dataset.didtab](function (error, items) {
                                itemList.innerHTML = "";
                                items.forEach(function (item) {
                                    return itemList.appendChild(item);
                                });
                            });
                            return false;
                        });
                    });
                    Array.prototype.find.call(tabs, function (tab) {
                        return tab.dataset.didtab == "roles";
                    }).click();

                    overlay.hide();
                });
            }
        };
    };
};

function previewMarkdown(md) {
    if (md.length <= 250) {
        return md;
    }
    return md.substring(0, 249) + "&nbsp;&nbsp;&nbsp;&hellip;";
}

},{"../../tiny-parallel":18,"../createDomNode":6,"../getViewOverlay":9,"../renderMembers":12}],6:[function(require,module,exports){
"use strict";

module.exports = function (tag, attr) {
    //TODO: alt to using `document`? (Breaks general usage!!!)
    var el = document.createElement(tag);
    if (!attr) {
        return el;
    }
    if (attr.class) el.classList = attr.class;
    if (attr.value) el.value = attr.value;
    if (attr.text) el.innerText = attr.text;else if (attr.html) el.innerHTML = attr.html;
    return el;
};

},{}],7:[function(require,module,exports){
"use strict";

var createDomNode = require("./createDomNode");

module.exports = function (id, name, membersSelect, membersList, removeHook) {
    var memberElement = createDomNode("div", { class: "did-invite-member", text: name });
    var dismissButton = createDomNode("div", { class: "did-uninvite-member-button" });

    dismissButton.addEventListener("click", function (e) {
        e.preventDefault();
        removeHook(id, function (error) {
            if (error) {
                return console.error("Failed to remove an invited member", error);
            }
            membersList.removeChild(memberElement);
            var newOpt = createDomNode("option", { value: id, text: name });
            var elementAlphanumericallyFollowing = getElementAlphaAfter(membersSelect, name);
            membersSelect.insertBefore(newOpt, elementAlphanumericallyFollowing);
        });
        return false;
    });

    memberElement.appendChild(dismissButton);
    return memberElement;
};

function getElementAlphaAfter(container, content) {
    return Array.prototype.filter.call(container.children, function (node) {
        return node.innerText >= content;
    })[0];
}

},{"./createDomNode":6}],8:[function(require,module,exports){
"use strict";

module.exports = function (form) {
    var overlay = form.querySelector(".did-overlay");
    var loadingMsg = overlay.querySelector(".did-overlay-message-loading");
    var postingMsg = overlay.querySelector(".did-overlay-message-posting");
    var failureMsg = overlay.querySelector(".did-overlay-message-failure");
    var successMsg = overlay.querySelector(".did-overlay-message-success");

    var hideAllMsgs = function hideAllMsgs() {
        loadingMsg.style = "";
        failureMsg.style = "";
        successMsg.style = "";
        postingMsg.style = "";
    };

    var hide = function hide() {
        overlay.style = "display:flex;opacity:0;";
        hideAllMsgs();
        setTimeout(function () {
            return overlay.style = "";
        }, 500);
    };

    var showMsg = function showMsg(msg) {
        hideAllMsgs();
        overlay.style = "display:flex;opacity:1;";
        msg.style = "opacity:1;";
    };

    return {
        loading: function loading() {
            return showMsg(loadingMsg);
        },
        posting: function posting() {
            return showMsg(postingMsg);
        },
        failure: function failure() {
            showMsg(failureMsg);
            setTimeout(hide, 2500);
        },
        success: function success(callback) {
            showMsg(successMsg);
            setTimeout(function () {
                callback();
                hide();
            }, 1200);
        },
        hide: hide
    };
};

},{}],9:[function(require,module,exports){
"use strict";

module.exports = function (view) {
    var overlay = view.querySelector(".did-overlay");
    var loadingMsg = overlay.querySelector(".did-overlay-message-loading");

    var hideAllMsgs = function hideAllMsgs() {
        loadingMsg.style = "";
    };

    var hide = function hide() {
        overlay.style = "display:flex;opacity:0;";
        hideAllMsgs();
        setTimeout(function () {
            return overlay.style = "";
        }, 500);
    };

    var showMsg = function showMsg(msg) {
        hideAllMsgs();
        overlay.style = "display:flex;opacity:1;";
        msg.style = "opacity:1;";
    };

    return {
        loading: function loading() {
            return showMsg(loadingMsg);
        },
        hide: hide
    };
};

},{}],10:[function(require,module,exports){
"use strict";

module.exports = function (api, integration, marked) {
    return {
        circleCreate: require("./circles/create")(api, integration),
        circleView: require("./circles/view")(api, integration, marked),
        circleEdit: require("./circles/edit")(api, integration),
        topicCreate: require("./topics/create")(api, integration),
        topicView: require("./topics/view")(api, integration, marked),
        topicEdit: require("./topics/edit")(api, integration)
    };
};

},{"./circles/create":3,"./circles/edit":4,"./circles/view":5,"./topics/create":14,"./topics/edit":15,"./topics/view":16}],11:[function(require,module,exports){
"use strict";

module.exports = function (form, fill) {
    Object.keys(fill).forEach(function (key) {
        var element = form.querySelector("[name=" + key + "]");
        if (!element) {
            return console.warn("[did] Tried to prefill", key, "with value", fill[key], "but no such input element exists in the form.");
        }
        element.value = fill[key];
        //This has been verified to work for: input, textarea, select
        //TODO: Not yet verified: checkbox, radio
    });
};

},{}],12:[function(require,module,exports){
"use strict";

var createDomNode = require("./createDomNode");

module.exports = function (userIds, users, integration) {
    return userIds.map(function (userId) {
        var user = users.find(function (user) {
            return user.userId == userId;
        });
        return renderUserLink(user, integration);
    });
};

function renderUserLink(user, integration) {
    var box = createDomNode("div");
    box.innerHTML = "<a href=\"#view-user\" data-userId=\"" + user.userId + "\" class=\"did-user-link\">" + user.name + "</a>";
    var link = box.firstChild;
    link.addEventListener("click", function (e) {
        e.preventDefault();
        integration.users.view(user.userId);
        return false;
    });
    return link;
}

},{"./createDomNode":6}],13:[function(require,module,exports){
"use strict";

var createRemovableMemberElement = require("./createRemovableMemberElement");

module.exports = function (membersSelect, membersList, hooks) {
    membersSelect.addEventListener("change", function (e) {
        var id = membersSelect.value;
        var opt = membersSelect.querySelector("option[value='" + id + "']");
        var name = opt.innerText;

        hooks.invite(id, function (error) {
            if (error) {
                return console.error("Failed to remove a member element", error);
            }

            membersSelect.removeChild(opt);
            var memberElement = createRemovableMemberElement(id, name, membersSelect, membersList, hooks.remove);
            membersList.appendChild(memberElement);
        });
    });
};

},{"./createRemovableMemberElement":7}],14:[function(require,module,exports){
"use strict";

var getOverlay = require("../getFormOverlay");
var setUpMemberInviteSelect = require("../setUpMemberInviteSelect");
var prefillFields = require("../prefillFields");

module.exports = function (api, integration) {
    return function (opts) {
        return {
            renderIn: function renderIn(container) {
                container.innerHTML = "<form class=\"did-form did-topic-form\"> <div class=\"did-form-row\"> <label for=\"title\"> Title <input name=\"title\" type=\"text\"> </label> <label for=\"why\"> Why should this topic be discussed? <textarea class=\"did-markdown-field\" name=\"why\"></textarea> </label> </div> <button>Create topic</button> <div class=\"did-overlay\"> <div class=\"did-overlay-message did-overlay-message-loading\">Loading form...</div> <div class=\"did-overlay-message did-overlay-message-posting\">Creating topic...</div> <div class=\"did-overlay-message did-overlay-message-failure\">Failed to create topic.</div> <div class=\"did-overlay-message did-overlay-message-success\">Topic created!</div> </div> </form> ";
                var form = container.querySelector("form.did-topic-form");

                if (!opts || !opts.circleId) {
                    throw new Error("Missing circleId in topics creation form, must be supplied in opts");
                }
                if (opts.fill) {
                    prefillFields(form, opts.fill);
                }

                form.addEventListener("submit", function (e) {
                    e.preventDefault();
                    sendCreateTopicRequest(api, integration, opts.circleId, form);
                    return false;
                });
            }
        };
    };
};

function sendCreateTopicRequest(api, integration, circleId, form) {
    var validation = validateData(form);
    if (!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    var overlay = getOverlay(form);
    overlay.posting();
    api.circles.topics.create(circleId, validation.data, function (error, result) {
        if (error) {
            overlay.failure();
            return console.error("Failed to create topic.", error);
        }
        overlay.success(function () {
            return integration.topics.view(circleId, result.topic.title);
        });
    });
}

function validateData(form) {
    var getValue = function getValue(name) {
        return form[name].value;
    };

    var valid = true;
    var errors = {};
    var title = getValue("title");
    var why = getValue("why");

    //TODO: actually validate

    if (valid) {
        return {
            valid: true,
            data: { title: title, why: why }
        };
    }
    return { valid: valid, errors: errors };
}

},{"../getFormOverlay":8,"../prefillFields":11,"../setUpMemberInviteSelect":13}],15:[function(require,module,exports){
"use strict";

var getOverlay = require("../getFormOverlay");
var parallel = require("../../tiny-parallel");
var createRemovableMemberElement = require("../createRemovableMemberElement");
var setUpMemberInviteSelect = require("../setUpMemberInviteSelect");

module.exports = function (api, integration) {
    return function (opts) {
        return {
            renderIn: function renderIn(container) {
                container.innerHTML = "<form class=\"did-form did-topic-form\"> <div class=\"did-form-row\"> <label for=\"title\"> Title <input name=\"title\" type=\"text\"> </label> <label for=\"owner\"> Owner <select name=\"owner\"> <option>Loading users...</option> </select> </label> <label for=\"why\"> Why should this topic be discussed? <textarea class=\"did-markdown-field\" name=\"why\"></textarea> </label> </div> <button>Update topic</button> <div class=\"did-overlay\"> <div class=\"did-overlay-message did-overlay-message-loading\">Loading form...</div> <div class=\"did-overlay-message did-overlay-message-posting\">Updating topic...</div> <div class=\"did-overlay-message did-overlay-message-failure\">Failed to update topic.</div> <div class=\"did-overlay-message did-overlay-message-success\">Topic updated!</div> </div> </form> ";
                var form = container.querySelector("form.did-topic-form");

                var overlay = getOverlay(form);
                overlay.loading();

                if (!opts || !opts.id || !opts.circleId) {
                    throw new Error("Missing topic ID or circle ID for circleEdit include. You should provide `id` and `circleId` as options when creating the include.");
                }

                parallel({
                    usersRequest: function usersRequest(callback) {
                        return api.users.get(callback);
                    },
                    circleRequest: function circleRequest(callback) {
                        return api.circles.get(opts.circleId, callback);
                    },
                    topicRequest: function topicRequest(callback) {
                        return api.circles.topics.get(opts.circleId, opts.id, callback);
                    }
                }, function (error, result) {
                    if (error) {
                        return console.error("Failed to load data", error);
                    }
                    var users = result.usersRequest.users;
                    var circle = result.circleRequest.circle;
                    var topic = result.topicRequest.topic;

                    if (circle.members.indexOf(api.getCurrentUserId()) === -1) {
                        return console.error("Cannot edit this form. Not a member of the circle.");
                    }

                    var setValue = function setValue(name, value) {
                        return form[name].value = value;
                    };
                    var transferValueByName = function transferValueByName(name) {
                        return setValue(name, topic[name]);
                    };
                    var transferValuesByName = function transferValuesByName(names) {
                        return names.forEach(transferValueByName);
                    };
                    transferValuesByName(["title", "why"]);

                    var ownerOptions = users.filter(function (user) {
                        return circle.members.indexOf(user.userId) !== -1;
                    }).map(function (user) {
                        return "<option value=\"" + user.userId + "\">" + user.name + "</option>";
                    }).join("");
                    var ownerSelect = form.owner;
                    ownerSelect.innerHTML = ownerOptions;
                    ownerSelect.value = topic.owner;

                    overlay.hide();
                });

                form.addEventListener("submit", function (e) {
                    e.preventDefault();
                    sendUpdateTopicRequest(api, integration, opts.circleId, opts.id, form);
                    return false;
                });
            }
        };
    };
};

function sendUpdateTopicRequest(api, integration, circleId, id, form) {
    var validation = validateData(form);
    if (!validation.valid) {
        //TODO: show errors on form
        return console.error("Failed to submit form because invalid data.");
    }
    var overlay = getOverlay(form);
    overlay.posting();
    api.circles.topics.update(circleId, id, validation.data, function (error, result) {
        if (error) {
            overlay.failure();
            return console.error("Failed to update topic.", error);
        }
        overlay.success(function () {
            return integration.topics.view(circleId, validation.data.title);
        });
    });
}

function validateData(form) {
    var getValue = function getValue(name) {
        return form[name].value;
    };

    var valid = true;

    var errors = {};
    var title = getValue("title");
    var owner = getValue("owner");
    var why = getValue("why");

    //TODO: actually validate

    if (valid) {
        return {
            valid: true,
            data: { title: title, owner: owner, why: why }
        };
    }
    return { valid: valid, errors: errors };
}

},{"../../tiny-parallel":18,"../createRemovableMemberElement":7,"../getFormOverlay":8,"../setUpMemberInviteSelect":13}],16:[function(require,module,exports){
"use strict";

var parallel = require("../../tiny-parallel");
var getOverlay = require("../getFormOverlay");
var createDomNode = require("../createDomNode");
var renderMembers = require("../renderMembers");

module.exports = function (api, integration, marked) {
    return function (opts) {
        return {
            renderIn: function renderIn(container) {
                container.innerHTML = "<div class=\"did-view\"> <div class=\"did-view-row did-view-row-double\"> <a class=\"did-back-to-circle-link\" href=\"#back-to-circle\">Back to circle</a> <a class=\"did-edit-link\" href=\"#edit-topic\">Edit topic</a> </div> <div class=\"did-view-row did-view-row-double\"> <div class=\"did-view-label did-view-label-title\"> Topic <div class=\"did-view-value did-big-title did-topic-title did-view-value-title\"></div> </div> </div> <div class=\"did-view-row\"> <div class=\"did-view-label did-view-label-owner\"> Owner <div class=\"did-view-value did-view-value-owner\"></div> </div> <div class=\"did-view-label did-view-label-why\"> Why <div class=\"did-view-value did-view-value-why\"></div> </div> </div> <div class=\"did-view-row\"> <div class=\"did-view-label did-view-label-stage\"> Stage <div class=\"did-topic-stage did-topic-stage-exploration\">Exploration</div> <div class=\"did-topic-stage did-topic-stage-pictureForming\">Picture Forming</div> <div class=\"did-topic-stage did-topic-stage-proposalShaping\">Proposal Shaping</div> <div class=\"did-topic-stage did-topic-stage-decisionMaking\">Decision Making</div> <div class=\"did-topic-stage did-topic-stage-agreement\">Agreement</div> </div> <div class=\"did-view-label did-view-label-procedure\"> Procedure <div class=\"did-view-value did-view-value-procedure\"></div> </div> </div> <div class=\"did-view-row did-view-row-double did-comments-section\"> <div class=\"did-view-label did-view-label-comments\"> Comments <div class=\"did-view-value did-view-value-commentsList\"></div> <div class=\"did-view-action did-view-action-addComment\"> </div> </div> </div> <div class=\"did-view-row did-view-row-double did-attachments-section\"> <div class=\"did-view-label did-view-label-attachments\"> Attachments <div class=\"did-view-value did-view-value-attachmentList\"></div> <div class=\"did-view-action did-view-action-addAttachment\"> </div> </div> </div> <div class=\"did-view-row did-view-row-double\"> <a class=\"did-btn did-go-to-next-stage-link\" href=\"#next-stage\">Go to next stage: </a> </div> <div class=\"did-overlay\"> <div class=\"did-overlay-message did-overlay-message-loading\">Loading topic...</div> <div class=\"did-overlay-message did-overlay-message-posting\">Going to next stage...</div> <div class=\"did-overlay-message did-overlay-message-failure\">Failed to go to next stage.</div> <div class=\"did-overlay-message did-overlay-message-success\">Update done!</div> </div> </div> ";
                var view = container.querySelector(".did-view");

                var overlay = getOverlay(container);
                overlay.loading();

                if (!opts || !opts.id || !opts.circleId) {
                    throw new Error("Missing topic ID or circle ID for topicView include. You should provide `id` and `circleId` as options when creating the include.");
                }

                view.querySelector(".did-back-to-circle-link").addEventListener("click", function (e) {
                    e.preventDefault();
                    integration.circles.view(opts.circleId);
                    return false;
                });

                view.querySelector(".did-edit-link").addEventListener("click", function (e) {
                    e.preventDefault();
                    integration.topics.edit(opts.circleId, opts.id);
                    return false;
                });

                parallel({
                    usersRequest: function usersRequest(callback) {
                        return api.users.get(callback);
                    },
                    topicRequest: function topicRequest(callback) {
                        return api.circles.topics.get(opts.circleId, opts.id, callback);
                    },
                    circleRequest: function circleRequest(callback) {
                        return api.circles.get(opts.circleId, callback);
                    }
                }, function (error, result) {
                    if (error) {
                        return console.error("Failed to get users or circle to display", error);
                    }

                    var users = result.usersRequest.users;
                    var topic = result.topicRequest.topic;
                    var circle = result.circleRequest.circle;

                    var selectValueField = function selectValueField(name) {
                        return view.querySelector(".did-view-value-" + name);
                    };
                    var setValue = function setValue(name, value) {
                        var field = selectValueField(name);
                        if (value) field.innerText = value;else field.innerHTML = "&mdash;";
                    };
                    var setMarkdownValue = function setMarkdownValue(name, value) {
                        var field = selectValueField(name);
                        field.innerHTML = value ? marked(value) : "&mdash;";
                    };

                    setValue("title", topic.title);
                    setMarkdownValue("why", topic.why);
                    setMarkdownValue("procedure", determineProcedure(topic.stage, circle));

                    var insertDomElements = function insertDomElements(name, elements) {
                        var field = selectValueField(name);
                        elements.forEach(function (e) {
                            field.appendChild(e);
                            field.appendChild(createDomNode("br"));
                        });
                    };
                    insertDomElements("owner", renderMembers([topic.owner], users, integration));

                    var goToNextStageLink = view.querySelector(".did-go-to-next-stage-link");

                    var getStageElement = function getStageElement(stage) {
                        return view.querySelector(".did-topic-stage-" + stage);
                    };
                    var markStage = function markStage(stage, state) {
                        getStageElement(stage).classList += " " + state;
                    };
                    var stages = ["exploration", "pictureForming", "proposalShaping", "decisionMaking", "agreement"];
                    var nextStage = null;

                    goToNextStageLink.addEventListener("click", function (e) {
                        e.preventDefault();
                        overlay.posting();
                        api.circles.topics.update(opts.circleId, opts.id, { stage: nextStage }, function (error) {
                            if (error) {
                                overlay.failure();
                                return console.error("Failed up go to next stage", error);
                            }
                            overlay.success(function () {
                                return integration.topics.view(opts.circleId, opts.id);
                            });
                        });
                        return false;
                    });

                    for (var i = 0; i < stages.length; i++) {
                        var stage = stages[i];
                        if (stage != topic.stage) {
                            markStage(stage, "done");
                        } else {
                            markStage(stage, "current");
                            if (i < stages.length - 1) {
                                nextStage = stages[i + 1];
                                goToNextStageLink.innerText += " " + getStageElement(nextStage).innerText;
                            } else {
                                goToNextStageLink.style = "display:none;";
                            }
                            break;
                        }
                    }

                    overlay.hide();
                });
            }
        };
    };
};

function determineProcedure(stage, circle) {
    return {
        "exploration": circle.topicExplorationStageProcedure,
        "pictureForming": circle.topicPictureFormingStageProcedure,
        "proposalShaping": circle.topicProposalShapingStageProcedure,
        "decisionMaking": circle.topicDecisionMakingStageProcedure,
        "agreement": circle.topicAgreementStageProcedure
    }[stage] || "";
}

},{"../../tiny-parallel":18,"../createDomNode":6,"../getFormOverlay":8,"../renderMembers":12}],17:[function(require,module,exports){
"use strict";

/*********************
 * This contains integration hooks back into the integrating application.
 * For example, this is how we decide how to act when we want to view a
 * resource in the integrating application.
 */
module.exports = function (conf) {
    if (conf) {
        return validateConf(conf);
    }
    return {
        circles: {
            view: function view(id) {
                return location.pathname = "/circles/" + id;
            }
        }
    };
};

function validateConf(conf) {
    //TODO: validate expected structure, return clean version
    return conf;
}

},{}],18:[function(require,module,exports){
"use strict";

module.exports = function (funcs, callback) {
    var errored = false;
    var result = {};
    var keys = Object.keys(funcs);
    keys.forEach(function (key) {
        return funcs[key](function (error, funcResult) {
            if (errored) {
                return;
            }
            if (error) {
                errored = true;
                return callback(error);
            }
            result[key] = funcResult;
            if (Object.keys(result).length == keys.length) {
                callback(null, result);
            }
        });
    });
};

},{}],"did":[function(require,module,exports){
"use strict";

var marked = require("marked");

//Strip out HTML sections in the Markdown.
var markedRenderer = new marked.Renderer();
markedRenderer.html = function (html) {
    return "";
};

marked.setOptions({ renderer: markedRenderer });

module.exports = function (url, integrationConf) {
    var api = require("./api-client/client")(url);
    var integration = require("./integration/integration")(integrationConf);

    return {
        api: api,
        includes: require("./includes/index")(api, integration, marked)
    };
};

},{"./api-client/client":2,"./includes/index":10,"./integration/integration":17,"marked":1}]},{},[]);
