export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID ?? '';
export const isProd = process.env.NODE_ENV === 'production';

export const pageview = (url: URL) => {
  if (isProd) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url
    });
  }
};

type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value: number;
};

export const event = ({ action, category, label, value }: GTagEvent) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
};
