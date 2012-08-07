

//get a reference to the canvas
var ctx;
var x = 100;
var y = 100;
var dx = 2;
var dy = 4;
var WIDTH;
var HEIGHT;

//var rightDown = false;
//var leftDown = false;

var canvasMinX;
var canvasMaxX;

var bricks;
var NROWS;
var NCOLS;
var BRICKWIDTH;
var BRICKHEIGHT;
var PADDING;

var ballr = 10;
var rowcolors = ["#FF1C0A", "#FFFD0A", "#00A308", "#0008DB", "#EB0093"];
var paddlecolor = "#FFFFFF";
var ballcolor = "#FFFFFF";
var backcolor = "#000000"; 

var paddlex;
var paddleh;
var paddlew;

var hitAudioPath = "/android_asset/www/audio/toneE.mp3";

var isStart = false;
var isPaused = false;
var gameStopped = false;
var hasWon = false;

var numWins = 0;
var numLoses = 0;

//http://paulirish.com/2011/requestanimationframe-for-smart-animating/
//http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

//requestAnimationFrame polyfill by Erik Möller
//fixes from Paul Irish and Tino Zijdel

//shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	   window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	   window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
	                              || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
	   window.requestAnimationFrame = function(callback, element) {
	       var currTime = new Date().getTime();
	       var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	       var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
	         timeToCall);
	       lastTime = currTime + timeToCall;
	       return id;
	   };
	
	if (!window.cancelAnimationFrame)
	   window.cancelAnimationFrame = function(id) {
	       clearTimeout(id);
	   };
}());


function init(){
	//canvas context
	ctx = $('#canvas')[0].getContext("2d");
	
	// width height of canvas
	WIDTH = $('#canvas').width();
	HEIGHT = $('#canvas').height();
	
	document.addEventListener("deviceready", onDeviceReady, false);
	
	paddleInstance();
	//animate();
	mouseSetup();
	createBricks();
	
	initialDisplayStatus();
	
	isStart = true;
	draw();
	
}
init();

function onDeviceReady(){
	logger("onDeviceReady Fired");
	document.removeEventListener("deviceready", onDeviceReady, false);
	
	document.addEventListener("pause", onPause, false);
}

function onPause(){
	logger("onPause Fired");
	isPaused = true;
	stopGame();
}

// event handlers
function animate() {
	
	if(!gameStopped){
		requestAnimationFrame( animate );
	    isStart = false;
	    draw();
	}else{
		logger("animate() gameStopped = true");
	}
   
}

function mouseSetup() {
	canvasMinX = $("#canvas").offset().left;
	canvasMaxX = canvasMinX + WIDTH;
  
	// event handlers
	// touch event - move
	document.addEventListener('touchmove', onMouseDrag);
	$(document).mousemove(onMouseMove);
	
	// mousemove alt
	$(document).mouseup(onMouseUp);

}

function onMouseMove(evt) {
  if (evt.pageX > canvasMinX && evt.pageX < canvasMaxX) {
    paddlex = evt.pageX - canvasMinX - 40;
  }
}

function onMouseUp(evt){
	x = 100;
	y = 100;
	dx = 2;
	dy = 4;
	
	gameStopped = false;
	
	animate();
	
	//$(document).mouseup(null);
	//console.log("onMouseUp");
	
}

function onMouseDrag(evt) {
 event.preventDefault();
 var touch = event.touches[0];
	    
  if (touch.pageX > canvasMinX && touch.pageX < canvasMaxX) {
    paddlex = touch.pageX - canvasMinX - 40;
  }
  
  //logger("touch.pageX " + touch.pageX + " touch.pageX " + touch.pageX);
}

function draw() {
  
  if(gameStopped) return;
	
  ctx.clearRect(0,0, WIDTH, HEIGHT);
  rect(0, 0, WIDTH, HEIGHT, '#000');
  
  if(!isStart){	  
	 ctx.fillStyle = ballcolor;	
	 circle(x, y, 10, ballcolor);
  }else{
	 rect(WIDTH/2 - 50, HEIGHT/2 - 12, 100, 25, '#ffffff');
	 createText(WIDTH/2 - 50 + 35, HEIGHT/2 - 12 + 18, "Start", '#000', "12px arial"); 
  }
  
  //move the paddle if left or right is currently pressed
  //if (rightDown) paddlex += 5;
  //else if (leftDown) paddlex -= 5;
  
  ctx.fillStyle = paddlecolor;
  rect(paddlex, HEIGHT - paddleh, paddlew, paddleh, paddlecolor);
  
  //draw bricks
  var allBricksClearedOut = true;
  
  for (i=0; i < NROWS; i++) {
    for (j=0; j < NCOLS; j++) {
      if (bricks[i][j] == 1) {
        rect((j * (BRICKWIDTH + PADDING)) + PADDING, 
             (i * (BRICKHEIGHT + PADDING)) + PADDING,
             BRICKWIDTH, BRICKHEIGHT, rowcolors[i]);
        allBricksClearedOut = false;
      }
    }
  }
  
  if(allBricksClearedOut){ 
	  x = 100;
	  y = 100;
	  hasWon = true;
	  stopGame();
  }
  
  //Math.round( Math.random() * rowcolors.length )
  
  //want to learn about real collision detection? go read
  // http://www.harveycartel.org/metanet/tutorials/tutorialA.html	
  //have we hit a brick?
  rowheight = BRICKHEIGHT + PADDING;
  colwidth = BRICKWIDTH + PADDING;
  row = Math.floor(y/rowheight);
  col = Math.floor(x/colwidth);
  
  //if so, reverse the ball and mark the brick as broken
  if (y < NROWS * rowheight && row >= 0 && col >= 0 && bricks[row][col] == 1) {
    dy = -dy;
    bricks[row][col] = 0;
    playAudio(hitAudioPath);
  }
 
  if( x + dx > WIDTH || x + dx < 0 ) dx = -dx;
  
  if( y + dy < 0 ) {
  	dy = -dy;
  }else if(y + dy > HEIGHT){
  	if (x > paddlex && x < paddlex + paddlew){
  		//move the ball differently based on where it hit the paddle
      	dx = 8 * ((x-(paddlex+paddlew/2))/paddlew);
  		dy = -dy;	
  	}else if (y + dy + ballr > HEIGHT){
  		if(!gameStopped) { 
  			hasWon = false;
  			stopGame();
  		}
  	}
  }
  	
  x += dx;
  y += dy;  
 
}

function stopGame(){
	if(!isPaused) {
		displayStatus();
	}
	
	isPaused = false;
	gameStopped = true;
	cancelAnimationFrame;
	requestAnimationFrame( function(){} );
	isStart = true;
	
	rect(WIDTH/2 - 50, HEIGHT/2 - 12, 100, 25, '#ffffff');
	createText(WIDTH/2 - 50 + 35, HEIGHT/2 - 12 + 18, "Start", '#000', "12px arial");
	
	// setup
	paddleInstance();
	createBricks();
}

function paddleInstance(){
	paddlex = WIDTH / 2;
	paddleh = 10;
	paddlew = 75;
}

function createBricks() {
  NROWS = 5;
  NCOLS = 5;
  BRICKWIDTH = (WIDTH/NCOLS) - 1;
  BRICKHEIGHT = 15;
  PADDING = 1;

  bricks = new Array(NROWS);
  for (i=0; i < NROWS; i++) {
    bricks[i] = new Array(NCOLS);
    for (j=0; j < NCOLS; j++) {
      bricks[i][j] = 1;
    }
  }
}

function displayStatus(){
	if(hasWon){
		numWins = Number(numWins) + 1;
		window.localStorage.setItem("breakout_wins", numWins);
	}else{
		numLoses = Number(numLoses) + 1;
		window.localStorage.setItem("breakout_loses", numLoses);
		if(navigator) navigator.notification.vibrate(1000);
	}
	$('#status').text("Wins: " + numWins + " - Loses: " + numLoses);
}

function initialDisplayStatus(){
	//window.localStorage.clear();
	numWins = window.localStorage.getItem("breakout_wins");
	numLoses = window.localStorage.getItem("breakout_loses");
	if(!numWins){
		numWins = 0;
	}
	if(!numLoses ){
		numLoses = 0;
	}
	$('#status').text("Wins: " + numWins + " - Loses: " + numLoses);
}


// utility methods
function logger(message){
	if(console){
		console.log(message);
	}
}

function circle(x,y,r,color){
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
}

function rect(x,y,w,h,color){
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.rect(x,y,w,h);
	ctx.closePath();
	ctx.fill();
}

function createText(x, y, textString, color, font){
	ctx.fillStyle = color;
	ctx.font = font;
	ctx.fillText(textString, x, y);
}

//Play audio
function playAudio(url) {
    try{
		// Play the audio file at url
	    var my_media = new Media(url,
	        // success callback
	        function() {
	            console.log("playAudio():Audio Success");
	        },
	        // error callback
	        function(err) {
	            console.log("playAudio():Audio Error: "+err);
	    });
	
	    // Play audio
	    my_media.play();
    } catch(e){
    	logger(e);
    } 
}

/* 
// examples not used

function createArcCircle(){
	ctx.beginPath();
	ctx.fillStyle = "#00A308";
	//ctx.fillStyle = "rgba(255, 255, 0, .5)"
	ctx.arc(220, 220, 50, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
}

function createArcCircle2(){
	ctx.fillStyle = "#FF1C0A";
	ctx.beginPath();
	ctx.arc(100, 100, 100, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
}

function createSquare(){
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.rect(10,10,10,10);
	ctx.closePath();
	ctx.fill();
}

function transparentRectangle(){
	//the rectangle is half transparent
	ctx.fillStyle = "rgba(255, 255, 0, .5)"
	ctx.beginPath();
	ctx.rect(15, 150, 120, 120);
	ctx.closePath();
	ctx.fill();
}
*/



