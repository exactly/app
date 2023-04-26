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

export class CustomError extends Error {
  public custom = true;

  constructor(message: string, public variant?: 'error' | 'warning') {
    super(message);
  }
}
