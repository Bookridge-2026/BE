const cron = require("node-cron");
const { Op } = require("sequelize");

module.exports = (models) => {
    // 매일 자정(00:00)에 실행
    cron.schedule("0 0 * * *", async () => {
        console.log("[Scheduler] 방 상태 체크 시작:", new Date().toISOString());

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // 시간 제거, 날짜만 비교

            // ongoing 상태인 방 중, startDate + period <= 오늘인 방을 closed로 변경
            const [updatedCount] = await models.room.update(
                { state: "closed" },
                {
                    where: {
                        state: "ongoing",
                        // sequelize literal로 날짜 연산: startDate + period(일) <= today
                        [Op.and]: [
                            models.sequelize.literal(
                                `DATE_ADD(startDate, INTERVAL period DAY) <= '${today.toISOString().slice(0, 10)}'`
                            ),
                        ],
                    },
                }
            );

            console.log(`[Scheduler] ${updatedCount}개의 방이 closed로 변경되었습니다.`);
        } catch (error) {
            console.error("[Scheduler] 방 상태 업데이트 중 오류 발생:", error);
        }
    });

    console.log("[Scheduler] 방 자동 종료 스케줄러 등록 완료 (매일 00:00)");
};