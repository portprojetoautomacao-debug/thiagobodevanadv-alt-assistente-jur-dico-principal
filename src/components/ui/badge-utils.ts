import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-default",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 focus:ring-primary/50",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/50",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 focus:ring-destructive/50",
        outline: "text-foreground border-border hover:bg-accent/50 focus:ring-accent",
        muted: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted/70 focus:ring-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
