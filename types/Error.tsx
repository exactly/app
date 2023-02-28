export type ErrorData =
  | {
      status: false;
      message?: string;
      component?: string;
      variant?: 'error' | 'warning';
    }
  | {
      status: true;
      message: string;
      component?: string;
      variant?: 'error' | 'warning';
    };
