import AlertMessage from "components/AlertMessage";
import useNetwork from "hooks/useNetwork";
import style from "./style.module.scss";
function CurrentNetwork() {
  const network = useNetwork();

  return (
    <AlertMessage
      label={`<span>You are connected to <strong>${network?.name}</strong> network</span>`}
    />
  );
}

export default CurrentNetwork;
