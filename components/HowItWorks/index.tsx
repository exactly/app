import Title from 'components/Title';
import Circle from './Circle';

import styles from './style.module.scss';

function HowItWorks() {
  const bullets = [
    {
      title: 'Deposit at variable rate',
      description:
        'Deposit an asset in the Smart Pool and receive a variable rate. They will receive an Exactly Token (eToken) as the voucher of their deposit.',
      icon: '/img/icons/depositVariable.svg'
    },
    {
      title: 'Deposit at fixed rate',
      description:
        'Deposit an asset in a specific Maturity Pool and receive a fixed interest rate at maturity. They will also be able to withdraw the deposit before the expiration date.',
      icon: '/img/icons/depositFixed.svg'
    },
    {
      title: 'Borrow at fixed rate',
      description:
        'Borrow an asset from a specific Maturity Pool and pay a fixed interest rate if they already have deposited an asset in the Smart Pool as collateral of the loan. They will also be able to repay the loan before the expiration date.',
      icon: '/img/icons/borrow.svg',
      type: 'secondary'
    }
  ];

  return (
    <section>
      <Title
        title={'How It Works'}
        subtitle={'Exactly users will be able to choose between 3 different options'}
      />
      <div className={styles.circlesContainer}>
        {bullets.map((bullet) => {
          return (
            <Circle
              title={bullet.title}
              description={bullet.description}
              icon={bullet.icon}
              type={bullet?.type}
            />
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;
