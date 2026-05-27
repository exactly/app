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
    uint128 refundedAmount;
    uint40 startTime;
    uint40 endTime;
    bool cancelable;
    bool canceled;
  }

  struct Amounts {
    uint128 deposit;
    uint128 protocolFee;
    uint128 brokerFee;
  }

  struct StreamAmounts {
    uint128 deposited;
    uint128 withdrawn;
    uint128 refunded;
  }

  struct StreamState {
    address sender;
    uint40 startTime;
    uint40 cliffTime;
    bool isCancelable;
    bool wasCanceled;
    ERC20 asset;
    uint40 endTime;
    bool isDepleted;
    bool isStream;
    StreamAmounts amounts;
  }

  struct Durations {
    uint40 cliff;
    uint40 total;
  }

  struct Range {
    uint40 start;
    uint40 cliff;
    uint40 end;
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
  mapping(uint256 streamId => address owner) public ownerOf;

  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  event CreateLockupLinearStream(
    uint256 streamId,
    address funder,
    address indexed sender,
    address indexed recipient,
    Amounts amounts,
    ERC20 indexed asset,
    bool cancelable,
    Range range,
    address broker
  );
  event CancelLockupStream(
    uint256 indexed streamId,
    address indexed sender,
    address indexed recipient,
    uint128 senderAmount,
    uint128 recipientAmount
  );
  event WithdrawFromLockupStream(uint256 indexed streamId, address indexed to, uint128 amount);

  function createWithDurations(CreateWithDurations calldata params) external returns (uint256 streamId) {
    streamId = nextStreamId++;
    params.asset.transferFrom(msg.sender, address(this), params.totalAmount);
    uint40 startTime = uint40(block.timestamp);
    uint40 endTime = startTime + params.durations.total;
    streams[streamId] = Stream({
      sender: params.sender,
      recipient: params.recipient,
      asset: params.asset,
      totalAmount: params.totalAmount,
      withdrawnAmount: 0,
      refundedAmount: 0,
      startTime: startTime,
      endTime: endTime,
      cancelable: params.cancelable,
      canceled: false
    });
    ownerOf[streamId] = params.recipient;
    emit Transfer(address(0), params.recipient, streamId);
    emit CreateLockupLinearStream(
      streamId,
      msg.sender,
      params.sender,
      params.recipient,
      Amounts({ deposit: params.totalAmount, protocolFee: 0, brokerFee: 0 }),
      params.asset,
      params.cancelable,
      Range({ start: startTime, cliff: startTime + params.durations.cliff, end: endTime }),
      params.broker.account
    );
  }

  function getRecipient(uint256 streamId) external view returns (address) {
    return ownerOf[streamId];
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
    emit WithdrawFromLockupStream(streamId, to, amount);
  }

  function isDepleted(uint256 streamId) external view returns (bool) {
    Stream memory stream = streams[streamId];
    return stream.withdrawnAmount >= stream.totalAmount;
  }

  function getStream(uint256 streamId) external view returns (StreamState memory) {
    Stream memory stream = streams[streamId];
    return StreamState({
      sender: stream.sender,
      startTime: stream.startTime,
      cliffTime: stream.startTime,
      isCancelable: stream.cancelable,
      wasCanceled: stream.canceled,
      asset: stream.asset,
      endTime: stream.endTime,
      isDepleted: stream.withdrawnAmount >= stream.totalAmount,
      isStream: address(stream.asset) != address(0),
      amounts: StreamAmounts({
        deposited: stream.totalAmount,
        withdrawn: stream.withdrawnAmount,
        refunded: stream.refundedAmount
      })
    });
  }

  function cancel(uint256 streamId) external {
    Stream storage stream = streams[streamId];
    if (stream.canceled) return;
    stream.canceled = true;
    uint128 refund = stream.totalAmount - vested(stream);
    stream.refundedAmount += refund;
    if (refund != 0) stream.asset.transfer(stream.sender, refund);
    emit CancelLockupStream(streamId, stream.sender, ownerOf[streamId], refund, 0);
  }

  function tokenURI(uint256) external pure returns (string memory) {
    return "data:application/json;base64,eyJuYW1lIjoiTG9jYWwgU3RyZWFtIiwiaW1hZ2UiOiIvimgL2Fzc2V0cy9FWEEuc3ZnIn0=";
  }

  function transferFrom(address from, address to, uint256 streamId) public {
    require(ownerOf[streamId] == from, "WRONG_FROM");
    ownerOf[streamId] = to;
    streams[streamId].recipient = to;
    emit Transfer(from, to, streamId);
  }

  function safeTransferFrom(address from, address to, uint256 streamId) external {
    transferFrom(from, to, streamId);
  }

  function safeTransferFrom(address from, address to, uint256 streamId, bytes calldata) external {
    transferFrom(from, to, streamId);
  }

  function vested(Stream memory stream) internal view returns (uint128) {
    if (block.timestamp <= stream.startTime) return 0;
    if (block.timestamp >= stream.endTime) return stream.totalAmount;
    return uint128((uint256(stream.totalAmount) * (block.timestamp - stream.startTime)) / (stream.endTime - stream.startTime));
  }
}
