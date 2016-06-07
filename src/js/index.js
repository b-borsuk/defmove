import Doppler from './doppler';

$(($) => {

    let $box = $('#box'),
        doppler = new Doppler();

    (new Doppler).init((bandwidth) => {
        var threshold = 4;
        
        // console.log('Bandwidth: ', bandwidth.left, 'x', bandwidth.right);

        if (bandwidth.left > threshold || bandwidth.right > threshold) {
            let scale    = 10,
                baseSize = 100,
                diff = bandwidth.left - bandwidth.right,
                dimension = (baseSize + scale * diff);

            $box.css({
                width: dimension,
                height: dimension
            });
        }
    });
});