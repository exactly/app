// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/src/tokens/ERC20.sol";

contract MockSablierV2LockupLinear {
  uint256 public nextStreamId = 1;

  struct Stream {
    address sender;
    address recipient;
    ERC20 asset;
    uint128 totalAmount;
    uint128 withdrawnAmount;
    uint40 startTime;
    uint40 endTime;
    bool canceled;
  }

  struct Durations {
    uint40 cliff;
    uint40 total;
  }

  struct Broker {
    address account;
    uint256 fee;
  }

  struct CreateWithDurations {
    address sender;
    address recipient;
    uint128 totalAmount;
    ERC20 asset;
    bool cancelable;
    bool transferable;
    Durations durations;
    Broker broker;
  }

  mapping(uint256 streamId => Stream stream) public streams;

  function createWithDurations(CreateWithDurations calldata params) external returns (uint256 streamId) {
    streamId = nextStreamId++;
    params.asset.transferFrom(msg.sender, address(this), params.totalAmount);
    streams[streamId] = Stream({
      sender: msg.sender,
      recipient: params.recipient,
      asset: params.asset,
      totalAmount: params.totalAmount,
      withdrawnAmount: 0,
      startTime: uint40(block.timestamp),
      endTime: uint40(block.timestamp) + params.durations.total,
      canceled: false
    });
  }

  function getRecipient(uint256 streamId) external view returns (address) {
    return streams[streamId].recipient;
  }

  function getWithdrawnAmount(uint256 streamId) external view returns (uint128) {
    return streams[streamId].withdrawnAmount;
  }

  function refundableAmountOf(uint256 streamId) external view returns (uint128) {
    Stream memory stream = streams[streamId];
    if (stream.canceled || block.timestamp >= stream.endTime) return 0;
    return stream.totalAmount - vested(stream);
  }

  function withdrawableAmountOf(uint256 streamId) public view returns (uint128) {
    Stream memory stream = streams[streamId];
    if (stream.canceled) return 0;
    return vested(stream) - stream.withdrawnAmount;
  }

  function withdrawMax(uint256 streamId, address to) external {
    uint128 amount = withdrawableAmountOf(streamId);
    if (amount == 0) return;
    Stream storage stream = streams[streamId];
    stream.withdrawnAmount += amount;
    stream.asset.transfer(to, amount);
  }

  function isDepleted(uint256 streamId) external view returns (bool) {
    Stream memory stream = streams[streamId];
    return stream.withdrawnAmount >= stream.totalAmount;
  }

  function cancel(uint256 streamId) external {
    Stream storage stream = streams[streamId];
    if (stream.canceled) return;
    stream.canceled = true;
    uint128 refund = stream.totalAmount - vested(stream);
    if (refund != 0) stream.asset.transfer(stream.sender, refund);
  }

  function tokenURI(uint256) external pure returns (string memory) {
    return "data:application/json;base64,eyJuYW1lIjoiTG9jYWwgU3RyZWFtIiwiaW1hZ2UiOiIvimgL2Fzc2V0cy9FWEEuc3ZnIn0=";
  }

  function vested(Stream memory stream) internal view returns (uint128) {
    if (block.timestamp <= stream.startTime) return 0;
    if (block.timestamp >= stream.endTime) return stream.totalAmount;
    return uint128((uint256(stream.totalAmount) * (block.timestamp - stream.startTime)) / (stream.endTime - stream.startTime));
  }
}
