import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
  query,
  stagger,
} from '@angular/animations';

export const fadeUps = trigger('fadeUps', [
  transition(':enter', [
    query('.animated-element', [
      style({ transform: 'translateY(50px)', opacity: 0 }),
      stagger(100, [
        animate(
          '0.4s ease-out',
          style({ transform: 'translateY(0)', opacity: 1 })
        ),
      ]),
    ]),
  ]),
  transition(':leave', [
    query('.animated-element', [
      style({ transform: 'translateY(0)', opacity: 1 }),
      stagger(100, [
        animate(
          '0.4s ease-out',
          style({ transform: 'translateY(-50px)', opacity: 0 })
        ),
      ]),
    ]),
  ]),
]);

export const fadeIn = trigger('fadeIn', [
  transition('void => *', [
    query('.animated-element', [
      style({ opacity: 0 }),
      stagger(100, [animate('0.5s ease-in', style({ opacity: 1 }))]),
    ]),
  ]),
]);

export const slideUp = trigger('slideUp', [
  transition('void => *', [
    query('.animated-element', [
      style({ transform: 'translateY(100px)', opacity: 0 }),
      stagger(100, [
        animate(
          '0.5s ease-out',
          style({ transform: 'translateY(0)', opacity: 1 })
        ),
      ]),
    ]),
  ]),
]);
export const slideInLeft = trigger('slideInLeft', [
  transition('void => *', [
    query('.animated-element', [
      style({ transform: 'translateX(-100px)', opacity: 0 }),
      stagger(150, [
        animate(
          '0.4s ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ]),
]);

export const slideInRight = trigger('slideInRight', [
  transition('void => *', [
    query('.animated-element', [
      style({ transform: 'translateX(100px)', opacity: 0 }),
      stagger(150, [
        animate(
          '0.4s ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ]),
]);

export const slideInLeftDetail = trigger('slideInLeftDetail', [
  transition('void => *', [
    query('.animated-element', [
      style({ transform: 'translateX(-100px)', opacity: 0 }),
      stagger(150, [
        animate(
          '1s ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ]),
]);
export const slideInRightDetail = trigger('slideInRightDetail', [
  transition('void => *', [
    query('.animated-element', [
      style({ transform: 'translateX(100px)', opacity: 0 }),
      stagger(150, [
        animate(
          '1s ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ]),
]);

// trigger('fadeUp', [
//   state('true', style({ transform: 'translateY(50px)', opacity: 0 })),
//   state('false', style({ transform: 'translateY(0)', opacity: 1 })),
//   transition('true => false', animate('0.5s ease-out')),
//   transition('false => true', animate('0.5s ease-out')),
// ]),
// [@fadeUp]="state" (@fadeUp.done)="state && state=!state"
// trigger('fadeUp', [
//   transition('void => *', [
//     query('.animated-element', [
//       style({ transform: 'translateY(50px)', opacity: 0 }),
//       stagger(100, [
//         animate(
//           '0.4s ease-out',
//           style({ transform: 'translateY(0)', opacity: 1 })
//         ),
//       ]),
//     ]),
//   ]),
// ]),
