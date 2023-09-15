import { type NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const isE2E = process.env.NEXT_PUBLIC_IS_E2E === 'true';

const ratelimit = isE2E
  ? null
  : new Ratelimit({
      redis: kv,
      // 100 requests from the same IP in 5 seconds
      limiter: Ratelimit.slidingWindow(100, '5 s'),
    });

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'development' || ratelimit === null) {
    return NextResponse.next();
  }

  const country = req.geo?.country;

  if (country === 'US') {
    return new Response(
      'Disclaimer\n\nExactly is an open source, non-custodial protocol that operates on both the Ethereum Mainnet (L1) and Optimism roll-up (L2) networks. The protocol is designed to bring fixed-income solutions for lenders and borrowers (the "Platform"). The Platform will permit its users, among other things, enter into certain transaction involving digital assets (including but not limited to digital loans and credit products) (the "Digital Assets Services").\n\nThe Platform does not allow it use by, or operates in any way with, US Persons. US Persons are prohibited from accessing and using the Digital Asset Services in any way. If Exactly has a reasonable suspicion that you are a US Person, we reserve the right to take whatever action we deem appropriate to prohibit your access to the Digital Asset Services. For purposes herein "US Person" shall mean any United States citizen or alien admitted for permanent residence in the United States, and any corporation, partnership, or other organization organized under the laws of the United States.',
      { status: 451 },
    );
  }

  const ip =
    req.ip ?? req.headers.get('x-real-ip') ?? (req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1');

  const { success } = await ratelimit.limit(ip);

  return success ? NextResponse.next() : new Response('Too many requests', { status: 429 });
}
