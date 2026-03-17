import React, { useEffect, useRef, useState } from "react";

export default function RevealOnScroll({
  children,
  className = "",
  variant = "up",
  threshold = 0.16,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`mc-reveal ${visible ? "show" : ""} ${className}`.trim()}
      data-variant={variant}
    >
      {children}
    </div>
  );
}