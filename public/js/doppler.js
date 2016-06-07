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
	
	var _doppler = __webpack_require__(2);
	
	var _doppler2 = _interopRequireDefault(_doppler);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	$(function ($) {
	
	    var $box = $('#box'),
	        doppler = new _doppler2.default();
	
	    new _doppler2.default().init(function (bandwidth) {
	        var threshold = 4;
	
	        // console.log('Bandwidth: ', bandwidth.left, 'x', bandwidth.right);
	
	        if (bandwidth.left > threshold || bandwidth.right > threshold) {
	            var scale = 10,
	                baseSize = 100,
	                diff = bandwidth.left - bandwidth.right,
	                dimension = baseSize + scale * diff;
	
	            $box.css({
	                width: dimension,
	                height: dimension
	            });
	        }
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
	        value: function pushToCallbacks() {
	            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	                args[_key2] = arguments[_key2];
	            }
	
	            callbacks.each(function (callback) {
	                return callback(args);
	            });
	        }
	    }, {
	        key: 'getBandwidth',
	        value: function getBandwidth(analyser, freqs) {
	            var primaryTone = this.freqToIndex(analyser, this.freq),
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
	        value: function freqToIndex(analyser, freq) {
	            return Math.round(freq / this.nyquist * analyser.fftSize / 2);
	        }
	    }, {
	        key: 'indexToFreq',
	        value: function indexToFreq(analyser, index) {
	            return this.nyquist / (analyser.fftSize / 2) * index;
	        }
	    }, {
	        key: 'optimizeFrequency',
	        value: function optimizeFrequency(oscillator, analyser, freqSweepStart, freqSweepEnd) {
	            var oldFreq = oscillator.frequency.value,
	                audioData = new Uint8Array(analyser.frequencyBinCount),
	                maxAmp = 0,
	                maxAmpIndex = 0,
	                from = this.freqToIndex(analyser, freqSweepStart),
	                to = this.freqToIndex(analyser, freqSweepEnd);
	
	            for (var i = from; i < to; i++) {
	                oscillator.frequency.value = this.indexToFreq(analyser, i);
	                analyser.getByteFrequencyData(audioData);
	
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
	                return this.indexToFreq(analyser, maxAmpIndex);
	            }
	        }
	    }, {
	        key: 'readMic',
	        value: function readMic(analyser, userCallback) {
	            var audioData = new Uint8Array(analyser.frequencyBinCount);
	
	            analyser.getByteFrequencyData(audioData);
	
	            var primaryTone = this.freqToIndex(analyser, this.freq);
	
	            this.pushToCallbacks({
	                type: 'TYPE_1',
	                payload: {
	                    primaryTone: primaryTone,
	                    index: this.freqToIndex(analyser, 22000),
	                    analyser: analyser,
	                    audioData: audioData
	                }
	            });
	
	            this.pushToCallbacks({
	                type: 'TYPE_2',
	                payload: {
	                    primaryTone: primaryTone,
	                    to: primaryTone - this.relevantFreqWindow,
	                    from: primaryTone + this.relevantFreqWindow,
	                    analyser: analyser,
	                    audioData: audioData
	                }
	            });
	
	            var band = this.getBandwidth(analyser, audioData);
	            userCallback(band);
	
	            this.pushToCallbacks({
	                type: 'TYPE_3',
	                payload: {
	                    bandDiff: band[0] - band[1]
	                }
	            });
	
	            this.readMicInterval = requestAnimationFrame(this.readMic.bind(this, analyser, userCallback));
	
	            return this.readMicInterval;
	        }
	    }, {
	        key: 'handleMic',
	        value: function handleMic(stream, callback, userCallback) {
	            var _this = this;
	
	            var mic = this.audioCtx.createMediaStreamSource(stream),
	                analyser = this.audioCtx.createAnalyser();
	
	            analyser.smoothingTimeConstant = 0.5;
	            analyser.fftSize = 2048;
	
	            mic.connect(analyser);
	
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
	                var freq = _this.optimizeFrequency(_this.oscillator, analyser, 19000, 22000);
	
	                _this.oscillator.frequency.value = freq;
	
	                callback(analyser, userCallback);
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
	
	            navigator.mediaDevices.getUserMedia(options).then(function (stream) {
	                return _this2.handleMic(stream, _this2.readMic.bind(_this2), callback);
	            }).catch(function () {
	                return console.log('Error!');
	            });
	        }
	    }, {
	        key: 'stop',
	        value: function stop() {
	            cancelAnimationFrame(this.readMicInterval);
	        }
	    }]);

	    return _class;
	}();

	exports.default = _class;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {module.exports = global["Dopler"] = __webpack_require__(1);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }
/******/ ]);
//# sourceMappingURL=doppler.js.map