/**
 * Created by Leonel Alexander Vieyra (leonelv) on 21/06/2018.
 * Forked from:
 * Original idea: https://github.com/gijsroge/tilt.js
 *
 * MIT License.
 *
 * Version 1.0.2
 */

/*
TODO:
  * fix performance issues (workarround: detect if the element it's on the viewport)
*/

function map(x, in_min, in_max, out_min, out_max) {
  return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

export default class EnhancedTilt {
  constructor(element, settings = {}) {
    if (!(element instanceof Node)) {
      throw "Can't initialize EnhancedTilt because " +
        element +
        ' is not a Node.';
    }

    this.width = null;
    this.height = null;
    this.left = null;
    this.top = null;
    this.transitionTimeout = null;
    this.updateCall = null;
    this.touching = false;
    this.prevState = {
      gamma: 0,
      beta: 0
    };
    this.gamma = 0;
    this.beta = 0;

    this.updateBind = this.update.bind(this);
    this.resetBind = this.reset.bind(this);

    this.element = element;
    this.settings = this.extendSettings(settings);

    this.reverse = this.settings.reverse ? -1 : 1;

    this.glare = this.isSettingTrue(this.settings.glare);
    this.glarePrerender = this.isSettingTrue(this.settings['glare-prerender']);

    if (this.glare) {
      this.prepareGlare();
    }

    this.addEventListeners();
  }

  isSettingTrue(setting) {
    return setting === '' || setting === true || setting === 1;
  }

  addEventListeners() {
    this.onMouseEnterBind = this.onMouseEnter.bind(this);
    this.onMouseMoveBind = this.onMouseMove.bind(this);
    this.onMouseLeaveBind = this.onMouseLeave.bind(this);

    this.onDeviceMoveBind = this.onDeviceMove.bind(this);

    this.onTouchStartBind = this.onTouchStart.bind(this);
    this.onTouchMoveBind = this.onTouchMove.bind(this);
    this.onTouchEndBind = this.onTouchEnd.bind(this);
    this.onWindowResizeBind = this.onWindowResizeBind.bind(this);

    this.element.addEventListener('mouseenter', this.onMouseEnterBind);
    this.element.addEventListener('mousemove', this.onMouseMoveBind);
    this.element.addEventListener('mouseleave', this.onMouseLeaveBind);

    this.element.addEventListener('touchstart', this.onTouchStartBind);
    this.element.addEventListener('touchmove', this.onTouchMoveBind);
    this.element.addEventListener('touchend', this.onTouchEndBind);

    if (this.glare) {
      window.addEventListener('resize', this.onWindowResizeBind);
    }

    if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', this.onDeviceMoveBind);
    }
  }

  removeEventListeners() {
    this.element.removeEventListener('mouseenter', this.onMouseEnterBind);
    this.element.removeEventListener('mousemove', this.onMouseMoveBind);
    this.element.removeEventListener('mouseleave', this.onMouseLeaveBind);
    this.element.removeEventListener('mouseenter', this.onTouchStartBind);
    this.element.removeEventListener('mousemove', this.onTouchMoveBind);
    this.element.removeEventListener('mouseleave', this.onTouchEndBind);

    if (this.glare) {
      window.removeEventListener('resize', this.onWindowResizeBind);
    }
  }

  destroy() {
    clearTimeout(this.transitionTimeout);
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.reset();

    this.removeEventListeners();
    this.element.enhancedTilt = null;
    delete this.element.enhancedTilt;

    this.element = null;
  }

  // mouse events
  onMouseEnter(event) {
    this.updateElementPosition();
    this.element.style.willChange = 'transform';
    this.setTransition();
  }

  onMouseMove(event) {
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }
    this.event = event;
    this.x = event.clientX
    this.y = event.clientY
    this.updateCall = requestAnimationFrame(this.updateBind);
  }

  onMouseLeave(event) {
    this.setTransition();
    if (this.settings.reset) {
      requestAnimationFrame(this.resetBind);
    }
  }

  // touch events
  onTouchStart(event) {
    this.touching = true;
    this.updateElementPosition();
    this.element.style.willChange = 'transform';
    this.setTransition();
  }

  onTouchMove(event) {
    this.touching = true;
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }
    if (this.settings.scroll) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.event = event;
    this.x = event.targetTouches[0].screenX;
    this.y = event.targetTouches[0].screenY;

    this.updateCall = requestAnimationFrame(this.updateBind);
  }

  onTouchEnd(event) {
    this.touching = false;
    this.setTransition();
    if (this.settings.reset) {
      requestAnimationFrame(this.resetBind);
    }
  }

  // movement events
  onDeviceMove(event) {
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.prevState.gamma = this.gamma;
    this.prevState.beta = this.beta;
    this.gamma = event.gamma;
    this.beta = event.beta;
    let gammaDiff = Math.abs(this.prevState.gamma - this.gamma);
    let betaDiff = Math.abs(this.prevState.beta - this.beta);

    if ((gammaDiff > 0 || betaDiff > 0)) {
      this.updateElementPosition();
      this.element.style.willChange = 'transform';
      this.setTransition();
    }

    if (!this.touching && (gammaDiff > .2 || betaDiff > .2)) {
      this.event = event;
      this.x = map((this.gamma = this.gamma < -90 ? 90 : this.gamma), -90, 90, 0, this.width) + this.left;
      this.y = map((this.beta = this.beta < -90 ? 90 : this.beta), -90, 90, 0, this.height) + this.top;
      this.updateCall = requestAnimationFrame(this.updateBind);
    }

    //if ((gammaDiff < 1 || betaDiff < 1)) {
    //  this.setTransition();
    //  if (this.settings.reset) {
    //    requestAnimationFrame(this.resetBind);
    //  }
    //}
  }

  reset() {
    this.event = {
      pageX: this.left + this.width / 2,
      pageY: this.top + this.height / 2
    };

    this.element.style.transform = 'perspective(' + this.settings.perspective + 'px) ' + 'rotateX(0deg) ' + 'rotateY(0deg) ' + 'scale3d(1, 1, 1)';

    if (this.glare) {
      this.glareElement.style.transform = 'rotate(180deg) translate(-50%, -50%)';
      this.glareElement.style.opacity = '0';
    }
  }

  getValues() {
    let x = (this.x - this.left) / this.width;
    let y = (this.y - this.top) / this.height;
    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);
    let tiltX = (this.reverse * (this.settings.max / 2 - x * this.settings.max)).toFixed(2);
    let tiltY = (this.reverse * (y * this.settings.max - this.settings.max / 2)).toFixed(2);
    let angle = Math.atan2(this.x - (this.left + this.width / 2), -(this.y - (this.top + this.height / 2))) * (180 / Math.PI);

    return {
      tiltX: tiltX,
      tiltY: tiltY,
      percentageX: x * 100,
      percentageY: y * 100,
      angle: angle
    };
  }

  updateElementPosition() {
    let rect = this.element.getBoundingClientRect();
    this.width = this.element.offsetWidth;
    this.height = this.element.offsetHeight;
    this.left = rect.left;
    this.top = rect.top;
  }

  update() {
    let values = this.getValues();
    this.element.style.transform = 'perspective(' + this.settings.perspective + 'px) ' + 'rotateX(' + (this.settings.axis === 'x' ? 0 : values.tiltY) + 'deg) ' + 'rotateY(' + (this.settings.axis === 'y' ? 0 : values.tiltX) + 'deg) ' + 'scale3d(' + this.settings.scale + ', ' + this.settings.scale + ', ' + this.settings.scale + ')';
    if (this.glare) {
      this.glareElement.style.transform = `rotate(${values.angle}deg) translate(-50%, -50%)`;
      this.glareElement.style.opacity = `${(values.percentageY *
				this.settings['max-glare']) /
				100}`;
    }

    this.element.dispatchEvent(
      new CustomEvent('tiltChange', {
        detail: values
      })
    );
    this.updateCall = null;
  }

  /**
   * Appends the glare element (if glarePrerender equals false)
   * and sets the default style
   */
  prepareGlare() {
    // If option pre-render is enabled we assume all html/css is present for an optimal glare effect.
    if (!this.glarePrerender) {
      // Create glare element
      const jsTiltGlare = document.createElement('div');
      jsTiltGlare.classList.add('js-tilt-glare');

      const jsTiltGlareInner = document.createElement('div');
      jsTiltGlareInner.classList.add('js-tilt-glare-inner');

      jsTiltGlare.appendChild(jsTiltGlareInner);
      this.element.appendChild(jsTiltGlare);
    }

    this.glareElementWrapper = this.element.querySelector('.js-tilt-glare');
    this.glareElement = this.element.querySelector('.js-tilt-glare-inner');

    if (this.glarePrerender) {
      return;
    }

    Object.assign(this.glareElementWrapper.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    });

    Object.assign(this.glareElement.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      'pointer-events': 'none',
      'background-image': `linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)`,
      width: `${this.element.offsetWidth * 2}px`,
      height: `${this.element.offsetWidth * 2}px`,
      transform: 'rotate(180deg) translate(-50%, -50%)',
      'transform-origin': '0% 0%',
      opacity: '0'
    });
  }

  updateGlareSize() {
    Object.assign(this.glareElement.style, {
      width: `${this.element.offsetWidth * 2}`,
      height: `${this.element.offsetWidth * 2}`
    });
  }

  onWindowResizeBind() {
    this.updateGlareSize();
  }

  setTransition() {
    clearTimeout(this.transitionTimeout);
    this.element.style.transition = this.settings.speed + 'ms ' + this.settings.easing;
    if (this.glare)
      this.glareElement.style.transition = `opacity ${this.settings.speed}ms ${
				this.settings.easing
			}`;

    this.transitionTimeout = setTimeout(() => {
      this.element.style.transition = '';
      if (this.glare) {
        this.glareElement.style.transition = '';
      }
    }, this.settings.speed);
  }

  extendSettings(settings) {
    let defaultSettings = {
      reverse: false,
      max: 35,
      perspective: 1000,
      easing: 'cubic-bezier(.03,.98,.52,.99)',
      scale: '1',
      speed: '300',
      transition: true,
      axis: null,
      glare: false,
      'max-glare': 1,
      'glare-prerender': false,
      reset: true,
      scroll: true
    };

    let newSettings = {};
    for (var property in defaultSettings) {
      if (property in settings) {
        newSettings[property] = settings[property];
      } else if (this.element.hasAttribute('data-tilt-' + property)) {
        let attribute = this.element.getAttribute('data-tilt-' + property);
        try {
          newSettings[property] = JSON.parse(attribute);
        } catch (e) {
          newSettings[property] = attribute;
        }
      } else {
        newSettings[property] = defaultSettings[property];
      }
    }

    return newSettings;
  }

  static init(elements, settings) {
    if (elements instanceof Node) {
      elements = [elements];
    }

    if (elements instanceof NodeList) {
      elements = [].slice.call(elements);
    }

    if (!(elements instanceof Array)) {
      return;
    }

    elements.forEach(element => {
      if (!('enhancedTilt' in element)) {
        element.enhancedTilt = new EnhancedTilt(element, settings);
      }
    });
  }
}

if (typeof document !== 'undefined') {
  /* expose the class to window */
  window.EnhancedTilt = EnhancedTilt;

  /**
   * Auto load
   */
  EnhancedTilt.init(document.querySelectorAll('[data-tilt]'));
}