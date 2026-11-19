/* 粉碎词汇 · 痕迹上报配置
   这里的 anon key 是公开的，Supabase 设计上允许它出现在前端；
   真正的保护靠数据库的 RLS 策略：只允许插入和读取，不允许修改和删除。 */
window.VOCAB_TRACE = {
  url: "https://sbvggtlwcxhegjrhsxia.supabase.co",
  key: "sb_publishable_dHlLWzFbsa1_QyW77NkAxQ_eD8rP6T0",
  table: "review_log"
};
