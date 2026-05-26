// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/src/tokens/ERC20.sol";

contract MockPermit2 {
  struct TokenPermissions {
    ERC20 token;
    uint256 amount;
  }

  struct PermitTransferFrom {
    TokenPermissions permitted;
    uint256 nonce;
    uint256 deadline;
  }

  struct SignatureTransferDetails {
    address to;
    uint256 requestedAmount;
  }

  function permitTransferFrom(
    PermitTransferFrom memory permit,
    SignatureTransferDetails calldata transferDetails,
    address owner,
    bytes calldata
  ) external {
    permit.permitted.token.transferFrom(owner, transferDetails.to, transferDetails.requestedAmount);
  }

  // solhint-disable-next-line func-name-mixedcase
  function DOMAIN_SEPARATOR() external pure returns (bytes32) {
    return bytes32(0);
  }
}
