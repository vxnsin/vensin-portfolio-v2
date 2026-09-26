import type { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  children: ReactNode;
  dashed?: boolean;
  className?: string;
  bodyClassName?: string;
  right?: ReactNode;
};

/** Old-web style bordered box with a small title bar. */
export function Window({ title, children, dashed, className = "", bodyClassName = "", right }: Props) {
  return (
    <section className={`win ${dashed ? "win-dashed" : ""} ${className}`}>
      {title !== undefined && (
        <div className="win-title">
          <span className="dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="flex-1 truncate">{title}</span>
          {right}
        </div>
      )}
      <div className={`win-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}
