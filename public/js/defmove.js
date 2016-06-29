/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/public/js";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _defmove = __webpack_require__(2);
	
	var _defmove2 = _interopRequireDefault(_defmove);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	$(function ($) {
	  window.frequencySlider = $('#frequency').slider({
	    formatter: function formatter(value) {
	      return 'Current value: ' + value;
	    }
	  });
	
	  var showAxes = function showAxes() {
	    document.getElementById('spectrum').style.display = "block";
	    document.getElementById('spectrum-zoom').style.display = "block";
	  };
	
	  var drawBall = function drawBall(ctx, pos) {
	    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	    ctx.fillStyle = "rgb(0,0,0)";
	
	    var normalizedX = Math.floor(0.5 * ctx.canvas.width);
	    var normalizedY = Math.floor(0.5 * ctx.canvas.height);
	    var maxSize = 100;
	    var normalizedSize = maxSize / 2 + Math.floor(pos / 30 * maxSize);
	    ctx.fillRect(normalizedX - normalizedSize / 2, ctx.canvas.height - normalizedY - normalizedSize / 2, normalizedSize, normalizedSize);
	  };
	
	  var clearBall = function clearBall(ctx) {
	    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	  };
	
	  var drawFrequencies = function drawFrequencies(ctx, analyser, freqs, primaryTone, startFreq, endFreq) {
	    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	    ctx.fillStyle = "rgb(0,0,0)";
	
	    var primaryVolume = freqs[primaryTone];
	    // For some reason, primaryVolume becomes 0 on firefox, I have no idea why
	    if (primaryVolume == 0) {
	      primaryVolume = 255;
	    }
	    for (var i = 0; i < endFreq - startFreq; i++) {
	      var volume = freqs[startFreq + i];
	      var normalizedX = Math.floor(i / (endFreq - startFreq) * ctx.canvas.width);
	      var normalizedY = Math.floor(0.9 * volume / primaryVolume * ctx.canvas.height);
	      ctx.fillRect(normalizedX, ctx.canvas.height - normalizedY - 5, 5, 5);
	    }
	  };
	
	  var ballCanvas = document.getElementById('ball');
	  var spectrumCanvas = document.getElementById('spectrum');
	  var zoomedSpectrumCanvas = document.getElementById('spectrum-zoom');
	
	  function drawSpectrum(defmove_data) {
	    if (defmove_data.type !== 'TYPE_1') {
	      return false;
	    }
	    var payload = defmove_data.payload;
	
	    var ctx = spectrumCanvas.getContext('2d');
	    drawFrequencies(ctx, payload.analyser, payload.audioData, payload.primaryTone, 0, payload.index);
	  }
	
	  function drawZoomedSpectrum(defmove_data) {
	    if (defmove_data.type !== 'TYPE_1') {
	      return false;
	    }
	
	    var payload = defmove_data.payload;
	    var ctx = zoomedSpectrumCanvas.getContext('2d');
	
	    drawFrequencies(ctx, payload.analyser, payload.audioData, payload.primaryTone, payload.from, payload.to);
	  }
	
	  window.boxActive = $('#action-box').prop('checked');
	
	  function boxMove(bandwidth) {
	    if (!window.boxActive) {
	      return false;
	    }
	
	    var threshold = 4;
	
	    if (bandwidth.left > threshold || bandwidth.right > threshold) {
	      var diff = bandwidth.left - bandwidth.right;
	
	      var ctx = ballCanvas.getContext('2d');
	      drawBall(ctx, diff);
	    }
	  }
	
	  var clamp = function clamp(val, min, max) {
	    return Math.min(max, Math.max(min, val));
	  };
	
	  window.scrollActive = $('#action-scroll').prop('checked');
	
	  function scrolling(defmove_data) {
	    if (defmove_data.type !== 'TYPE_2') {
	      return false;
	    }
	
	    var payload = defmove_data.payload;
	
	    if (window.scrollActive && (payload.band.left > 10 || payload.band.right > 10)) {
	      var bandwidthDifference = clamp(payload.band.right - payload.band.left, -10, 10);
	      var currentScroll = $(window).scrollTop();
	      var scale = 10;
	      $(window).scrollTop(currentScroll + scale * bandwidthDifference);
	    }
	  }
	
	  $('#action-scroll').on('click', function (e) {
	    var $this = $(this);
	    window.scrollActive = $this.prop('checked');
	  });
	
	  $('#action-box').on('click', function (e) {
	    var $this = $(this);
	    window.boxActive = $this.prop('checked');
	  });
	
	  var DefMove;
	  $('#on').on('click', function (e) {
	    e.preventDefault();
	    var $on = $(this);
	    var $off = $('#off');
	
	    DefMove = new _defmove2.default(drawZoomedSpectrum, drawSpectrum, scrolling);
	
	    DefMove.setFrequency(window.frequencySlider.slider('getValue') * 1000);
	
	    try {
	      DefMove.init(boxMove);
	      $on.prop('disabled', true);
	      $off.prop('disabled', false);
	    } catch (e) {}
	
	    showAxes();
	  });
	
	  window.frequencySlider.on('slideStop', function (e) {
	    DefMove.setFrequency(window.frequencySlider.slider('getValue') * 1000);
	  });
	
	  $('#off').on('click', function (e) {
	    e.preventDefault();
	    var $off = $(this);
	    var $on = $('#on');
	
	    $on.prop('disabled', false);
	    $off.prop('disabled', true);
	
	    var ctx = ballCanvas.getContext('2d');
	    clearBall(ctx);
	
	    DefMove.stop();
	  });
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _window = window;
	var requestAnimationFrame = _window.requestAnimationFrame;
	var cancelAnimationFrame = _window.cancelAnimationFrame;
	var setTimeout = _window.setTimeout;
	var navigator = _window.navigator;
	
	var _class = function () {
	    function _class() {
	        _classCallCheck(this, _class);
	
	        var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
	
	        this.audioCtx = new AudioContext();
	        this.oscillator = this.audioCtx.createOscillator();
	        this.analyser = this.audioCtx.createAnalyser();
	
	        this.freq = 20000;
	        this.relevantFreqWindow = 33;
	        this.nyquist = this.audioCtx.sampleRate / 2;
	
	        this.readMicInterval = 0;
	
	        for (var _len = arguments.length, callbacks = Array(_len), _key = 0; _key < _len; _key++) {
	            callbacks[_key] = arguments[_key];
	        }
	
	        this.callbacks = callbacks;
	    }
	
	    _createClass(_class, [{
	        key: 'pushToCallbacks',
	        value: function pushToCallbacks(args) {
	            if (this.callbacks.length > 0) {
	                this.callbacks.forEach(function (callback) {
	                    return callback(args);
	                });
	            }
	        }
	    }, {
	        key: 'getBandwidth',
	        value: function getBandwidth(freqs) {
	            var primaryTone = this.freqToIndex(this.freq),
	                primaryVolume = freqs[primaryTone],
	                maxVolumeRatio = 0.001;
	
	            var leftBandwidth = 0,
	                rightBandwidth = 0,
	                volume = void 0,
	                normalizedVolume = void 0;
	
	            do {
	                leftBandwidth++;
	                volume = freqs[primaryTone - leftBandwidth];
	                normalizedVolume = volume / primaryVolume;
	            } while (normalizedVolume > maxVolumeRatio && leftBandwidth < this.relevantFreqWindow);
	
	            do {
	                rightBandwidth++;
	                volume = freqs[primaryTone + rightBandwidth];
	                normalizedVolume = volume / primaryVolume;
	            } while (normalizedVolume > maxVolumeRatio && rightBandwidth < this.relevantFreqWindow);
	
	            return {
	                left: leftBandwidth,
	                right: rightBandwidth
	            };
	        }
	    }, {
	        key: 'freqToIndex',
	        value: function freqToIndex(freq) {
	            return Math.round(freq / this.nyquist * this.analyser.fftSize / 2);
	        }
	    }, {
	        key: 'indexToFreq',
	        value: function indexToFreq(index) {
	            return this.nyquist / (this.analyser.fftSize / 2) * index;
	        }
	    }, {
	        key: 'optimizeFrequency',
	        value: function optimizeFrequency(oscillator, freqSweepStart, freqSweepEnd) {
	            var oldFreq = oscillator.frequency.value,
	                audioData = new Uint8Array(this.analyser.frequencyBinCount),
	                maxAmp = 0,
	                maxAmpIndex = 0,
	                from = this.freqToIndex(freqSweepStart),
	                to = this.freqToIndex(freqSweepEnd);
	
	            for (var i = from; i < to; i++) {
	                oscillator.frequency.value = this.indexToFreq(i);
	                this.analyser.getByteFrequencyData(audioData);
	
	                if (audioData[i] > maxAmp) {
	                    maxAmp = audioData[i];
	                    maxAmpIndex = i;
	                }
	            }
	            // Sometimes the above procedure seems to fail, not sure why.
	            // If that happends, just use the old value.
	            if (maxAmpIndex == 0) {
	                return oldFreq;
	            } else {
	                return this.indexToFreq(maxAmpIndex);
	            }
	        }
	    }, {
	        key: 'readMic',
	        value: function readMic(userCallback) {
	            var audioData = new Uint8Array(this.analyser.frequencyBinCount);
	
	            this.analyser.getByteFrequencyData(audioData);
	
	            var primaryTone = this.freqToIndex(this.freq);
	
	            var analyser = this.analyser;
	
	            this.pushToCallbacks({
	                type: 'TYPE_1',
	                payload: {
	                    primaryTone: primaryTone,
	                    index: this.freqToIndex(22000),
	                    to: primaryTone + this.relevantFreqWindow,
	                    from: primaryTone - this.relevantFreqWindow,
	                    analyser: analyser,
	                    audioData: audioData
	                }
	            });
	
	            var band = this.getBandwidth(audioData);
	            userCallback(band);
	
	            this.pushToCallbacks({
	                type: 'TYPE_2',
	                payload: {
	                    band: band
	                }
	            });
	
	            this.readMicInterval = requestAnimationFrame(this.readMic.bind(this, userCallback));
	
	            return this.readMicInterval;
	        }
	    }, {
	        key: 'handleMic',
	        value: function handleMic(stream, callback, userCallback) {
	            var _this = this;
	
	            var mic = this.audioCtx.createMediaStreamSource(stream);
	            this.stream = stream;
	            this.mic = mic;
	
	            this.analyser.smoothingTimeConstant = 0.5;
	            this.analyser.fftSize = 2048;
	
	            mic.connect(this.analyser);
	
	            // Doppler tone
	            this.oscillator.frequency.value = this.freq;
	            this.oscillator.type = this.oscillator.SINE;
	            this.oscillator.start(0);
	            this.oscillator.connect(this.audioCtx.destination);
	
	            // There seems to be some initial "warm-up" period
	            // where all frequencies are significantly louder.
	            // A quick timeout will hopefully decrease that bias effect.
	            setTimeout(function () {
	                // Optimize doppler tone
	                var freq = _this.optimizeFrequency(_this.oscillator, 19000, 22000);
	
	                _this.oscillator.frequency.value = freq;
	                _this.freq = freq;
	
	                callback(userCallback);
	            });
	        }
	    }, {
	        key: 'init',
	        value: function init(callback) {
	            var _this2 = this;
	
	            var options = {
	                audio: {
	                    optional: [{
	                        echoCancellation: false
	                    }]
	                }
	            };
	
	            try {
	                navigator.mediaDevices.getUserMedia(options).then(function (stream) {
	                    return _this2.handleMic(stream, _this2.readMic.bind(_this2), callback);
	                }).catch(function () {
	                    return console.log('Error!');
	                });
	            } catch (e) {
	                alert('Нажаль Ваш браузер не підтримує роботу з динаміком та мікрофонами.');
	                this.stop();
	                throw e;
	            }
	        }
	    }, {
	        key: 'setFrequency',
	        value: function setFrequency(frequency) {
	            if (frequency >= 18000 && frequency <= 20000) {
	                this.freq = frequency;
	                this.oscillator.frequency.value = frequency;
	            }
	        }
	    }, {
	        key: 'getFrequency',
	        value: function getFrequency() {
	            return this.freq;
	        }
	    }, {
	        key: 'stop',
	        value: function stop() {
	            this.stream.getAudioTracks()[0].stop();
	            this.stream.removeTrack(this.stream.getAudioTracks()[0]);
	            this.mic.disconnect();
	            this.oscillator.disconnect();
	            cancelAnimationFrame(this.readMicInterval);
	        }
	    }]);

	    return _class;
	}();

	exports.default = _class;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {module.exports = global["defmove"] = __webpack_require__(1);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }
/******/ ]);
//# sourceMappingURL=defmove.js.map