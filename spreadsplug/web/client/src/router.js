/** @jsx React.DOM */
/* global module, require, console */

/*
 * Copyright (C) 2014 Johannes Baiter <johannes.baiter@gmail.com>
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
  'use strict';
  var Backbone = require('backbone'),
      ReactDOM = require('react-dom'),
      _ = require('underscore'),
      SpreadsApp = require('./components/spreadsapp'),
      Workflows = require('./workflow.js'),
      EventDispatcher = require('./events.js');

  /**
   * Application Router.
   * Defines which view names correspond to which route and updates the
   * `SpreadsApp` root container with the new view and optionally a workflow
   * id.
   */
  module.exports = Backbone.Router.extend({
    /**
     * Sets up the application.
     */
    initialize: function() {
      this.events = EventDispatcher;
      this.events.connect();

      // Set up model collections
      this._workflows = new Workflows();
      this._workflows.connectEvents(this.events);

      // Get workflows synchronously from server
      this._workflows.fetch({async: false});
    },
    routes: {
      "":                         "root",
      "workflow/new":             "createWorkflow",
      "workflow/:slug":           "viewWorkflow",
      "workflow/:slug/edit":      "editWorkflow",
      "workflow/:slug/capture":   "startCapture",
      "workflow/:slug/submit":    "submitWorkflow",
      "logging":                  "displayLog",
      "preferences":              "editPreferences"
    },


    /** We override the 'route' method so we can intercept routing events by
     *  setting the 'before' method on the router. If it returns false, we
     *  silently undo the previous navigation event.
     */
    route: function(route, name, callback) {
      var router = this;
      if (!callback) callback = this[name];

      var f = function() {
        var rv = (router.before || Function.prototype)(route, name);
        if (rv !== false) callback.apply(router, arguments);
        else window.history.go(-1);
      };
      return Backbone.Router.prototype.route.call(this, route, name, f);
    },

    /**
     * Renders `SpreadsApp` component into `content` container and assigns
     * the passed `view` name and `workflow` id as well as our model
     * collection (`this._workflows`).
     *
     * @private
     * @param {string} view
     * @param {?string} workflowSlug
     */
    _renderView: function(view, workflowSlug) {
      ReactDOM.render(<SpreadsApp view={view} workflows={this._workflows}
                                        workflowSlug={workflowSlug} />,
                            document.getElementById('spreadsroot'));
    },

    root: function() {
      this._renderView("root");
    },

    createWorkflow: function() {
      this._renderView("create");
    },

    viewWorkflow: function(workflowSlug) {
      this._renderView("view", workflowSlug);
    },

    editWorkflow: function(workflowSlug) {
      this._renderView("edit", workflowSlug);
    },

    startCapture: function(workflowSlug) {
      this._renderView("capture", workflowSlug);
    },

    submitWorkflow: function(workflowSlug) {
      this._renderView("submit", workflowSlug);
    },

    displayLog: function() {
      this._renderView("log");
    },

    editPreferences: function() {
      this._renderView("preferences");
    }
  });
}());
