export type TableHeader = {
  label: string;
  key?: string;
  tooltipTitle?: string;
  tooltipPlacement?: 'top' | 'top-start' | 'top-end';
  align?: 'left' | 'inherit' | 'center' | 'right' | 'justify';
  hidden?: boolean;
};
