//depends on 'button.js', '_buttons.scss', and '_hidden.scss' to work properly

//depends on the following elements in the index.html file:
//- a [div] in the body with class 'button description'
//- a [div] in the body with class 'top' that holds:
//  - [h1] with class 'title'
//  - [p] with class 'directions'



//Main object that holds functions that deal with positioning sizing of inititial...
//description and title of a visualizations. Default state is visibile when the user...
//first views the visualization.
var description = {



  //object to hold elements of the description.
  elements: {},



  /**
   * setUp
   *   Initial function that uses jquery to wait until the page is ready before
   *   defining element properties as well as establishing a timeout function to
   *   draw attention to the button after a certain amount of time, and attach
   *   other event listeners to the elements.
   */
  setUp: function(){
    //jquery, makes sure the document is ready.
    $( document ).ready(function(){

      //sets holder property 'hidden' to reflect descriptions NOT hidden status.
      description.hidden = 0;

      //sets two properties; one for the button and one for the top div that holds...
      //the description title and directions.
      description.elements.button = document.getElementsByClassName("button description")[0];
      description.elements.topDiv = document.getElementsByClassName("top")[0];

      //timeout to call blink function after a specified time.
      window.setTimeout(description.blink, 500, description.elements.button);

      //sets initial height of top div to half the screen size.
      description.elements.topDiv.style.height = donut.measurements.height / 2 + "px";

      //d3, selects '.top' div and binds touch event which calls 'hide()' function if...
      //the description is not hidden.
      d3.select(".top")
        .on("touchstart", function(){
          if( !description.hidden ){
            description.hide();
          }
        });

      //d3, selects '.button.description' div and binds touch event which calls...
      //the 'show()' function if the description is hidden and the 'hide()' function...
      //if the description is not hidden.
      d3.select(".button.description")
        .on("touchstart", function(){
            if(description.hidden){
              console.log('hidden');
              description.show();
            }else{
              console.log("hid");
              description.hide();
            }
          });
    });
  },



  /**
   * blink
   *   Function that will draw attention to the button if it is not used. [currently commented out].
   */
  blink: function(button){
    console.log(button);
    //d3.select(button.selector).transition().duration(2500).style("background","blueviolet");
  },



  /**
   * hide
   *   Function to hide the description after the user interacts with the div or...
   *   the button. Shrinks the div, changes the opacity of the directions so they...
   *   are no longer visible, and moves the button to the top right area of the screen.
   */
  hide: function(){
    description.elements.topDiv.style.height = "5%";
    description.elements.topDiv.setAttribute("class", "hidden top");

    description.elements.button.setAttribute("class", "hidden button description");
    description.elements.button.style.height = "25px";

    description.hidden = 1;
  },



  /**
   * show
   *   Function to show the descriptions after the user hits the button when the...
   *   description is hidden. Expands the div, changes the opacity of the directions..
   *   so they are visible, and moves the button to the lower middle area of the div.
   */
  show: function(){
    var button = description.elements.button;
    var topDiv = description.elements.topDiv;

    var directions = topDiv.children[1];
    var title = topDiv.children[0];

    topDiv.style.height = donut.measurements.height / 2 + "px";
    topDiv.setAttribute("class", "top");

    button.setAttribute("class", "button description");
    button.style.height = buttons.measurements.buttonWidth;

    description.hidden = 0;
  }
}
