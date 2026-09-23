/* Page behaviour that the WordPress theme used to provide: mobile menu, sticky header,
 * FAQ accordion and the "Get Offer Now" pop-up. Needs jQuery + Bootstrap 3 (loaded before this file). */
jQuery(function ($) {
  // mobile side menu
  function closeMenu() {
    $('#mySidenav').removeClass('openside');
    $('.side-backdrop').removeClass('in');
    $('body').removeClass('modal-open');
  }
  $('.headtoggle .toggle').on('click', function (e) {
    e.preventDefault();
    $('#mySidenav').addClass('openside');
    $('.side-backdrop').addClass('in');
    $('body').addClass('modal-open');
  });
  $('#mySidenav .closebtn, .side-backdrop').on('click', closeMenu);
  $(document).on('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // sticky header after 150px
  function sticky() { $('.topheader').toggleClass('sticky-header', $(window).scrollTop() >= 150); }
  $(window).on('scroll', sticky); sticky();

  // FAQ accordion (same behaviour as the live theme: one open at a time)
  $('.accordion-toggle').on('click', function () {
    var wasActive = $(this).hasClass('active');
    $('.accordion-toggle, .accordion-content').removeClass('active');
    if (!wasActive) { $(this).addClass('active'); $(this).next('.accordion-content').addClass('active'); }
  });

  // "Get Offer Now" buttons open the cash-offer pop-up
  $(document).on('click', '.offer-modal, .button-popup-hero1-button', function (e) {
    e.preventDefault();
    $('#offermodal').modal('show');
  });
});
