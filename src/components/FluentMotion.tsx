import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { fluentTransitions, fluentVariants } from '@/hooks/use-fluent-motion'

type FluentVariantKey = keyof typeof fluentVariants
type FluentTransitionKey = keyof typeof fluentTransitions

interface FluentMotionProps extends Omit<HTMLMotionProps<'div'>, 'transition'> {
  children: ReactNode
  variant?: FluentVariantKey
  transition?: FluentTransitionKey
  delay?: number
  stagger?: boolean
  hover?: boolean
  tap?: boolean
}

export function FluentMotion({ 
  children, 
  variant = 'fadeInUp',
  transition = 'standard',
  delay = 0,
  stagger = false,
  hover = false,
  tap = false,
  ...props 
}: FluentMotionProps) {
  const selectedVariant = fluentVariants[variant]
  const selectedTransition = {
    ...fluentTransitions[transition],
    delay
  }

  const hoverEffect = hover ? { scale: 1.02, transition: fluentTransitions.decelerate as any } : undefined
  const tapEffect = tap ? { scale: 0.98, transition: fluentTransitions.accelerate as any } : undefined

  const variants = stagger
    ? {
        initial: selectedVariant.initial,
        animate: {
          ...selectedVariant.animate,
          transition: {
            ...selectedTransition,
            staggerChildren: 0.05,
            delayChildren: 0.1
          }
        },
        exit: selectedVariant.exit
      }
    : selectedVariant

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants as any}
      transition={selectedTransition as any}
      whileHover={hoverEffect}
      whileTap={tapEffect}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FluentStaggerItem({ 
  children,
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FluentReveal({ 
  children,
  direction = 'left',
  ...props 
}: HTMLMotionProps<'div'> & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const variants = {
    left: {
      initial: { clipPath: 'inset(0 100% 0 0)' },
      animate: { clipPath: 'inset(0 0% 0 0)' }
    },
    right: {
      initial: { clipPath: 'inset(0 0 0 100%)' },
      animate: { clipPath: 'inset(0 0% 0 0)' }
    },
    up: {
      initial: { clipPath: 'inset(100% 0 0 0)' },
      animate: { clipPath: 'inset(0% 0 0 0)' }
    },
    down: {
      initial: { clipPath: 'inset(0 0 100% 0)' },
      animate: { clipPath: 'inset(0 0 0% 0)' }
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants[direction] as any}
      transition={fluentTransitions.emphasized as any}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FluentFade({ 
  children,
  delay = 0,
  ...props 
}: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...fluentTransitions.standard, delay } as any}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FluentSlide({ 
  children,
  direction = 'up',
  delay = 0,
  ...props 
}: HTMLMotionProps<'div'> & { direction?: 'up' | 'down' | 'left' | 'right'; delay?: number }) {
  const variants = {
    up: { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    down: { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    left: { initial: { x: 40, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x: -40, opacity: 0 }, animate: { x: 0, opacity: 1 } }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="initial"
      variants={variants[direction] as any}
      transition={{ ...fluentTransitions.emphasized, delay } as any}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FluentScale({ 
  children,
  delay = 0,
  ...props 
}: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ ...fluentTransitions.emphasized, delay } as any}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FluentHover({ 
  children,
  scale = 1.02,
  ...props 
}: HTMLMotionProps<'div'> & { scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={fluentTransitions.decelerate as any}
      {...props}
    >
      {children}
    </motion.div>
  )
}
