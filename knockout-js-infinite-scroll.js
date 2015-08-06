/* global ko:false */
'use strict';

(function (factory) {
    // Module systems magic dance.

    /* istanbul ignore next - (code coverage ignore) */
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require('knockout'), exports);
    } else if (typeof define === 'function' && define['amd']) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(['knockout', 'exports'], factory);
    } else {
        // <script> tag: use the global `ko` object
        factory(ko, {});
    }
}(function (ko, exports) {
    ko.extenders.infinitescroll = function(target, args) {
        var props            = {},
            Y_AXIS           = 'Y',
            X_AXIS           = 'X',
            BindingException = function(message) {
                this.message = message;
                this.name    = 'Knockout Infinite Scroll Binding Exception';
            },
            validateAxis     = function(axis) {
                if (axis !== Y_AXIS && axis !== X_AXIS) {
                    throw new BindingException('Invalid value for infinite scroll binding property scrollAxis: ' + axis);
                }
                return axis;
            };

        target.infinitescroll = props;

        props.numPagesPadding = ko.observable(parseFloat(args.numPagesPadding) || 1);
        props.scrollAxis      = ko.observable(args.scrollAxis ? validateAxis(args.scrollAxis.toString().toUpperCase()) : Y_AXIS);
        props.rateLimit       = parseInt(args.rateLimit) || 250 ;

        // viewport dimensions
        props.viewportWidth   = ko.observable(parseInt(args.viewportWidth)  || -1);
        props.viewportHeight  = ko.observable(parseInt(args.viewportHeight) || -1);
        // item dimensions
        props.itemWidth       = ko.observable(parseInt(args.itemWidth)  || -1);
        props.itemHeight      = ko.observable(parseInt(args.itemHeight) || -1);

        // current position in scrollable container
        props.scrollPosition  = ko.observable(0);
        props.updateScrollPos = function(pos) {
            props.scrollPosition(parseInt(pos));
        };

        // if using the main browser scroller to scroll a container that is not 100% tall or 100% wide,
        // the gap between the scroller height/width and div height/width is the scrollPosOffset in px.
        props.scrollPosOffset = ko.observable(0);

        // calculations
        props.numColsPerPage = ko.computed(function() {
            var viewportWidth = parseInt(props.viewportWidth()),
                itemWidth     = parseInt(props.itemWidth()) || -1,
                roundingFunc  = props.scrollAxis() === Y_AXIS ? 'floor' : 'ceil';

            return Math.max(Math[roundingFunc](viewportWidth / itemWidth), 0);
        });

        props.numRowsPerPage = ko.computed(function() {
            var viewportHeight = parseInt(props.viewportHeight()),
                itemHeight     = parseInt(props.itemHeight()) || -1,
                roundingFunc   = props.scrollAxis() === Y_AXIS ? 'ceil' : 'floor';

            return Math.max(Math[roundingFunc](viewportHeight / itemHeight), 0);
        });

        props.numItemsPerPage = ko.computed(function() {
            var numColsPerPage = parseInt(props.numColsPerPage()),
                numRowsPerPage = parseInt(props.numRowsPerPage());

            return numColsPerPage * numRowsPerPage;
        });

        props.numItemsPadding = ko.computed(function() {
            var numItemsPerPage = props.numItemsPerPage(),
                numPagesPadding = props.numPagesPadding(),
                itemsMultiple   = props.scrollAxis() === Y_AXIS ? props.numColsPerPage() : props.numRowsPerPage();

            return Math.max(Math.floor( (numItemsPerPage * numPagesPadding) / itemsMultiple) * itemsMultiple, 0);
        });

        props.firstVisibleIndex = ko.computed(function() {
            var scrollPosition  = parseInt(props.scrollPosition()),
                scrollPosOffset = parseInt(props.scrollPosOffset()),
                isYAxisScroll   = props.scrollAxis() === Y_AXIS,
                itemSize        = isYAxisScroll ? (parseInt(props.itemHeight()) || -1) : (parseInt(props.itemWidth()) || -1),
                itemsMultiple   = isYAxisScroll ? props.numColsPerPage() : props.numRowsPerPage();

            return Math.max(Math.floor((scrollPosition - scrollPosOffset) / itemSize) * itemsMultiple, 0);
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

        // display items
        props.displayItems = ko.observableArray([]);
        props.computeDisplay = ko.computed(function() {
            var oldDisplayItems = props.displayItems.peek(),
                newDisplayItems = target.slice(0, props.lastHiddenIndex());

            if (oldDisplayItems.length !== newDisplayItems.length) {
                // if collections are different lengths, we know they're not identical
                props.displayItems(newDisplayItems);
            } else {
                // check if collections are not identical, and replace with new items if they aren't
                for (var i = newDisplayItems.length - 1; i >= 0; i--) {
                    if (newDisplayItems[i] !== oldDisplayItems[i]) {
                        props.displayItems(newDisplayItems);
                        break;
                    }
                }
            }
        });
        props.computeDisplay.extend({rateLimit: props.rateLimit});
    };
}));
