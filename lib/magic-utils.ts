import { type Variants } from "framer-motion";
import { cn } from "./utils";

/**
 * Motion variants for the Morphing Card
 */
export const morphVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

/**
 * Motion variants for items inside the card
 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/**
 * Utility to combine framer motion props with tailwind
 */
export { cn };
