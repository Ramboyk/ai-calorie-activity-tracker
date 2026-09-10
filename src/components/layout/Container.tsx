import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  clean?: boolean;
}

export function Container({
  as: Component = "div",
  className,
  children,
  clean = false,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "w-full mx-auto",
        !clean && "max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;
