// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/src/utils/SafeTransferLib.sol";

contract MockSwapper {
  using SafeTransferLib for ERC20;

  ERC20 public immutable exa;

  struct Permit {
    uint256 value;
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  struct Permit2 {
    uint256 amount;
    uint256 deadline;
    bytes signature;
  }

  constructor(ERC20 exa_) {
    exa = exa_;
  }

  function swap(address payable account, uint256, uint256 keepETH) external payable {
    if (keepETH != 0) account.transfer(keepETH);
    exa.safeTransfer(account, (msg.value - keepETH) * 5_000);
  }

  function swap(ERC20 asset, uint256 amount, bytes calldata, uint256, uint256) public {
    asset.safeTransferFrom(msg.sender, address(this), amount);
    exa.safeTransfer(msg.sender, amount);
  }

  function swap(ERC20 asset, Permit calldata permit, bytes calldata socketData, uint256 minEXA, uint256 keepETH) external {
    asset.permit(msg.sender, address(this), permit.value, permit.deadline, permit.v, permit.r, permit.s);
    swap(asset, permit.value, socketData, minEXA, keepETH);
  }

  function swap(ERC20 asset, Permit2 calldata permit, bytes calldata socketData, uint256 minEXA, uint256 keepETH) external {
    swap(asset, permit.amount, socketData, minEXA, keepETH);
  }

  receive() external payable {}
}
