import { Animation, createAnimation } from '@ionic/react';

// Custom slide-in from right animation
export const customSlideInAnimation = (_: HTMLElement, opts: any): Animation => {
  const rootTransition = createAnimation()
    .duration(opts.duration || 300)
    .easing('cubic-bezier(0.32, 0.72, 0, 1)');

  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('transform', 'translateX(100%)', 'translateX(0%)')
    .fromTo('opacity', '0', '1');

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .fromTo('transform', 'translateX(0%)', 'translateX(-20%)')
    .fromTo('opacity', '1', '0.8');

  rootTransition.addAnimation([enteringAnimation, leavingAnimation]);

  return rootTransition;
};

// Custom fade animation
export const customFadeAnimation = (_: HTMLElement, opts: any): Animation => {
  const rootTransition = createAnimation()
    .duration(opts.duration || 250)
    .easing('ease-in-out');

  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('opacity', '0', '1')
    .fromTo('transform', 'scale(0.95)', 'scale(1)');

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .fromTo('opacity', '1', '0');

  rootTransition.addAnimation([enteringAnimation, leavingAnimation]);

  return rootTransition;
};

// Custom zoom animation
export const customZoomAnimation = (_: HTMLElement, opts: any): Animation => {
  const rootTransition = createAnimation()
    .duration(opts.duration || 300)
    .easing('cubic-bezier(0.36, 0.66, 0.04, 1)');

  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('transform', 'scale(0.8)', 'scale(1)')
    .fromTo('opacity', '0', '1');

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .fromTo('transform', 'scale(1)', 'scale(1.1)')
    .fromTo('opacity', '1', '0');

  rootTransition.addAnimation([enteringAnimation, leavingAnimation]);

  return rootTransition;
};

// Custom slide-up from bottom animation (for modals)
export const customModalAnimation = (_: HTMLElement, opts: any): Animation => {
  const rootTransition = createAnimation()
    .duration(opts.duration || 400)
    .easing('cubic-bezier(0.32, 0.72, 0, 1)');

  const backdropAnimation = createAnimation()
    .addElement(opts.baseEl.querySelector('ion-backdrop')!)
    .fromTo('opacity', '0', '0.4');

  const wrapperAnimation = createAnimation()
    .addElement(opts.baseEl.querySelector('.modal-wrapper')!)
    .fromTo('transform', 'translateY(100%)', 'translateY(0%)')
    .fromTo('opacity', '0', '1');

  rootTransition.addAnimation([backdropAnimation, wrapperAnimation]);

  return rootTransition;
};

export default {
  customSlideInAnimation,
  customFadeAnimation,
  customZoomAnimation,
  customModalAnimation,
};
