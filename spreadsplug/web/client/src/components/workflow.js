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
      jQuery = require('jquery'),
      _ = require('underscore'),
      ModelMixin = require('../../vendor/backbonemixin.js'),
      F = require('foundation-sites/dist/js/foundation.cjs.js'),
      Lightbox = require('./overlays.js').LightBox,
      Overlay = require('./overlays.js').Overlay,
      LayeredComponentMixin = require('./overlays.js').LayeredComponentMixin,
      util = require('../util.js'),
      PropTypes = require('prop-types'),
      createClass = require('create-react-class');

  var PagePreview = createClass({
    propTypes: {
      imageType: PropTypes.string
    },

    getInitialState: function() {
      // We always display the toolbar when we're on a touch device, since
      // hover events are not available.
      return { displayToolbar: util.isTouchDevice() };
    },

    toggleToolbar: function() {
      if (!util.isTouchDevice()) {
        this.setState({displayToolbar: !this.state.displayToolbar});
      }
    },

    render: function() {
      var cx = require('classnames'),
          liClasses = cx({
            'th': true,
            'page-preview': true,
            'selected': this.props.selected
          }),
          page = this.props.page,
          thumbUrl = util.getPageUrl(this.props.workflow,
                                     page.capture_num,
                                     this.props.imageType, true);
      return (
        <li className={liClasses} title="Open full resolution image in lightbox"
            onMouseEnter={this.toggleToolbar} onMouseLeave={this.toggleToolbar}>
          <div className="grid-x">
            <div className="cell">
              <a onClick={this.props.selectCallback}
                 title={this.props.selected ? "Deselect image" : "Select image"}>
                <img src={thumbUrl} />
              </a>
              {this.state.displayToolbar &&
              <a onClick={this.props.lightboxCallback}
                 className="toggle-zoom fa fa-search-plus" />}
            </div>
          </div>
          <div className="grid-x">
            <div className="cell">
              {page.page_label}
            </div>
          </div>
        </li>);
    }
  });

  /**
   * Component that displays details for a single workflow along with
   * a paginated grid of thumbnail images and a list of generated output
   * files.
   *
   * @property {Workflow} workflow - Workflow to display
   */
  var WorkflowDisplay = createClass({
    /** Enables two-way databinding with Backbone model */
    mixins: [ModelMixin, LayeredComponentMixin],

    /** Activates databinding for `workflow` model property. */
    getBackboneModels: function() {
      return [this.props.workflow];
    },
    getInitialState: function() {
      return {
        /** Index number of first thumbnail picture */
        thumbStart: 0,
        /** Number of thumbnails to display */
        thumbCount: 24,
        /** Image to display in a lightobx overlay */
        lightboxSeqNum: undefined,
        imageType: 'raw',
        selectedPages: []
      };
    },
    /**
     * Set page to be displayed in lightbox.
     *
     * If no `sequenceNum` parameter is passed, the lightbox will be disabled,
     * otherwise it will be enabled with the image of the currently active
     * imageType as its content.
     *
     * @param {string} [sequenceNum] - Sequence number of the page to be displayed
     */
    setLightbox: function(sequenceNum) {
      this.setState({
        lightboxSeqNum: sequenceNum
      });
    },
    /**
     * Change page of page thumbnail display.
     *
     * @param {number} pageIdx - Page number to chagne to
     */
    browse: function(pageIdx) {
      var thumbStart = (pageIdx)*this.state.thumbCount;
      if (thumbStart%this.state.thumbCount == 0) {
        thumbStart = (pageIdx-1)*this.state.thumbCount;
      }
      this.setState({
        thumbStart: thumbStart
      });
    },
    togglePageSelect: function(page) {
      var pages = this.state.selectedPages;
      if (_.contains(pages, page)) {
        this.setState({selectedPages: _.without(pages, page)});
      } else {
        pages.push(page);
        this.setState({selectedPages: pages});
      }
    },
    bulkDelete: function() {
      this.props.workflow.deletePages({pages: this.state.selectedPages});
    },
    handleImageTypeSelect: function(event) {
      this.setState({
        imageType: event.target.value
      });
    },
    render: function() {
      var workflow = this.props.workflow,
          pages = workflow.get('pages'),
          pageCount = Math.ceil(pages.length / this.state.thumbCount),
          thumbStart = this.state.thumbStart,
          thumbStop = this.state.thumbStart+this.state.thumbCount,
          deleteClasses = require('classnames')({
            'small': true,
            'button': true,
            'disabled': this.state.selectedPages.length === 0
          }),
          imageTypes = ['raw'],
          metadata = workflow.get('metadata');
          if (pages.length > 0) {
            imageTypes = imageTypes.concat(_.without(_.keys(pages[0].processed_images),
                                                     'tesseract'));
          }
      return (
        <main>
          <div className="grid-x">
            <div className="cell">
              <h1>{metadata.title}</h1>
            </div>
          </div>
          <div className="grid-x metadata-view">
            <div className="cell">
              <h2>Metadata</h2>
              {_.map(window.metadataSchema, function(field) {
                if (!_.has(metadata, field.key)) return;
                var valueNode,
                    value = metadata[field.key];
                if (field.multivalued) {
                  valueNode = (
                    <ul>
                    {_.map(value, function(item) {
                      return <li key={item}>{item}</li>;
                    })}
                    </ul>);
                } else {
                  valueNode = value;
                }
                return (
                  <div className="grid-x" key={field.key}>
                    <div className="cell small-4 medium-2">{field.description}</div>
                    <div className="cell small-8 medium-10">{valueNode}</div>
                  </div>);
                })}
            </div>
          </div>

          {/* Only show image thumbnails when there are images in the workflow */}
          {pages.length > 0 &&
          <section>
            <div className="grid-x">
              <div className="cell">
                <h2>Pages</h2>
              </div>
            </div>
            <div className="grid-x">
              <div className="cell small-6 medium-8">
                <F.Button onClick={this.bulkDelete} size="small"
                          className={deleteClasses} title="Delete">
                  <i className="fa fa-trash-o" />
                </F.Button>
              </div>
              <div className="cell small-4 medium-2" offset={2}>
                <select className="format-select"
                        onChange={this.handleImageTypeSelect}>
                  {imageTypes.map(function(name) {
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>
            </div>
                <ul ref="pagegrid" className="pagegrid small-block-grid-2 medium-block-grid-4 large-block-grid-6">
                  {pages.slice(thumbStart, thumbStop).map(function(page) {
                      return (
                        <PagePreview page={page} workflow={workflow} key={page.capture_num} imageType={this.state.imageType}
                                    selected={_.contains(this.state.selectedPages, page)}
                                    selectCallback={_.partial(this.togglePageSelect, page)}
                                    lightboxCallback={_.partial(this.setLightbox, page.sequence_num)} />
                      );
                    }.bind(this))}
                </ul>
                {pageCount > 1 && <F.Pagination centered={true} pageCount={pageCount} onBrowse={this.browse} />}
          </section>}

          {/* Only show output file list if there are output files in the workflow */}
          {!_.isEmpty(workflow.get('out_files')) &&
          <div className="grid-x">
            <div className="cell">
              <h2>Output files</h2>
              <ul ref="outputlist" className="fa-ul">
                {_.map(workflow.get('out_files'), function(outFile) {
                    var fileUrl = '/api/workflow/' + this.props.workflow.id + '/output/' + outFile.name,
                        classes = {
                          'fa-li': true,
                          'fa': true,
                        };
                    if (outFile.mimetype === "text/html") classes['fa-file-code-o'] = true;
                    else if (outFile.mimetype === "application/pdf") classes['fa-file-pdf-o'] = true;
                    else classes['fa-file'] = true;
                    return (
                      <li key={outFile.name}><a href={fileUrl}><i className={require('classnames')(classes)} /> {outFile.name}</a></li>
                    );
                  }, this)}
              </ul>
            </div>
          </div>}
        </main>
      );
    },
    renderLayer: function() {
      if (!_.isNumber(this.state.lightboxSeqNum)) return null;
      var page = _.findWhere(this.props.workflow.get('pages'),
                             {sequence_num: this.state.lightboxSeqNum});
      var imageUrl = util.getPageUrl(this.props.workflow, page.capture_num,
                                     this.state.imageType, false);
      return (
        <Overlay>
          <Lightbox
            imageUrl={imageUrl} sequenceNumber={this.state.lightboxSeqNum}
            sequenceLength={this.props.workflow.get('pages').length}
            onBrowse={this.setLightbox}
            onClose={_.partial(this.setLightbox, null)} />
        </Overlay>);
    }
  });

  module.exports = WorkflowDisplay;
}());
