import React from "react";
import {
  Button as GluestackButton,
  ButtonText as GluestackButtonText,
  ButtonIcon as GluestackButtonIcon,
  ButtonSpinner as GluestackButtonSpinner,
  ButtonGroup as GluestackButtonGroup,
} from "@/components/ui/button";

type GluestackButtonProps = React.ComponentProps<typeof GluestackButton>;
type ButtonVariant = NonNullable<GluestackButtonProps["variant"]>;

export type ButtonAction = "primary" | "secondary" | "negative" | "positive";

type ButtonProps = Omit<GluestackButtonProps, "action"> & {
  action?: ButtonAction;
  /** Filled / selected state (e.g. active nav tab). */
  active?: boolean;
};

type StyleConfig = {
  variant: ButtonVariant;
  className?: string;
};

/**
 * Default action → Gluestack variant mapping.
 * className overrides generated hover styles (outline/ghost use bg-muted otherwise).
 */
const defaultActionStyles: Record<ButtonAction, StyleConfig> = {
  primary: { variant: "default" },
  secondary: {
    variant: "outline",
    className:
      "data-[hover=true]:bg-accent data-[active=true]:bg-accent",
  },
  negative: {
    variant: "destructive",
    className:
      "data-[hover=true]:bg-destructive/90 data-[active=true]:bg-destructive/90",
  },
  positive: {
    variant: "default",
    className:
      "bg-greenscale-700 data-[hover=true]:bg-greenscale-900 data-[active=true]:bg-greenscale-900",
  },
};

/** Styles when an action is paired with a non-default variant. */
const actionVariantStyles: Partial<
  Record<ButtonAction, Partial<Record<ButtonVariant, StyleConfig>>>
> = {
  primary: {
    outline: {
      variant: "outline",
      className:
        "border-indigoscale-900 data-[hover=true]:bg-indigoscale-100 data-[active=true]:bg-indigoscale-100",
    },
  },
  negative: {
    outline: {
      variant: "outline",
      className:
        "border-destructive data-[hover=true]:bg-destructive/10 data-[active=true]:bg-destructive/10",
    },
  },
  secondary: {
    link: { variant: "link" },
  },
};

/** Extra classes when `active` is true (e.g. selected nav tab). */
const activeActionStyles: Partial<
  Record<ButtonAction, Partial<Record<ButtonVariant, string>>>
> = {
  primary: {
    outline:
      "bg-indigoscale-700 border-indigoscale-900 data-[hover=true]:bg-indigoscale-900 data-[active=true]:bg-indigoscale-900",
  },
  negative: {
    outline:
      "bg-destructive border-destructive data-[hover=true]:bg-destructive/90 data-[active=true]:bg-destructive/90",
  },
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveButtonStyles(
  action?: ButtonAction,
  variant?: ButtonVariant,
  active?: boolean,
): StyleConfig {
  if (!action) {
    return { variant: variant ?? "default" };
  }

  const defaultStyle = defaultActionStyles[action];
  const resolvedVariant = variant ?? defaultStyle.variant;

  let config: StyleConfig;
  if (variant && variant !== defaultStyle.variant) {
    config = actionVariantStyles[action]?.[variant] ?? {
      variant: resolvedVariant,
    };
  } else {
    config = defaultStyle;
  }

  const activeClassName = active
    ? activeActionStyles[action]?.[config.variant]
    : undefined;

  return {
    variant: config.variant,
    className: joinClasses(config.className, activeClassName),
  };
}

export const Button = React.forwardRef<
  React.ElementRef<typeof GluestackButton>,
  ButtonProps
>(function Button({ action, active, variant, className, ...props }, ref) {
  const resolved = resolveButtonStyles(action, variant, active);

  return (
    <GluestackButton
      ref={ref}
      variant={resolved.variant}
      className={joinClasses(resolved.className, className)}
      {...props}
    />
  );
});

Button.displayName = "Button";

export const ButtonText = GluestackButtonText;
export const ButtonIcon = GluestackButtonIcon;
export const ButtonSpinner = GluestackButtonSpinner;
export const ButtonGroup = GluestackButtonGroup;
