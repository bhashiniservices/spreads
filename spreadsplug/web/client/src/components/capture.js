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

  var React = require('react'),
      _ = require('underscore'),
      Mousetrap = require('mousetrap'),
      ModelMixin = require('../../vendor/backbonemixin.js'),
      Overlay = require('./overlays.js').Overlay,
      LoadingAnimation = require('./overlays.js').Activity,
      lightbox = require('./overlays.js').LightBox,
      LayeredComponentMixin = require('./overlays.js').LayeredComponentMixin,
      ConfigWidget = require('./config.js').ConfigWidget,
      CropWidget = require('./cropdialog.js'),
      util = require('../util.js'),
      PropTypes = require('prop-types'),
      createClass = require('create-react-class');

  var placeholderImg = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4AQMAAABPbGssAAAAA1BMVEWZmZl86KQWAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gQIFjciiRhnwgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAZSURBVEjH7cEBDQAAAMKg909tDwcUAAAPBgnYAAHW6F1SAAAAAElFTkSuQmCC";


  var StatusDisplay = createClass({
    propTypes: {
      numPages: PropTypes.number.isRequired,
      numExpected: PropTypes.number,
      captureStart: PropTypes.number
    },

    getInitialState: function() {
      return {
        initialNum: this.props.numPages
      }
    },

    render: function() {
      // This is only >0 when the 'extent' metadata field is a number, this
      // allows us to display a progress bar that allows for some visual
      // feedback on how far a long the user is with a capture.
      var progress = Math.min(1, this.props.numPages/this.props.numExpected);
      var speed;
      if (this.props.captureStart) {
        var elapsed = (new Date().getTime()/1000) - this.props.captureStart;
        var shot = this.props.numPages - this.state.initialNum;
        speed = (3600/elapsed)*shot | 0;
      } else {
        speed = 0.0;
      }

      return (
        <div>
          {this.props.numExpected > 0 &&
          <div className="grid-x">
            <div className="cell">
              <div className="nice secondary progress">
                <span className="meter" style={{width: progress*100+'%'}} />
              </div>
            </div>
          </div>}
          <div className="grid-x capture-info">
            <div className="cell small-6">
              <span className="pagecount">{this.props.numPages} pages</span>
            </div>
            {speed > 0 &&
            <div className="cell small-6">
              <span className="capturespeed">{speed} pages/hour</span>
            </div>}
          </div>
        </div>
      );
    }
  });


  var Preview = createClass({
    mixins: [LayeredComponentMixin],

    propTypes: {
      targetPage: PropTypes.oneOf(["odd", "even"]).isRequired,
      imageSrc: PropTypes.string,
      cropParams: PropTypes.object,
      onCropParamUpdate: PropTypes.func,
      showCropPreview: PropTypes.bool
    },

    getInitialState: function() {
      return {
        displayLightbox: false,
        displayCrop: false,
      };
    },

    toggleCropDisplay: function() {
      this.setState({
        displayCrop: !this.state.displayCrop
      });
    },

    getCropPreviewStyle: function() {
      if (!this.isMounted() || _.isEmpty(this.props.cropParams)) return {};
      var domNode = this.refs.previewImage.getDOMNode();
      var cropParams = this.props.cropParams,
          factor = domNode.offsetWidth / cropParams.nativeWidth,
          thumbOffset = domNode.offsetLeft;
      return {
        left: thumbOffset + Math.ceil(cropParams.left*factor),
        top: Math.ceil(cropParams.top*factor),
        width: Math.ceil(cropParams.width*factor),
        height: Math.ceil(cropParams.height*factor)
      };
    },

    toggleLightbox: function() {
      this.setState({
        displayLightbox: !this.state.displayLightbox
      });
    },

    handleSave: function(params) {
      this.toggleCropDisplay();
      this.props.onCropParamUpdate(params);
    },

    render: function() {
      var cropPreviewStyle = this.props.showCropPreview ? this.getCropPreviewStyle() : {};
      var imageSrc = this.props.imageSrc + "?numtype=capture";
      var thumbSrc = this.props.imageSrc + "/thumb?numtype=capture";
      return (
        <li>
          {this.props.imageSrc &&
          <a className="toggle-crop" title="Crop image" onClick={this.toggleCropDisplay}>
            <i className="fa fa-crop" /> Crop
          </a>}
          {this.props.imageSrc ?
            <a title="Open full resolution image in lightbox"
               onClick={this.toggleLightbox}>
              <img className={this.props.targetPage}
                   src={thumbSrc} ref='previewImage'/>
            </a>:
            <img className={"placeholder " + this.props.targetPage}
                 src={placeholderImg}/>}
          {!_.isEmpty(cropPreviewStyle) &&
           <div className="crop-preview" style={cropPreviewStyle}/>}
        </li>
      );
    },

    renderLayer: function() {
      var imageSrc = this.props.imageSrc + "?numtype=capture";
      if (!this.state.displayLightbox && !this.state.displayCrop) return null;
      return (
        <Overlay>
          {this.state.displayLightbox &&
            <lightbox onClose={this.toggleLightbox} imageUrl={imageSrc} />}
          {this.state.displayCrop &&
            <div className="reveal" id="previewModal" data-reveal onClose={this.toggleCropDisplay}>
              <CropWidget imageSrc={imageSrc}
                          onSave={this.handleSave}
                          cropParams={this.props.cropParams} showInputs={true} />
            </div>}
        </Overlay>);
    }
  });


  var ConfigModal = createClass({
    propTypes: {
      workflow: PropTypes.object.isRequired,
      onClose: PropTypes.func.isRequired,
      onConfirm: PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        advancedOpts: false,
        validationErrors: {}
      };
    },

    toggleAdvanced: function() {
      this.setState({
        advancedOpts: !this.state.advancedOpts
      });
    },

    handleSubmit: function() {
      this.props.workflow.on('validated:invalid', function(workflow, errors) {
        this.setState({validationErrors: errors});
      }, this);
      var xhr = this.props.workflow.save();
      if (xhr) {
        xhr.done(function() {
          this.props.workflow.off('validated:invalid', null, this);
          this.props.onConfirm();
        }.bind(this))
      };
    },

    render: function() {
      return (
        <form onSubmit={this.handleSubmit}>
          <div className="reveal" id="ConfigModal1" data-reveal onCancel={this.props.onClose}
                          onConfirm={this.handleSubmit}>
            <h2>Configure Devices</h2>
            <input id="check-advanced" type="checkbox"
                   value={this.state.advancedOpts}
                   onChange={this.toggleAdvanced} />
            <label htmlFor="check-advanced">Show advanced options</label>
            <ConfigWidget template={window.configTemplates.device}
                          cfgValues={this.props.workflow.get('config').device}
                          errors={this.state.validationErrors}
                          showAdvanced={this.state.advancedOpts}
                          onChange={function(vals) {
                            var config = _.clone(this.props.workflow.get('config'));
                            config.device = vals;
                            this.props.workflow.set('config', config);
                          }.bind(this)} />
          </div>
        </form>
      );
    }
  });


  var Control = createClass({
    mixins: [LayeredComponentMixin],

    propTypes: {
      workflow: PropTypes.object.isRequired,
      onConfigUpdate: PropTypes.func.isRequired,
      onFinish: PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        displayConfig: false
      };
    },

    componentWillMount: function() {
      // Bind keyboard shortcuts
      _.each(window.config.core.capture_keys, function(key) {
        if (key === ' ') key = 'space';
        Mousetrap.bind(key, this.handleCapture);
      }, this);
      Mousetrap.bind('r', this.handleRetake);
      Mousetrap.bind('f', this.props.onFinish);
    },

    componentWillUnmount: function() {
      _.each(window.config.core.capture_key, function(key) {
        if (key === ' ') key = 'space';
        Mousetrap.unbind(key);
      });
      Mousetrap.unbind('r');
      Mousetrap.unbind('f');
    },

    toggleConfigModal: function() {
      this.setState({
        displayConfig: !this.state.displayConfig
      });
    },

    /**
     * Trigger a single capture, display activity overlay until it is finished
     */
    handleCapture: function() {
      if (this.state.waiting) return;
      this.props.workflow.triggerCapture();
    },

    handleConfigUpdate: function() {
      if (this.state.waiting) return;
      this.toggleConfigModal();
      this.props.onConfigUpdate();
    },

    /**
     * Trigger a retake (= delete last <num_devices> captures and take new
     * ones, display activity overlay until it is finished.
     */
    handleRetake: function() {
      if (this.state.waiting)  return;
      this.props.workflow.triggerCapture({retake: true});
    },

    render: function() {
      return (
        <div className="grid-x">
          <div className="cell capture-controls">
            <ul>
              <li id="retake-capture">
                <button type="button" className="button secondary" title="Discard last capture and take a new one"
                    onClick={this.handleRetake}>
                  <i className="fa fa-refresh"></i>
                </button>
              </li>
              <li id="trigger-capture">
                <button type="button" className="button" title="Trigger capture" onClick={this.handleCapture}>
                  <i className="fa fa-camera"></i>
                </button>
              </li>
              <li>
                <button type="button" className="button secondary" title="Configure devices" 
                    onClick={this.toggleConfigModal}>
                  <i className="fa fa-gear"></i>
                </button>
              </li>
              <li>
                <button type="button" className="button" title="Finish capture and return to workflow list"
                          onClick={this.props.onFinish} className="complete">
                  <i className="fa fa-check"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      );
    },

    renderLayer: function() {
      if (this.state.displayConfig) {
        return (
          <Overlay>
            <ConfigModal workflow={this.props.workflow}
                              onClose={this.toggleConfigModal}
                              onConfirm={this.handleConfigUpdate} />
          </Overlay>);
      } else {
        return null;
      }
    }
  });


  var ShortcutHelp = createClass({
    propTypes: {
      captureKeys: PropTypes.arrayOf(PropTypes.string)
    },

    render: function() {
      if (util.isTouchDevice()) return null;
      return (
        <div className="grid-x hide-for-touch">
          <div className="cell small-4 small-offset-4 shortcuts">
            <strong>Keyboard shortcuts:</strong>
            <ul>
              <li>Capture:
                {_.map(this.props.captureKeys, function(key) {
                  return (<span key={key}>{' '}<kbd>{key.toUpperCase()}</kbd></span>);
                })}</li>
              <li>Retake: <kbd>R</kbd></li>
              <li>Finish: <kbd>F</kbd></li>
            </ul>
          </div>
        </div>
      );
    }
  });


  /**
   * Screen component to control the capture process.
   */
  var CaptureScreen = createClass({
    propTypes: {
      workflow: PropTypes.object.isRequired
    },

    /** Enables two-way databinding with Backbone model */
    mixins: [ModelMixin, LayeredComponentMixin],

    /** Activates databinding for `workflow` model property. */
    getBackboneModels: function() {
      return [this.props.workflow];
    },

    getInitialState: function() {
      // Try to load cropParams for this workflow from localStorage
      return {
        /** Display activity overlay? */
        waiting: false,
        /** Message for activity overlay */
        waitMessage: undefined,
        /** Crop parameters */
        cropParams: {},
        /** Whether we registered a function to crop on successful captures */
        cropOnSuccess: false,
        /** Time of first capture */
        captureStart: undefined,
        /** Last error */
        lastError: undefined
      };
    },

    componentWillMount: function() {
      // Display waiting modal during ongoing capture
      this.props.workflow.on('capture-triggered', function(){
        this.toggleWaiting("Please wait for the capture to finish...");
      }, this);
      this.props.workflow.on('capture-succeeded', this.toggleWaiting, this);

      // Record time of first capture
      this.props.workflow.on('capture-succeeded', _.once(function() {
        this.setState({
          captureStart: new Date().getTime()/1000
        });
      }), this);

      this.props.workflow.on('capture-failed', _.partial(this.handleError, false), this);

      // Leave capture screen when the workflow step is changed from elsewhere
      this.props.workflow.on('status-updated', function(status) {
        if (status.step !== 'capture') {
          window.router.navigate('/', {trigger: true});
        }
      }, this);
    },

    componentDidMount: function() {
      // Prepare devices
      this.toggleWaiting("Please wait while the devices  are being prepared " +
                          "for capture");
      this.props.workflow.prepareCapture({onSuccess: this.handlePrepareFinish,
                                          onError: _.partial(this.handleError, true)});

      var storageKey = 'crop-params.' + this.props.workflow.id,
          cropParamJson = localStorage.getItem(storageKey),
          cropParams;
      if (cropParamJson) {
        // If there are crop parameters in the localStorage for this scan,
        // the pages preceding the first shot are (likely, TODO) already cropped,
        // so we only register the crop callback after the first capture has
        // already happened.
        this.props.workflow.once('capture-succeeded', this.bindCropEvents, this);
        this.setState({
          cropParams: JSON.parse(cropParamJson),
          cropTarget: undefined
        });
      }
    },

    /**
     * Triggers finish of capture on workflow.
     */
    componentWillUnmount: function() {
      console.log("Wrapping up capture process");

      // Remove event listeners
      this.props.workflow.off(null, null, this);

      // Crop last two shot images
      if (this.state.cropOnSuccess && !_.isEmpty(this.state.cropParams)) {
        _.each(this.props.workflow.get('pages').slice(-2), function(page) {
            var targetPage = page.sequence_num%2 > 0 ? 'odd': 'even';
            this.props.workflow.cropPage({
              pageNum: page.capture_num,
              cropParams: this.state.cropParams[targetPage]
            });
        }, this);
      }
    },

    handlePrepareFinish: function() {
      window.addEventListener("beforeunload", function(event) {
        this.props.workflow.finishCapture();
      }.bind(this));

      window.router.before = function(route, name) {
        this.setState({
          returnRoute: route
        });
        this.handleFinish();
        return false;
      }.bind(this);

      this.toggleWaiting();
    },

    handleError: function(critical, error) {
      this.setState({
        waiting: false,
        lastError: error,
        errorIsCritical: critical
      });
    },

    handleFinish: function() {
      delete window.router.before;
      function leaveScreen() {
        window.router.navigate(this.state.returnRoute || '/',
                               {trigger: true});
      }
      this.toggleWaiting("Please wait for the capture process to finish...");
      this.props.workflow.finishCapture({onSuccess: leaveScreen.bind(this)});
    },

    /**
     * For each page number 'n' in data.pages, crop the page 'n-2' with
     * the appropriate crop parameters.
     */
    cropLast: function(data) {
      var workflow = this.props.workflow,
          shotPages = data.pages;
      if (data.retake) {
        // Don't crop on retakes
        return;
      }
      console.log("Cropping last capture");
      _.each(shotPages, function(page) {
        var pageNum = page.capture_num,
            // This is safe, since we don't crop on retakes
            toCrop = pageNum-2,
            targetPage = page.sequence_num%2 > 0 ? 'odd': 'even';
        this.props.workflow.cropPage({
          pageNum: toCrop,
          cropParams: this.state.cropParams[targetPage]
        });
      }, this);
    },

    /**
     * Toggle display of activity overlay.
     *
     * @param {string} message - Message to display on overlay
     */
    toggleWaiting: function(message) {
      if (!this.state.waiting) {
        this.setState({
          waiting: true,
          waitMessage: message || ''
        });
      } else {
        this.setState({waiting: false});
      }
    },

    bindCropEvents: function() {
      if (!this.state.cropOnSuccess) {
        this.props.workflow.on('capture-succeeded', this.cropLast, this);
        this.setState({cropOnSuccess: true})
      }
    },

    setCropParams: function(targetPage, params) {
      // Register event to crop the previous picture for any new picture taken
      // We don't send this manually with each capture trigger, since we also
      // want to catch captures triggered from the backend (i.e. via the
      // hidtrigger plugin)
      var origParams = this.state.cropParams,
          storageKey = 'crop-params.' + this.props.workflow.id,
          paramJson;
      this.bindCropEvents();
      origParams[targetPage] = params;
      paramJson = JSON.stringify(origParams);
      if (paramJson != localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, paramJson);
      }
      this.setState({
        cropParams: origParams,
        cropTarget: undefined
      });
    },

    handleConfigUpdate: function() {
        this.toggleWaiting("Please wait until the devices are reconfigured.");
        this.props.workflow.prepareCapture({onSuccess: this.toggleWaiting,
                                            onError: _.partial(this.handleError, true),
                                            reset: true});
    },

    render: function() {
      var workflow = this.props.workflow || {},
          oddImage, evenImage, captureKeys, previewClasses;

      previewClasses = {
        'capture-preview': true,
        'small-block-grid-2': util.getOrientation() === 'landscape',
        'small-block-grid-1': util.getOrientation() === 'portrait',
        'medium-block-grid-2': util.getOrientation() === 'portrait'
      };

      captureKeys = [] ;
      _.each(window.config.core.capture_keys, function(key) {
        if (key === ' ') captureKeys.push('<spacebar>');
        else captureKeys.push(key);
      });

      if (workflow.get('pages').length) {
        var lastPages = _.sortBy(workflow.get('pages').slice(-2), 'capture_num');
        evenImage = util.getPageUrl(workflow, lastPages[0].capture_num, 'raw');
        oddImage = util.getPageUrl(workflow, lastPages[1].capture_num, 'raw');
      }

      return (
        <div>
          <div className="grid-x">
            <div className="cell">
                <ul className={require('classnames')(previewClasses)}>
                  <Preview targetPage="even" imageSrc={evenImage}
                    cropParams={this.state.cropParams['even']}
                    onCropParamUpdate={_.partial(this.setCropParams, 'even')}
                    showCropPreview={this.state.captureStart > 0} />
                  <Preview targetPage="odd" imageSrc={oddImage}
                    cropParams={this.state.cropParams['odd']}
                    onCropParamUpdate={_.partial(this.setCropParams, 'odd')}
                    showCropPreview={this.state.captureStart > 0}/>
              </ul>
            </div>
          </div>
          <StatusDisplay numPages={this.props.workflow.get('pages').length}
                         numExpected={this.props.workflow.get('metadata').extent | 0}
                         captureStart={this.state.captureStart} />
          <Control workflow={this.props.workflow}
                   onConfigUpdate={this.handleConfigUpdate}
                   onFinish={this.state.waiting ? function(){} : this.handleFinish} />
          <ShortcutHelp captureKeys={captureKeys} />
        </div>
      );
    },

    renderLayer: function() {
      if (this.state.lastError) {
        var leave = _.partial(window.router.navigate, "/", {trigger: true});
        var closeModal = function() {
          this.setState({
            lastError: undefined,
            errorIsCritical: undefined
          });
        }.bind(this);
        return (
          <Overlay>
            <div className="reveal" id="captutreScreenModal" data-reveal onClose={this.state.errorIsCritical ? leave : closeModal}>
              <h2>Error</h2>
              <p>
                {_.flatten(_.map(this.state.lastError.message.split('\n'), function(part) {
                  return [part, <br/>];
                  }))}
              </p>
              <button type="button" className="button" onClick={this.state.errorIsCritical ? leave : closeModal}>OK</button>
            </div>
          </Overlay>);
      } else if (this.state.waiting) {
        return (
          <Overlay>
            <LoadingAnimation message={this.state.waitMessage} />
          </Overlay>);
      } else {
        return null;
      }
    }
  });

  module.exports = {
    CaptureScreen: CaptureScreen
  };
})();
