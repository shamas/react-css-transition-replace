/**
 * Adapted from ReactCSSTransitionGroupChild.js by Facebook
 *
 * @providesModule ReactCSSTransitionReplaceChild
 */

import React from 'react';

import ReactTransitionEvents from 'react/lib/ReactTransitionEvents';
import CSSCore from 'react/lib/CSSCore';

// We don't remove the element from the DOM until we receive an animationend or
// transitionend event. If the user screws up and forgets to add an animation
// their node will be stuck in the DOM forever, so we detect if an animation
// does not start and if it doesn't, we just call the end listener immediately.
const TICK = 17;
const NO_EVENT_TIMEOUT = 5000;

let noEventListener = null;


if (process.env.NODE_ENV !== 'production') {
  noEventListener = function() {
    (process.env.NODE_ENV !== 'production' ? console.warn(
      'transition(): tried to perform an animation without ' +
      'an animationend or transitionend event after timeout (' +
      NO_EVENT_TIMEOUT +
      'ms). You should either disable this ' +
      'transition in JS or add a CSS animation/transition.'
    ) : null);
  };
}

class ReactCSSTransitionReplaceChild extends React.Component {

  constructor(props) {
    super(props);
    this.flushClassNameQueue = this.flushClassNameQueue.bind(this);
  }

  transition(animationType, finishCallback) {
    const node = React.findDOMNode(this);
    const className = this.props.name + '-' + animationType;
    const activeClassName = className + '-active';
    let noEventTimeout = null;

    const endListener = function(e) {
      if (e && e.target !== node) {
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        clearTimeout(noEventTimeout);
      }

      CSSCore.removeClass(node, className);
      CSSCore.removeClass(node, activeClassName);

      ReactTransitionEvents.removeEndEventListener(node, endListener);

      // Usually this optional callback is used for informing an owner of
      // a leave animation and telling it to remove the child.
      if (finishCallback) {
        finishCallback();
      }
    };

    ReactTransitionEvents.addEndEventListener(node, endListener);

    CSSCore.addClass(node, className);

    // Need to do this to actually trigger a transition.
    this.queueClass(activeClassName);

    if (process.env.NODE_ENV !== 'production') {
      noEventTimeout = setTimeout(noEventListener, NO_EVENT_TIMEOUT);
    }
  }

  queueClass(className) {
    this.classNameQueue.push(className);

    if (!this.timeout) {
      this.timeout = setTimeout(this.flushClassNameQueue, TICK);
    }
  }

  flushClassNameQueue() {
    if (this._mounted) {
      this.classNameQueue.forEach(className => CSSCore.addClass(React.findDOMNode(this), className));
    }
    this.classNameQueue.length = 0;
    this.timeout = null;
  }

  componentWillMount() {
    this.classNameQueue = [];
  }

  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    delete this._mounted;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  componentWillAppear(done) {
    this.props.appear ? this.transition('appear', done) : done();
  }

  componentWillEnter(done) {
    this.props.enter ? this.transition('enter', done) : done();
  }

  componentWillLeave(done) {
    this.props.leave ? this.transition('leave', done) : done();
  }

  componentDidEnter() {
    this.props.onEntered();
  }

  componentDidLeave() {
    this.props.onLeft();
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

export default ReactCSSTransitionReplaceChild;
