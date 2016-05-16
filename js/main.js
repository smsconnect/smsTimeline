var timeline = {

  //An object that stores d3 'tools' that are reuseable between functions
  //(i.e d3 scales, axises, etc.)
  d3tools: {},

  //An object that stores DOM elements that are used between functions
  elem: {},

  //An object that stores measurements, dimensions, and coordinates that functions
  //use to position and resize elements dynamically based on screen size of device
  meas: {},

  //A specific object to hold dimensions and positioning values of the polygon
  //'viewer', seperated from the measurements object due to its unique amount
  //of points and coordinates needed to contruct it
  viewer: {},

  //main object property to keep track of if an event is currently displayed
  displayed: false,


  //main object property to keep track of whether or not the content holder is
  //expanded or not
  expanded: false,



  /**
   * setUp
   *   file to start constructions of the timeline elements
   */
  setUp: function(){
    var tM = timeline.meas; //var to make property assignments of the measurements object more readable
    var tV = timeline.viewer; //var to make property assignments of the viewer object more readable

    tM.width = document.documentElement.clientWidth;
    tM.height = document.documentElement.clientHeight;
    tM.padding = document.documentElement.clientHeight/2; //padding that determines where timeline axis stops
    tM.eventHolderWidth = tM.width * 0.7;
    tM.rightSpace = tM.width - (tM.width * 0.7);
    tM.circleRadius = tM.rightSpace * (7 / 120);
    tM.timelineXPos = tM.width * (15.5 / 16);

    tV.width = tM.rightSpace;
    tV.height = tV.width / 3;
    tV.xPos = (tM.timelineXPos - 1.5) - tV.width;
    tV.yPos = (tM.height / 2) - (tV.height / 2);
    tV.overhang = tM.eventHolderWidth - tV.xPos; //how much viewer goes past content holder width
    tV.bottom = tV.yPos + tV.height;
    tV.top = tV.yPos;

    timeline.makeViewer();
    timeline.makeEventHolder();

    timeline.useData();

    buttons.createButtons();//call to 'buttons.js' to construct default buttons

    timeline.bindEventsAndCall();
    timeline.onReady();
  },



  /**
   * makeViewer
   *   Constructs the viewer svg that gets filled in with the year of events when
   *   they are navigated to on the timeline.
   */
  makeViewer: function(){
    var height = timeline.viewer.height;
    var overhang = timeline.viewer.overhang;
    var width = timeline.viewer.width;
    var xPos = timeline.viewer.xPos;
    var yPos = timeline.viewer.yPos;

    //coordinate points to construct viewer path
    var viewerLineData = [
      { "x": 0, "y": 0},
      { "x": width * (5 / 6), "y": 0},
      { "x": width, "y": height/2},
      { "x": width * (5 / 6), "y": height},
      { "x": 0, "y": height},
      { "x": 0, "y": 0}
    ];

    //coordinate points to construct small addition path for style purposes
    var viewerBackLineData = [
      { "x": 0, "y": height},
      { "x": overhang, "y": height},
      { "x": overhang, "y": height + overhang}
    ]

    var viewerLine = d3.svg.line()
      .x(function(d){ return d.x;})
      .y(function(d){ return d.y;})
      .interpolate("linear");

    //main svg that will hold viewer polygon paths
    var viewerSvg = d3.select("body")
      .append("svg")
        .attr("class","viewer-svg")
        .attr("width", width)
        .attr("height", height + overhang)
        .attr("fill","black")
        .style("position", "fixed")
        .style("left", xPos)
        .style("top", yPos)

    //uses 'viewerLine' and 'viewerLineData' to make main polygon path and append to svg
    viewerSvg.append("path")
      .attr("d", viewerLine(viewerLineData))
      .attr("stroke-width","0px")
      .attr("fill","#e84a0c");

    //uses 'viewerLine' and 'viewerBackLineData' to make small polygon path and append to svg
    viewerSvg.append("path")
      .attr("d", viewerLine(viewerBackLineData))
      .attr("stroke-width","0px")
      .attr("fill","#333333");

    timeline.elem.viewer = viewerSvg[0][0]; //put viewer svg element in main elements object ([0][0] used because initial variable was created with d3)
  },



  /**
   * makeEventHolder
   *   Creates <div> and <p> to hold event texts and appends both to DOM
   */
  makeEventHolder: function(){
    var height = timeline.meas.height;
    var width = timeline.meas.eventHolderWidth;
    var eventHolder = timeline.elem.eventHolder = document.getElementById("event-holder");  //get and save content div
    var eventContent = timeline.elem.eventContent = document.createElement("div"); //create and save event content div
    var eventText = timeline.elem.eventText = document.createElement("p");  //create and save text paragraph tag

    eventHolder.onclick = function(){
      timeline.expand();
    }

    eventHolder.ontouchmove = function(){
      timeline.expand();
    }

    eventHolder.style.width = width + "px";
    eventHolder.style.height = height + "px";

    eventContent.setAttribute("class","content");
    eventContent.setAttribute("id","c");
    eventContent.style.width = width - 40 + "px";

    eventText.setAttribute("class","text");
    eventText.setAttribute("id","p");

    eventHolder.appendChild(eventContent);
    eventHolder.appendChild(eventText);
  },



  /**
   * useData
   *   Introduces data object and sets measurement values that need information
   *   from the data object. (This would be where AJAX call would be if used)
   */
  useData: function(){
    var data = timeline.data;

    timeline.meas.totalHeight = document.documentElement.clientHeight * (data.length / 2.5);  //sets total height of timeline vis based on data object length
    timeline.meas.earliest = new Date(data[0].date);  //gets earliest date in data object (first event object...have to keep in order)
    timeline.meas.latest = new Date(data[(data.length) - 1].date);  //gets latest date in data object (last event object...have to keep in order)

    timeline.makeSvg();
  },



  /**
   * makeSvg
   *   Creates main svg that holds timeline path and timeline elements
   */
  makeSvg: function(){
    var totalHeight = timeline.meas.totalHeight;
    var width = timeline.meas.width;

    //svg element which is the size of the body that holds all generates svg elements besides the viewer
    timeline.elem.svg = d3.select("body")
      .append("svg")
        .attr("class","svg")
        .attr("width", width)
        .attr("height", totalHeight);

    timeline.makeTimeline();
  },



  /**
   * makeTimeline
   *   Makes main timeline path and date ticks and appends them to main svg
   */
  makeTimeline: function(){
    var circleRadius = timeline.meas.circleRadius;
    var earliest = timeline.meas.earliest;
    var latest = timeline.meas.latest;
    var padding = timeline.meas.padding;
    var svg = timeline.elem.svg;
    var tickSize = timeline.meas.rightSpace / 5;  //calculates ticksize of timeline axis based off size of right space
    var timelineX = timeline.meas.timelineXPos;
    var totalHeight = timeline.meas.totalHeight;

    //time scale for year event placement on timeline. Saved in 'd3tools' because
    //it is used again in "timeline.makeCircles()" to place circle points
    var yScale = timeline.d3tools.yScale = d3.time.scale()
      .domain([earliest, latest])
      .range([padding, totalHeight - padding]);

    //makes main timeline path into an axis
    var yScaleSideAxis = timeline.d3tools.yScaleSideAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left")
      .ticks(d3.time.years, 1)  //determines spacing of ticks on timeline axis
      .innerTickSize(tickSize); //determines length of ticks on timeline axis

    //creates and appends the main 'timeline' path to main svg
    svg.append("g")
      .attr("class","timeline-path")
      .style("transform", "translate(" + timelineX + "px,0px)")
      .call(yScaleSideAxis);

    //dynamically resizes the tick text
    d3.selectAll(".tick text")
      .style("font-size", circleRadius * 2.5);

    timeline.makeCircles();
  },



  /**
   * makeCircles
   *   Makes circles for every timeline event and appends them to the main svg,
   *   and adds y position to timeline.circleCY
   */
  makeCircles: function(){
    var circleCY = timeline.meas.circleCY = []; //array to hold y center position of all circle elements on screen. Saved and used in "timeline.isScrolledIntoView" and "timeline.goWhere"
    var circleRadius = timeline.meas.circleRadius;
    var data = timeline.data;
    var svg = timeline.elem.svg;
    var timelineX = timeline.meas.timelineXPos;
    var yScale = timeline.d3tools.yScale;

    //D3, makes all circle points for every event
    var circles = timeline.elem.circles = svg
      .append("g")
        .selectAll(".circle")
        .data(data)
        .enter()
      .append("circle")
        .attr("class", "circle")
        .attr("cx", timelineX)  //sets x position of circle elements so they are on the timeline path
        .attr("cy", function(d){return d3.round(yScale(new Date(d.date)));})  //sets y position of circle elements (based on date of object in data)
        .attr("r", circleRadius)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("fill", "#bbbbbc");

    //pushes all center y points of the circle elements into array
    for(var i = 0; i < circles[0].length; i++){
      circleCY.push(parseInt(circles[0][i].getAttribute("cy")));
    }
  },



  /**
   * bindEventsAndCall
   *   Binds 'touchmove' listener to html DOM element that calls isScrolledIntoView
   *   function if fired
   */
  bindEventsAndCall: function(){
    d3.select("html").on("touchmove",function(){
      timeline.isScrolledIntoView();
      timeline.contract();
    });

    timeline.isScrolledIntoView();
  },



  /**
   * isScrolledIntoView
   *   Anytime the user touches the screen and moves the timeline position this
   *   function is called. It checks to see if any of the circle event elements
   *   are now positioned within the bounds of the viewer. Circle elements are
   *   are animated and other functions are then called to hide or show text
   *   descriptions associated with and event. Called every 250 ms due to momentum
   *   scrolling on touch screen devices.
   */
  isScrolledIntoView: function(){
    var circleCY = timeline.meas.circleCY;
    var circleRadius = timeline.meas.circleRadius;
    var circles = timeline.elem.circles;
    var data = timeline.data;
    var viewerBottom = timeline.viewer.bottom;
    var viewerHeight = timeline.viewer.height;
    var viewerTop = timeline.viewer.top;
    var viewerWidth = timeline.viewer.width;
    var badCounter = 0; //counter to see if all circle elements are out of bounds
    var bodyScroll = window.scrollY;  //sees how far page has been scrolled
    var d3Circle; //circle element being checked
    var elementCenter;  //center y coordinate of the element being checked

    //goes through all circle elements
    for(var i = 0; i < circles[0].length; i++){
      d3Circle = d3.select(circles[0][i]);
      elementCenter = circleCY[i] - bodyScroll;

      //checks to see if any of the circle's centers are between the top or bottom of the viewer
      if(elementCenter >= viewerTop && elementCenter <= viewerBottom){

        //if the element WASN'T displayed
        if(!data[i].displayed){

          //animation effects for circle within the bounds
          d3Circle.transition()
            .ease("elastic")
            .attr("r", circleRadius * 2.38)
            .attr("fill","#00adee");

          timeline.hideContent(); //hides old content
          timeline.chooseContent(i); //calls function to display content associated with the circle element
          timeline.showText(i); //calls function to display event description associated with the circle element

          data[i].displayed = true; //sets displayed property of this event object to true
          timeline.displayed = true; //sets main object displayed property to true for use in other areas
        }

       //if circle isn't between the top or bottom of the viewer
      }else{

        //if the element WAS displayed
        if(data[i].displayed){

          //animation effects for circles without of bounds
          d3Circle.transition()
            .ease("elastic")
            .attr("r", circleRadius)
            .attr("fill","#bbbbbc");

          data[i].displayed = false;  //sets displayed property of this event object to false
          timeline.displayed = false; //sets main object displayed property to false for use in other areas
        }

        //if all the way through elements and none within bounds
        if(badCounter === data.length - 1){
          timeline.hideContent();
          timeline.hideText();  //calls function to hide displayed description text
        }

        badCounter++; //counter to make sure we checked all the circles before hiding the description text
      }
    }
  },



  /**
   * chooseContent
   *   Decides which content to display and how to display it based on what is in
   *   the content object of the event object in the main data object
   *
   * @param {number} pos - Position of circle element in the circle array that is within the bounds of the viewer svg
   */
  chooseContent: function(pos){
    var content = timeline.data[pos].content
    var eventContent = timeline.elem.eventContent

    eventContent.innerHTML = ""; //make sure old content is clear

    //if the event has associated content
    if(content){

      //if the content is an image
      if(content.image){
        timeline.showContentImage(content.image, eventContent);

      //if the content is audio
      }else if(content.audio){
        timeline.showContentAudio(content.audio, eventContent);
      }
    }
  },



  /**
   * showContentImage
   *   Adds an image element to content div then sets the image src based on the
   *   content.image property of the event
   *
   * @param {element} contentElement - DOM element that will hold the event image
   * @param {string} image - string to set as image source
   */
  showContentImage: function(image, contentElement){
    var contentImage = document.createElement("img");

    contentImage.src = "assets/images/" + image;
    contentElement.appendChild(contentImage);
    contentElement.style.opacity = 1;
  },



  /**
   * showContentAudio
   *   Adds HTML5 audio elements to the content div then sets the image src based on the
   *   content.audio property of the event. Uses premade styling 'jplayer' instead
   *   of default html5 audio player for sizing reasons
   *
   * @param  {string} audio - string to set as audio source
   * @param  {element} contentElement - DOM element that will hold the event audio
   */
  showContentAudio: function(audio, contentElement){
    var audioWrapper = document.getElementsByClassName("prototype-wrapper")[0]; //get jplayer wrapper class

    //create new jplayer instance with selected audio
    var myCirclePlayer = new CirclePlayer("#jquery_jplayer_1",
    {
      oga: "assets/audio/" + audio
    }, {
      cssSelectorAncestor: "#cp_container_1"
    });

    //if there is a jplayer wrapper class
    if(audioWrapper){
      audioWrapper.style.width = timeline.meas.eventHolderWidth + "px";
      audioWrapper.style.opacity = 1;
      audioWrapper.style.pointerEvents = "auto";
      audioWrapper.style.display = "block";
    }
  },



  /**
   * showText
   *   Selects <p> with id='p' from the DOM and adds the description of the circle
   *   element that is attached to this element in the main data object, and changes
   *   the opacity of the text so it is visible
   *
   * @param {number} pos - Position of circle element in the circle array that is within the bounds of the viewer svg
   */
  showText: function(pos){
    var data = timeline.data;
    var eventText = timeline.elem.eventText;
    var textObject = data[pos].description; //gets the events associated description

    eventText.innerHTML = textObject;
    if(!timeline.expanded){
      eventText.style.top = (timeline.meas.height / 2) - (eventText.clientHeight / 2) + "px";
    }
    eventText.style.opacity = 1;  //makes text element visible

    timeline.meas.textElementHeight = eventText.clientHeight; //save for use in contract function
    timeline.makeYearText(pos);
  },



  /**
   * expand
   *   expands the event holder to cover the timeline, moves the viewer to top center
   *   of event holder, resizes event content and event text
   */
  expand: function(){
    var tE = timeline.elem; //var to make property assignments of elements more readable

    //if timeline is already expanded
    if(timeline.expanded === true){
      timeline.contract();  //contract the event holder
      timeline.expanded = false;  //record that event holder is now contracted
      return;
    }

    if(timeline.displayed === false) return;  //if no event is displayed, do not allow event holder to expand

    //sizing and positioning of elements to expand: event content, event holder,
    //event text, and the viewer
    tE.eventContent.style.width = timeline.meas.width - 40 + "px";
    tE.eventHolder.style.width = timeline.meas.width + "px";
    tE.eventHolder.style.paddingTop = "calc(5% + " + timeline.viewer.height + "px)";
    tE.eventText.style.top = "0px";
    tE.eventText.style.position = "relative";
    tE.viewer.style.top = "2.5%";
    tE.viewer.style.left = "calc(50% - " + timeline.viewer.width * (5 / 12) + "px)";
    tE.viewer.style.width = timeline.viewer.width * (5 / 6);
    tE.viewer.style.height = timeline.viewer.height - 1;

    timeline.expanded = true; //record that the event holder is now expanded
  },



  /**
   * contract
   *   returns event holder to normal size and position on left, exposing timeline
   */
  contract: function(){
    var tE = timeline.elem; //var to make property assignments of elements more readable
    var tM = timeline.meas; //var to make getting and setting measurements more readable

    tE.eventContent.style.width = tM.eventHolderWidth - 40 + "px";
    tE.eventContent.style.top = 0 + "px";

    tE.eventHolder.style.width = tM.eventHolderWidth + "px";
    tE.eventHolder.style.paddingTop = "0px";

    tE.eventText.style.position = "absolute";
    tE.eventText.style.top = (tM.height / 2) - (tM.textElementHeight/ 2) + "px";//this gets event text close to final position but slightly off due to css transitions

    //top measurement for text is weird due to css transitions...timeout until transitions
    //are completed and then correct text placement (set for 250 ms)
    setTimeout(function(){
      tE.eventText.style.top = (tM.height / 2) - (tE.eventText.clientHeight/ 2) + "px";
      tM.textElementHeight = tE.eventText.clientHeight; //update new saved height
    }, 250);

    tE.viewer.style.top = timeline.viewer.yPos;
    tE.viewer.style.left = timeline.viewer.xPos;
    tE.viewer.style.width = timeline.viewer.width;
    tE.viewer.style.height = timeline.viewer.height + timeline.viewer.overhang;

    timeline.expanded = false;  //record that event holder is now contracted
  },



  /**
   * hideContent
   *   makes content div within event holder not visible, as well as jplayer audio
   *   elements
   */
  hideContent: function(){
    var audioWrapper = document.getElementsByClassName("prototype-wrapper")[0]; //select jplayer audio player

    audioWrapper.style.opacity = 0;
    audioWrapper.style.pointerEvents = "none";
    audioWrapper.style.display = "none";

    timeline.elem.eventContent.style.opacity = 0;
  },



  /**
   * hideText
   *   Selects <p> with id='p' from the DOM and changes the opacity of the text
   *   so that it is no longer visible. **DOESN'T DELETE THE INNER HTML OF <p>**
   */
  hideText: function(){
    var eventText = timeline.elem.eventText;

    if(eventText){
      eventText.style.opacity = 0;  //makes text element not visible
      timeline.deleteYearText();
    }
  },



  /**
   * makeYearText
   *   When a circle is scrolled into view this function displays the year of that
   *   event within the viewer
   *
   * @param {number} pos - Position of circle element in the circle array that is within the bounds of the viewer svg
   */
  makeYearText: function(pos){
    var data = timeline.data;
    var viewerHeight = timeline.viewer.height;
    var viewerWidth = timeline.viewer.width;
    var yearText = d3.select(".viewer-svg").selectAll("text")
      .data([data[pos]]);

    yearText.text(function(d){return new Date(d.date).getYear() + 1900;});  //necessary to keep date updated

    //D3, gets year text of event and displays in viewer
    yearText.enter()
      .append("text")
        .attr("x", viewerWidth / 10)
        .attr("y", viewerHeight - (viewerHeight / 4))
        .attr("fill", "white")
        .style("font-size", (viewerHeight - (viewerHeight / 8)) + "px")
        .style("text-shadow","2px 3px 4px rgba(0,0,0,.5)")
        .text(function(d){return new Date(d.date).getYear() + 1900;});

    //variables defined after text elements are created to help center text in viewer
    var viewerSquare = viewerWidth - (viewerWidth * (1 / 6));
    var viewerTextWidth = parseInt(yearText.style("width"));

    yearText.attr("x", function(){return (viewerSquare - viewerTextWidth) / 2}); //centers text in viewer
  },



  /**
   * deleteYearText
   *   selects text element within the viewer svg and removes it
   */
  deleteYearText: function(){
    d3.select(".viewer-svg")
      .selectAll("text")
        .remove();
  },



  /**
   * onReady
   *   jquery function that waits until the DOM is completed and ready, then
   *   calls function to set up standard buttons and specific timeline buttons,
   *   and then sets jquery setInterval function to call isScrolledIntoView every
   *   250 ms due to momentum scrolling from touch devices.
   */
  onReady: function(){
    $( document ).ready(function(){
        timeline.createTimelineButtons();

        //starts reoccuring, time-delayed function call
        setInterval(function(){
          timeline.isScrolledIntoView();
        }, 250);  //time between reoccuring calls
    });
  },



  /**
   * createTimelineButtons
   *   Creates specific timeline buttons that controls navigation between previous
   *   and next events and adds them to the DOM
   */
  createTimelineButtons: function(){
    var buttonNavWidth = d3.select(".button.nav").style("width"); //button that shows nav, width set by CSS
    var buttonNext = d3.select(".button.next");
    var buttonPrev = d3.select(".button.prev");

    $( ".button img" ).innerWidth(buttonNavWidth); //used to set .png image width until I get properly sized icon images

    buttonPrev.style("height", buttonNavWidth); //sets height to be equal to dynamic width of buttons so that it is a circle
    buttonNext.style("height", buttonNavWidth);

    buttonPrev.on("touchstart", function(){
                                  timeline.goPrevNext(this, 0); //0 for prev
                                })
              .on("touchend",   function(){
                                  d3.select(this).attr("id", null); //returns button element appearance to normal from CSS id applied on 'touchstart'
                                });

    buttonNext.on("touchstart", function(){
                                  timeline.goPrevNext(this, 1); //1 for next
                                })
              .on("touchend",   function(){
                                  d3.select(this).attr("id", null); //returns button element appearance to normal from CSS id applied on 'touchstart'
                                });
  },



  /**
   * goPrevNext
   *   gets the event element that is either directly before or directly after the
   *   bounds of the viewer element (with goWhere) and scrolls to this point using
   *   jquery.
   *
   * @param {element} button - The button that was pressed
   * @param {number} direction - The direction you want to move, based on button pushed (0 for prev, 1 for next)
   */
  goPrevNext: function(button, direction){
    var height = timeline.meas.height;
    var elementCenter = timeline.goWhere(direction); //determines which element to scroll to with 'goWhere'

    d3.select(button).attr("id", "active");
    $( 'html, body' ).animate({scrollTop: elementCenter - height/2}, 500); //jquery scrolls to center of event element
    //document.body.scrollTop = elementCenter - height/2; //without jquery, but no animation
  },



  /**
   * goWhere
   *   Loops through circle elements and returns an element the 'goPrevNext' uses
   *   to scroll to that element. If statements compare center y coordinates of
   *   circle elements to the top or bottom edge of the viewer object to determine
   *   which elements to return.
   *
   * @param {number} direction - The direction you want to move, based on button pushed (0 for prev, 1 for next)
   */
  goWhere: function(direction){
    var circleCY = timeline.meas.circleCY;
    var circles = timeline.elem.circles;
    var viewerBottom = timeline.viewer.bottom;
    var viewerTop = timeline.viewer.top;
    var scrollTop = d3.round(window.scrollY + viewerTop); //$( "body" ).scrollTop() + viewerTop);
    var scrollBottom = d3.round(window.scrollY + viewerBottom); //$( "body" ).scrollTop() + viewerBottom);

    for(var i = 0; i < circles[0].length; i++){
      var element = circles[0][i];
      var elementCenter = circleCY[i];

      //if direction is 'prev' (0), not the first element, and there is an element center greater than the top viewer measurement
      if(direction === 0 && i > 0 && elementCenter >= scrollTop){
        --i; //decrements counter
        elementCenter = circleCY[i];  //resets element center to previous circle
        return elementCenter; //returns center y measurement of previous circle

      //if direction is 'next' (1)
      }else{

        //if there is a circle past the bottom of the viewer
        if(elementCenter >= scrollBottom){
          return elementCenter; //returns that element

        //if gone through all the elements
        }else if(i == circles[0].length -1){
          return elementCenter;// return last circle element center (stay on last event in timeline)
        }
      }
    }
  },



  //local data object, update to add or subtract events from the timeline
  data : [
    {
      "description":"Mark Ellingson, President of the Rochester Athenaeum & Mechanics Institute (RAMI) takes over the Empire State School of Printing located in Ithaca, New York, and it becomes a two-year program.",
      "date":"1/1/1937",
      content: {
        "image":"cias.jpg"
      }
    },

    {
      "description":"20 freshman enroll in the program with the first major printing project by the department being the student newspaper, PSIMAR.",
      "date":"1/1/1938",
      content: {
        "audio":"horse.ogg"
      }
    },

    {
      "description":"Students take over the editorial page of the Democrat and Chronicle for one issue.",
      "date":"1/1/1939",
      "pic":"cias.jpg"
    },

    {
      "description":"Rochester Athenaeum & Mechanics Institute becomes Rochester Institute of Technology.",
      "date":"1/1/1944",
      "pic":"cias.jpg"
    },

    {
      "description":"SPM moves into Clark Building with enrollment dramatically increasing to 136 due to the end of WWII.",
      "date":"1/1/1946",
      "pic":"cias.jpg"
    },

    {
      "description":"First 4-color illustration appears in Student Publication, Rochester Institute of Technology (SPRIT)",
      "date":"1/1/1947",
      "pic":"cias.jpg"
    },

    {
      "description":"RIT and the Lithographic Technical Foundation sponsor a Web Offset Conference and propose a new web press purchase for the school. Gannett Company donates a Teletypesetter system to the School of Printing.",
      "date":"1/1/1948",
      "pic":"cias.jpg"
    },

    {
      "description":"SPRIT changes its name to RIT Reporter.",
      "date":"1/1/1951",
      "pic":"cias.jpg"
    },

    {
      "description":"One-third of seniors major in offset lithography; two-thirds major in letterpress printing. Frank Gannett is presented the prestigious Founders Award for his service to the Institute.",
      "date":"1/1/1952",
      "pic":"cias.jpg"
    },

    {
      "description":"Ellen Eggleton becomes the first woman to receive an Associate of Applied from the School of Printing.",
      "date":"1/1/1953",
      "pic":"cias.jpg"
    },

    {
      "description":"Printing students Carl Nelson and Arthur Borock convince the Athletic Board to adopt the tiger emblem to represent RIT sports.",
      "date":"1/1/1955",
      "pic":"cias.jpg"
    },

    {
      "description":"A section of the Hand Composition Laboratory is dedicated in memoriam to prominent typography, Frederic W. Goudy.",
      "date":"1/1/1961",
      "pic":"cias.jpg"
    },

    {
      "description":"Flexography and gravure printing become part of the curriculum.",
      "date":"1/1/1965",
      "pic":"cias.jpg"
    },

    {
      "description":"New Goss C-38 publication press is installed on the campus.",
      "date":"1/1/1967",
      "pic":"cias.jpg"
    },

    {
      "description":"Melbert B. Cary Jr., Graphic Arts Collection is donated, housing historical and current examples of “fine” printing.",
      "date":"1/1/1969",
      "pic":"cias.jpg"
    },

    {
      "description":"250 freshman enter the program making the total number enrolled an impressive 661 students. MBO folding machine for bindery is donated. Now all major printing processes are represented with up-to-date equipment.",
      "date":"1/1/1977",
      "pic":"cias.jpg"
    },

    {
      "description":"150th Anniversary of RIT",
      "date":"1/1/1978",
      "pic":"cias.jpg"
    },

    {
      "description":"Renovation and rededication of the Cary Graphic Arts Collection is finished.",
      "date":"1/1/1979",
      "pic":"cias.jpg"
    },

    {
      "description":"Labs are updated with $4.2 million in computer equipment.",
      "date":"1/1/1982",
      "pic":"cias.jpg"
    },

    {
      "description":"A SCR-40 Scanning densitometer, a Linotype/Paul scanner, and a Compugraphics typesetter are donated.",
      "date":"1/1/1983",
      "pic":"cias.jpg"
    },

    {
      "description":"Cary Library no longer has a “look but don’t touch” policy and is open for use.",
      "date":"1/1/1984",
      "pic":"cias.jpg"
    },

    {
      "description":"The newspaper production lab that supported the degree program, News Paper Operations Management, begins using a digital page layout system.",
      "date":"1/1/1996",
      "pic":"cias.jpg"
    },

    {
      "description":"New Media courses are first offered as part of SPM curriculum.",
      "date":"1/1/1997",
      "pic":"cias.jpg"
    },

    {
      "description":"The Digital Publishing Center is established, printing student work at RIT.",
      "date":"1/1/1998",
      "pic":"cias.jpg"
    },

    {
      "description":"RIT is selected by the Alfred P. Sloan Foundation to become one of twenty-six Sloan Industry Centers. This center is dedicated to studying major business environment influences in the printing industry.",
      "date":"1/1/2001",
      "pic":"cias.jpg"
    },

    {
      "description":"The Printing Applications Lab at RIT is donated a Sunday 2000 press.",
      "date":"1/1/2005",
      "pic":"cias.jpg"
    },

    {
      "description":"Open Publishing Lab is founded, researching new methods of content creation and developing open source applications for publishing across various media.",
      "date":"1/1/2007",
      "pic":"cias.jpg"
    },

    {
      "description":"75th Anniversary of the School of Print Media.",
      "date":"1/1/2012",
      "pic":"cias.jpg"
    }
  ]
}//end timeline object*******************
