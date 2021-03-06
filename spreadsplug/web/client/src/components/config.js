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
      ReactDOM = require('react-dom'),
      _ = require('underscore'),
      merge = require('merge'),
      F = require('./foundation.js'),
      util = require('../util.js'),
      ModelMixin = require('../../vendor/backbonemixin.js'),
      capitalize = require('../util.js').capitalize,
      PropTypes = require('prop-types'),
      createClass = require('create-react-class');


  /**
   * A single option component for the workflow configuration.
   */
  var PluginOption = createClass({
    propTypes: {
      /** Name of the option */
      name: PropTypes.string.isRequired,
      /** Current value of the option */
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
      ]).isRequired,
      /** Template for the option */
      option: PropTypes.object.isRequired,
      /** Errors from server-side validation for the option */
      error: PropTypes.object,
      /** Function to be called when value changes */
      onChange: PropTypes.func.isRequired
    },

    render: function() {
      var name = this.props.name,
          option = this.props.option,
          /* If there is a docstring, use it as the label, otherwise use
           * the capitalized name */
          label =  <label htmlFor={name}>{option.docstring || capitalize(name)}</label>,
          input;
      if (option.selectable && _.isArray(option.value)) {
        /* Use a dropdown to represent selectable cfgValues */
        input = (
          <select id={name} multiple={false} value={this.props.value}
                  onChange={this.props.onChange}>
            {_.map(option.value, function(key) {
              return <option key={key} value={key}>{key}</option>;
            })}
          </select>
        );
      } else if (_.isArray(option.value)) {
        /* TODO: Currently we cannot deal with multi-valued options,
         *       change this! */
        return null;
      } else if (typeof option.value === "boolean") {
        /* Use a checkbox to represent boolean cfgValues */
        input = <input id={name} type={"checkbox"} checked={this.props.value}
                       onChange={this.props.onChange} />;
      } else {
        /* Use a regular input to represent number or string cfgValues */
        var value = option.value === null ? "" : option.value;
        var types = { "number": "number",
                      "string": "text" };

        input = <input id={name} type={types[typeof value]}
                       value={this.props.value} onChange={this.props.onChange} />;
      }
      var error = this.props.error && (<small className="error">{this.props.error}</small>);
      var isSmall = util.isSmall();
      var isCheckbox = input.props.type === 'checkbox';

      return (
        <div className="grid-x">
        {input && input.props.type === 'checkbox' &&
          <div>
            <div className="cell small-1">{input}</div>
            <div className="cell small-11">{label}</div>
          </div>}
        {input && input.props.type !== 'checkbox' &&
          <div className="cell">
            <label htmlFor={name}>
              {option.docstring || capitalize(name)}
              {input}{error}
            </label>
          </div>}
        </div>
      );
    }
  });


  /**
   * Collection of options for a single section
   */
  var ConfigWidget = createClass({
    propTypes: {
      /** Whether to show advanced options */
      showAdvanced: PropTypes.bool,
      /** Current settings for this plugin */
      cfgValues: PropTypes.object.isRequired,
      /** Template for the settings */
      template: PropTypes.object.isRequired,
      /** Errors from server-side validation */
      errors: PropTypes.object,
      /** Function to be called when value changes */
      onChange: PropTypes.func.isRequired
    },

    /** Generate change callback for a given key */
    getHandleChange: function(key) {
      return function(e) {
        var cfgValues = _.clone(this.props.cfgValues);
        var newVal;
        if (e.target.type === 'checkbox') newVal = e.target.checked;
        else if (e.target.type === 'number') newVal = e.target.value | 0;
        else newVal = e.target.value;
        cfgValues[key] = newVal;
        this.props.onChange(cfgValues);
      }.bind(this);
    },

    render: function() {
      var template = this.props.template,
          cfgValues = this.props.cfgValues;
      return (
        <div>
        {_.map(template, function(option, key) {
          return (<PluginOption name={key} option={option} key={key}
                                value={this.props.cfgValues[key]}
                                error={this.props.errors[key]}
                                onChange={this.getHandleChange(key)} />);
        }, this)}
        </div>
      );
    }
  });


  /**
   * Component for selecting plugin to display settings for
   */
  var PluginSelector = createClass({
    propTypes: {
      /** Type of plugins to select */
      type: PropTypes.string.isRequired,
      /** List of available plugins of that type */
      available: PropTypes.arrayOf(PropTypes.string).isRequired,
      /** Function to be called when selection changes */
      onChange: PropTypes.func.isRequired,
      /** List of enabled plugins of that type */
      enabled: PropTypes.arrayOf(PropTypes.string)
    },

    render: function() {
      var checkboxes = _.map(this.props.available, function(plugin) {
        var key = 'toggle-' + plugin;
        return (
          <div className="grid-x" key={key}>
            <div className="cell">
              <input id={key} type="checkbox"
                    checked={_.contains(this.props.enabled, plugin)}
                    onChange={function(e){
                        this.props.onChange(e.target.checked, plugin);
                    }.bind(this)} />
              <label htmlFor={key}> {plugin} </label>
            </div>
          </div>);
      }, this);
      var selectLabel = <label>Select {this.props.type} plugins</label>;

      if (util.isSmall()) {
        return (
          <div className="plugin-select">
            <div className="grid-x plugin-select-label">
              <div className="cell">{selectLabel}</div>
            </div>
            {checkboxes}
          </div>);
      } else {
        return (
          <div className="grid-x plugin-select-label">
            <div className="cell small-3 columns plugin-select-label">
              {selectLabel}
            </div>
            <div className="cell small-9 select-pane">
              {checkboxes}
            </div>
          </div>);
      }
    }
  });


  var SectionSelector = createClass({
    propTypes: {
      active: PropTypes.bool,
      onClick: PropTypes.func.isRequired,
      name: PropTypes.string.isRequired
    },

    render: function() {
      var classes = require('classnames')({
        "plugin-label": true,
        active: this.props.active
      });
      return (
        <div className="grid-x">
          <div className="cell">
            <a onClick={this.props.onClick}>
              <label className={classes}>
                {capitalize(this.props.name)}
                {this.props.active &&
                 <i style={{"margin-right": "1rem",
                            "line-height": "inherit"}}
                    className="fa fa-caret-right right" />}
              </label>
            </a>
          </div>
        </div>);
    }
  });


  /**
   * Container for all plugin configuration widgets.
   * Offers a dropdown to select a plugin to configure and displays its
   * configuration widget.
   */
  var Configuration = createClass({
    propTypes: {
      /** Available plugins by type */
      availablePlugins: PropTypes.object,
      /** Application default configuration */
      defaultConfig: PropTypes.object,
      /** Current configuration */
      config: PropTypes.object,
      /** Configuration templates for available plugins */
      templates: PropTypes.object.isRequired,
      /** Errors from server-side validation */
      errors: PropTypes.object,
      /** Allow editing of core options **/
      enableCore: PropTypes.bool
    },

    getDefaultProps: function() {
      var availablePlugins;
      if (!_.isUndefined(window.plugins)) {
        if (window.config.web.mode == 'scanner') {
          availablePlugins = _.omit(window.plugins, "postprocessing", "output");
        } else {
          availablePlugins = window.plugins;
        }
      } else if (_.isUndefined(availablePlugins)) {
        availablePlugins = {};
      }

      return {
        availablePlugins: availablePlugins,
        config: {plugins: _.flatten(_.values(availablePlugins))}
      };
    },

    getInitialState: function() {
      return {
        /** Currently selected plugin */
        selectedSection: undefined,
        /** Validation errors (from components themselves */
        internalErrors: {},
        /** Only for initialization purposes, not intended to be kept in sync
         *  at all times. */
        config: this.props.config || {
          plugins: _.flatten(_.values(this.props.availablePlugins))
        },
        /** Whether to display advanced options */
        advancedOpts: false
      };
    },

    handleChange: function(section, cfgValues) {
      var config = _.clone(this.state.config);
      config[section] = cfgValues;
      this.setState({config: config});
    },

    handlePluginToggle: function(enabled, pluginName) {
      var config = this.state.config;
      if (_.isUndefined(config.plugins)) config.plugins = [];
      if (enabled) {
        config.plugins.push(pluginName);
      } else {
        config.plugins = _.without(config.plugins, pluginName);
        delete config[pluginName];
      }
      this.setState({config: config});
    },

    toggleAdvanced: function(){
      this.setState({ advancedOpts: !this.state.advancedOpts });
    },

    getDefaultConfig: function(pluginName) {
      if (!_.has(this.props.templates, pluginName)) return;
      var template = this.props.templates[pluginName],
          config = {};
      _.each(template, function(option, key) {
        var value = this.props.defaultConfig[pluginName][key] || option.value;
        config[key] = _.isArray(option.value) ? option.value[0] : option.value;
      }, this);
      return config;
    },

    shouldDisplayOption: function(option) {
      if (!this.state.advancedOpts && option.advanced) {
          return false;
      } else if (typeof(option.depends) === 'string') {
          return _.contains(this.props.config.plugins, option.depends);
      } else if (typeof(option.depends) === 'object') {
        return _.every(option.depends, function(section, sectionName) {
          if (!_.has(this.state.config, sectionName)) {
            return false;
          } else {
            return _.every(option.depends[sectionName], function(value, key) {
              return this.state.config[sectionName][key] == value;
            }, this);
          }
        }, this);
      } else {
        return true;
      }
    },

    render: function() {
      var templates = this.props.templates,
          config = this.state.config,
          errors = merge(this.state.internalErrors, this.props.errors),
          availablePlugins = this.props.availablePlugins,
          selectedSection;

      var configSections = _.filter(
        _.union(_.keys(config), _.keys(this.props.defaultConfig)),
        function(section) {
          if (section === 'core' || section === 'web') {
            return this.props.enableCore;
          } else {
            return !_.isEmpty(templates[section]);
          }
        }, this);

      /* If no section is explicitely selected, use the first one */
      selectedSection = this.state.selectedSection;
      if (!_.isEmpty(configSections) && !selectedSection) {
        selectedSection = configSections[0];
      }

      var isSmall = util.isSmall();
      var sectionPicker;
      var paneContainer = ReactDOM.div;
      var outerContainer = ReactDOM.div;
      if (util.isSmall()) {
        sectionPicker = (
          <div className="grid-x section-picker">
            <div className="cell">
              <select multiple={false} value={selectedSection}
                      onChange={function(e) {
                        this.setState({selectedSection: e.target.value});
                      }.bind(this)}>
                {_.map(configSections, function(section) {
                  return <option key={section} value={section}>{capitalize(section)}</option>;
                })}
              </select>
              <div><i className="fa fa-caret-down down" /></div>
            </div>
          </div>
        );
      } else {
        sectionPicker = (
          <div className="cell small-3 section-picker">
            {_.map(configSections, function(section) {
              return (
              <SectionSelector key={section} active={selectedSection === section} name={section}
                               onClick={_.partial(this.setState.bind(this), {selectedSection: section}, null)} />);
            }, this)}
          </div>
        )
      }

      return (
        <div className="grid-x">
          <div className="cell medium-10 large-8">
            <fieldset className="config">
              <legend>Configuration</legend>
              {!_.isEmpty(availablePlugins.postprocessing) &&
                <PluginSelector type="postprocessing"
                                available={availablePlugins.postprocessing}
                                enabled={config.plugins}
                                onChange={this.handlePluginToggle} />}
              {!_.isEmpty(availablePlugins.output) &&
                <PluginSelector type="output"
                                available={availablePlugins.output}
                                enabled={config.plugins}
                                onChange={this.handlePluginToggle} />}
              <div className="grid-x toggle-advanced">
                <div className="cell">
                  <input id="check-advanced" type="checkbox" value={this.state.advancedOpts}
                          onChange={this.toggleAdvanced} />
                  <label htmlFor="check-advanced">Show advanced options</label>
                </div>
              </div>
              <outerContainer className="plugin-config">
                {sectionPicker}
                <paneContainer>
                  <div className="cell medium-9 config-pane">
                    <ConfigWidget template={_.pick(templates[selectedSection], this.shouldDisplayOption)}
                                  cfgValues={this.state.config[selectedSection] || this.getDefaultConfig(selectedSection)}
                                  errors={errors[selectedSection] || {}}
                                  onChange={_.partial(this.handleChange, selectedSection)} />
                  </div>
                </paneContainer>
              </outerContainer>
            </fieldset>
          </div>
        </div>);
    }
  });

  module.exports = {
      ConfigWidget: ConfigWidget,
      Configuration: Configuration
  }
}());
