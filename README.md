# enhanced-tilt.js

A smooth 3D tilt JavaScript library forked from [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js/)

### Main Features

------

- Reacts with touch events.

- Reacts with device orientation events.

### Usage

------

```html
<body>
<div class="your-element" data-tilt></div>

<!-- at the end of the body -->
<script type="text/javascript" src="enhanced-tilt.js"></script>
</body>
```

### Options

------

```js
{
    reverse:           false,  // reverse the tilt direction
    max:               35,     // max tilt rotation (degrees)
    perspective:       1000,   // Transform perspective, the lower the more extreme the tilt gets.
    scale:             1,      // 2 = 200%, 1.5 = 150%, etc..
    speed:             300,    // Speed of the enter/exit transition
    transition:        true,   // Set a transition on enter/exit.
    axis:              null,   // What axis should be disabled. Can be X or Y.
    reset:             true    // If the tilt effect has to be reset on exit.
    easing:            "cubic-bezier(.03,.98,.52,.99)",    // Easing on enter/exit.
    glare:             false   // if it should have a "glare" effect
    "max-glare":       1,      // the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
    "glare-prerender": false   // false = EnhancedTilt creates the glare elements for you, otherwise
                               // you need to add .js-tilt-glare>.js-tilt-glare-inner by yourself
}
```

### Events

------

```js
const element = document.querySelector(".js-tilt");
EnhancedTilt.init(element);
element.addEventListener("tiltChange", callback);
```

### Methods

------

```js
const element = document.querySelector(".js-tilt");
EnhancedTilt.init(element);

// Destroy instance
element.enhancedTilt.destroy();

// Get values of instance
element.enhancedTilt.getValues();

// Reset instance
element.enhancedTilt.reset();
```

### Known Bugs

------

- It's always listening for movement and can cause some performance issues, also tilts the elements that aren't visible on the viewport (Fix in progress).
- Sometimes doesn't response to touch events.

### Credits

------

Forked from: [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js/)

Creator of the version I've used for this fork: [Șandor Sergiu](https://github.com/micku7zu)

Original library: [Tilt.js](http://gijsroge.github.io/tilt.js/)

Original library author: [Gijs Rogé](https://twitter.com/GijsRoge)

### License

------

MIT License
