import { withSentry } from '@sentry/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  // ...
};

export default withSentry(handler);
