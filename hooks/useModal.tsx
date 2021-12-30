import { useState } from 'react';
import { Dictionary } from 'types/Dictionary';

type Props = {
  content?: Dictionary<String | Boolean | Number | undefined>;
};

const useModal = () => {
  let [modal, setModal] = useState(false);
  let [modalContent, setModalContent] = useState<
    Dictionary<String | Boolean | Number | undefined> | undefined
  >(undefined);

  let handleModal = ({ content = {} }: Props) => {
    setModal(!modal);
    if (content) {
      setModalContent(content);
    }
  };

  return { modal, handleModal, modalContent };
};

export default useModal;
