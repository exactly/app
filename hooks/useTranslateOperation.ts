import { useCallback, useMemo } from 'react';
import { capitalize as mCapitalize } from '@mui/material';
import { Operation } from 'contexts/ModalStatusContext';
import { useTranslation } from 'react-i18next';

export default function useTranslateOperation() {
  const { t } = useTranslation();

  const { infinitive, present, past, noun } = useMemo<{
    infinitive: Record<Operation, string | null>;
    past: Record<Operation, string | null>;
    present: Record<Operation, string | null>;
    noun: Record<Operation, string | null>;
  }>(
    () => ({
      infinitive: {
        borrowAtMaturity: t('borrow'),
        borrow: t('borrow'),
        depositAtMaturity: t('deposit'),
        deposit: t('deposit'),
        withdrawAtMaturity: t('withdraw'),
        withdraw: t('withdraw'),
        repayAtMaturity: t('repay'),
        repay: t('repay'),
      },

      past: {
        borrowAtMaturity: t('borrowed'),
        borrow: t('borrowed'),
        depositAtMaturity: t('deposited'),
        deposit: t('deposited'),
        withdrawAtMaturity: t('withdrawn'),
        withdraw: t('withdrawn'),
        repayAtMaturity: t('repayed'),
        repay: t('repayed'),
      },

      present: {
        borrowAtMaturity: t('borrowing'),
        borrow: t('borrowing'),
        depositAtMaturity: t('depositing'),
        deposit: t('depositing'),
        withdrawAtMaturity: t('withdrawing'),
        withdraw: t('withdrawing'),
        repayAtMaturity: t('repaying'),
        repay: t('repaying'),
      },

      noun: {
        borrowAtMaturity: t('borrow_noun'),
        borrow: t('borrow_noun'),
        depositAtMaturity: t('deposit_noun'),
        deposit: t('deposit_noun'),
        withdrawAtMaturity: t('withdraw_noun'),
        withdraw: t('withdraw_noun'),
        repayAtMaturity: t('repay_noun'),
        repay: t('repay_noun'),
      },
    }),
    [t],
  );

  return useCallback(
    (
      op: Operation,
      {
        variant = 'infinitive',
        capitalize = false,
      }: { variant?: 'infinitive' | 'present' | 'past' | 'noun'; capitalize?: boolean } = {},
    ) => {
      const record = {
        infinitive,
        present,
        past,
        noun,
      }[variant];
      const word = record[op];
      return capitalize ? mCapitalize(word ?? '') : word;
    },
    [infinitive, present, past, noun],
  );
}
