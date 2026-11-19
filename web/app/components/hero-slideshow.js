import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

const INTERVAL_MS = 4000;

/**
 * Dashboard hero background: the registry's own photographs crossfading on a
 * 4-second timer. Decorative (aria-hidden), so assistive tech ignores it, and
 * the timer is dropped with the component when the visitor navigates away.
 * Visitors who prefer reduced motion get a single still image instead.
 */
export default class HeroSlideshowComponent extends Component {
  slides = [
    '/hero/hero-1.jpg',
    '/hero/hero-2.jpg',
    '/hero/hero-3.jpg',
    '/hero/hero-4.jpg',
    '/hero/hero-5.jpg',
    '/hero/hero-6.jpg',
  ];

  @tracked index = 0;

  _timer = null;

  constructor() {
    super(...arguments);
    registerDestructor(this, () => {
      if (this._timer) window.clearInterval(this._timer);
    });
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      this._timer = window.setInterval(() => {
        this.index = (this.index + 1) % this.slides.length;
      }, INTERVAL_MS);
    }
  }
}
