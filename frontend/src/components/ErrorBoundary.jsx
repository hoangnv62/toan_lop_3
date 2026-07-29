import { Component } from 'react';
import { FiAlertOctagon } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          <Card className="p-8 gap-4 max-w-2xl w-full hover:translate-y-0">
            <Alert variant="danger">
              <FiAlertOctagon />
              <AlertTitle>Lỗi render component</AlertTitle>
              <AlertDescription>{this.state.error.message}</AlertDescription>
            </Alert>
            <ScrollArea className="max-h-64 rounded-lg bg-slate-100">
              <pre className="p-4 text-xs text-slate-700 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </ScrollArea>
            <Button variant="outline" className="self-start" onClick={() => this.setState({ error: null })}>
              Thử lại
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
