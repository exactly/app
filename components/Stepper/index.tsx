import styles from './style.module.scss';

type Props = {
  currentStep: Number;
  totalSteps: Number;
};

function Stepper({ currentStep, totalSteps }: Props) {
  return (
    <div className={styles.steps}>
      {Array.from(Array(totalSteps).keys()).map((step) => {
        return (
          <div
            className={
              currentStep >= step + 1 ? styles.selectedStep : styles.step
            }
          ></div>
        );
      })}
    </div>
  );
}

export default Stepper;
