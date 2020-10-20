/** @jsx React.DOM */
/* global module, require */

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
  var React = require('react'),
      _ = require('underscore'),
      merge = require('merge'),
      F = require('./foundation.js'),
      Overlay = require('./overlays.js').Overlay,
      LayeredComponentMixin = require('./overlays.js').LayeredComponentMixin,
      Configuration = require('./config.js').Configuration,
      PropTypes = require('prop-types'),
      createClass = require('create-react-class');

  var Preferences = createClass({
    mixins: [LayeredComponentMixin],

    propTypes: {
      globalConfig: PropTypes.object.isRequired,
      onSave: PropTypes.func.isRequired,
      errors: PropTypes.object
    },

    getDefaultProps: function() {
      return {
        errors: {
          preferences: {},
          displayRestartConfirmation: false
        }
      };
    },

    getInitialState: function() {
      return {
        config: this.props.globalConfig,
      }
    },

    doSave: function(force) {
      var restartRequired = _.any(['core', 'web'], function(section) {
        return !_.isEqual(this.props.globalConfig[section],
                          this.refs.config.state.config[section]);
      }, this);
      if (restartRequired && !force) {
        this.setState({displayRestartConfirmation: true})
      } else {
        this.props.onSave(this.refs.config.state.config);
      }
    },

    handleSave: function() {
      this.doSave();
    },

    render: function() {
      return (
        <section>
          <form>
            <div className="grid-x"><div className="cell"><h2>Preferences</h2></div></div>
                <Configuration ref="config" config={this.props.globalConfig}
                               errors={this.props.errors} enableCore={true}
                               templates={window.configTemplates} />
            <div className="grid-x">
              <div className="cell">
                <F.Button size='small' onClick={this.handleSave}>
                  <i className="fa fa-check"> Save</i>
                </F.Button>
              </div>
            </div>
          </form>
        </section>
      );
    },

    renderLayer: function() {
      if (!this.state.displayRestartConfirmation) return null;
      var closeModal = _.partial(this.setState.bind(this),
                                 {displayRestartConfirmation: false},
                                 null);
      return (
        <Overlay>
          <F.Modal onClose={closeModal}>
            <div className="grid-x">
              <div className="cell"><h1>Restart required</h1></div>
            </div>
            <div className="grid-x">
              <div className="cell"><p>
                You seem to have made changes to either the <strong>core</strong>
                or <strong>web</strong> settings. This makes it neccessary to restart
                the application. Please make sure that nobody else is using the scanner at
                the moment.</p>
              <p>It is also strongly advised to <strong>refresh the page</strong> if you
                 have made any changes to the <strong>web</strong> configuration.
              </p></div>
            </div>
            <div className="grid-x">
              <div className="cell small-6">
                <F.Button onClick={function(){ this.doSave(true); closeModal(); }.bind(this)}
                          size="small">OK</F.Button>
              </div>
              <div className="cell small-6">
                <F.Button onClick={closeModal} size="small">Cancel</F.Button>
              </div>
            </div>
          </F.Modal>
        </Overlay>
      );
    }

  });

  module.exports = Preferences;
}());
