import { useState } from "react";

type Props = {
  content?: String;
};

export default () => {
  let [modal, setModal] = useState(false);
  let [modalContent, setModalContent] = useState<String>("");

  let handleModal = ({ content = "" }: Props) => {
    setModal(!modal);
    if (content) {
      setModalContent(content);
    }
  };

  return { modal, handleModal, modalContent };
};
