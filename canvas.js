/**
 * Sound and Image loader 
 * Will run callback whence the final resource loads
 * To add an image to be loaded, pass it's URI to the loadImage method
 * Same for Sounds with loadSound
 */
var Load = function(callback){
    this.callback = callback;
};
Load.prototype = {
    neededResources: 0,
    receivedResources: 0,
    loadImage: function(src){
        this.neededResources ++;
        var image = new Image();
        image.onload = function(){
            this.receivedResources ++;
            if(this.receivedResources === this.neededResources){
                this.callback();
            };
        };
        image.src = src;
        return image;
    },
    loadSound: function(src){
        this.neededResources ++;
        var sound = new Audio(src);
        sound.canplaythrough = function(){
            receivedResources ++;
            if(this.receivedResources === this.neededResources){
                this.callback();
            };
        };
        return sound;
    },
};
/**
 * A helper tool for "canvas.Text"
 * Cast any text decorations (italics, underline, etc.) as additional arguments
 * Can be replaced in canvas.Text with anything that implements "getText()"
 */
var Font = function(family, size){
    this.family = family;
    this.size = size;
    this.decoration = [];
    for(var i = 2; i<arguments.length; i++){
        this.decoration.push(arguments[i]);
    }
};
Font.prototype = {
    getText: function(){
        var out = this.size + " " + this.family;
        for(var i = 2; i<this.decoration.length; i++){
            out = this.decoration[i] + " " + out;
        }
        return out;
    }
};

/**
 * For defaulting optional parameters
 */
var set = function(wantedArgument, defaultArgument){
    if(typeof(wantedArgument) === "undefined")return defaultArgument;
    return wantedArgument;
}


var Mouse = function(id){
    this.elem = document.getElementById(id);
    var obj = this;
    this.elem.addEventListener("mousedown", function (e){
        obj.state = true;
    });
    this.elem.addEventListener("mouseup", function(e){
        obj.state = false;
    });
    this.elem.addEventListener("mousemove", function(e){
        e = e || window.event;
        obj.x = e.clientX;
        obj.y = e.clientY;
    });
    this.elem.addEventListener("mouseout", function(e){
        delete obj.x;
        delete obj.y;
    });
};

var DT = function(meanTime){
    this.meanTime = set(meanTime, 30);
};
DT.prototype = {
    fpsList: [],
    refresh: function(){
        var last = this.last;
        this.last = new Date().getTime();
        this.dt = this.last - last;
        this.fps = 1000 / this.dt;
        this.fpsList.unshift(this.fps);
        this.fpsList.splice(this.meanTime);
        this.fpsMean = 0;
        var amount = 0;
        for(var i = 0; i<this.fpsList.length; i++){
            if(this.fpsList[i] && this.fpsList[i] != 1/0){
                this.fpsMean += this.fpsList[i];
                amount ++;
            };
        }
        this.fpsMean /= amount;
    },
    
}

/**
 * Create an object to represent an html canvas
 * Canvas.start() begins the loop, causing rendering of elements and mainloop to run
 * Canvas.end() stops it after the current iteration
 * To add a drawn object besides those implemented here, give your object a draw method, and add the object
 * to your canvases "elements" array
 */
var Canvas = function(id){
    this.id = id;
    this.canvas = document.getElementById(id);
    this.context = document.getElementById(id).getContext("2d");
    this.mouse = new Mouse(id);
};
Canvas.prototype = {
    backgroundColor: null,
    elements: [],
    looping: false,
    mainloop: function(){},
    fps: 100,
    end: function(){
        if(!this.looping)return;
        this.looping = false;
        loop.removeRunning(this);
    },
    run: function(){
        this.dt.refresh();
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
    },
    start: function(){
        if(this.looping)return;
        this.looping = true;
        var obj = this
        //loop.addRunning(this);
        this.dt = new DT(1000);
        this.interval = setInterval(function(){
                obj.run();
            }, 1000/this.fps);
    },
    remove: function(element){
        for(var i = 0; i<this.elements.length; i++){
            if(this.elements[i] === element){
                this.elements.splice(i, 1);
                return true;
            }
        }
        return false;
    },
};
/**
 * The mainCanvas, if specified, is the default canvas for objects drawn on the canvas
 */
var setMainCanvas = function(canvas){
    mainCanvas = canvas
},

/**
 * Rectangles are blocks of color drawn on the canvas
 * options is an object with any of: style, borderStyle, and/or borderWidth
 * opts and canvas are optional parameters
 */
Rectangle = function(x, y, width, height, opts, canvas){
    this.canvas = set(canvas, mainCanvas);
    this.canvas.elements.push(this);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.style = set(opts.style, "black");
    this.borderWidth = set(opts.borderWidth, "1");
    this.borderStyle = set(opts.borderStyle, "white");
};
Rectangle.prototype = {
    draw: function(){
        var context = this.canvas.context;
        context.beginPath()
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = this.style;
        context.fill();
        context.lineWidth = this.borderWidth;
        context.strokeStyle = this.borderStyle;
        context.stroke();
    },
    shift: function(deltX, deltY){
        this.x +=deltX;
        this.y +=deltY;
    },
    expand: function(deltWidth, deltHeight){
        this.width += deltWidth;
        this.height += deltHeight;
    },
    evenExpand: function(deltWidth, deltHeight){
        this.shift(deltWidth/2, deltHeight/2);
        this.expand(deltWidth/2, deltHeight/2);

    },
};


/**
 * For loading images of external formats (jpg, png, etc.) on the canvas.
 * "image" can either be a string, which will load a new image from that
 * location, or a image which has been loaded independently
 */
var Image = function(x, y, image, canvas){
    this.canvas = set(canvas, mainCanvas);
    this.canvas.elements.push(this);
    this.x = x;
    this.y = y;
    if(typeof(image) === typeof(""))this.image = loadImage(image);
    else this.image = image;
};
Image.prototype = {
    draw: function(){
        this.canvas.context.drawImage(this.image, this.x, this.y, set(this.width, this.image.width), set(this.height, this.image.height));
    },
    shift: function(deltX, deltY){
        this.x += deltX;
        this.y += deltY;
    },
    proportionalSize: function(p){
        this.height = this.image.height * p;
        this.width = this.image.width * p;
    },
    proportionalWidth: function(width){
        p = width / this.image.width;
        this.proportionalSize(p);
    },
    proportionalHeight: function(height){
        p = height / this.image.height;
        this.proportionalSize(p);
    },
};

/**
 * Text, with the bottom (textAlign) at (x, y)
 * font is a Font object, or anything with a "getText()" method
 * color, font, and canvas are optional
 */
var Text = function(x, y, startText, color, textAlign, font, canvas){
    this.canvas = set(canvas, mainCanvas);
    this.canvas.elements.push(this);
    this.x = x;
    this.y = y;
    this.text = set(startText, "");
    this.color = set(color, "black");
    this.textAlign = set(textAlign, "left");
    this.font = set(font, new Font("sans-serif", "20px"));
};
Text.prototype = {
    draw: function(){
        var context = this.canvas.context;
        context.fillStyle = this.color;
        context.font = this.font.getText();
        context.textAlign = this.textAlign;
        context.fillText(this.text, this.x, this.y);
    },
    shift: function(deltX, deltY){
        this.x += deltX;
        this.y += deltY;
    },
};

var NumText = function(x, y, startText, num, color, textAlign, font, canvas){
    this.num = set(num, 0);
    this.base = set(startText, "");
    Text.call(this, x, y, this.base+this.num, color, textAlign, font, canvas)
};
NumText.prototype = {
    draw: function(){
        this.text = this.base+this.num;
        Text.prototype.draw.call(this);
    },
};



//For discerning a key name based on a number
var keyMap = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Esc",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "Left",
    38: "Up",
    39: "Right",
    40: "Down",
    44: "F13",
    46: "Del",
    49: "1",
    50: "2", 
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9",
    59: ";",
    61: "=",
    65: "a",
    66: "b",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    71: "g",
    72: "h",
    73: "i",
    74: "j",
    75: "k",
    76: "l",
    77: "m",
    78: "n",
    79: "o",
    80: "p",
    81: "q",
    82: "r",
    83: "s",
    84: "t",
    85: "u",
    86: "v",
    87: "w",
    88: "x",
    89: "y",
    90: "z",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    224: "Meta",
};



var keyCodes = {},
    keys = {};

document.addEventListener("keydown", function (e) {
    e = e || window.event;
    keyCodes[e.keyCode] = true;
    if(e.key){
        keys[e.key] = true;
    }else{
        keys[keyMap[e.keyCode]] = true;
    }
});
document.addEventListener("keyup", function(e){
    e = e || window.event;
    keyCodes[e.keyCode] = false;
    if(e.key){
        keys[e.key] = false;
    }else{
        keys[keyMap[e.keyCode]] = false;
    }
});

if(false){
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
}


canvas = {
    Canvas: Canvas,
    setMainCanvas: setMainCanvas,
    Rectangle: Rectangle,
    Text: Text,
    NumText: NumText,
    Load: Load,
    Font: Font,
    DT: DT,
    keys: keys,
    keyCodes: keyCodes,
};
