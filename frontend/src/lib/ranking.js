// Xếp hạng kiểu thi đấu (1, 1, 3): đồng điểm thì đồng hạng, người kế tiếp bỏ qua các hạng đã chia.
// `items` phải đã sắp giảm dần theo điểm. So theo giá trị `getScore` trả về — truyền điểm đã làm
// tròn như lúc hiển thị, kẻo hai bạn cùng thấy 7.3 mà lại khác hạng.
export const rankByScore = (items, getScore) =>
  items.reduce((ranks, item, i) => {
    const tied = i > 0 && getScore(item) === getScore(items[i - 1]);
    return [...ranks, tied ? ranks[i - 1] : i + 1];
  }, []);
