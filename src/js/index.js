import defmove from './defmove';

$(($) => {
  window.frequencySlider = $('#frequency').slider({
    formatter: function(value) {
      return 'Current value: ' + value;
    }
  });

  var showAxes = function() {
    document.getElementById('spectrum').style.display = "block";
    document.getElementById('spectrum-zoom').style.display = "block";
  };


  var drawBall = function(ctx, pos) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgb(0,0,0)";

    var normalizedX = Math.floor( 0.5 * ctx.canvas.width );
    var normalizedY = Math.floor( 0.5 * ctx.canvas.height );
    var maxSize = 100;
    var normalizedSize = maxSize/2 + Math.floor( pos/30 * maxSize );
    ctx.fillRect( normalizedX - normalizedSize/2,
                  ctx.canvas.height - normalizedY - normalizedSize/2,
                  normalizedSize, normalizedSize );
  };

    var clearBall = function(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  var drawFrequencies = function(ctx, analyser, freqs, primaryTone, startFreq, endFreq) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgb(0,0,0)";

    var primaryVolume = freqs[primaryTone];
    // For some reason, primaryVolume becomes 0 on firefox, I have no idea why
    if (primaryVolume == 0) {
      primaryVolume = 255;
    }
    for (var i = 0; i < (endFreq-startFreq); i++) {
      var volume = freqs[startFreq+i];
      var normalizedX = Math.floor( i/(endFreq-startFreq) * ctx.canvas.width );
      var normalizedY = Math.floor( 0.9 * volume/primaryVolume * ctx.canvas.height );
      ctx.fillRect( normalizedX, ctx.canvas.height - normalizedY - 5, 5, 5 );
    }
  };

  var ballCanvas = document.getElementById('ball');
  var spectrumCanvas = document.getElementById('spectrum');
  var zoomedSpectrumCanvas = document.getElementById('spectrum-zoom');

  function drawSpectrum(defmove_data) {
    if (defmove_data.type !== 'TYPE_1') {
      return false;
    }
    let payload = defmove_data.payload;

    let ctx = spectrumCanvas.getContext('2d');
    drawFrequencies(ctx, payload.analyser, payload.audioData, payload.primaryTone, 0, payload.index);
  }

  function drawZoomedSpectrum(defmove_data) {
    if (defmove_data.type !== 'TYPE_1') {
      return false;
    }

    let payload =  defmove_data.payload;
    let ctx = zoomedSpectrumCanvas.getContext('2d');

    drawFrequencies(ctx, payload.analyser, payload.audioData, payload.primaryTone, payload.from, payload.to);
  }

  window.boxActive = $('#action-box').prop('checked');

  function boxMove(bandwidth) {
    if (!window.boxActive) {
      return false;
    }

    let threshold = 4;

    if (bandwidth.left > threshold || bandwidth.right > threshold) {
      let diff = bandwidth.left - bandwidth.right;

      let ctx = ballCanvas.getContext('2d');
      drawBall(ctx, diff);
    }
  }

  var clamp = function(val, min, max) {
    return Math.min(max, Math.max(min, val));
  };

  window.scrollActive = $('#action-scroll').prop('checked');

  function scrolling(defmove_data) {
    if (defmove_data.type !== 'TYPE_2') {
      return false;
    }

    let payload =  defmove_data.payload;

    if (window.scrollActive && (payload.band.left > 10 || payload.band.right > 10)) {
      var bandwidthDifference = clamp(payload.band.right - payload.band.left, -10, 10);
      var currentScroll = $(window).scrollTop()
      var scale = 10;
      $(window).scrollTop(currentScroll + scale*bandwidthDifference);
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
  $('#on').on('click', function(e) {
    e.preventDefault();
    var $on = $(this);
    var $off = $('#off');

    DefMove = new defmove(drawZoomedSpectrum, drawSpectrum, scrolling);

    DefMove.setFrequency(window.frequencySlider.slider('getValue') * 1000);

    try {
      DefMove.init(boxMove);
      $on.prop('disabled', true);
      $off.prop('disabled', false);
    } catch (e) {
    }

    showAxes();
  });

  window.frequencySlider.on('slideStop', function (e) {
    DefMove.setFrequency(window.frequencySlider.slider('getValue') * 1000);
  });

  $('#off').on('click', function(e) {
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
