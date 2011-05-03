###Features (Demo [1][1] / [2][2])

* Adds an animation and styled selector which updates and interacts with the native select.
* Mouse or keyboard navigation:
 * Move down - down & right arrow, page down & mousewheel (if mousewheel plugin found).
 * Move up - up & left arrow, page up & mousewheel.
 * To Start - Home
 * To End - End
* Change selections using the mouse or keyboard:
 * Mouse `double-click` - toggle selection.
 * Mouse `Control + click` - toggle selection.
 * Mouse `Shift + click` - toggle selections between current position and clicked selection.
 * `Space` - toggle selection of highlighted option.
 * `Insert` - select highlighted option.
 * `Delete` - unselect highlighted option.
 * `Shift + Space` - toggle all options - none selected or all selected.
 * `Shift + Arrow` - takes current selection (selected or not selected) and continues it in the arrow direction - *NOTE* this is not the default way it works inside a select box!
* Get or set selection methods available.
* Event hooks &amp; callbacks added to allow extension of the plugin.
* ARIA support (may not be fully implemented).
* Works in all of the latest browser versions, as well as IE7 & IE8 (in IE9 compatibility mode)

### Dependencies
* Required - jQuery 1.4.3+
* Optional - jQuery mousewheel plugin & easing plugin

###Documentation

* Wiki Pages: [Home][3] | [FAQ][4] | [Setup][5] | [Options][6] | [Usage][7] | [Events][8] | [Change][9]

###Licensing

* FancySelector: [MIT License][9]
* Font: [Creative Commons Attribution License 3.0][10]

###Change Log

Only the latest changes will be shown below, see the wiki change log to view older versions.

###Version 1.0.1 beta (5/3/2011)

* Added mouse double click to toggle selection.
* Added a method to allow updating the selector. Use it as follows:
```javascript
// Update FancySelector - No options required.
$('.selector').fancySelector();
```

* Changed `includeHighlight` option to be `false` by default.
* Updated the main demo:
 * Window resize script is no longer required for a full screen FancySelector. It now uses the proper CSS to keep the height at 100%.
 * Info box updated to show triggered events & made hideable.
* Added shortcut methods to change a selection and/or move the highlight.

```javascript
// Highlight fourth option (zero-based index).
$('.selector').fancySelector(3);

// Select and highlight third option (zero-based index).
$('.selector').fancySelector(2, true);

// Unselect and highlight third option (zero-based index).
$('.selector').fancySelector(2, false);
```

###Version 1.0 beta (5/2/2011)

* Posted on Github

  [1]: http://Mottie.github.com/FancySelector/
  [2]: http://Mottie.github.com/FancySelector/index2.html
  [3]: https://github.com/Mottie/FancySelector/wiki
  [4]: https://github.com/Mottie/FancySelector/wiki/FAQ
  [5]: https://github.com/Mottie/FancySelector/wiki/Setup
  [6]: https://github.com/Mottie/FancySelector/wiki/Options
  [7]: https://github.com/Mottie/FancySelector/wiki/Usage
  [8]: https://github.com/Mottie/FancySelector/wiki/Events
  [9]: https://github.com/Mottie/FancySelector/wiki/Change
  [10]: http://www.opensource.org/licenses/mit-license.php
  [11]: http://creativecommons.org/licenses/by/3.0/
