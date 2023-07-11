import { type NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const country = req.geo?.country;

  if (country === 'US') {
    return new Response(
      'Disclaimer\n\nExactly is an open source, non-custodial protocol that operates on both the Ethereum Mainnet (L1) and Optimism roll-up (L2) networks. The protocol is designed to bring fixed-income solutions for lenders and borrowers (the "Platform"). The Platform will permit its users, among other things, enter into certain transaction involving digital assets (including but not limited to digital loans and credit products) (the "Digital Assets Services").\n\nThe Platform does not allow it use by, or operates in any way with, US Persons. US Persons are prohibited from accessing and using the Digital Asset Services in any way. If Exactly has a reasonable suspicion that you are a US Person, we reserve the right to take whatever action we deem appropriate to prohibit your access to the Digital Asset Services. For purposes herein "US Person" shall mean any United States citizen or alien admitted for permanent residence in the United States, and any corporation, partnership, or other organization organized under the laws of the United States.',
      { status: 451 },
    );
  }

  return NextResponse.next();
}
