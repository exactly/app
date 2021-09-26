declare global {
  interface Window {
    ethereum: any;
  }
}

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts"
      });
      if (addressArray.length > 0) {
        return {
          address: addressArray[0]
        };
      } else {
        return {
          address: ""
        };
      }
    } catch (err: any) {
      return {
        address: ""
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      )
    };
  }
};
