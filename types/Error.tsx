export type ErrorData =
  | {
      status: false;
      message?: string;
      component?: string;
    }
  | {
      status: true;
      message: string;
      component?: string;
    };
