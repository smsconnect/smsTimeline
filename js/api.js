//Main object that holds functions that utilize the Adobe DPS API and allow elements...
//to interact with the back end of the app.
var api = {



  /**
   * setUp
   *   Initial function that uses jquery to select elements of the app, as documented...
   *   in the Adobe DPS API documentation.
   */
  setUp: function(){
    $( document ).ready(function() {
      var $sliderOne = $( '#slideshow-container-one' );
      var $sliderTwo = $( '#slideshow-container-two' );

      //button that I have added to the DOM to navigate back with
      var $buttonNav = $( '.button.nav' );

      //sets the default app navigation as hidden
      adobeDPS.Gesture.disableNavigation([$sliderOne[0], $sliderTwo[0]]);

      //binds event listener to my button element
      $buttonNav.attr( "onclick", "api.toggleNavUi();" );
    });
  },



  /**
   * toggleNavUi
   *   Function that should toggle the visibility of the apps built in navigation...
   *   as documented in the Adobe DPS API documentation. (Added old DPS relative...
   *   link to see if possible to just go back in the app instead of clicking nav).
   *
   */
  toggleNavUi: function(){
    adobeDPS.Gesture.toggleNavigationUI();
    window.location = "navto://relative/last";
  }
}
