/**
 * Image loading tools
 * call loadImage with the uri of an image to have it return an image object
 * set when loaded to a function that will call when all resources are loaded
 * (assuming there are resources)
 */
var neededResources = 0;
var receivedResources = 0;
whenLoaded = function(){};
loadImage = function(src){
    neededResources ++;
    var image = new Image();
    image.onload = function(){
        receivedResources ++;
        if(receivedResources === neededResources){
            whenLoaded();
        }
    }
    image.src = src;
    return image;

}
loadSound = function(src){
    neededResources ++;
    var sound = new Audio(src);
    sound.canplaythrough = function(){
        receivedResources ++;
                if(receivedResources === neededResources){
                    whenLoaded();
                }
    }
    return sound;
}
/**
 * A helper tool for "canvas.Text"
 * Cast any text decorations (italics, underline, etc.) as additional arguments
 * Can be replaced in canvas.Text with anything that implements "getText()"
 */
Font = function(family, size){
    this.family = family;
    this.size = size;
    this.decoration = [];
    for(var i = 2; i<arguments.length; i++){
        this.decoration.push(arguments[i]);
    }
    this.getText = function(){
        var out = this.size + " " + this.family;
        for(var i = 2; i<this.decoration.length; i++){
            out = this.decoration[i] + " " + out;
        }
        return out;
    }
}

/**
 * For defaulting optional parameters
 */
set = function(wantedArgument, defaultArgument){
    if(typeof(wantedArgument) === "undefined")return defaultArgument;
    return wantedArgument;
}
running = [];
loop = {
    /**
     * The amount of redraws and mainloops that will happen in a second for any running canvas
     */
    FPS: 60,
    run: function(){
        console.log("indefinete");
        for(var i = 0; i<running.length; i++){
            running[i].run();
        }
    },
    addRunning: function(runnable){
        running.push(runnable)
        if(running.length === 1){
            this.interval = setInterval(function(){
                        for(var i = 0; i<running.length; i++){
                            running[i].run();
                        }
                    },
                     1000/this.FPS);
        };
    },
    removeRunning: function(runnable){
        for(var i = 0; i<running.length; i++){
            if(running[i] === runnable){
                running.splice(i, 1);
                break;
            }
        }
        console.log(running, running.length);
        if(running.length === 0){
            clearInterval(this.interval);
        }
    },

}
canvas = {

    /**
     * Create an object to represent an html canvas
     * Canvas.start() begins the loop, causing rendering of elements and mainloop to run
     * Canvas.end() stops it after the current iteration
     * To add a drawn object besides those implemented here, give your object a draw method, and add the object
     * to your canvases "elements" array
     */
    Canvas: function(id){
        this.id = id;
        this.canvas = document.getElementById(id);
        this.context = document.getElementById(id).getContext("2d");
        this.backgroundColor = null;
        this.elements = [];
        this.looping = false;
        this.fps = 24;
        this.mainloop = function(){};
        this.end = function(){
            if(!this.looping)return;
            this.looping = false;
            loop.removeRunning(this);
        };
        this.run = function(){
            this.mainloop();
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if(this.backgroundColor !== null){
                this.context.beginPath();
                this.context.rect(0, 0, this.canvas.width, this.canvas.height);
                this.context.fillStyle = this.backgroundColor;
                this.context.fill();
            }
            for(i = 0;i<this.elements.length;i++){
                this.elements[i].draw();
            };
        }
        this.start = function(){
            if(this.looping)return;
            this.looping = true;
            loop.addRunning(this);
        };
        this.remove = function(element){
            for(var i = 0; i<this.elements.length; i++){
                if(this.elements[i] === element){
                    this.elements.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
    },
    /**
     * The mainCanvas, if specified, is the default canvas for objects drawn on the canvas
     */
    setMainCanvas: function(canvas){
        mainCanvas = canvas
    },

    /**
     * Rectangles are blocks of color drawn on the canvas
     * options is an object with any of: style, borderStyle, and/or borderWidth
     * opts and canvas are optional parameters
     */
    Rectangle: function(x, y, width, height, opts, canvas){
        this.canvas = set(canvas, mainCanvas);
        this.canvas.elements.push(this);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.style = set(opts.style, "black");
        this.borderWidth = set(opts.borderWidth, "1");
        this.borderStyle = set(opts.borderStyle, "white");
        this.specialRender = function(){};
        this.draw = function(){
            var context = this.canvas.context;
            context.beginPath()
            context.rect(this.x, this.y, this.width, this.height);
            context.fillStyle = this.style;
            context.fill();
            context.lineWidth = this.borderWidth;
            context.strokeStyle = this.borderStyle;
            context.stroke();
            this.specialRender()
        };
        this.shift = function(deltX, deltY){
            this.x +=deltX;
            this.y +=deltY;
        };
        this.expand = function(deltWidth, deltHeight){
            this.width += deltWidth;
            this.height += deltHeight;
        };
        this.evenExpand = function(deltWidth, deltHeight){
            this.shift(deltWidth/2, deltHeight/2);
            this.expand(deltWidth/2, deltHeight/2);

        };
    },


    /**
     * For loading images of external formats (jpg, png, etc.) on the canvas.
     * "image" can either be a string, which will load a new image from that
     * location, or a image which has been loaded independently
     */
    Image: function(x, y, image, canvas){
        this.canvas = set(canvas, mainCanvas);
        this.canvas.elements.push(this);
        this.x = x;
        this.y = y;
        if(typeof(image) === typeof(""))this.image = loadImage(image);
        else this.image = image;
        this.draw = function(){
            this.canvas.context.drawImage(this.image, this.x, this.y, set(this.width, this.image.width), set(this.height, this.image.height));
        };
        this.shift = function(deltX, deltY){
            this.x += deltX;
            this.y += deltY;
        }
        this.proportionalSize = function(p){
            this.height = this.image.height * p;
            this.width = this.image.width * p;
        }
        this.proportionalWidth = function(width){
            p = width / this.image.width;
            this.proportionalSize(p);
        }
        this.proportionalHeight = function(height){
            p = height / this.image.height;
            this.proportionalSize(p);
        }
    },

    /**
     * Text, with the bottom left at (x, y)
     * font is a Font object, or anything with a "getText()" method
     * color, font, and canvas are optional
     */
    Text: function(x, y, startText, color, textAlign, font, canvas){
        this.canvas = set(canvas, mainCanvas);
        this.canvas.elements.push(this);
        this.x = x;
        this.y = y;
        this.text = set(startText, "");
        this.color = set(color, "black");
        this.textAlign = set(textAlign, "left");
        this.font = set(font, new Font("sans-serif", "20px"));
        this.draw = function(){
            var context = this.canvas.context;
            context.fillStyle = this.color;
            context.font = this.font.getText();
            context.textAlign = this.textAlign;
            context.fillText(this.text, this.x, this.y);
        }
        this.shift = function(deltX, deltY){
            this.x += deltX;
            this.y += deltY;
        }
    },

    NumText: function(x, y, startText, num, color, font, canvas){
        this.canvas = set(canvas, mainCanvas);
        this.canvas.elements.push(this);
        this.x = x;
        this.y = y;
        this.text = set(startText, "");
        this.num = set(num, 0);
        this.color = set(color, "black");
        this.font = set(font, new Font("sans-serif", "20px"));
        this.draw = function(){
            var context = this.canvas.context;
            context.fillStyle = this.color;
            context.font = this.font.getText();
            context.fillText(this.text+this.num, this.x, this.y);
        }
        this.shift = function(deltX, deltY){
            this.x += deltX;
            this.y += deltY;
        }
    },
}


input = {
    //keyCodes are numbers of keys
    keyCodes: {},

    //keys are names of keys
    keys: {},

    //true if any key on the keyboard (which creates a key event) is being pressed
    anyKey: false,

    //store mouse states: {state: /*whether the left click is pressed (boolean)*/,
    mouse: {},              //x:, y: /*the position of the pointer on the window, undefined if off the window*/}
    
    //stores the x and y of the touch on the window. undefined if not touching
    //also has started, for if touch is down
    touch: {},
    
    text: 'L',
}


document.addEventListener("keydown", function (e) {
    e = e || window.event;
    input.keys[e.key] = true;
    input.keyCodes[e.keyCode] = true;
    input.anyKey = true;
});
document.addEventListener("keyup", function(e){
    e = e || window.event;
    input.keys[e.key] = false;
    input.keyCodes[e.keyCode] = false;
    input.anyKey = false;
});
document.addEventListener("mousedown", function (e){
    input.mouse.state = true;
});
document.addEventListener("mouseup", function(e){
    input.mouse.state = false;
});
document.addEventListener("mousemove", function(e){
    e = e || window.event;
    input.mouse.x = e.clientX;
    input.mouse.y = e.clientY;
});
document.addEventListener("mouseout", function(e){
    delete input.mouse.x;
    delete input.mouse.y;
});
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, false);

// helpers
var $ = document.querySelector.bind(document),
    $$ = document.querySelectorAll.bind(document),
    getPointerEvent = function(event) {
        return event.targetTouches ? event.targetTouches[0] : event;
    },
   
    setListener = function (elm,events,callback) {
        var eventsArray = events.split(' '),
            i = eventsArray.length;
        while(i--){
            elm.addEventListener( eventsArray[i], callback, false );
        }
    };

var touchStarted = false, // detect if a touch event is sarted
    currX = 0,
    currY = 0,
    cachedX = 0,
    cachedY = 0;

//setting the events listeners
setListener(document,'touchstart mousedown',function (e){
    e.preventDefault();
    var pointer = getPointerEvent(e);
    // caching the current x
    cachedX = currX = pointer.pageX;
    // caching the current y
    cachedY = currY = pointer.pageY;
    // a touch event is detected      
    touchStarted = true;
    input.touch.started = touchStarted;
    // detecting if after 200ms the finger is still in the same position
    setTimeout(function (){
        if ((cachedX === currX) && !touchStarted && (cachedY === currY)) {
            // Here you get the Tap event
        }
    },200);
});
setListener(document,'touchend mouseup touchcancel',function (e){
    e.preventDefault();
    // here we can consider finished the touch event
    touchStarted = false;
    input.touch.started = touchStarted;

});
setListener(document,'touchmove mousemove',function (e){
    e.preventDefault();
    var pointer = getPointerEvent(e);
    currX = pointer.pageX;
    currY = pointer.pageY;
    input.touch.x = currX;
    input.touch.y = currY;
    if(touchStarted) {
         // here you are swiping

    }
   
});


