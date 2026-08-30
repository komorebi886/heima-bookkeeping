// 预设分类种子数据（v1 内置分类，见 docs/产品文档.md 第三节）
// 每个大类保留「其他」兜底小类，保证任何一笔账都有地方可记

export const expenseCategories = [
  { name: '餐饮', children: ['早餐', '午餐', '晚餐', '外卖', '水果零食', '饮品甜点', '聚餐请客', '其他'] },
  { name: '交通', children: ['公交地铁', '打车', '加油', '停车', '火车', '飞机', '汽车保养', '其他'] },
  { name: '居住', children: ['房租', '房贷', '水电燃气', '物业费', '网络宽带', '话费通讯', '居家日用', '其他'] },
  { name: '购物', children: ['服饰鞋包', '美妆个护', '数码家电', '家居家纺', '书籍文具', '宠物用品', '其他'] },
  { name: '娱乐', children: ['电影演出', '游戏充值', '旅游度假', '运动健身', '唱K聚会', '兴趣爱好', '其他'] },
  { name: '医疗', children: ['药品', '门诊挂号', '住院手术', '体检', '保健养生', '其他'] },
  { name: '教育', children: ['学费', '培训课程', '考试报名', '图书资料', '亲子教育', '其他'] },
  { name: '人情', children: ['随礼红包', '孝敬父母', '请客送礼', '捐款公益', '其他'] },
  { name: '其他', children: ['手续费', '罚款', '其他支出'] }
]

export const incomeCategories = [
  { name: '工资', children: ['工资', '奖金', '津贴', '兼职收入'] },
  { name: '理财', children: ['利息', '基金收益', '股票收益', '理财到期'] },
  { name: '红包', children: ['微信红包', '支付宝红包', '压岁钱', '礼物折现'] },
  { name: '其他', children: ['报销', '退款', '二手转卖', '借款收回'] }
]

// 把预设分类写入数据库（只在分类表为空时执行一次）
export function seedCategories(db) {
  const insertCat = db.prepare('INSERT INTO categories (type, name, sort_order) VALUES (?, ?, ?)')
  const insertSub = db.prepare('INSERT INTO sub_categories (category_id, name, sort_order) VALUES (?, ?, ?)')

  const seed = db.transaction(() => {
    expenseCategories.forEach((cat, i) => {
      const info = insertCat.run('expense', cat.name, i)
      cat.children.forEach((sub, j) => insertSub.run(info.lastInsertRowid, sub, j))
    })
    incomeCategories.forEach((cat, i) => {
      const info = insertCat.run('income', cat.name, i)
      cat.children.forEach((sub, j) => insertSub.run(info.lastInsertRowid, sub, j))
    })
  })
  seed()
}
