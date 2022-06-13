import { useState } from 'react';

type Props = {
  content?: any;
};

const useModal = () => {
  let [modal, setModal] = useState(false);
  let [modalContent, setModalContent] = useState<any>(undefined);

  let handleModal = ({ content = {} }: Props) => {
    setModal(!modal);
    if (content) {
      setModalContent(content);
    }
  };

  return { modal, handleModal, modalContent };
};

export default useModal;
