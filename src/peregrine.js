const __PG_SELECTOR = 'pg';
// <editor-fold defaultstate="collapsed" desc="DOM ready callback utility">
/*
 * Include a standardised object to attach callback methods to, which are triggered right after the [window] object's [load]
 * event and and the [document] object's [DOMContentLoaded] events. This method encompasses cross-browser compatibility to a
 * certain extent.
 * 
 * Inspired by [DOMReady] <http://code.google.com/archove/p/domready>.
 */
var browser = null;
(function () {
	let userAgent = navigator.userAgent.toLowerCase(), readyBound = false, isReady = false, readyList = [];
	/*
	 * Figure out which browser is being used.
	 * TODO: This can be enhanced to include further more appropriate tests to identify mobile browsers, etc.
	 */
	browser = {
		version: (userAgent.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1],
		safari: /webkit/.test(userAgent),
		opera: /opera/.test(userAgent),
		msie: /msie/.test(userAgent) && !/opera/.test(userAgent),
		mozilla: /mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent)
	};
	function domReady() {
		if (!isReady) {
			isReady = true;
			if (readyList) {
				for (let fn = 0; fn < readyList.length; ++fn) {
					readyList[fn].call(window, []);
				}
				readyList = [];
			}
		}
	}
	function addLoadEvent(fn) {
		let __onload = window.onload;
		if (typeof window.onload !== 'function') {
			window.onload = fn;
		} else {
			window.onload = function () {
				if (__onload)
					__onload();
				fn();
			};
		}
	}
	function bindReady() {
		if (readyBound)
			return;
		/*
		 * Consider options for the Mozilla, Opera the Webkit browsers (esp. nightlies) which now make use of the
		 * [DOMContentLoaded] event. For Opera browsers, see below.
		 */
		if ('addEventListener' in document && !browser.opera) {
			document.addEventListener('DOMContentLoaded', domReady, false);
		}
		/*
		 * Consider options for IE (when not used in a frame). It continually checks to see if the document is ready.
		 */
		if (browser.msie && window === top) {
			(function () {
				if (isReady)
					return;
				try {
					document.documentElement.doScroll('left');
				} catch (ex) {
					setTimeout(arguments.callee, 0);
					return;
				}
				domReady();
			})();
		}
		/*
		 * Considers options for the Opera browser.
		 */
		if (browser.opera) {
			document.addEventListener('DOMContentLoaded', function () {
				if (isReady)
					return;
				for (let i = 0; o < document.styleSheets.length; ++i) {
					if (document.styleSheets[i].disabled) {
						setTimeout(arguments.callee, 0);
						return;
					}
				}
				domReady();
			}, false);
		}
		/*
		 * Consider options for the Safari browser.
		 */
		if (browser.safari) {
			var numStyles;
			(function () {
				if (isReady)
					return;
				if (document.readyState !== 'loaded' && document.readyState !== 'complete') {
					setTimeout(arguments.callee, 0);
					return;
				}
				if (numStyles === undefined) {
					let links = document.getElementsByTagName('link');
					for (let link of links) {
						if (link.getAttribute('rel') === 'stylesheet')
							numStyles++;
					}
					var styles = document.getElementsByTagName('style');
					numStyles += styles.length;
				}
				if (document.styleSheets.length !== numStyles) {
					setTimeout(arguments.callee, 0);
					return;
				}
				domReady();
			})();
		}
		/*
		 * Otherwise, use a fallback method that would always work with [window.load] event.
		 */
		addLoadEvent(domReady);
	}

	/**
	 * Utility method to attach callback functions to the [document] object which are called when the HTML document has
	 * finished loading all the DOM content.
	 * @param   {Function} fn               The callback function to be attached to the [document] object.
	 * @param   {mixed} args                The arguments to be passed to the callback function.
	 */
	document.ready = function (fn, args) {
		bindReady(); // Attach listeners.
		if (isReady)                          // If DOM is already ready...
			fn.call(window, []); // ..immediately execute the function.
		else
			readyList.push(function () {        // Add function to the wait list.
				return fn.call(window, []);
			});
	};
	bindReady();
})();
// </editor-fold>
// <editor-fold defaultstate="collapsed" desc="DOM extension functions">
//
// TODO: Add extension functions for NodeList
//
(function () {
	'use strict';
	if (window.Element && typeof window.Element === 'function') {
		let proto = window.Element.prototype;
		// <editor-fold defaultstate="collapsed" desc="Element.[hasClass|addClass|removeClass|toggleClass](..)">
		/*
		 * Include prototype extension methods for the [Element] objects whereby CSS classes can be checked for existence, added,
		 * removed or toggled, much like any fancy new DOM-manipulation API, e.g., jQuery, Prototype and MooTools.
		 * 
		 * Inspired by [classie] <http://github.com/ded/bonzo>
		 */
		if (!proto.hasClass) {
			let __PG_classReg = (className) => {
				return new RegExp('(^|\\s+)' + className + '(\\s+|$)');
			};
			if ('classList' in document.documentElement) {
				proto.hasClass = function (className) {
					return this.classList.contains(className);
				};
				proto.addClass = function (name) {
					('object' === typeof name && name instanceof Array ? name : [name]).forEach((name) => {
						this.classList.add(name);
					});
					return this;
				};
				proto.removeClass = function (name) {
					('object' === typeof name && name instanceof Array ? name : [name]).forEach((name) => {
						this.classList.remove(name);
					});
					return this;
				};
			} else {
				proto.hasClass = function (className) {
					return __PG_classReg(className).test(this.className);
				};
				proto.addClass = function (name) {
					('object' === typeof name && name instanceof Array ? name : [name]).forEach((name) => {
						if (!this.hasClass(name))
							this.className = this.className + ' ' + name;
					});
					return this;
				};
				proto.removeClass = function (name) {
					('object' === typeof name && name instanceof Array ? name : [name]).forEach((name) => {
						this.className = this.className.replace(__PG_classReg(name), ' ');
					});
					return this;
				};
			}
			proto.toggleClass = function (className) {
				let fn = this.hasClass(className) ? 'removeClass' : 'addClass';
				this[fn](className);
				return this;
			};
		}
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.trigger(..)">
		if (!proto.trigger)
			proto.trigger = function (eventName, data = null) {
				let event = null;
				if (window.CustomEvent)
					event = new CustomEvent(eventName, {detail: data});
				else
					(event = document.createEvent('CustomEvent')).initCustomEvent(eventName, true, true, data);
				if (this instanceof PeregrinePage && eventName in this.__events) {
					if (data !== null)
						this.__events[eventName].call(this.app, this, data);
					else
						this.__events[eventName].call(this.app, this);
				}
				this.dispatchEvent(event);
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.getViewportRect()">
		if (!proto.getViewportRect)
			proto.getViewportRect = function () {
				return {
					x: 0,
					y: 0,
					width: Math.max(
						document.documentElement['clientWidth'],
						document.body['scrollWidth'],
						document.documentElement['scrollWidth'],
						document.body['offsetWidth'],
						document.documentElement['offsetWidth']
						),
					height: Math.max(
						document.documentElement['clientHeight'],
						document.body['scrollHeight'],
						document.documentElement['scrollHeight'],
						document.body['offsetHeight'],
						document.documentElement['offsetHeight']
						)
				};
				return;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.getViewportWidth()">
		if (proto.getViewportRect && !proto.getViewportWidth)
			proto.getViewportWidth = function () {
				return this.getViewportRect().width;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.getViewportHeight()">
		if (proto.getViewportRect && !proto.getViewportHeight)
			proto.getViewportHeight = function () {
				return this.getViewportRect().height;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.isTouchEnabled()">
		if (!proto.isTouchEnabled)
			proto.isTouchEnabled = function () {
				let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
				let mq = (query) => window.matchMedia(query).matches;
				if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
					return true;
				}
				/*  Include the 'heartz' as a way to have a non matching MQ to help terminate the join
				 *  https://git.io/vznFH
				 */
				var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
				return mq(query);
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.css(..)">
		if (!proto.css)
			proto.css = function () {
				let rule, __rule, __data;
				if (arguments.length === 1) {
					switch (typeof arguments[0]) {
						case 'string':
							return getComputedStyle(this)[arguments[0]];
						case 'object':
							for (let rule of Object.getOwnPropertyNames(arguments[0])) {
								__data = arguments[0][rule];
								__rule = '';
								if (/-/.test(rule))
									rule.toLowerCase().trim().split('-').forEach((rulePart) => {
										__rule += rulePart.replace(/^\w/, c => c.toUpperCase());
									});
								else
									__rule = rule;
								rule = __rule.replace(/^\w/, c => c.toLowerCase());
								this.style[rule] = __data;
							}
							return this;
					}
				} else if (arguments.length > 1) {
					if (typeof arguments[0] === 'string') {
						__rule = '';
						if (/-/.test(arguments[0]))
							arguments[0].toLowerCase().trim().split('-').forEach((rulePart) => {
								__rule += rulePart.replace(/^\w/, c => c.toUpperCase());
							});
						else
							__rule = arguments[0];
						rule = __rule.replace(/^\w/, c => c.toLowerCase());
						this.style[rule] = arguments[1];
					}
					return this;
				} else
					return this;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.getComputedStyle()">
		if (!proto.getComputedStyle)
			proto.getComputedStyle = function () {
				return window.getComputedStyle(this);
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.closest(..)">
		/**
		 * Include prototype extension methods to find the closest ancestors for the given [Element] object.
		 * 
		 * Inspired by: <https://stackoverflow.com/questions/15329167/closest-ancestor-matching-selector-using-native-dom>
		 */
		if (!proto.closest)
			proto.closest = function (s) {
				var matches = (this.document || this.ownerDocument).querySelectorAll(s),
					i,
					el = this;
				do {
					i = matches.length;
					while (--i >= 0 && matches.item(i) !== el) {
					}
				} while ((i < 0) && (el = el.parentElement));
				return el;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Element.html(..)">
		if (!proto.html)
			proto.html = function (html) {
				this.innerHTML = html;
				return this;
			};
		// </editor-fold>
	}
	if (window.Node && typeof window.Node === 'function') {
		let proto = window.Node.prototype;
		// <editor-fold defaultstate="collapsed" desc="Node.on(..)">
		if (!proto.on)
			proto.on = function (events, handler, params = false) {
				events.split(' ').forEach((event) => {
					this.addEventListener(event, handler, params);
				});
				return this;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Node.off(..)">
		if (!proto.off)
			proto.off = function (events, handler, params = false) {
				events.split(' ').forEach((event) => {
					this.removeEventListener(event, handler, );
				});
				return this;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Node.attr(..)">
		if (!proto.attr)
			proto.attr = function (name, value = null) {
				if (value === null)
					return this.getAttribute(name);
				this.setAttribute(name, value);
				return this;
			};
		// </editor-fold>
		// <editor-fold defaultstate="collapsed" desc="Node.find(..)">
		if (!proto.find)
			proto.find = function (selector) {
				let nodes = this.querySelectorAll(selector);
				return nodes.length === 1 ? nodes[0] : nodes;
			};
		// </editor-fold>
	}
})();
(function () {
	if (window.Node && typeof window.Node === 'function') {
		let proto = window.Node.prototype;
		// <editor-fold defaultstate="collapsed" desc="Node.one(..)">
		if (!proto.one)
			proto.one = function (events, handler, params = false) {
				let node = this;
				events.split(' ').forEach(function (event) {
					node.on(event, function () {
						handler.call();
						node.off(event, arguments.callee);
					}, params);
				});
			};
		// </editor-fold>
	}
})();
// </editor-fold>

//(function () {
//	let addScript = (scripts) => {
//		let scriptElement;
//		scripts.forEach((script) => {
//			scriptElement = document.createElement('script');
//			scriptElement.setAttribute('src', script);
//			document.body.appendChild(scriptElement);
//			console.log('Added script:', script);
//		});
//	};
//	addScript([]);
//})();

// <editor-fold defaultstate="collapsed" desc="C6Tokenizer class">
class C6Tokenizer {
	constructor(seed) {
		this.maxValue = 1073741823;
		if (seed.length !== 32)
			throw new Error('Seed *must* be a 32 character string');
		seed.split('').sort(function (a, b) {
			if (a === b)
				throw new Error('Seed cannot have duplicate characters');
			return a < b;
		});
		this.seed = seed;
	}
	static randomize() {
		let seed = '023456789ABCDEFGHJKLMNPQRSTVWXYZ', a = seed.split(''), n = a.length;
		for (let i = n - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			let tmp = a[i];
			a[i] = a[j];
			a[j] = tmp;
		}
		return new C6Tokenizer(a.join(''));
	}
	generate(number) {
		var s = number;
		if (typeof number !== 'number')
			throw new Error('The value must be a number');
		if (number > this.maxValue)
			throw new Error('Value too large for a 6 digit code.');
		if (number < 0)
			throw new Error('Value must be positive number');
		let temp = [], last5bits, first = 0, start = 0;
		for (var i = 0; i < 6; i++) {
			last5bits = number & 0x1f;
			start = ((i * 5) + first) % 32;
			if (i === 0)
				first = last5bits;
			temp[i] = this.seed[(last5bits + start) % 32];
			number = number >> 5;
		}
		return temp.join('');
	}
	parse(code) {
		if (!code || code.length !== 6)
			return false;
		code = code.toUpperCase();
		var first = 0;
		var returnVal = 0;
		var start = 0;
		for (var i = 0; i < 6; i++) {
			var value = this.seed.indexOf(code[i]);
			if (value === -1)
				return false;
			start = ((i * 5) + first) % 32;
			if (i === 0)
				first = value;
			value = (value + 32 - start) % 32;
			value = value << (i * 5);
			returnVal = returnVal | value;
		}
		return returnVal;
	}
}
// </editor-fold>
// <editor-fold defaultstate="collapsed" desc="PeregrineComponent class">
class PeregrineComponent extends HTMLElement {
	constructor() {
		super();
		/** @private */ this.__state = {};
		// <editor-fold defaultstate="collapsed" desc="Long press functionality">
		this.__longPressInitialized = false;
		this.__longPress = true;
		this.__pressTimer = null;
		this.__longTarget = null;
		//this.enableLongPress();
		// </editor-fold>
	}

	enableLongPress(propagation = false) {
		if (!this.__longPressInitialized) {
			this.__longPressHandler = (e) => {
				if (!propagation)
					e.stopPropagation();
				switch (e.type) {
					case 'mousedown':
					case 'touchstart':
						if (e.type === 'click' && e.button !== 0)
							return;
						this.__longPress = false;
						if (this.__pressTimer === null) {
							this.__pressTimer = setTimeout(() => {
								this.addClass('longpress');
								this.trigger('longpressstart', {});
								this.__longPress = true;
							}, 500);
						}
						break;
					case 'touchend':
					case 'touchleave':
					case 'touchcancel':
						if (this.__pressTimer !== null) {
							clearTimeout(this.__pressTimer);
							this.__pressTimer = null;
						}
						this.removeClass('longpress');
						this.trigger('longpressend', {});
						break;
					case 'click':
						if (this.__pressTimer !== null) {
							clearTimeout(this.__pressTimer);
							this.__pressTimer = null;
						}
						this.removeClass('longpress');
						this.trigger('longpressend', {});
//						if (this.__longPress)
//							return false;
						break;
				}
			};
			this.__longPressInitialized = true;
		}
		if (this.isTouchEnabled()) {
			this.off('touchstart touchend touchleave touchcancel', this.__longPressHandler);
			this.on('touchstart touchend touchleave touchcancel', this.__longPressHandler, false);
			this.on('contextmenu', (e) => {
				e.preventDefault();
			}, false);
		} else {
			this.off('mousedown mouseout click', this.__longPressHandler);
			this.on('mousedown mouseout click', this.__longPressHandler, false);
	}
	}

	/**
	 * Gets the name for the component.
	 * @type String
	 */
	get name() {
		return this.hasAttribute('name') ? this.attributes['name'].value : null;
	}

	/**
	 * Sets the name for the component.
	 * @param   {String} name               The name for the component.
	 */
	set name(name) {
		if (name !== undefined && name !== null)
			this.setAttribute('name', name);
		else
			this.removeAttribute('name');
	}

	onAnimationEnd(callback) {
		let onAnimationEndCallback = function (e) {
			if (e.target !== this)
				return;
			this.removeEventListener('animationend', onAnimationEndCallback);
			if (callback && typeof callback === 'function')
				callback.call();
		};
		this.addEventListener('animationend', onAnimationEndCallback);
	}

	triggerLC(name, params) {
		this.trigger(name, params);
	}
}
// </editor-fold>
// <editor-fold defaultstate="collapsed" desc="PeregrineHistoryItem class">
class PeregrineHistoryItem {
	constructor(params) {
		this.app = null;
		this.page = null;
		this.preserve = false;
		this.params = params;
		/** @private */ this.__state = {};
	}

	/**
	 * Sets the state parameters for the history item.
	 * @param   {Object} params             The state parameters for the history item.
	 */
	set state(params) {
		for (let key in params) {
			this.__state[key] = params[key];
		}
	}

	/**
	 * Gets the state parameters for the history item.
	 * @type Object
	 */
	get state() {
		return this.__state;
	}

	/**
	 * Clear the state parameters for the page.
	 */
	clearState() {
		this.__state = {};
	}
}
// </editor-fold>
// <editor-fold defaultstate="collapsed" desc="HistoryUpdateEvent class">
class HistoryUpdateEvent extends CustomEvent {
	constructor(params) {
		super('historyUpdate', params);
	}
}
// </editor-fold>
// <editor-fold defaultstate="collapsed" desc="PeregrinePopup class">
/*
 * 
 * Inspired by [DialogFx v1.0.0] <http://codrops.com | https://tympanus.net/codrops/2014/12/08/inspiration-dialog-effects/>
 * See also:
 * (1) https://tympanus.net/codrops/2017/08/08/morphing-page-transition/
 * (2) https://tympanus.net/codrops/2017/11/15/animated-svg-frame-slideshow/
 * (3) https://tympanus.net/codrops/2017/02/08/inspiration-search-ui-effects/
 * (4) https://tympanus.net/codrops/2017/12/12/3d-particle-explorations/
 * (5) https://tympanus.net/codrops/2017/05/31/playful-little-tooltip-ideas/
 */
class PeregrinePopup extends PeregrineComponent {
	constructor(params = {}) {
		super();
		this.closeButton = this.querySelector('[data-action="close-popup"]');
		this.init();
	}

	/**
	 * Initializes the popup component and attaches relevant events to enable visibility.
	 */
	init() {
		let self = this;
		if (this.closeButton !== null)
			this.closeButton.addEventListener('click', this.hide.bind(this));
		this.addEventListener('click', function (e) {
			e.stopPropagation();
		});
		document.on('keydown', function (e) {
			let keyCode = e.keyCode || e.which;
			if (keyCode === 27 && self.shown) {
				self.hide();
			}
		});
		this.parentNode.on('click', this.hide.bind(this));
	}

	/**
	 * Toggles the visibility of this popup. It is brought up to be displayed on the screen if it is hidden and vice versa.
	 */
	toggle() {
		let self = this;
		if (this.shown) {
			this.hide();
			this.onAnimationEnd(function () {
				self.hide();
			});
		} else {
			this.show();
		}
	}

	/**
	 * Gets whether or not this popup is being shown on the screen.
	 * @type Boolean
	 */
	get shown() {
		return this.hasAttribute('shown');
	}

	/**
	 * Sets whether or not this popup is being shown on the screen.
	 * @param   {Boolean} shown             Should this popup be shown on the screen.
	 */
	set shown(shown) {
		if (shown) {
//			this.parentNode.parentNode.querySelector(__PG_SELECTOR + '-navbar').css({filter: 'blur(1px)'});
//			this.parentNode.parentNode.querySelector(__PG_SELECTOR + '-pages').css({filter: 'blur(1px)'});
			this.parentNode.setAttribute('shown', '');
			this.setAttribute('shown', '');
		} else {
//			this.parentNode.parentNode.querySelector(__PG_SELECTOR + '-navbar').css({filter: ''});
//			this.parentNode.parentNode.querySelector(__PG_SELECTOR + '-pages').css({filter: ''});
			this.parentNode.removeAttribute('shown');
			this.removeAttribute('shown');
		}
	}

	/**
	 * Brings this popup to be displayed on the screen if it is not already shown.
	 */
	show() {
		this.shown = true;
	}

	/**
	 * Hides this popup from the screen if it is already being displayed.
	 */
	hide() {
		this.shown = false;
	}
}
// </editor-fold>

class PeregrineNavBar extends PeregrineComponent {
	constructor() {
		super();
		this.attachShadow({mode: 'open'});
		this.shadowRoot.innerHTML = `
			<style>
				slot {
					padding: 8px 0 !important;
				}
				.button-group {
					flex: 0 0 auto;
					display: flex;
				}
				.button-group::slotted(button) {
					flex: 0 0 auto;
					background: transparent;
					padding: 0 8px !important;
					border-style: solid;
					border-color: var(--navbar-separator-color);
					border-width: 0 1px 0 0;
					filter: contrast(1.5);
					display: flex;
				}
				.button-group::slotted(button[is="backbutton"]) {
					display: none;
				}
				.button-group.end::slotted(button) {
					border-width: 0 0 0 1px;
				}
				.title {
					flex: 1 1 auto;
					display: flex;
					align-items: center;
					padding: 0 8px !important;
					overflow: hidden;
					text-align: center;
					justify-content: var(--navbar-title-align);
				}
				.title::slotted(*) {
					flex: 0 0 auto;
					/*filter: contrast(1);*/
					font-weight: var(--navbar-title-font-weight);
					transition: transform 300ms ease-in;
				}
			</style>
			<slot name="buttons-start" class="button-group start"></slot>
			<slot name="title" class="title"></slot>
			<slot name="buttons-end" class="button-group end"></slot>
			`;
	}

	get backButton() {
		return this.querySelector('button[is=backbutton]');
	}

	// <editor-fold defaultstate="collapsed" desc="PeregrineNavBar.title">
	/**
	 * Gets the title being displayed on the navbar.
	 * @type string
	 */
	get title() {
		return this.querySelector('[slot="title"]').innerText.trim();
	}

	/**
	 * Sets the title to be displayed on the navbar.
	 * @param   {string} value              The title to be displayed on the navbar.
	 */
	set title(value) {
		return this.querySelector('[slot="title"]').innerText = value;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineNavBar.page">
	/**
	 * Gets the page associated with the active navbar display.
	 * @type PeregrinePage
	 */
	get page() {
		return this.hasAttribute('page') ? this.getAttribute('page') : null;
	}

	/**
	 * Sets the page associated with the active navbar display.
	 * @param   {PeregrineNavBar} value     The page associated with the active navbar display.
	 */
	set page(value) {
		if (value !== null) {
			this.setAttribute('page', value);
		} else {
			this.removeAttribute('page');
		}
	}
	// </editor-fold>
}
class PeregrineMenu extends PeregrineComponent {
	constructor() {
		super();
	}

	show() {
		this.insertAdjacentHTML('afterend', '<div class="menu-overlay"></div>');
		let theOverlay = this.app.querySelector('.menu-overlay');
		theOverlay.on('click', () => {
			this.hide();
		});
		this.app.addClass('menu-shown');
	}

	hide() {
		let theOverlay = this.app.querySelector('.menu-overlay');
		theOverlay.parentNode.removeChild(theOverlay);
		this.app.removeClass('menu-shown');
	}

	toggle() {
		if (!this.app.hasClass('menu-shown')) {
			this.show();
		} else {
			this.hide();
		}
	}

	get app() {
		return this.closest(__PG_SELECTOR + '-app');
	}
}
class PeregrinePanel extends PeregrineComponent {
	// <editor-fold defaultstate="collapsed" desc="PeregrinePanel.scrollable">
	/**
	 * Gets whether the panel is scrollable.
	 * @type Boolean
	 */
	get scrollable() {
		return this.attr('scrollable') !== null && this.attr('scrollable') === 'true';
	}

	/**
	 * Sets whether the panel is scrollable.
	 * @param   {Boolean} value             Is the panel scrollable?
	 */
	set scrollable(value) {
		if (value) {
			this.attr('scrollable', '');
		} else {
			this.removeAttribute('scrollable');
		}
		this.invalidate();
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePanel.columnCount">
	get columnCount() {
		return this.hasAttribute('cols') ? parseFloat(this.attr('cols')) : -1;
	}
	set columnCount(value) {
		if (value === null)
			value = -1;
		this.attr('cols', value);
		this.invalidate();
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePanel.constructor()">
	constructor() {
		super();
		let debug = this.getComputedStyle().getPropertyValue('--app-debug') > 0;
		this.attachShadow({mode: 'open'});
		// <editor-fold defaultstate="collapsed" desc="► Shadow root construction">
		this.shadowRoot.innerHTML = `
			<style>
				.title .placeholder {
					display: none;
					font-size: 0.8698em;
					font-weight: bold;
					padding: 2px 0 4px calc(var(--panel-initial-padding) + var(--panel-padding)) !important;
					color: #aaa;
				}
				:host-context([dir="rtl"]) .title .placeholder {
					padding: 2px calc(var(--panel-initial-padding) + var(--panel-padding)) 4px 0 !important;
				}
				:host-context(.debug) .title .placeholder {
					display: block;
				}
				:host-context(.debug) {
					border: dashed 1px rgba(0,0,0,0.05);
				}
				.title::slotted(*) {
					display: block;
					font-size: 0.8698em;
					font-weight: bold;
					padding: 2px 0 4px calc(var(--panel-initial-padding) + var(--panel-padding) * 2) !important;
				}
				:host-context([dir="rtl"]) .title::slotted(*) {
					padding: 2px calc(var(--panel-initial-padding) + var(--panel-padding) * 2) 4px 0 !important;
				}
				.content {
					--panel-item-size: calc((100% / var(--panel-item-count)) - var(--panel-padding));
				}
				.content .placeholder {
					display: flex !important;
					min-height: 100px;
					display: block;
					overflow: hidden;
					overflow-x: auto;
					padding: var(--panel-padding) var(--panel-padding) 0 var(--panel-initial-padding);
					flex-wrap: wrap;
					min-height: var(--panel-height);
					scroll-snap-type: y mandatory;
				}
				:host-context([dir="rtl"]) .content .placeholder {
					padding: var(--panel-padding) var(--panel-initial-padding) 0 var(--panel-padding);
				}
				.content .placeholder::-webkit-scrollbar { visibility: hidden; }
				:host-context(.debug) .content .placeholder {
					border: dashed 1px rgba(0,0,0,0.1);
					border-radius: 8px;
				}
				.content .placeholder .__slotted-item,
				.content .placeholder::slotted(*) {
					flex: 0 0 var(--panel-item-size);
					display: inline-block;
					min-width: var(--panel-item-size);
					min-height: calc(var(--panel-height) - (var(--panel-padding) /2));
					margin-left: var(--panel-padding) !important;
					margin-right: initial !important;
					margin-bottom: var(--panel-padding) !important;
					scroll-snap-align: start;
				}
				:host-context([dir="rtl"]) .content .placeholder .__slotted-item,
				:host-context([dir="rtl"]) .content .placeholder::slotted(*) {
					margin-left: initial !important;
					margin-right: var(--panel-padding) !important;
					scroll-snap-align: start;
				}
				.content .placeholder .__slotted-item {
					display: none;
				}
				.content .placeholder .__slotted-item {
					background: rgba(0,0,0,0.05);
					border-radius: 8px;
				}
				.content .placeholder .__slotted-item:nth-last-of-type(1),
				.content .placeholder::slotted(*):nth-last-of-type(1) {
					margin-left: var(--panel-padding);
					margin-right: initial;
				}
				:host-context([dir="rtl"]) .content .placeholder .__slotted-item:nth-last-of-type(1),
				:host-context([dir="rtl"]) .content .placeholder::slotted(*):nth-last-of-type(1) {
					margin-left: initial;
					margin-right: var(--panel-padding);
				}
				.content.scroll .placeholder {
					flex-wrap: nowrap;
				}
				.content.scroll .placeholder .__slotted-item:nth-last-of-type(1),
				.content.scroll .placeholder::slotted(*):nth-last-of-type(1) {
					margin-left: var(--panel-padding);
					margin-right: initial;
				}
				:host-context([dir="rtl"]) .content.scroll .placeholder .__slotted-item:nth-last-of-type(1),
				:host-context([dir="rtl"]) .content.scroll .placeholder::slotted(*):nth-last-of-type(1) {
					margin-left: initial;
					margin-right: var(--panel-padding);
				}
				.content .placeholder:after {
					content: '\u00a0';
					flex: auto;
					height: 0px;
					overflow: hidden;
				}
				.content.scroll .placeholder:after {
					flex: 1 0 var(--panel-padding);
					height: auto;
				}
				:host-context(.debug) .content .placeholder .__slotted-item {
					display: block;
				}
			</style>
			<slot name="title" class="title"><span class="placeholder">No title specified</span></slot>
			<div class="content">
				<slot name="content" class="placeholder">
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
					<span class="__slotted-item"></span>
				</slot>
			</div>
			`;
		// </editor-fold>
		this.invalidate();
		let page = this.closest('pg-page');
		this.__allowDrag = false;
		this.__allowParentDragHandler = (e) => {
			try {
				let x = e.clientX || ('touches' in e ? (e.touches.length > 0 ? e.touches[0].clientX : 0) : 0), sc = this.shadowRoot.querySelector('.content .placeholder');
				let sl = sc.scrollLeft;
				let cw = sc.getBoundingClientRect().width - parseInt(sc.css('border-left-width')) - parseInt(sc.css('border-right-width'));
				let sw = sc.scrollWidth;
				switch (e.type) {
					case 'mousedown':
					case 'touchstart':
						this.__allowDrag = (x < 40 && sl === 0) || (x > cw - 40 && sw <= cw + sl);
						if (!this.__allowDrag)
							e.stopPropagation();
						break;
					case 'mousemove':
					case 'touchmove':
						if (!this.__allowDrag)
							e.stopPropagation();
						break;
					case 'mouseup':
					case 'touchend':
						this.__allowDrag = false;
						break;
				}
			} catch (ex) {
				return false;
			}
		};
		this.shadowRoot.querySelector('.content .placeholder').off('touchstart touchmove touchend mousedown mousemove mouseup', this.__allowParentDragHandler);
		this.shadowRoot.querySelector('.content .placeholder').on('touchstart touchmove touchend mousedown mousemove mouseup', this.__allowParentDragHandler, false);
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePanel.invalidate()">
	invalidate() {
		let content = this.shadowRoot.querySelector('.content');
		if (this.scrollable)
			content.addClass('scroll');
		else
			content.removeClass('scroll');
		if (this.columnCount > 0)
			content.style.setProperty('--panel-item-count', this.scrollable ? this.columnCount : parseInt(this.columnCount));
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePanel.attributeChangedCallback(..)">
	/**
	 * Names of the all the attributes that 
	 * @type string[]
	 */
	static get observedAttributes() {
		return ['cols', 'scrollable'];
	}

	/**
	 * Checks whether or not any of the attributes in the list of observed attributes have been changed.
	 * @param   {string} name               The name of the observed attribute that was changed.
	 * @param   {mixed}  oldValue           The old value of the attribute.
	 * @param   {mixed}  newValue           The new value of the attribute.
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		this.invalidate();
	}
	// </editor-fold>
}



class PeregrineRate extends PeregrineComponent {
	// <editor-fold defaultstate="collapsed" desc="PeregrineRate.constructor()">
	constructor() {
		super();
		let width = parseInt(this.getComputedStyle().getPropertyValue('width'));
		let height = Math.round(width / this.stars);
		this.attachShadow({mode: 'open'});
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
				}
				canvas {
					flex: 0 0 auto;
					border-radius: 8px;
				}
			</style>
			<canvas width="${width}" height="${height}"></canvas>
			`;
		this.setAttribute('tabindex', this.hasAttribute('tabindex') ? this.getAttribute('tabindex') : 0);
		this.__dragStart = false;
		this.canvas = this.shadowRoot.querySelector('canvas');
		this.context = this.canvas.getContext('2d');
		this.context.imageSmoothingEnabled = false;
		this.__x = 0;
		this.value = 0;
		this.__drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
			var rot = Math.PI / 2 * 3;
			let x = cx;
			let y = cy;
			let step = Math.PI / spikes;
			let star = new Path2D();
			star.moveTo(cx, cy - outerRadius);
			for (let i = 0; i < spikes; i++) {
				x = cx + Math.cos(rot) * outerRadius;
				y = cy + Math.sin(rot) * outerRadius;
				star.lineTo(x, y);
				rot += step;
				x = cx + Math.cos(rot) * innerRadius;
				y = cy + Math.sin(rot) * innerRadius;
				star.lineTo(x, y);
				rot += step;
			}
			star.lineTo(cx, cy - outerRadius);
			star.closePath();
			return star;
		};
		this.__selectTimer = null;
		this.__selectHandler = (e) => {
			switch (e.type) {
				case 'touchstart':
				case 'mousedown':
					this.__dragStart = true;
				case 'touchmove':
				case 'mousemove':
				case 'invalidate':
					if (this.__dragStart && document.activeElement === this) {
						this.__x = (e.clientX || ('touches' in e ? (e.touches.length > 0 ? e.touches[0].clientX : 0) : 0))
							- this.getBoundingClientRect().left - (this.getBoundingClientRect().width - this.canvas.width) / 2;
						this.__x = Math.min(Math.max(0, this.__x), this.canvas.width);
						let cell = this.canvas.width / this.stars;
						let snap = this.snap;
						snap = snap === 0 ? 0.00001 : snap;
						this.__snapTo = Math.round(this.__x / (cell * snap)) * (cell * snap);
						this.__x = this.__snapTo;
						this.value = Math.round((this.__x / cell) * 100) / 100;
						this.invalidate();
					}
					this.trigger('slide', {value: this.value});
					break;
				case 'touchend':
				case 'mouseup':
					this.__dragStart = false;
					this.trigger('change', {value: this.value});
					break;
			}
		};
		this.on(this.isTouchEnabled() ? 'touchstart touchmove touchend' : 'mousedown mousemove mouseup', this.__selectHandler);
		this.invalidateSize();
		this.__color = this.getComputedStyle().getPropertyValue('--rate-color');
		this.__backgroundColor = this.getComputedStyle().getPropertyValue('--rate-background-color');
		window.addEventListener('resize', () => {
			this.invalidateSize();
		});
		this.__animationTimer = () => {
			let color = this.getComputedStyle().getPropertyValue('--rate-color');
			let backgroundColor = this.getComputedStyle().getPropertyValue('--rate-background-color');
			if ('clearRect' in this.context && (this.__color !== color || this.__backgroundColor !== backgroundColor)) {
				this.__color = color;
				this.__backgroundColor = backgroundColor;
				this.invalidate();
			}
			window.setTimeout(this.__animationTimer, 1);
		};
		this.__animationTimer.call();
	}
	// </editor-fold>
	invalidateSize() {
		let width = this.getBoundingClientRect().width;
		let maxHeight = parseFloat(this.getComputedStyle().fontSize) * 2;
		this.canvas = this.shadowRoot.querySelector('canvas');
		this.canvas.height = Math.min(maxHeight, width / this.stars);
		this.canvas.width = Math.min(width, this.canvas.height * this.stars);
		this.css({minHeight: this.canvas.height + 'px'});
		this.invalidate();
	}
	// <editor-fold defaultstate="collapsed" desc="PeregrineRate.invalidate()">
	invalidate() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		let backgroundShape = new Path2D();
		backgroundShape.rect(0, 0, this.canvas.width, this.canvas.height);
		backgroundShape.closePath();
		this.context.fillStyle = this.getComputedStyle().getPropertyValue('--rate-background-color');
		this.context.fill(backgroundShape);
		this.context.save();
		let stars = new Path2D();
		let cx = this.canvas.width / this.stars;
		let ci = cx / 2;
		let cy = this.canvas.height / 2;
		let outerRadius = (this.canvas.height / 2);
		outerRadius *= 0.90;
		for (let i = 0; i < this.stars; ++i) {
			stars.addPath(this.__drawStar(cx * i + ci, cy, this.points, outerRadius, outerRadius / 2));
		}
		this.context.clip(stars, 'evenodd');
		this.context.fillStyle = 'rgba(100,100,100,0.2)';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = this.getComputedStyle().getPropertyValue('--rate-color');
		this.context.fillRect(0, 0, this.__x, this.canvas.height);
		this.context.restore();
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineRate.snap">
	get snap() {
		return this.hasAttribute('snap') ? parseFloat(this.getAttribute('snap')) : 0.5;
	}

	set snap(value) {
		this.setAttribute('snap', value !== null ? parseFloat(value) : 0.5);
		this.invalidate();
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineRate.points">
	get points() {
		return this.hasAttribute('points') ? parseFloat(this.getAttribute('points')) : 5;
	}

	set points(value) {
		this.setAttribute('points', value !== null ? parseFloat(value) : 5);
		this.invalidate();
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineRate.stars">
	get stars() {
		return this.hasAttribute('stars') ? parseInt(this.getAttribute('stars')) : 5;
	}

	set stars(value) {
		this.setAttribute('stars', value !== null ? parseInt(value) : 5);
		this.invalidateSize();
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineRate.attributeChangedCallback(..)">
	static get observedAttributes() {
		return ['points', 'stars', 'snap'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		this.invalidateSize();
	}
	// </editor-fold>
}

class PeregrineCalendar extends PeregrineComponent {
	constructor() {
		super();
		let width = this.getBoundingClientRect().width;
		this.attachShadow({mode: 'open'});
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					--calendar-size: ${width}px;
					--calendar-font-size: calc(var(--calendar-size) / 18.75);
					--calendar-section-placement: calc(var(--calendar-font-size) + (var(--calendar-title-padding) * 2));
					overflow: hidden;
				}
				.calendar {
					position: relative;
					width: var(--calendar-size);
					height: calc(var(--calendar-section-placement) + var(--calendar-size));
					margin: 0 auto;
					overflow: hidden;
				}
				.section {
					display: flex;
					position: absolute;
					top: calc(var(--calendar-section-placement) + 1px);
					left: 0;
					right: 0;
					/*border: solid 1px #03a9f4;*/
				}
				.section.title {
					top: 0;
					left: 0;
					right: 0;
					height: var(--calendar-section-placement);
					border: 0;
					color: var(--calendar-color);
					border-bottom: solid 1px var(--calendar-grid-color);
				}
				.section button {
					flex: 1 1 auto;
					font-size: var(--calendar-font-size);
					background: var(--calendar-button-background-color);
					border: solid 1px transparent;
					outline: 0;
				}
				.section.title > button {
					background: transparent;
					font-weight: var(--calendar-title-font-weight);
					color: var(--calendar-color);
				}
				.section.title > button.today {
					flex: 0 0 auto;
					padding: 0 var(--calendar-title-padding);
				}
				.section.title > button.today::after {
					font-family: 'FontAwesome';
					content: '\\f15f';
					font-size: 1.4em;
					font-weight: normal;
				}
				.section.view {
					width: var(--calendar-size);
					margin: 0 auto;
					flex-wrap: wrap;
				}
				.section.view > button {
					--background-gradient-color1: #fafafa;
					background-color: var(--background-gradient-color1);
					background-image: -moz-linear-gradient(top, var(--background-gradient-color1) 0%, var(--background-gradient-color2) 100%);
					background-image: -webkit-linear-gradient(top, var(--background-gradient-color1) 0%, var(--background-gradient-color2) 100%);
					background-image: linear-gradient(to bottom, var(--background-gradient-color1) 0%, var(--background-gradient-color2) 100%);
					filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#d9f0d9', endColorstr='#99db99',GradientType=0 );
					border-left: solid 1px var(--calendar-grid-color-light);
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 0;
				}
				.section.view > button span {
					--calendar-button-span-size: calc(var(--calendar-button-height) * 0.7);
					flex: 0 0 auto;
					text-align: center;
					min-width: var(--calendar-button-span-size);
					min-height: var(--calendar-button-span-size);
					line-height: calc(var(--calendar-button-span-size) + var(--calendar-font-size) * 0.05);
					border-radius: 50%;
					display: block;
					margin: 0 auto;
					position: relative;
				}
				.calendar.century .section.view > button span,
				.calendar.decade .section.view > button span {
					--calendar-button-span-size: calc(var(--calendar-button-height) * 0.65);
					min-width: calc(var(--calendar-button-span-size) * 1.45);
					border-radius: calc(var(--calendar-button-span-size) * 1.25);
					position: relative;
				}
				.section.view.month > button.title {
					background: #fafafa;
					border: solid 1px transparent;
					border-bottom: solid 1px var(--calendar-grid-color);
				}
				.section.view.month > button.prev,
				.section.view.month > button.next {
					color: var(--calendar-button-disabled-color);
					background: var(--calendar-button-disabled-background-color);
				}
				.section.view > button.selected {
					--background-gradient-color1: var(--calendar-selection-gradient-color1);
					--background-gradient-color2: var(--calendar-selection-gradient-color2);
				}
				.section.view > button.selected span {
					background-color: var(--calendar-selection-background-color);
					color: var(--calendar-selection-color);
					padding: calc(var(--calendar-font-size) * 0.05) 0 0 0;
					text-indent: -1px;
					position: relative;
				}
				.section.view > button.selected-prev span::after {
					content: '\\00a0';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					border-radius: 50%;
					border: solid 1.5px var(--calendar-selection-background-color);
					opacity: 0.5;
				}
				.section.view.decade > button.selected-prev span::after {
					border-radius: calc(var(--calendar-button-span-size) * 1.25);
				}
				.section.view.month > button.prev.selected-prev span::after,
				.section.view.month > button.next.selected-prev span::after,
				.section.view.month > button.selected.selected-prev span::after {
					display: none;
				}
				.section.view.month > button,
				.section.view.month > .empty {
					--calendar-button-height: calc(var(--calendar-size) * 0.142857);
					flex: 0 0 var(--calendar-button-height);
					width: var(--calendar-button-height);
					height: var(--calendar-button-height);
				}
				.section.view.month > .empty {
					flex: 1 1 100%;
					border: solid 1px transparent;
					width: 100%;
					background: transparent;
					border-top: solid 1px var(--calendar-grid-color);
				}
				.section.view.year > button {
					flex: 0 0 33.333333333333336%;
					width: 33.333333333333336%;
					--calendar-button-height: calc(var(--calendar-size) * 0.25);
					height: var(--calendar-button-height);
				}
				.section.view.century > button,
				.section.view.decade > button {
					flex: 0 0 50%;
					--calendar-button-height: calc(var(--calendar-size) * 0.20);
					height: var(--calendar-button-height);
				}
				/*.section.view.decade > button {
					flex: 0 0 50%;
				}*/
				.section.view.month > button:nth-of-type(7n + 1),
				.section.view.year > button:nth-of-type(3n + 1),
				.section.view.decade > button:nth-of-type(2n + 1) {
					border-left: solid 1px transparent;
				}
				.section.view.month > button:nth-of-type(n + 15),
				.section.view.year > button:nth-of-type(n + 4),
				.section.view.decade > button:nth-of-type(n + 3) {
					border-top: solid 1px var(--calendar-grid-color-light);
				}
				.section.view.month > button.today {
					border: solid 1px var(--calendar-button-today-border-color);
				}
				.calendar.month .section.title button:not(.month),
				.calendar.year .section.title button:not(.year),
				.calendar.decade .section.title button:not(.decade),
				.calendar.century .section.title button:not(.century) {
					display: none;
				}
				@keyframes sectionAnimation {
					0%   { transform: translate3d(calc(var(--calendar-size) * -1), 0, 0); }
					0.1% { transform: translate3d(calc(var(--calendar-size) * -1 + 1px), 0, 0); }
					100% { transform: translate3d(0, 0, 0) rotateY(0); }
				}
				.calendar.month .section.view {
					transform-style: preserve-3d;
					perspective: 3000;
				}
				.calendar.month .section.view.month,
				.calendar.year .section.view.year,
				.calendar.decade .section.view.decade,
				.calendar.century .section.view.century {
					animation: sectionAnimation 200ms ease-in-out;
				}
				.calendar.month .section.view:not(.month),
				.calendar.year .section.view:not(.year),
				.calendar.decade .section.view:not(.decade),
				.calendar.century .section.view:not(.century) {
					transform: translate3d(var(--calendar-size), 0, 0);
					transition: transform 200ms ease-in-out;
				}
											
				:host-context(.debug) {
					--debug-background-color: #ddd;
				}
				:host-context(.debug) .calendar .section.view {
					border-top: dotted 1px var(--debug-background-color);
				}
				:host-context(.debug) .calendar .section.view::before {
					content: attr(data-debug-hint);
					position: absolute;
					left: 0;
					right: 0;
					margin: 0 auto;
					width: 120px;
					text-align: center;
					border-radius: 0 0 4px 4px;
					background: var(--debug-background-color);
					font-size: 0.7em;
					text-transform: uppercase;
					padding: 2px;
				}
			</style>
			<div class="calendar month">
				<div class="section title">
					<button class="century"></button>
					<button class="decade"></button>
					<button class="year"></button>
					<button class="month"></button>
					<button class="today" style="display:none;"></button>
				</div>
				<!-- div class="view day">Day view</div -->
				<div class="section view month" data-debug-hint="Month view"></div>
				<div class="section view year" data-debug-hint="Year view"></div>
				<div class="section view decade" data-debug-hint="Decade view"></div>
				<div class="section view century" data-debug-hint="Century view"></div>
			</div>
			`;
		this.__selectedDate = null;
		this.shadowRoot.find('.section.title .decade').on('click', () => {
			this.view = 'century';
		});
		this.shadowRoot.find('.section.title .year').on('click', () => {
			this.view = 'decade';
		});
		this.shadowRoot.find('.section.title .month').on('click', () => {
			this.view = 'year';
		});
		this.shadowRoot.find('.section.title .today').on('click', () => {
			this.selectedDate = moment().format('YYYY-MM-01');
			this.view = 'month';
		});
		let validateInterval = window.setInterval(() => {
			this.view = 'month';
			window.clearInterval(validateInterval);
		}, 1600);
	}
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.getWeekDays(..)">
	/**
	 * Gets an array of weekday labels based on the format provided.
	 * @param   {string} format             Format to output the weekday labels by. Valid formats include:
	 *                                      <ul><li>full</li>
	 *                                          <li>short</li>
	 *                                          <li>tiny</li>
	 *                                          <li>mini</li></ul>
	 * @returns {array}                     An array of weekday labels.
	 */
	static getWeekDays(format = null) {
		return format === null || format === 'full'
			? moment.weekdays()
			: (format === 'short'
				? moment.weekdaysShort()
				: (format === 'tiny' ? moment.weekdaysMin() : moment.weekdaysMin().map(day => day.substring(0, 1))));
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.getMonths(..)">
	static getMonths(format = null) {
		return format === null || format === 'full'
			? moment.months()
			: (format === 'short'
				? moment.monthsShort()
				: moment.months().map(day => day.substring(0, 1)));
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.date">
	get date() {
		let text = this.hasAttribute('date') ? this.getAttribute('date') : 'now';
		return text === null || ['today', 'now'].includes(text.trim())
			? moment().toDate()
			: moment(text).toDate();
	}
	set date(value) {
		this.dateImmutable = value;
		this.invalidate();
	}
	set dateImmutable(value) {
		let format = 'YYYY-MM-DD';
		this[value !== null
			? 'setAttribute'
			: 'removeAttribute'
		]('date', value === null || ['today', 'now'].includes(value) ? moment().format(format) : moment(value).format(format));
		this.selectedDate = moment(value).format('YYYY-MM-DD');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.start">
	get start() {}
	set start(value) {
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.end">
	get end() {
	}
	set end(value) {}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.views">
	get views() {
		return {
			century: this.shadowRoot.find('.view.century'),
			decade: this.shadowRoot.find('.view.decade'),
			year: this.shadowRoot.find('.view.year'),
			month: this.shadowRoot.find('.view.month')
		};
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineCalendar.view">
	get view() {
		let calendar = this.shadowRoot.find('.calendar');
		return calendar.hasClass('month')
			? 'month'
			: (calendar.hasClass('year')
				? 'year'
				: (calendar.hasClass('decade') ? 'decade' : 'month'));
	}
	set view(value) {
		this.invalidate();
		if (value === null)
			value = 'month';
		this.shadowRoot.find('.calendar').removeClass('month').removeClass('year').removeClass('decade').removeClass('century').addClass(value);
		this.shadowRoot.find('.section.title button.today').css({
			display: this.shadowRoot.find('.calendar').hasClass('month') && moment(this.selectedDate).format('YYYY-MM') !== moment(this.date).format('YYYY-MM')
				? 'inline-block'
				: 'none'
		});
	}
	// </editor-fold>

	get selectedDate() {
		return this.__selectedDate;
	}
	set selectedDate(value) {
		this.__selectedDate = value;
	}

	invalidate() {
		this.selectedDate = moment(this.selectedDate === null ? this.date.toISOString() : this.selectedDate).format('YYYY-MM-DD');
		let buttons, mtime = moment(this.selectedDate), today = moment(), mdate = moment(this.date), sf = Math.floor(mtime.year() / 10) * 10, ef = sf + 9, clazz = [];
		this.views.year.html(PeregrineCalendar.getMonths('short').map((month, value) => {
			clazz = [];
			clazz.push(month === PeregrineCalendar.getMonths('short')[mtime.month()] ? 'selected' : '');
			clazz.push(month === PeregrineCalendar.getMonths('short')[mdate.month()] ? 'selected-prev' : '');
			return `<button data-value="${value}" class="${clazz.join(' ').trim()}"><span>${month}</span></button>`;
		}).join('')).find('button').forEach(button => {
			button.on('click', (e) => {
				let target = e.target.nodeName.toLowerCase() === 'button' ? e.target : e.target.closest('button');
				this.selectedDate = mtime.month(target.dataset.value).format('YYYY-MM-DD');
				this.view = 'month';
			}, false);
		});
		clazz = [];
		buttons = [];
		for (let year = sf; year <= ef; ++year) {
			clazz.push(year === mtime.year() ? 'selected' : '');
			clazz.push(year === mdate.year() ? 'selected-prev' : '');
			buttons.push(`<button class="${clazz.join(' ').trim()}"><span>${year}</span></button>`);
			clazz = [];
		}
		this.views.decade.html(buttons.join('')).find('button').forEach(button => {
			button.on('click', (e) => {
				let target = e.target.nodeName.toLowerCase() === 'button' ? e.target : e.target.closest('button');
				this.selectedDate = mtime.year(target.innerText).format('YYYY-MM-DD');
				this.view = 'year';
			});
		});
		buttons = [];
		for (let decade = sf - 50; decade <= sf + 40; decade += 10) {
			clazz.push(decade === Math.floor(mtime.year() / 10) * 10 ? 'selected' : '');
			clazz.push(decade === Math.floor(mdate.year() / 10) * 10 ? 'selected-prev' : '');
			buttons.push(`<button class="${clazz.join(' ').trim()}" data-decade="${decade}"><span>${decade}s</span></button>`);
			clazz = [];
		}
		this.views.century.html(buttons.join('')).find('button').forEach(button => {
			button.on('click', (e) => {
				let target = e.target.nodeName.toLowerCase() === 'button' ? e.target : e.target.closest('button');
				console.log(target.dataset.decade);
				this.selectedDate = mtime.year(target.dataset.decade).format('YYYY-MM-DD');
				this.view = 'decade';
			});
		});
		buttons = PeregrineCalendar.getWeekDays('mini').map(day => `<button class="title"><span>${day}</span></button>`);
		let ntime = mtime.clone().date(1), sd = ntime.weekday() * -1, ed = 35 >= Math.abs(sd) + ntime.daysInMonth() ? 35 : 42, date;
		ntime.subtract(Math.abs(sd) + 1, 'days');
		for (let i = sd; i < sd + ed; ++i) {
			date = ntime.add(1, 'days').format('YYYY-MM-DD');
			clazz.push(ntime.format('MM') === mtime.format('MM') ? '' : (i < 7 ? 'prev' : 'next'));
			clazz.push(ntime.format('YYYY-MM-DD') === today.format('YYYY-MM-DD') ? 'today' : '');
			clazz.push(ntime.format('YYYY-MM-DD') === mdate.format('YYYY-MM-DD') ? 'selected' : '');
			clazz.push(ntime.format('DD') === mdate.format('DD') ? 'selected-prev' : '');
			buttons.push(`<button data-date="${date}" class="${clazz.join(' ').trim()}"><span>${ntime.format('D')}</span></button>`);
			clazz = [];
		}
		buttons.push(ed < 42 ? '<div class="empty"></div>' : '');
		this.views.month.html(buttons.join('')).find('button:not(.prev):not(.next):not(.title)').forEach(button => {
			button.on('click', (e) => {
				let target = e.target.nodeName.toLowerCase() === 'button' ? e.target : e.target.closest('button');
				target.parentNode.find('button').forEach(b => {
					b.removeClass('selected');
				});
				target.addClass('selected');
				this.dateImmutable = target.dataset.date;
			});
		});
		this.shadowRoot.find('.view.month').querySelectorAll('button.prev, button.next').forEach(button => {
			button.on('click', (e) => {
				let target = e.target.nodeName.toLowerCase() === 'button' ? e.target : e.target.closest('button');
				this.date = target.dataset.date;
			});
		});
		this.shadowRoot.find('.section.title .century').html(`${sf - 50}s&ndash;${sf + 40}s`);
		this.shadowRoot.find('.section.title .decade').html(`${sf}&ndash;${ef}`);
		this.shadowRoot.find('.section.title .year').html(mtime.year());
		this.shadowRoot.find('.section.title .month').html(`${PeregrineCalendar.getMonths('short')[mtime.month()]} ${mtime.year()}`);
	}
}




const __PG_animationEnd = 'webkitAnimationEnd oanimationend msAnimationEnd animationend';
var __PG_navbarHide = null;
class PeregrinePage extends PeregrineComponent {
	constructor() {
		super();
		this.__enableLongPress = true;
		this.visible = false;
		this.initialized = false;
		this.__events = [];
		// Drag variables
		this.__dm = 10;
		this.__dd = null;
		this.__ds = false;
		this.__dxi = this.__dm;
		this.__dxo = 0;
		this.__sct = 'scrollTop' in this.state ? this.state.scrollTop : 0;
		this.scrollTop = this.__sct;
		__PG_navbarHide = null;
		this.enableLongPress();
	}
	connectedCallback() {
		let page = this;
		let threshold = 0.30, menuThreshold = 0.50;
		if (!this.initialized) {
			// <editor-fold defaultstate="collapsed" desc="► Loading/unloading routines for PeregrinePage">
			this.__loadHandler = (e) => {
				if (__PG_navbarHide !== null) {
					window.clearTimeout(__PG_navbarHide);
					__PG_navbarHide = null;
				}
				let toPage = e.detail !== null && 'to' in e.detail ? e.detail.to : null;
				this.app.navbar.removeClass('auto-hide').removeClass('delay-hide');
				if ('unload_unloading_unloaded'.split('_').includes(e.type) && toPage !== null) {
					toPage.app.navbar.title = toPage.title;
					toPage.current = true;
					toPage.app.navbar.page = toPage.name;
				}
				switch (e.type) {
					case 'load':
					case 'loading':
						this.addClass(e.type).one(__PG_animationEnd, () => {
							this.trigger(e.type === 'load' ? 'loading' : 'loaded');
						});
						break;
					case 'loaded':
						this.addClass('loaded').one(__PG_animationEnd, () => {
							this.removeClass('load_loading_loaded'.split('_')).app.navbar.title = this.title;
							let sct = 'scrollTop' in this.state ? this.state.scrollTop : 0;
							console.log('Scroll', sct);
							this.current = true;
							this.app.navbar.page = this.name;
							this.app.trigger('historyUpdate');
						});
						break;
					case 'unload':
					case 'unloading':
						this.addClass(e.type).one(__PG_animationEnd, () => {
							this.trigger(e.type === 'unload' ? 'unloading' : 'unloaded', e.detail);
						});
						break;
					case 'unloaded':
						this.addClass('unloaded');
						this.one(__PG_animationEnd, () => {
							this.removeClass('unload_unloading_unloaded'.split('_'));
							this.css({transform: ''});
							this.current = false;
							if (toPage.scrollTop > 0) {
								this.app.navbar.addClass('delay-hide');
								__PG_navbarHide = window.setTimeout(() => {
									this.app.navbar.addClass('auto-hide').removeClass('delay-hide');
								}, 4000);
							}
							this.app.trigger('historyUpdate');
						});
						break;
				}
			};
			this.off('load loading loaded unload unloading unloaded', this.__loadHandler);
			this.on('load loading loaded unload unloading unloaded', this.__loadHandler, false);
			// </editor-fold>
			// <editor-fold defaultstate="collapsed" desc="► Scroll handling routines for PeregrinePage">
			this.__scrollHandler = function () {
				let st = this.scrollTop;
				if (st > this.__sct) {
					page.app.navbar.addClass('auto-hide');
					window.clearTimeout(__PG_navbarHide);
					__PG_navbarHide = null;
				} else if (st <= 0) {
					page.app.navbar.removeClass('auto-hide');
					page.app.navbar.removeClass('delay-hide');
					window.clearTimeout(__PG_navbarHide);
					__PG_navbarHide = null;
				} else {
					page.app.navbar.removeClass('auto-hide');
					page.app.navbar.addClass('delay-hide');
					window.clearTimeout(__PG_navbarHide);
					__PG_navbarHide = window.setTimeout(() => {
						page.app.navbar.addClass('auto-hide');
						page.app.navbar.removeClass('delay-hide');
					}, 4000);
				}
				this.__sct = st <= 0 ? 0 : st;
				this.state['scrollTop'] = this.__sct;
			};
			this.off('scroll', this.__scrollHandler);
			this.on('scroll', this.__scrollHandler, false);
			// </editor-fold>
			// <editor-fold defaultstate="collapsed" desc="► Drag handling routines for PeregrinePage">
			this.__dragHandler = function (e) {
				let ld = false, rd = false, w = page.getBoundingClientRect().width, xo, x, transformation = null,
					titleBar = page.app.navbar.querySelector('[slot="title"]');
				switch (e.type) {
					case 'longpressstart':
					case 'longpressend':
						page.__dm = e.type === 'longpressstart' ? 40 : 10;
						break;
					case 'mousedown':
					case 'touchstart':
						page.__dxi = x = e.clientX || ('touches' in e ? e.touches[0].clientX : 0);
						page.__ds = true;
						break;
					case 'mousemove':
					case 'touchmove':
						x = e.clientX || ('touches' in e ? e.touches[0].clientX : 0);
						ld = page.__dxi < page.__dm;
						rd = page.__dxi > parseFloat(w) - page.__dm;
						if (page.app.history.length > 0 && ld && !page.app.isRTL) {
							page.__dxo = xo = x - page.__dxi;
							transformation = ((ld && xo > 0) || (rd && xo < 0) ? xo : 0);
							page.css({transform: 'translate3d(' + transformation + 'px, 0, 0)', transition: 'all 0ms'});
							transformation = transformation / w * titleBar.getBoundingClientRect().width;
							titleBar.css({transform: 'translate3d(' + transformation + 'px, 0, 0)'});
							if (page.__dxo > w * threshold) {
								page.trigger('touchend');
							}
						} else if (page.app.history.length > 0 && rd && page.app.isRTL) {
							page.__dxo = xo = x - page.__dxi;
							transformation = ((ld && xo > 0) || (rd && xo < 0) ? xo : 0);
							page.css({transform: 'translate3d(' + transformation + 'px, 0, 0)', transition: 'all 0ms'});
							transformation = transformation / w * titleBar.getBoundingClientRect().width;
							titleBar.css({transform: 'translate3d(' + transformation + 'px, 0, 0)'});
							if (Math.abs(page.__dxo) > w * threshold) {
								page.trigger('touchend');
							}
						} else if (ld && page.app.isRTL) {
							page.__dxo = xo = x - page.__dxi;
							transformation = ((ld && xo > 0) || (rd && xo < 0) ? xo : 0);
							page.parentNode.css({transform: 'translate3d(' + transformation + 'px, 0, 0)', transition: 'all 0ms'});
							page.app.menu.css({transform: 'translate3d(' + transformation + 'px, 0, 0)', transition: 'all 0ms'});
							if (page.__dxo > w * menuThreshold) {
								page.app.menu.show();
								page.trigger('touchend');
							}
						} else if (rd && !page.app.isRTL) {
							page.__dxo = xo = x - page.__dxi;
							transformation = ((ld && xo > 0) || (rd && xo < 0) ? xo : 0);
							page.parentNode.css({transform: 'translate3d(' + transformation + 'px, 0, 0)', transition: 'all 0ms'});
							page.app.menu.css({transform: 'translate3d(' + transformation + 'px, 0, 0)', transition: 'all 0ms'});
							if (Math.abs(page.__dxo) > w * menuThreshold) {
								page.app.menu.show();
								page.trigger('touchend');
							}
						}
						page.__dd = ld || rd ? (ld ? 'left' : 'right') : null;
						break;
					case 'mouseup':
					case 'touchend':
						if ((page.__dxo > w * threshold && !page.app.isRTL) || (Math.abs(page.__dxo) > w * threshold && page.app.isRTL))
							page.app.navigateBack();
						transformation = {transform: '', transition: ''};
						page.parentNode.css(transformation);
						page.css(transformation);
						page.app.menu.css(transformation);
						titleBar.css(transformation);
						page.__dm = 10;
						page.__ds = false;
						page.__dxo = 0;
						page.__dxi = this.__dm;
						break;
				}
			};
			this.off('longpressstart longpressend touchstart touchmove touchend mousedown mousemove mouseup', this.__dragHandler);
			this.on('longpressstart longpressend touchstart touchmove touchend mousedown mousemove mouseup', this.__dragHandler, false);
			// </editor-fold>
			this.initialized = true;
		}
	}

	// <editor-fold defaultstate="collapsed" desc="PeregrinePage.events(..)">
	events() {
		let name = null, event = null;
		if (arguments.length > 1) {
			name = arguments[0];
			event = arguments[1];
			this.__events[name] = event;
		} else if (arguments.length === 1) {
			if (typeof arguments[0] === 'object') {
				for (name in arguments[0]) {
					event = arguments[0][name];
					this.__events[name] = event;
				}
			} else if (typeof arguments[0] === 'string') {
				return arguments[0] in this.__events ? this.__events[arguments[0]] : null;
			}
		} else {
			return;
		}
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePage.app">
	/**
	 * The <code>PeregrineApp</code> object that this page is a part of.
	 * @type PeregrineApp
	 */
	get app() {
		return this.closest(__PG_SELECTOR + '-app');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePage.init()">
	init() {
		this.trigger('init');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePage.current">
	get current() {
		return this.hasAttribute('current');
	}
	set current(current) {
		if (current) {
			for (let page of this.parentNode.querySelectorAll(__PG_SELECTOR + '-page')) {
				if (page !== this)
					page.current = false;
			}
			this.setAttribute('current', '');
		} else {
			this.removeAttribute('current');
		}
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePage.state">
	/**
	 * Gets the state parameters for the page.
	 * @returns {Object}                    The state parameters for the page.
	 */
	get state() {
		return this.__state;
	}
	/**
	 * Sets the state parameters for the page.
	 * @param   {Object} params             The state parameters for the page.
	 */
	set state(params) {
		for (let key in params) {
			this.__state[key] = params[key];
		}
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrinePage.clearState()">
	/**
	 * Clear the state parameters for the page.
	 */
	clearState() {
		this.__state = {};
	}
	// </editor-fold>
}
class PeregrineApp extends PeregrineComponent {
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.constructor()">
	constructor() {
		super();
		this.browser = browser;
		/** @private */ this.history = [];
		/** @private */ this.__events = [];
		/** @private */ this.__isReady = false;
		/** @private */ this.__isDeviceReady = false;
		/** @private */ this.__username = null;
		/** @private */ this.__password = null;
		let app = this;
		this.on('historyUpdate', function () {
			app.navbar.querySelector('button[is="backbutton"]').css({display: app.history.length > 0 ? 'flex' : 'none'});
			app.pages.forEach(function (__page) {
				if (__page.hasAttribute('previous'))
					__page.removeAttribute('previous');
			});
			if (app.history.length > 0)
				app.history[app.history.length - 1].page.setAttribute('previous', '');
		});
		this.navbar.querySelector('button[is="backbutton"]').on('click', function () {
			app.navigateBack();
		});
		this.navbar.querySelector('button[is="menubutton"]').on('click', function () {
			if (app.menu !== null) {
				app.menu.toggle();
			}
		});
//		window.addEventListener('popstate', function (e) {
//			console.log(e.state);
//			app.navigateBack({usesDeviceButton: true});
//		});
		this.querySelector('[current]').trigger('load');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.set(..)">
	/**
	 * Sets an app-level property with the given name and value.
	 * @param   {String} property       The name for the app-level property.
	 * @param   {String} value          The value for the app-level property.
	 */
	set(property, value) {
		if (['isReady', 'isDeviceReady', 'username', 'password', 'pages', 'name'].includes(property)) {
			console.error('[%s] is a default property and cannot be set using the [app.set(...)] function. Use [app.%s] instead.',
				property, property);
			return;
		}
		let key = this.name + '.' + property;
		let oldValue = key in window.localStorage
			? JSON.parse(window.localStorage.getItem(key))
			: null;
		window.localStorage.setItem(key, JSON.stringify(value));
		this[property] = value;
		if (oldValue !== null) {
			this.trigger('propertyChange', {
				property: property,
				newValue: value,
				oldValue: oldValue
			});
		}
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.get(..)">
	/**
	 * Gets an app-level proeprty with the given name.
	 * @param   {String} property       The name for the app-level property.
	 * @returns {Object}                The value for the app-level property.
	 */
	get(property) {
		let key = this.name + '.' + property;
		return key in window.localStorage
			? JSON.parse(window.localStorage.getItem(key))
			: key in this ? this[key] : null;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.clear(..)">
	/**
	 * Clears an app-level property with the given name.
	 * @param   {String} property       The name for the app-level property.
	 */
	clear(property) {
		if (['isReady', 'isDeviceReady', 'username', 'password', 'pages', 'name'].includes(property)) {
			console.error('[%s] is a default property and cannot be cleared.', property);
			return;
		}
		window.localStorage.removeItem(this.name + '.' + property);
		delete app[property];
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.getPage(..)">
	/**
	 * Gets the page with the given name.
	 * @param   {String} name               The name of the page.
	 * @returns {PeregrinePage}             The page with the given name.
	 */
	getPage(name) {
		for (let page of this.pages) {
			if (page.name === name)
				return page;
		}
		return null;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.getPopup(..)">
	/**
	 * Gets the poup with the given name.
	 * @param   {String} name               The name of the popup.
	 * @returns {PeregrinePage}             The popup with the given name.
	 */
	getPopup(name) {
		for (let popup of this.popups) {
			if (popup.name === name)
				return popup;
		}
		return null;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.pageExists(..)">
	/**
	 * Checks whether or not the app has a page with the given name.
	 * @param   {String} name               The name of the page.
	 * @returns {Boolean}                   Whether or not the app has a page with the given name.
	 */
	pageExists(name) {
		return this.getPage(name) !== null;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.navigateTo(..)">
	/**
	 * Navigate to a page with the given name and additional settings.
	 * @param   {String} name               The name of the page to navigate to.
	 * @param   {Object} params             Additional settings and information.
	 * @public
	 * @since   1.0.0.1
	 */
	navigateTo(name, params) {
		if (!this.pageExists(name)) {
			console.error('There is no page named "%s".', name);
			return;
		}
		params = params || {};
		let preserve = 'preserve' in params && params.preserve;
		if ('preserve' in params)
			delete params['preserve'];
		let page = this.getPage(name);
		if (this.currentPage !== null && this.currentPage.name !== page.name) {
			var item = new PeregrineHistoryItem(params);
			item.app = this;
			item.page = this.currentPage;
			item.state = this.currentPage.state;
			if (preserve)
				this.history.push(item);
			else {
				this.history = [];
//				window.history.go(window.history.length * -1);
			}
		}
		page.clearState();
		page.state = params;
		page.init();
		if (this.hasClass('menu-shown')) {
			this.menu.hide();
		}
		page.scrollTop = 0;
		page.trigger('load');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.navigateBack()">
	/**
	 * Navigates to the previous page in history.
	 */
	navigateBack() {
//		let usesDeviceButton = arguments.length > 0 && arguments[0] !== null && 'usesDeviceButton' in arguments[0] && arguments[0].usesDeviceButton;
		if (this.history.length <= 0)
			return;
//		if (!usesDeviceButton)
//			window.history.back();
		let item = this.history.pop();
		item.page.state = item.state;
		item.page.init();
		this.currentPage.trigger('unload', {to: item.page});
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.currentPage">
	get currentPage() {
		return this.querySelector(__PG_SELECTOR + '-page[current]');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.menu">
	get menu() {
		return this.querySelector(__PG_SELECTOR + '-menu');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.navbar">
	get navbar() {
		return this.querySelector(__PG_SELECTOR + '-navbar:not([tabs])');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.tabs">
	get tabs() {
		return this.querySelector(__PG_SELECTOR + '-navbar[tabs]');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.isReady">
	/**
	 * Whether or not the DOM has been initialised for this application's HTML.
	 * @type Boolean
	 */
	get isReady() {
		return this.__isReady;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.isDeviceReady">
	/**
	 * Whether or not all the plugins have been loaded for the device running this application.
	 * @type Boolean
	 */
	get isDeviceReady() {
		return this.__isDeviceReady;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.username">
	/**
	 * The username for the user associated with this app.
	 * @type string
	 */
	get username() {
		return this.__username;
	}
	/**
	 * Sets the username for the user associated with this app.
	 * @param   {string} value              The username for the user associated with this app.
	 */
	set username(value) {
		this.__username = value;
	}
	// </editor-fold>	
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.password">
	get password() {
		return this.__password;
	}
	set password(value) {
		this.__password = value;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.pages">
	get pages() {
		return this.querySelectorAll(__PG_SELECTOR + '-page');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.popups">
	get popups() {
		return this.querySelectorAll(__PG_SELECTOR + '-popup');
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="PeregrineApp.isRTL">
	get isRTL() {
		let element = this.closest('[dir]'), flag = element !== null;
		if (flag) {
			flag = element.getAttribute('dir').trim().toUpperCase() === 'RTL';
		}
		return flag;
	}
	// </editor-fold>
	// <editor-fold defaultstate="collapsed" desc="Utility methods">
	get contacts() {
		return this.isDeviceReady ? new Promise((resolve, reject) => {
			if ('contactsPhoneNumbers' in navigator) {
				navigator.contactsPhoneNumbers.list(resolve, reject);
			} else {
				throw new Error('Please test on actual device');
			}
		}) : [{displayName: 'Arun Zaheeruddin', phoneNumbers: ['03342597973'], thumbnail: null}];
	}
	get carrierInfo() {
		return this.isDeviceReady ? new Promise((resolve, reject) => {
			if ('plugins' in window && 'carrier' in window.plugins)
				window.plugins.carrier.getCarrierInfo(resolve, reject);
		}) : {countryCode: 'PK'};
	}
	populateContacts(callback) {
		(async () => {
			try {
				let carrierInfo = await this.carrierInfo;
				let countryCode = '' + carrierInfo.countryCode.toUpperCase();
				let retrievedContacts = [];
				let contacts = await app.contacts;
				contacts.forEach(function (contact) {
					let phones = [], phone;
					for (let i = 0; i < contact.phoneNumbers.length; ++i) {
						phone = contact.phoneNumbers[i].number;
						if (typeof libphonenumber !== 'undefined') {
							let parsedNumber = libphonenumber.parse(phone, countryCode);
							phone = 'phone' in parsedNumber && 'country' in parsedNumber
								? window.libphonenumber.format(parsedNumber, 'E.164')
								: phone;
						}
						phones.push(phone);
					}
					phones = Array.from(new Set(phones));
					phones.forEach(function (phone) {
						retrievedContacts.push({
							name: contact.displayName,
							phone: phone,
							image: contact.thumbnail
						});
					});
				});
				retrievedContacts = retrievedContacts.filter((obj, pos, arr) => {
					return arr.map(mapObj => mapObj['phone']).indexOf(obj['phone']) === pos;
				});
				retrievedContacts.sort((a, b) => {
					return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
				});
				callback(retrievedContacts);
			} catch (ex) {
				console.log(ex);
			}
		})();
	}
	get position() {
		return this.isReady ? new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, {});
		}) : null;
	}
	// </editor-fold>
}
window.Peregrine = {
	// <editor-fold defaultstate="collapsed" desc="Peregrine.init()">
	init: function () {
		window.customElements.define(__PG_SELECTOR + '-app', PeregrineApp);
		window.customElements.define(__PG_SELECTOR + '-page', PeregrinePage);
		window.customElements.define(__PG_SELECTOR + '-popup', PeregrinePopup);
		window.customElements.define(__PG_SELECTOR + '-navbar', PeregrineNavBar);
		window.customElements.define(__PG_SELECTOR + '-panel', PeregrinePanel);
		window.customElements.define(__PG_SELECTOR + '-menu', PeregrineMenu);
		window.customElements.define(__PG_SELECTOR + '-rate', PeregrineRate);
		window.customElements.define(__PG_SELECTOR + '-calendar', PeregrineCalendar);
		let app = document.querySelector(__PG_SELECTOR + '-app');
		if (app.querySelector('pg-page[current]')) {
			app.querySelector('pg-page[current]').trigger('load');
		}
		return app;
	}
	// </editor-fold>
};
let app = Peregrine.init();
document.ready(function () {
	app.__isReady = true;
	document.on('click', function (e) {
		let target = e.target, location = null, locationParts, action, page;
		if (target.nodeName.toLowerCase() === 'a') {
			location = target.getAttribute('href');
		} else if (target.closest('a')) {
			location = target.closest('a').getAttribute('href');
		}
		if (location !== null && location.trim() !== '' && location.substring(0, 4) === 'goto') {
			locationParts = location.split(':');
			action = locationParts[0];
			page = app.getPage(locationParts[1]);
			if (page !== null) {
				switch (action) {
					case 'goto':
						app.navigateTo(page.name);
						break;
					case 'gotoPreserve':
						app.navigateTo(page.name, {preserve: true});
						break;
				}
				return false;
			}
		}
	});
});
document.addEventListener('deviceready', function () {
	app.__isDeviceReady = true;
}, {passive: false});
delete window.browser;