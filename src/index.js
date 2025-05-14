// noinspection DuplicatedCode
const cheerio = require('cheerio');
import pkg from '../package.json';

const pluginName = pkg.name.replace(/^gitbook-plugin-/, '');

function getSetting(settings, key, defaultVal, convertor) {
	if (settings) {
		const match = settings.match(new RegExp(`${key}(?::([^\\r\\n|]*))?`));
		if (match) {
			return convertor ? convertor(match[1]) : match[1];
		}
	}
	return convertor ? convertor(defaultVal) : defaultVal;
}

module.exports = {
	book: {
		assets: './dist',
		// js: [
		//   'plugin.js'
		// ],
		css: [
			'index.css'
		]
	},
	ebook: {
		assets: './dist',
		// js: [
		//   'plugin.js'
		// ],
		css: [
			'index.css'
		]
	},
	hooks: {
		page: function (page) {
			const bookIns = this;
			const options = bookIns.config.get('pluginsConfig')[pluginName];
			const $ = cheerio.load(page.content);
			$('blockquote').each((i, blockquote) => {
				try {
					// define the cheerio elements
					const $blockquote = $(blockquote);
					const origin = $blockquote.html();
					//origin = origin.replace(/(^<p>)|(<\/p>$)/g,'');
					const reg = /(?:<p>\s*)?\[!([!?\w]*)((?:\|\w*:[^|\]]*)*?)\]/g;
					let lastIndex = 0;
					let matches;
					const rs = [];
					while ((matches = reg.exec(origin)) !== null) {
						const index = matches.index;
						if (lastIndex < index) {
							if (rs.length === 0) {
								rs.push('<blockquote>');
							}
							rs.push(origin.substring(lastIndex, index));
							rs.push('</blockquote>');
						}
						lastIndex = reg.lastIndex;
						const match = matches[0];
						let key = matches[1].trim().toLowerCase();
						const settings = matches[2];

						// alias
						key = ({
							'': 'tip',
							'?': 'question', 'q': 'question',
							'!': 'note', 'n': 'note', 'i': 'note', 'info': 'note',
							'!!': 'warning', 'w': 'warning', 'warn': 'warning',
							'!!!': 'danger', 'important': 'danger', 'error': 'danger'
						})[key] || key;

						const config = options[key];
						if (!config) {
							rs.push('<blockquote>');
							rs.push(match);
							continue;
						}

						// Style configuration
						const style = getSetting(settings, 'style', options.style);
						let iconVisible = getSetting(settings, 'iconVisible', config.iconVisible || 'true', (v) => v !== 'false');
						let labelVisible = getSetting(settings, 'labelVisible', config.labelVisible || 'true', (v) => v !== 'false');
						let label = getSetting(settings, 'label', config.label);
						const icon = getSetting(settings, 'icon', config.icon);
						const className = getSetting(settings, 'className', config.className);
						// Label can be language specific and could be specified via user configuration
						if (typeof label === 'object') {
							const language = bookIns.innerLanguage || bookIns.config.language;
							if (language && Object.prototype.hasOwnProperty.call(label, language)) {
								label = label[language];
							} else {
								label = label['en'] || label['zh'];
							}
						}
						if (!label) {
							labelVisible = false;
						}
						if (labelVisible) {
							const iconTag = iconVisible ? `<i class="${icon}"></i>` : '';
							rs.push(`<blockquote class="alert ${style} ${className}">
                <p class="title">${iconTag} ${label}</p>
                <p>`);
						} else {
							const iconTag = iconVisible ? `<span class="title"><i class="${icon}"></i></span>` : '';
							rs.push(`<blockquote class="alert ${style} ${className}"><p>${iconTag} `);
						}
					}
					if (rs.length > 0) {
						if (lastIndex < origin.length) {
							rs.push(origin.substring(lastIndex));
						}
						rs.push('</blockquote>');

						const content = rs.join('');
						if (content !== origin) {
							// append the new blockquote (as a div) to the parent
							$blockquote.before(content);
							// remove the old blockquote tag, so we dont get the default styling
							$blockquote.remove();
							// bookIns.log.error('content',content)
							// bookIns.log.error('$.html()',$.html())
							// bookIns.log.error('page.content.indexOf(origin)',page.content.indexOf(origin))
							// update the page content html with the new html
							//page.content = $('body').html();
							page.content = $.html();
						}
					}
				}catch (e){
					bookIns.log.error('', e)
				}
			});
			return page;
		}
	},
	blocks: {},
	filters: {},
};
