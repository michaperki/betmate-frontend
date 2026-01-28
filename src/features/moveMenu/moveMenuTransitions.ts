import {
  AnimatePresenceProps, TargetAndTransition, Transition, Variants,
} from 'framer-motion';

export type MoveMenuTransitionVariant =
  | 'none'
  | 'fade'
  | 'slide'
  | 'flip'
  | 'stack'
  | 'morph';

export const DEFAULT_MOVE_MENU_TRANSITION: MoveMenuTransitionVariant = 'fade';

export function getMoveMenuTransitionVariant(): MoveMenuTransitionVariant {
  try {
    const fromLs = typeof window !== 'undefined'
      ? (window.localStorage.getItem('bm_move_menu_transition') as MoveMenuTransitionVariant | null)
      : null;
    if (fromLs && isVariant(fromLs)) return fromLs;
  } catch {}

  // Use a direct token so webpack DefinePlugin replaces it; in the browser this becomes a string literal
  const fromEnv = (process.env.MOVE_MENU_TRANSITION as MoveMenuTransitionVariant | undefined);
  if (fromEnv && isVariant(fromEnv)) return fromEnv;

  return DEFAULT_MOVE_MENU_TRANSITION;
}

function isVariant(v: string): v is MoveMenuTransitionVariant {
  return ['none', 'fade', 'slide', 'flip', 'stack', 'morph'].includes(v);
}

type MotionSpec = {
  initial: false | TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
};

export function tileMotionByVariant(variant: MoveMenuTransitionVariant): MotionSpec {
  switch (variant) {
    case 'fade':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      };
    case 'slide':
      return {
        initial: { opacity: 0, x: -8 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -8 },
        transition: { duration: 0.2 },
      };
    case 'flip':
      return {
        initial: { opacity: 0, scale: 0.985 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.985 },
        transition: {
          type: 'spring', stiffness: 520, damping: 38, mass: 0.7,
        },
      };
    case 'stack':
      return {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 6 },
        transition: { duration: 0.18 },
      };
    case 'morph':
      return {
        initial: { opacity: 0, filter: 'blur(2px)' },
        animate: { opacity: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, filter: 'blur(2px)' },
        transition: { duration: 0.22 },
      };
    case 'none':
    default:
      return {
        initial: false,
        animate: {},
        exit: {},
        transition: { duration: 0 },
      } as MotionSpec;
  }
}

export const stackParentVariants: Variants = {
  animate: { transition: { staggerChildren: 0.03 } },
};

export const presenceMode: AnimatePresenceProps['mode'] = 'popLayout';
