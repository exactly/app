import { useState } from 'react';

import { Alert } from 'types/Alert';

const useAlert = () => {
  const [alert, setAlert] = useState<Alert>({
    status: false,
    type: '',
    msg: 0
  });

  function handleAlert(data: Alert) {
    console.log(data, 'alert modified');
    setAlert(data);
  }

  console.log(alert, 'alert');

  return {
    alert,
    handleAlert
  };
};

export default useAlert;
