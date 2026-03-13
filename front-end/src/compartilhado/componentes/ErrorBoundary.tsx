import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  modulo: string;
}

interface State {
  hasError: boolean;
}

/**
 * Componente que captura erros em seus componentes filhos e exibe uma UI de fallback elegante.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Erro no módulo ${this.props.modulo}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 flex flex-col items-center text-center gap-4 animar-entrada">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Ops! Algo deu errado no {this.props.modulo}</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Tivemos um problema inesperado ao carregar esta seção. Tente recarregar a página.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
          >
            <RefreshCw size={14} />
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
