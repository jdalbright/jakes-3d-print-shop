type BrandLogoProps = {
  variant?: "full" | "mark";
  tone?: "default" | "mono" | "inverse";
  className?: string;
};

export function BrandLogo({
  variant = "full",
  tone = "default",
  className,
}: BrandLogoProps) {
  const classes = [
    "brand-logo",
    `brand-logo--${variant}`,
    `brand-logo--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <svg
        className="brand-logo__mark"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <path className="brand-logo__layer" d="M4 4h27l-4 6H0l4-6Z" />
        <path className="brand-logo__layer brand-logo__layer--accent" d="M6 13h26l-4 6H2l4-6Z" />
        <path className="brand-logo__layer" d="M3 22h27l-4 6H0l3-6Z" />
      </svg>
      {variant === "full" ? (
        <span className="brand-logo__wordmark">
          <span>Jake’s</span>
          <strong>3D Print Shop</strong>
        </span>
      ) : null}
    </span>
  );
}
