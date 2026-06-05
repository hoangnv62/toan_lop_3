import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 max-w-2xl w-full">
            <h2 className="text-lg font-bold text-red-600 mb-3">Lỗi render component</h2>
            <pre className="text-xs text-slate-700 bg-slate-100 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              className="mt-4 btn-secondary"
              onClick={() => this.setState({ error: null })}>
              Thử lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
