const db = require("../models");
const notificationService = require("./notificationService");

const pokeMember = async (roomId, leaderUserId, targetMemberId) => {
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");
  if (room.state !== "ongoing") {
    throw new Error("진행 중(ongoing)인 방에서만 콕 찌르기가 가능합니다.");
  }

  const leader = await db.member.findOne({
    where: {
      roomId,
      userId: leaderUserId,
      role: "leader",
      state: "attend",
    },
  });

  if (!leader) {
    throw new Error("방장만 콕 찌르기를 할 수 있습니다.");
  }

  const targetMember = await db.member.findOne({
    where: {
      roomId,
      memberId: targetMemberId,
      state: "attend",
    },
  });

  if (!targetMember) {
    throw new Error("대상 멤버를 찾을 수 없습니다.");
  }

  if (targetMember.role === "leader") {
    throw new Error("방장은 콕 찌를 수 없습니다.");
  }

  await targetMember.increment("pokeCount", { by: 1 });
  await targetMember.reload();

  const pokeLimit = room.poke;
  const canKick = targetMember.pokeCount >= pokeLimit;


  //알림
  await notificationService.createPokeNotification({
    senderMemberId: leader.memberId,
    targetMemberId: targetMember.memberId,
  });

  return {
    memberId: targetMember.memberId,
    pokeCount: targetMember.pokeCount,
    poke: room.poke,
    canKick,
  };
};


const kickMember = async (roomId, leaderUserId, targetMemberId) => {
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");
  if (room.state !== "ongoing") {
    throw new Error("진행 중(ongoing)인 방에서만 강퇴가 가능합니다.");
  }

  const leader = await db.member.findOne({
    where: {
      roomId,
      userId: leaderUserId,
      role: "leader",
      state: "attend",
    },
  });

  if (!leader) {
    throw new Error("방장만 멤버를 강퇴할 수 있습니다.");
  }

  const targetMember = await db.member.findOne({
    where: {
      roomId,
      memberId: targetMemberId,
      state: "attend",
    },
  });

  if (!targetMember) {
    throw new Error("대상 멤버를 찾을 수 없습니다.");
  }

  if (targetMember.role === "leader") {
    throw new Error("방장은 강퇴할 수 없습니다.");
  }

  if (targetMember.pokeCount < room.poke) {
    throw new Error("아직 강퇴할 수 없습니다.");
  }

  await targetMember.destroy();

  // TODO: 알림 기능 연결

  return "멤버를 강퇴했습니다.";
};

module.exports = {
  pokeMember,
  kickMember,
};