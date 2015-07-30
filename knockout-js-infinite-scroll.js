﻿/* global ko:false */
'use strict';

(function (factory) {
	// Module systems magic dance.
    /* istanbul ignore next - (code coverage ignore) */
	if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
		// CommonJS or Node: hard-coded dependency on "knockout"
		factory(require('knockout'), exports);
	} else if (typeof define === 'function' && define.amd) {
		// AMD anonymous module with hard-coded dependency on "knockout"
		define(['knockout', 'exports'], factory);
	} else {
		// <script> tag: use the global `ko` object
		factory(ko, {});
	}
}(function (ko, exports) {
	ko.extenders.infinitescroll = function(target, args) {
		function BindingException(message) {
			this.message = message;
			this.name    = 'Custom Binding Exception';
		}

		var props = {},
			yAxis = 'Y',
			xAxis = 'X';

		target.infinitescroll = props;

		props.numPagesPadding = ko.observable(parseFloat(args.numPagesPadding) || 1);
		props.scrollAxis      = ko.observable(args.scrollDirection.toUpperCase() || yAxis);

		// dimensions
		props.viewportWidth  = ko.observable(-1);
		props.viewportHeight = ko.observable(-1);

		props.itemWidth  = ko.observable(-1);
		props.itemHeight = ko.observable(-1);

		props.scrollY = ko.observable(0);
		props.scrollX = ko.observable(0);

		// if using the main browser scroller to scroll a container that is not 100% tall,
		// the gap between the scroller height and div height is the scrollYOffset in px.
		props.scrollYOffset = ko.observable(0);

		// if using the main browser scroller to scroll a container that is not 100% wide,
		// the gap between the scroller width and div width is the scrollXOffset in px.
		props.scrollXOffset = ko.observable(0);

		// calculations
		props.numColsPerPage = ko.computed(function() {
			var viewportWidth = parseInt(props.viewportWidth()),
				itemWidth     = parseInt(props.itemWidth()) || -1;

			return Math.max(Math.floor(viewportWidth / itemWidth), 0);
		});

		props.numRowsPerPage = ko.computed(function() {
			var viewportHeight = parseInt(props.viewportHeight()),
				itemHeight     = parseInt(props.itemHeight()) || -1;

			return Math.max(Math.ceil(viewportHeight / itemHeight), 0);
		});

		props.numItemsPerPage = ko.computed(function() {
			var numColsPerPage = parseInt(props.numColsPerPage()),
				numRowsPerPage = parseInt(props.numRowsPerPage());

			return numColsPerPage * numRowsPerPage;
		});

		props.numItemsPadding = ko.computed(function() {
			var numItemsPerPage = props.numItemsPerPage(),
				numPagesPadding = props.numPagesPadding(),
				numColsPerPage  = props.numColsPerPage();

			return Math.max(Math.floor(numItemsPerPage * numPagesPadding / numColsPerPage) * numColsPerPage, 0);
		});

		props.firstVisibleIndex = ko.computed(function() {
			var itemHeight     = parseInt(props.itemHeight()) || -1,
				numColsPerPage = props.numColsPerPage(),
			    scrollPosition,
				scrollOffset;

			if (props.scrollAxis === yAxis) {
				scrollPosition = parseInt(props.scrollY());
				scrollOffset   = parseInt(props.scrollYOffset());
			} else if (props.scrollAxis === xAxis) {
				scrollPosition = parseInt(props.scrollX());
				scrollOffset   = parseInt(props.scrollXOffset());
			} else {
				throw new BindingException('Invalid property scrollAxis: ' + props.scrollAxis);
			}

			return Math.max(Math.floor((scrollPosition - scrollOffset) / itemHeight) * numColsPerPage, 0);
		});

		props.lastVisibleIndex = ko.computed(function() {
			return props.firstVisibleIndex() + props.numItemsPerPage() - 1;
		});

		props.firstHiddenIndex = ko.computed(function() {
			return Math.max(props.firstVisibleIndex() - 1 - props.numItemsPadding(), 0);
		});

		props.lastHiddenIndex = ko.computed(function() {
			return Math.min(props.lastVisibleIndex() + 1 + props.numItemsPadding(), target().length);
		});

		props.heightBefore = ko.computed(function() {
			return Math.max(props.firstHiddenIndex() / props.numColsPerPage() * props.itemHeight(), 0);
		});

		props.heightAfter = ko.computed(function() {
			return Math.max(((target().length - 1 - props.lastHiddenIndex()) / props.numColsPerPage()) * props.itemHeight(), 0);
		});

		props.widthBefore = ko.computed(function() {
			return Math.max(props.firstHiddenIndex() / props.numColsPerPage() * props.itemWidth(), 0);
		});

		props.widthAfter = ko.computed(function() {
			return Math.max(((target().length - 1 - props.lastHiddenIndex()) / props.numColsPerPage()) * props.itemWidth(), 0);
		});

		// display items
		props.displayItems = ko.observableArray([]);

		ko.computed(function() {
			var oldDisplayItems = props.displayItems.peek(),
				newDisplayItems = target.slice(0, props.lastHiddenIndex());

			if (oldDisplayItems.length !== newDisplayItems.length) {
				props.displayItems(newDisplayItems);
				return;
			}

			// if collections are not identical, skip, replace with new items
			for (var i = newDisplayItems.length - 1; i >= 0; i--) {
				if (newDisplayItems[i] !== oldDisplayItems[i]) {
					props.displayItems(newDisplayItems);
					return;
				}
			}
		});
	};
}));