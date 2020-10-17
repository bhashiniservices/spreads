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
      classSet = require('classnames'),
      _ = require('underscore'),
      PropTypes = require('prop-types'),
      createClass = require('create-react-class');

  /**
   * Row component.
   */
  var Row =  createClass({
    propTypes: {
      /** Useful for pre/postfix labels in forms */
      collapse: PropTypes.bool,
      /** Additional CSS classes */
      className: PropTypes.string,
      /** Child component(s) */
      children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ]),
    },

    getDefaultProps: function() {
      return {
        collapse: false,
        className: ""
      }
    },

    render: function() {
      var classes = [
        this.props.className,
        classSet({
          'row': true,
          'collapse': this.props.collapse
        })
      ].join(" ");
      return (<div className={classes}>{this.props.children}</div>);
    }
  });


  /**
   * Column component
   */
  var Column = createClass({
    propTypes: {
      size: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.number)
      ]),
      offset: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.number)
      ]),
      className: PropTypes.string
    },

    getDefaultProps: function() {
      return {
        size: 12,
        offset: 0
      };
    },

    render: function() {
      var classes = {
        columns: true
      };
      if (_.isNumber(this.props.size)) {
        classes['small-' + this.props.size] = true;
      } else {
        _.each(_.zip(this.props.size, ['small', 'medium', 'large']), function(size) {
          if (size[0]) classes[size[1] + '-' + size[0]] = true;
        });
      }
      if (_.isNumber(this.props.offset) && this.props.offset > 0) {
        classes['small-offset-' + this.props.offset] = true;
      } else {
        _.each(_.zip(this.props.offset, ['small', 'medium', 'large']), function(offset) {
          if (offset[0]) classes[offset[1] + '-offset-' + offset[0]] = true;
        });
      }
      var className = [React.addons.classSet(classes), this.props.className].join(" ");
      return (<div className={className}>
                {this.props.children}
              </div>);
    }
  });

  /**
   * Button component.
   */
  var Button = createClass({
    propTypes: {
      size: PropTypes.oneOf(['tiny', 'small', 'medium', 'large']),
      secondary: PropTypes.bool,
      expand: PropTypes.bool,
      disabled: PropTypes.bool,
      onClick: PropTypes.func,
      title: PropTypes.string,
      className: PropTypes.string,
      children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ]),
    },

    getDefaultProps: function() {
      return {
        size: 'medium',
        secondary: false,
        expand: false,
        disabled: false
      };
    },

    render: function() {
      var classes = {
        'action-button': true,  // TODO: Remove
        'secondary': this.props.secondary,
        'expand': this.props.expand,
        'disabled': this.props.disabled
      };
      var className = [classSet(classes), this.props.className].join(" ");
      className += " " + this.props.size;
      return (<a onClick={!this.props.disabled && this.props.onClick}
                 className={className} title={this.props.title}>
                {this.props.children}
              </a>);
    }
  });


  /**
   * Display a Foundation "alert" box.
   */
  var Alert = createClass({
    propTypes: {
      severity: PropTypes.oneOf([
        'standard', 'success', 'warning', 'info', 'alert', 'secondary'
      ]),
      onClick: PropTypes.func,
      onClose: PropTypes.func,
      className: PropTypes.string,
      children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ])
    },

    getDefaultProps: function() {
      return {
        level: 'standard'
      }
    },

    render: function() {
      var classes = {'alert-box': true};
      classes[this.props.severity] = true;
      var className = [classSet(classes), this.props.className].join(" ");
      return (<div className={className} onClick={this.props.onClick}>
                {this.props.children}
                <a className="close" onClick={this.props.onClose}>&times;</a>
              </div>);
    }
  });


  var PageButton = createClass({
    propTypes: {
      current: PropTypes.bool,
      num: PropTypes.number,
      onClick: PropTypes.func
    },

    render: function() {
      return (
        <li className={this.props.current ? "current": ""}>
          <a onClick={this.props.onClick}>
            {this.props.num}
          </a>
        </li>
      );
    }
  });


  /**
   * Pagination component.
   */
  var Pagination = createClass({
    propTypes: {
      centered: PropTypes.bool,
      pageCount: PropTypes.number.isRequired,
      onBrowse: PropTypes.func.isRequired
    },

    getDefaultProps: function() {
      return { centered: false };
    },

    /**
     * Switch to previous page
     */
    handleBack: function() {
      if (this.state.currentPage !== 1) {
        this.handleToPage(this.state.currentPage-1);
      }
    },

    /**
     * Switch to next page
     */
    handleForward: function() {
      if (this.state.currentPage !== this.props.pageCount) {
        this.handleToPage(this.state.currentPage+1);
      }
    },

    /**
     * Change to given page
     *
     * @param {number} idx - Page number to switch to
     */
    handleToPage: function(idx) {
      this.setState({
        currentPage: idx
      });
      this.props.onBrowse(idx);
    },

    getInitialState: function() {
      return {
        currentPage: 1
      };
    },

    render: function() {
      var lastPage = this.props.pageCount,
          currentPage = this.state.currentPage;

      var uncenteredPagination = (
        <ul className="pagination">
          <li className={"arrow" + (currentPage === 1 ? " unavailable" : '')}>
            <a onClick={this.handleBack}>&laquo;</a>
          </li>
          <PageButton current={currentPage === 1} num={1} onClick={_.partial(this.handleToPage, 1)} />
          {(currentPage > 2) && <li className="unavailable"><a>&hellip;</a></li>}
          {lastPage > 2 &&
            _.range(currentPage-1, currentPage+2).map(function(idx) {
              if (idx <= 1 || idx >= lastPage) return;
              return (
                <PageButton key={"page-"+idx} current={currentPage === idx}
                  num={idx} onClick={_.partial(this.handleToPage, idx)} />
              );
            }.bind(this))}
          {(currentPage < lastPage-1) && <li className="unavailable"><a>&hellip;</a></li>}
          <PageButton current={currentPage === lastPage} num={lastPage}
                      onClick={_.partial(this.handleToPage, lastPage)} />
          <li className={"arrow" + (currentPage === lastPage ? " unavailable" : '')}>
            <a onClick={this.handleForward}>&raquo;</a>
          </li>
        </ul>
      );
      if (this.props.centered) {
        return (
          <div className="pagination-centered">
            {uncenteredPagination}
          </div>
        );
      } else {
        return uncenteredPagination;
      }
    }
  });


  /**
   * Modal overlay with close button
   */
  var Modal = createClass({
    propTypes: {
      onClose: PropTypes.func,
      children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ]),
    },

    render: function() {
      var classes = classSet({
        'reveal-modal': true,
        'open': true
      });
      return (
        <div className={classes}
              style={{visibility: 'visible', display: 'block'}}>
          {this.props.children}
          <a className="close-reveal-modal" onClick={this.props.onClose}>&#215;</a>
        </div>
      );
    }
  });


  /**
   * Modal overlay with 'OK' and 'Cancel' buttons.
   */
  var ConfirmModal = createClass({
    propTypes: {
      onCancel: PropTypes.func,
      onConfirm: PropTypes.func,
      children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ])
    },

    render: function() {
      return (
        <Modal onClose={this.props.onCancel}>
          {this.props.children}
          <Row>
            <Column size={6}>
              <Button onClick={this.props.onConfirm} size="small">OK</Button>
            </Column>
            <Column size={6}>
              <Button onClick={this.props.onCancel} size="small">Cancel</Button>
            </Column>
          </Row>
        </Modal>
      );
    }
  });

  var Label = createClass({
    propTypes: {
      round: PropTypes.bool,
      severity: PropTypes.oneOf([
        'standard', 'success', 'warning', 'alert', 'secondary'
      ]),
    },

    render: function() {
      var classes = {
        'label': true,
        'round': this.props.round,
      };
      if (this.props.severity !== 'standard') classes[this.props.severity] = true;
      return (
        <span className={classSet(classes)}>{this.props.children}</span>
      );
    }
  });

  module.exports = {
    Row: Row,
    Column: Column,
    Button: Button,
    Alert: Alert,
    Pagination: Pagination,
    Modal: Modal,
    ConfirmModal: ConfirmModal,
    Label: Label
  };
}());
