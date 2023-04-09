import "dotenv/load";
import {
  DB_PROPERTIES,
  DOUBAN_USER_ID,
  RATING_TEXT_FULL,
  STATUS,
} from "./constants.ts";
import { BookItem, BookType } from "./type.ts";
import { DOMParser } from "deno_dom";
import { htmlParser } from "./book_fetch.ts";
import { createPage, queryBooks, updatePage } from "./notion_api.ts";
import { getIDFromURL } from "./utils.ts";

const bookURL =
  templateURL`https://book.douban.com/people/${0}/${1}?${"start"}&sort=time&rating=all&filter=all&mode=list`;

const doubanCookie = await (await fetch("https://book.douban.com")).headers.get(
  "set-cookie",
);

function templateURL(
  spans: TemplateStringsArray,
  ...keys: (string | number)[]
) {
  return (...args: any[]) => {
    const dicts: Record<string, string | number> = args[args.length - 1];
    return spans[0] + keys.map((key, index) => {
      return Number.isInteger(key)
        ? args[key as number] + spans[index + 1]
        : key + "=" + dicts[key] + spans[index + 1];
    }).join("");
  };
}

async function fetchAllBookItems(
  type: BookType,
  start: number,
  data: BookItem[] = [],
): Promise<BookItem[]> {
  const parsedData: BookItem[] = data;
  const response =
    await (await fetch(bookURL(DOUBAN_USER_ID, type, { start }), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cookie": doubanCookie || "",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.62",
      },
    }))
      .text();

  const dom = new DOMParser().parseFromString(response, "text/html")!;
  const [, , end, total] = dom.querySelector(".mode > .subject-num")
    ?.textContent.trim().match(/([\d]+)-([\d]+)\s\/\s([\d]+)/) || [];

  const bookItemContents = dom.querySelectorAll(".list-view li");
  // bugs: https://github.com/b-fuze/deno-dom/issues/4
  bookItemContents.forEach((_, index) => {
    const titleElm = dom.querySelector(
      `.list-view li:nth-of-type(${index + 1}) > div.item-show > div.title > a`,
    );

    const dateElm = dom.querySelector(
      `.list-view li:nth-of-type(${index + 1}) > div.item-show > div.date`,
    );

    const ratingElm = dom.querySelector(`
    .list-view li:nth-of-type(${index + 1}) > div.item-show > div.date > span
    `);

    const link = titleElm?.getAttribute("href")?.trim();
    const title = titleElm?.textContent.trim();
    const markDate = dateElm?.textContent.trim();
    const rating = ratingElm?.getAttribute("class")?.trim();

    parsedData.push({
      [DB_PROPERTIES.条目链接]: link,
      [DB_PROPERTIES.个人评分]:
        RATING_TEXT_FULL[rating as keyof typeof RATING_TEXT_FULL],
      [DB_PROPERTIES.标注日期]: markDate,
      [DB_PROPERTIES.书名]: title,
      [DB_PROPERTIES.状态]: STATUS[type],
    });
  });

  if (Number(end) >= Number(total)) return parsedData;
  else return fetchAllBookItems(type, Number(end), parsedData);
}

const readingBookItems = await fetchAllBookItems("do", 0);
const wannaReadingBookItems = await fetchAllBookItems("wish", 0);
const readBookItems = await fetchAllBookItems("collect", 0);

await Promise.all(readingBookItems.map(async (item) => {
  Object.assign(item, await htmlParser(item[DB_PROPERTIES.条目链接]));
}));

await Promise.all(wannaReadingBookItems.map(async (item) => {
  Object.assign(item, await htmlParser(item[DB_PROPERTIES.条目链接]));
}));

await Promise.all(readBookItems.map(async (item) => {
  Object.assign(item, await htmlParser(item[DB_PROPERTIES.条目链接]));
}));

const allBookItems = [
  ...readingBookItems,
  ...wannaReadingBookItems,
  ...readBookItems,
];

const feedsInDatabase = await queryBooks(
  allBookItems.map((book) => getIDFromURL(book[DB_PROPERTIES.条目链接]) || ""),
);

allBookItems.forEach((feed) => {
  const originFeed = feedsInDatabase.find((item) => {
    return getIDFromURL(item?.[DB_PROPERTIES.条目链接]) ===
      getIDFromURL(feed?.[DB_PROPERTIES.条目链接]);
  }) || {};

  const updatedFeed = Object.assign({}, originFeed, feed);

  if (updatedFeed.page_id) {
    updatePage(updatedFeed);
  } else {
    createPage(updatedFeed);
  }
});
