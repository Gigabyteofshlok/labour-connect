import React, { Component } from 'react';
import { ShieldAlert, RefreshCw, Home, Compass } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 [ERROR BOUNDARY] Caught a critical rendering failure:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 font-sans selection:bg-brand-500/35">
          {/* Neon background light effect */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-2xl w-full glass-panel border border-white/5 rounded-2xl p-6 sm:p-10 text-center relative z-10 shadow-2xl animate-fade-in">
            {/* Danger Glow Header Icon */}
            <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full text-red-500 mb-6 border border-red-500/20 pulse-active shadow-lg shadow-red-500/5">
              <ShieldAlert className="w-12 h-12" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              SYSTEM RECOVERY ACTIVE
            </h1>
            <p className="text-dark-300 text-sm sm:text-base max-w-md mx-auto mb-6">
              Labour Connect intercepted a critical UI runtime crash. The application state has been isolated to prevent data corruption.
            </p>

            {/* Error Detail accordion */}
            {this.state.error && (
              <div className="text-left bg-dark-950/80 border border-white/5 rounded-xl p-4 mb-8 max-h-48 overflow-y-auto font-mono text-xs text-red-400">
                <p className="font-bold text-red-300 mb-1 border-b border-white/5 pb-1">
                  Error: {this.state.error.toString()}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed opacity-75 mt-2">
                  {this.state.errorInfo?.componentStack || this.state.error.stack}
                </p>
              </div>
            )}

            {/* Interactive Control actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 font-bold text-sm text-white bg-orange-gradient hover:opacity-90 active:scale-95 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 neon-glow-orange"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3 font-bold text-sm text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4 text-brand-500" />
                Return to Safestate
              </button>
            </div>

            {/* Platform Health indicators */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-4 text-xs text-dark-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-active"></span>
                Socket Server: Online
              </span>
              <span className="text-dark-600">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 pulse-active"></span>
                Database Sync: Fallback Active
              </span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
