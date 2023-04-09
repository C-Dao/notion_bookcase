export enum DB_PROPERTIES {
  封面 = "封面",
  书名 = "书名",
  个人评分 = "个人评分",
  标注日期 = "标注日期",
  我的短评 = "我的短评",
  条目链接 = "条目链接",
  出版日期 = "出版日期",
  出版社 = "出版社",
  作者 = "作者",
  译者 = "译者",
  ISBN = "ISBN",
  丛书 = "丛书",
  出品方 = "出品方",
  状态 = "状态",
}

export const PropertyType: Record<keyof typeof DB_PROPERTIES, string> = {
  封面: "files",
  书名: "title",
  个人评分: "multi_select",
  标注日期: "date",
  我的短评: "rich_text",
  条目链接: "url",
  出版日期: "date",
  出版社: "rich_text",
  作者: "rich_text",
  ISBN: "rich_text",
  状态: "multi_select",
  译者: "rich_text",
  丛书: "rich_text",
  出品方: "rich_text",
};

export enum RATING_TEXT {
  很差 = "⭐",
  较差 = "⭐⭐",
  还行 = "⭐⭐⭐",
  推荐 = "⭐⭐⭐⭐",
  力荐 = "⭐⭐⭐⭐⭐",
}

export enum RATING_TEXT_FULL {
  "rating1-t" = "⭐",
  "rating2-t" = "⭐⭐",
  "rating3-t" = "⭐⭐⭐",
  "rating4-t" = "⭐⭐⭐⭐",
  "rating5-t" = "⭐⭐⭐⭐⭐",
}

export enum STATUS {
  collect = "读过",
  do = "在读",
  wish = "想读",
}

export enum EMOJI {
  在读 = "📖",
  读过 = "📕",
  想读 = "🔖",
}

export const DOUBAN_USER_ID = Deno.env.get("DOUBAN_USER_ID");
export const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
export const NOTION_BOOK_DATABASE_ID = Deno.env.get("NOTION_BOOK_DATABASE_ID");
