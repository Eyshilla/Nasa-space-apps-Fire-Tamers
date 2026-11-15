import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';

interface InnerBoundaryProps {
  title?: string;
  variant: 'card' | 'plot';
  resetKey?: string | number;
  errorTitle: string;
  retryLabel: string;
  children: React.ReactNode;
}

interface InnerBoundaryState {
  hasError: boolean;
  retryCount: number;
}

class ChartErrorBoundaryInner extends React.Component<
  InnerBoundaryProps,
  InnerBoundaryState
> {
  state: InnerBoundaryState = {
    hasError: false,
    retryCount: 0,
  };

  static getDerivedStateFromError(): Partial<InnerBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `[FireTamers ChartErrorBoundary]${this.props.title ? ` (${this.props.title})` : ''}`,
      error,
      info.componentStack
    );
  }

  componentDidUpdate(prevProps: InnerBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const boxClasses =
        this.props.variant === 'card'
          ? 'flex h-full min-h-[240px] w-full flex-col items-center justify-center rounded-xl border border-red-500/35 bg-[#121A30] p-4 text-center shadow-lg shadow-black/25'
          : 'flex h-full min-h-[190px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-red-500/40 bg-[#0B1020]/60 p-4 text-center';

      return (
        <div role="alert" className={boxClasses}>
          <AlertTriangle className="mb-2 h-6 w-6 shrink-0 text-amber-300" />
          {this.props.title && (
            <p className="chart-text-axis mb-1 font-semibold text-slate-100">
              {this.props.title}
            </p>
          )}
          <p className="chart-text-annotation max-w-sm text-slate-300">
            {this.props.errorTitle}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-3 inline-flex min-h-[32px] items-center gap-1.5 whitespace-nowrap rounded-md border border-cyan-500/45 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span>{this.props.retryLabel}</span>
          </button>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.retryCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export interface ChartErrorBoundaryProps {
  title?: string;
  variant?: 'card' | 'plot';
  resetKey?: string | number;
  children: React.ReactNode;
}

export const ChartErrorBoundary: React.FC<ChartErrorBoundaryProps> = ({
  title,
  variant = 'card',
  resetKey,
  children,
}) => {
  const lang = usePsiStore((s) => s.lang);
  const t = useStrings(lang);

  return (
    <ChartErrorBoundaryInner
      title={title}
      variant={variant}
      resetKey={resetKey}
      errorTitle={t.chartCard.errorTitle}
      retryLabel={t.chartCard.retry}
    >
      {children}
    </ChartErrorBoundaryInner>
  );
};
