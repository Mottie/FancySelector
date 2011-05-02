/*
 * FancySelector v1.0 beta
 * By Rob Garrison (aka Mottie & Fudgey)
 * Dual licensed under the MIT and GPL licenses.
 *
 */

(function($){
$.fancySelector = function(el, options){

	var base = this;
	base.el = el;
	base.$el = $(el).addClass('fancyselectorselect'); // select
	base.$options = base.$el.find('option'); // options
	base.$returnedOptions = $.fancySelector.returnedOptions;

	// restored on destroy
	base.originalSize = base.$el.attr('size');
	base.originalMultiple = base.$el.attr('multiple');

	// Add a reverse reference to the DOM object
	base.$el.data('FancySelector', base);

	base.init = function(){
		var o, t; // temp variable
		base.options = $.extend({},$.fancySelector.defaultOptions, options);

		base.selectedOptions = '';
		base.$viewport = base.$el.wrap('<div class="fancyselectorwrapper" />').parent();

		// build fancy selector, unselectable attribute needed for older IE
		base.$box = $('<div class="fancyselector"></div>')
			.attr( 'role', 'listbox' )
			.css( 'top', -base.vpHeight );
		base.$options.each(function(i){
			o = (base.el.options[i].selected) ? base.options.selected : '';
			o += ($(this).is(':disabled')) ? ' disabled" aria-disabled="true" disabled="true"' : '"';
			t = $('<div class="' + o + ' unselectable="on" role="option"></div>');
			t.attr( 'data-value', $(this).val() ); // in case of quotes
			t.html( $(this).html() );
			base.$box.append(t);
		});
		base.$el
			// make hidden select the same height as base.options.page size - attempt to keep navigation consistent
			.attr({ 'size' : base.options.page + 1, 'aria-hidden' : true })
			.after(base.$box);

		// update multiple selector attribute
		if (base.options.max === 1) {
			base.options.multiple = false;
		}
		if (base.options.multiple){
			base.$el.attr('multiple', 'multiple');
		} else {
			base.$el.removeAttr('multiple');
		}

		base.$divs = base.$box.find('div');
		base.listLength = base.$divs.length - 1;

		// set starting hilighted option
		t = base.options.start;
		// if start is already a jQuery object, it's targeting an object in the list, grab index
		if ($.fn.isPrototypeOf(t)) { t = base.$options.index(t); } // t is now a number

		// if t is a string, first look for the text, then the value. If not found, set default to zero
		if (typeof t === 'string') { t = base.$divs.filter(':contains(' + t + ')') || base.$divs.filter('[data-value=' + t + ']') || 0; }
		// if start contains a jQuery object, then find the index and use it
		base.index = ($.fn.isPrototypeOf(t)) ? base.$divs.index(t) : t;
		base.highlight(true);

		// Mouse interaction
		base.$divs.click(function(e){
			// shift-click toggles selection between current and clicked option
			if (e.shiftKey) {
				base.setSelection();
				var i,
					st = base.index,
					en = base.$divs.index($(this)),
					diff = Math.abs(en - st),
					dir = (en > st) ? 1 : -1;
				for (i=0; i < diff; i++){
					base.index += dir;
					base.setSelection();
				}
				base.highlight();
			} else {
				// click just moves highlight to clicked div
				base.index = base.$divs.index($(this));
				base.$el.focus();
				base.highlight();
				// ctrl-click toggle option - simulate how it works in a real select
				if (e.ctrlKey) { base.setSelection(); }
			}
		});

		// Add mousewheel functionality, if mousewheel plugin exists
		if ($.isFunction( $.fn.mousewheel )) {
			base.$viewport.bind('mousewheel.fancyselector', function(e, delta){
				if (!base.$box.is('.focused')) { return; } // no scrolling if not focused
				// delta range: +/- 1.6667 to 100 or more, so set a max of "page" option
				base.index -= Math.floor( Math.min( Math.abs(delta), base.options.page ) ) * (delta > 0 ? 1 : -1);
				// stop at min/max instead of wrapping
				base.checkLimits();
			});
		}

		// Keyboard navigation & focus/blur events
		base.$el.add( base.$box )
			.bind('keydown.fancyselector', function(e){
				base.$box.addClass('focused');
				base.checkKey(e);
			})
			.bind('focus.fancyselector', function(){
				clearTimeout(base.blurTimer);
				base.timerFocus = setTimeout(function(){
					if (base.$box.is('.focused')) { return; }
					base.$box.addClass('focused');
					base.$el.trigger('focused.fancyselector', base);
				}, 200);
			})
			.bind('blur.fancyselector', function(){
				clearTimeout(base.focusTimer);
				// trigger custom blur event
				base.blurTimer = setTimeout(function(){
					base.$box.removeClass('focused');
					base.getSelections(null, false); // update actual select box, x should be undefined
					base.$el.trigger('blurred.fancyselector', base);
				}, 200);
			})
			.bind('focused.fancyselector', function(){
				// expand selection box
				if (base.options.expand) {
					o = base.$viewport.height();
					t = o * base.options.page; // make expanded box taller by 1 page (5x by default)
					base.$viewport
						.wrap('<div class="fancyselectorexpanded" />')
						.css({ position: 'absolute', height: t, top: 0 }) // tried fancy animations, but this works better
						.parent().css({ height : t, top: -t/2 + o/2 });
					base.highlight();
				}
			})
			.bind('blurred.fancyselector', function(){
				// if single option is selectable, show selected option when blurred
				if (base.options.keepInView && !base.options.multiple) {
					base.index = base.el.selectedIndex;
					base.highlight(true);
				}
				// remove expanded selection box
				if (base.options.expand) {
					base.$viewport
						.removeAttr('style')
						.unwrap();
					base.highlight(true);
				}
			});

		// Binds events/callbacks
		$.each( 'initialized.fancyselector changed.fancyselector submitted.fancyselector focused.fancyselector blurred.fancyselector'.split(' '), function(i,o){
			var evt = o.split('.')[0];
			if ($.isFunction(base.options[evt])){
				base.$el.bind(o, base.options[evt]);
			}
		});

		// Find new center on window resize
		if (base.options.resizable) { $(window).resize(base.highlight); }

		base.initialized = true;
		base.$el.trigger('initialized.fancyselector', base);

	}; // end base.init

	// Check key pressed
	base.checkKey = function(e){
		var sw, k = e.which;
		switch(k){
		case 13: // enter to submit
			return base.getSelections(null, true); // x should be undefined
		case 32: // space to select (ctrl-click works too)
			if (e.shiftKey) {
				// unselect all or select all when using ctrl-space (ignore disabled options)
				return (base.$divs.not('.disabled').filter('.' + base.options.selected).length > 0) ? base.unselectAll() : base.selectAll();
			} else {
				return base.setSelection();
			}
		case 33: case 34: // page up/down
			base.index += (k === 33 ? -1 : 1) * base.options.page;
			break;
		case 39: case 40: // right/down
			// shift + arrow - propogates current selection
			if (e.shiftKey) {
				sw = base.$divs.eq(base.index).is('.' + base.options.selected) ? true : false;
				base.setSelection(base.index++, sw); 
				base.checkLimits();
				base.setSelection(base.index, sw);
			} else {
				base.index++;
			}
			break;
		case 35: case 36: // end/home
			base.index = (k === 35) ? base.listLength : 0;
			break;
		case 37: case 38: // left/up
			// shift + arrow - propogates current selection
			if (e.shiftKey) {
				sw = base.$divs.eq(base.index).is('.' + base.options.selected) ? true : false;
				base.setSelection(base.index--, sw);
				base.checkLimits();
				base.setSelection(base.index, sw);
			} else {
				base.index--;
			}
			break;
		case 45: case 46: // insert = select, delete = unselect
			base.setSelection(base.index, (k === 45) ? true : false);
			break;
		}
		base.checkLimits();
	};

	// Check index limits before updating the highlight - no wrapping
	base.checkLimits = function(){
		if (base.index < 0) { base.index = 0; }
		if (base.index > base.listLength) { base.index = base.listLength; }
		base.highlight();
	};

	// Update highlight & center vertically
	base.highlight = function(internal){
		if (base.index < 0) { base.index = (base.options.wrap) ? base.listLength : 0; }
		if (base.index > base.listLength) { base.index = (base.options.wrap) ? 0 : base.listLength; }
		var hi, ct, nt, i = base.index;

		// update highlight class
		base.$divs
			.removeClass(base.options.highlight)
			.eq(i).addClass(base.options.highlight).end()

			// update fading classes
			.removeClass('faded1 faded2 faded3 faded4 faded5')
			.filter(':gt(' + (i+4) + '),:lt(' + (i-4) + ')').addClass('faded5').end()
			// http://bugs.jquery.com/ticket/9022 - Checking ":eq(n)" because if n<0, IE will return ":eq(0)" & add all fade classes to the first element
			.filter(':eq(' + (i+4) + ')' + (i-4 < 0 ? '' : ',:eq(' + (i-4) + ')') ).addClass('faded4').end()
			.filter(':eq(' + (i+3) + ')' + (i-3 < 0 ? '' : ',:eq(' + (i-3) + ')') ).addClass('faded3').end()
			.filter(':eq(' + (i+2) + ')' + (i-2 < 0 ? '' : ',:eq(' + (i-2) + ')') ).addClass('faded2').end()
			.filter(':eq(' + (i+1) + ')' + (i-1 < 0 ? '' : ',:eq(' + (i-1) + ')') ).addClass('faded1');

		// keep focus on select
		if (internal !== true) { base.el.focus(); }
		hi = base.$box.find('.' + base.options.highlight);
		ct = base.$box.position().top; // current top
		nt = base.$viewport.height()/2 - hi.position().top - hi.outerHeight()/2; // new top
		if (Math.abs(nt-ct) < 5) { return; } // don't animate if the difference is small (prevents jiggling animation)
		base.$box
			.stop(true, true)
			.animate({ top : nt }, { queue: false, duration: base.options.time, easing: base.options.easing } );
	};

	// toggle currently highlighted option, or set "forceSelect" to true to select, false to unselect
	base.setSelection = function(n, forceSelect){
		if (typeof(n) === 'undefined' || isNaN(n)) {
			n = base.index;
		}
		if (n < 0) { n = 0; }
		if (n > base.listLength) { n = base.listLength; }
		// unselect previous if multiple options disabled, then select current
		if (!base.options.multiple && base.options.max === 1 && base.$box.find('.' + base.options.selected).length === 1 && !base.$divs.eq(n).is('.disabled')){
			base.$box.find('.' + base.options.selected).removeClass(base.options.selected);
		}
		// if max option is set & selected options >= max & option isn't already selected, then return
		if ( base.options.max !== false &&
			base.$box.find('.' + base.options.selected).length >= base.options.max && //
			!base.$divs.eq(n).is('.' + base.options.selected) ){
				return;
			}
		base.$divs.eq(n).filter(':not(.disabled)').toggleClass(base.options.selected, forceSelect);
		// update selected option in original element - usually gets cleared due to use of the arrow keys
		base.el.options[n].selected = (base.$divs.eq(base.index).is('.' + base.options.selected)) ? true : false;
		if (base.initialized) { base.$el.trigger('changed.fancyselector', base); }
	};

	// Store & return a list of currently selected options
	base.getSelections = function(report, internal){
		var d = base.$divs.filter('.' + base.options.selected),
			h = base.$divs.filter('.' + base.options.highlight),
			l = d.length;
		if (base.options.includeHighlight){
			if (l === 0) { d = h; }
			// ignore highlight if the max number has already been selected
			if (base.options.max !== false && l < base.options.max && d.filter('.' + base.options.highlight).length === 0) {
				d = d.add( h[0] );
			}
		}
		if (typeof report === 'undefined' || report === null) { report = base.options.report; }
		base.el.selectedIndex = -1; // clear selections, updated below
		base.selectedOptions = d.map(function(){
			var i = base.$divs.index(this);
			base.el.options[i].selected = true; // update original selector
			return base.$returnedOptions[report](base, i);
		}).get();
		if (base.initialized && internal) { base.$el.trigger('submitted.fancyselector', [base, base.selectedOptions]); }
		// return string containing text from selected options
		return base.selectedOptions;
	};

	// Select all options
	base.selectAll = function(){
		var j;
		if ( base.options.multiple && ( base.options.max === false || base.listLength <= base.options.max ) ){
			base.$divs.not('.disabled').addClass(base.options.selected);
			for (j=0; j < base.listLength; j++){
				base.el.options[j].selected = (base.el.options[j].disabled) ? false : true;
			}
			if (base.options.resizable) { base.highlight(); }
			if (base.initialized) { base.$el.trigger('changed.fancyselector', base); }
		}
	};

	// Unselect all options
	base.unselectAll = function(){
		base.$divs.not('.disabled').removeClass(base.options.selected);
		base.el.selectedIndex = -1;
		if (base.options.resizable) { base.highlight(); }
		if (base.initialized) { base.$el.trigger('changed.fancyselector', base); }
	};

	// *cry* don't destroy me!
	base.destroy = function(){
		base.$box.remove();
		var t = { size : base.originalSize };
		if (base.originalMultiple !== false && typeof base.originalMultiple !== 'undefined') {
			t.multiple = true;
		} else {
			base.$el.removeAttr('multiple');
		}
		base.$el
			.removeClass('fancyselectorselect')
			.removeAttr('aria-hidden')
			.removeAttr('role')
			.attr(t)
			.unbind('keydown.fancyselector keypress.fancyselector focus.fancyselector blur.fancyselector mousewheel.fancyselector initialized.fancyselector changed.fancyselector submitted.fancyselector focused.fancyselector blurred.fancyselector')
			.removeData('fancySelector')
			.unwrap()
			.nextAll('.fancySelector').remove();
	};

	// Run initializer
	base.init();
};

$.fancySelector.defaultOptions = {
	// Appearance
	start            : 0,       // starting option
	page             : 5,       // number of options to scroll when using page up/down
	wrap             : true,    // Wrap list (FF or Rewind) at ends if true; when using arrow keys only
	time             : 500,     // animation time in milliseconds
	easing           : 'swing', // Include easing plugin or jQuery UI if anything other than "swing" or "linear"
	resizable        : false,   // Set to true if the fancySelector is resizable (e.g. full screen like the demo)
	expand           : false,   // selection will expand when focused, set this to true only if the fancyselector is small

	// selections
	includeHighlight : true,    // include highlighted selection on submit; will not include highlight if max # of options already set
	multiple         : true,    // allow multiple selections
	keepInView       : true,    // keeps selected option in view after select has been blurred
	max              : false,   // Maximum number of selections, set to "false" (no quotes) to disable max
	report           : 'text',  // Tied to the $.fancySelector.returnedOptions function: use "text", "value", "index" or custom function

	// classes used - modify the css to match these names
	selected         : 'selected', // selected class name
	highlight        : 'highlight' // highlighted class name
};

// Functions that return a desired attribute/text from options - left side matches "report" option string
// base = plugin base, i = option index. Please read the documentation on how to add more options to this function.
// *Note* that the functions target the hidden select and not the fancyselector objects & don't confuse
//  base.el.options (original select options-DOM element), base.$options (original select options-jQuery object) or base.options (plugin options)
$.fancySelector.returnedOptions = {
	'text'  : function(base, i){ return base.el.options[i].innerHTML; },
	'value' : function(base, i){ return base.el.options[i].value; },
	'index' : function(base, i){ return i; },
	// add more functions here based on the example below to get other attributes
	'class' : function(base, i){ return base.$options.eq(i).attr('class'); }
};

// initialize plugin
$.fn.fancySelector = function(options){
	return this.each(function(){
		(new $.fancySelector(this, options));
	});
};

// returns the selector if it has been attached to the object.
$.fn.getfancySelector = function(){
	return this.data('FancySelector');
};

})(jQuery);