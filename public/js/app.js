
// $('.js-gallery').slick({
// 	infinite: true,
// 	speed: 500,
// 	// draggable: false,
// 	vertical: true,
// 	cssEase: 'linear'
// });

$('.js-sidebar__open').on('click', function() {
	$('body').toggleClass('is-open');
	setTimeout(function() {
		$('.js-gallery').slick('setPosition');
	}, 300);
});
