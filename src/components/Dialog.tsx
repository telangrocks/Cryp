import React, { useEffect, useRef } from 'react';

type DialogRootProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogRootProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;
  return <>{children}</>;
}

type DialogPortalProps = { children: React.ReactNode };
export function DialogPortal({ children }: DialogPortalProps) {
  return <>{children}</>;
}

type DialogOverlayProps = { onDismiss?: () => void } & React.HTMLAttributes<HTMLDivElement>;
export function DialogOverlay({ onDismiss, ...rest }: DialogOverlayProps) {
  return (
    <div
      role="presentation"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
      }}
      {...rest}
    />
  );
}

type DialogContentProps = {
  onCloseAutoFocus?: () => void;
  onInteractOutside?: (e: MouseEvent) => void;
  ariaLabel?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function DialogContent({ onInteractOutside, ariaLabel, children, ...rest }: DialogContentProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!contentRef.current) return;
      if (!contentRef.current.contains(e.target as Node)) onInteractOutside?.(e);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onInteractOutside]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      ref={contentRef}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#111827',
        color: '#e5e7eb',
        width: '90%',
        maxWidth: '520px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        zIndex: 1001,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

type DialogHeaderProps = { children: React.ReactNode };
export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {children}
    </div>
  );
}

type DialogTitleProps = { children: React.ReactNode };
export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{children}</h2>
  );
}

type DialogDescriptionProps = { children: React.ReactNode };
export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>{children}</p>
  );
}

type DialogFooterProps = { children: React.ReactNode };
export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </div>
  );
}

type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function DialogClose(props: DialogCloseProps) {
  return (
    <button
      {...props}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#e5e7eb',
        padding: '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };
export function DialogButton({ variant = 'primary', ...rest }: ButtonProps) {
  const style =
    variant === 'primary'
      ? {
          background: '#2563eb',
          color: '#fff',
          border: 'none',
        }
      : {
          background: 'transparent',
          color: '#e5e7eb',
          border: '1px solid rgba(255,255,255,0.2)',
        };
  return (
    <button
      {...rest}
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        ...style,
      }}
    />
  );
}


