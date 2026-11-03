# 词条数据维护

`data/terms.js` 是唯一数据源，`db/seed.sql` 由它生成。改词条请改数据源，不要手改 seed。

## 结构

- `root.TERMS = [...]` —— 原有的 24 条物料，以及部分部件 / 化学品 / 物性
- `root.TERMS.push(...)` —— 扩充词库（部件、化学品、物性）
- 物料段按**莫氏硬度升序**排列，按硬度值分组并有注释

## 脚本

```sh
node scripts/parse-terms.js        # 仅解析校验（被下面两个脚本复用）
node scripts/sort-mohs.js          # 预览物料排序
node scripts/sort-mohs.js --apply  # 补莫氏硬度并按硬度升序重排
node scripts/merge-minerals.js --apply  # 矿物词条合并（形态词 → 精编矿物）
node scripts/build-seed.mjs        # 生成 db/seed.sql
```

三个脚本都可以重复执行，结果是幂等的。

## 矿物数据

`scripts/data/mineral-*.js` 是 77 条矿物的精编数据（化学式、词根、密度、解理、工程特性），
`merge-minerals.js` 从这三份文件生成词条。要改某条矿物的说法，改这里再跑脚本，
不要直接改 `data/terms.js` 里那一行——下次重跑会被覆盖。

## 硬度口径

- 区间取中值（长石 6–6.5 → 6.25，赤铁矿 5–6 → 5.5）
- 粉体 / 混合料取主要物相（粉煤灰 5.5、矿渣 4.5、熟料 6.5、刚玉 9、碳化硅 9.25）
- 原有 24 条保留原来的文字写法（如「1（最软标准矿物）」），只取数值参与排序

## 踩过的坑

`terms.js` 里化学式带括号（`Ca(OH)₂`、`Al(OH)₃`），所以**不能按括号配对切条目**，
也不能用「行尾 `)`」判断条目结束——正确判断是「行尾 `),`」。
