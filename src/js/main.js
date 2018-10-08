window.jQuery = $ = require('jquery');
require('owl.carousel');

$(document).ready(function(){

    $('.owl-carousel').owlCarousel({
        nav: true, 
        autoHeight: true,
        slideSpeed : 300,
        paginationSpeed : 400,
        singleItem: true,
        items: 1,
        touchDrag: true,
        dots: true,

    })

    $('.backdrop__nav__topmenu__hamburger').click(function () {
        console.log('hej')
        $('.navigation_menu').addClass('show');
    })

    $('.navigation_menu__close').click(function () {
        $('.navigation_menu').removeClass('show');
    })

});
