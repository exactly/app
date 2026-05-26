// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract MockSablierV2NFTDescriptor {
  function tokenURI(address, uint256) external pure returns (string memory) {
    return "data:application/json;base64,eyJuYW1lIjoiTG9jYWwgU3RyZWFtIiwiaW1hZ2UiOiIvaW1nL2Fzc2V0cy9FWEEuc3ZnIn0=";
  }
}
