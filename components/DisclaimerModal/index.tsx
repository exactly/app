import React, { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import { Typography } from '@mui/material';

import Link from '@mui/material/Link';

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const tos = JSON.parse(localStorage.getItem('tos') || '');
      !tos && setOpen(true);
    } catch (e) {
      setOpen(true);
    }
  }, []);

  const handleProceed = () => {
    localStorage.setItem('tos', JSON.stringify(true));

    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Disclaimer</DialogTitle>
      <DialogContent dividers>
        <>
          <Typography variant="body1" mb={2}>
            Exactly is an open source, non-custodial protocol that operates on the Ethereum Mainnet network. The
            protocol is designed to bring fixed-income solutions for lenders and borrowers (the &quot;Platform&quot;).
            The Platform will permit its users, among other things, enter into certain transaction involving digital
            assets (including but not limited to digital loans and credit products) (the &quot;Digital Assets
            Services&quot;).
          </Typography>
          <Typography variant="body1" mb={2}>
            The Platform does not allow it use by, or operates in any way with, US Persons. US Persons are prohibited
            from accessing and using the Digital Asset Services in any way. If Exactly has a reasonable suspicion that
            you are a US Person, we reserve the right to take whatever action we deem appropriate to prohibit your
            access to the Digital Asset Services. For purposes herein “US Person” shall mean any United States citizen
            or alien admitted for permanent residence in the United States, and any corporation, partnership, or other
            organization organized under the laws of the United States.
          </Typography>
          <Typography variant="body1">
            By clicking &quot;Proceed&quot; at the bottom of this disclaimer, you will be confirming that you are not a
            US Person and that you are not located, organized or resident in the United States of America. For more
            information please carefully read in full our{' '}
            <Link href="https://exact.ly/tos/" target="_blank" rel="noopener noreferrer">
              terms and conditions
            </Link>{' '}
            before using the Platform or the Digital Asset Services.
          </Typography>
        </>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleProceed} variant="contained">
          Proceed
        </Button>
      </DialogActions>
    </Dialog>
  );
}
