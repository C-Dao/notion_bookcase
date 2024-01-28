import "dotenv/load";
import { BookItem, DoubanBookType } from "./types.ts";
import {
  fetchBookItems,
  updateBookItemsInDatabase,
} from "./apis/douban_api.ts";

async function fetchAllBookItems(
  type: DoubanBookType,
  start: number,
  data: BookItem[] = [],
): Promise<BookItem[]> {
  const { data: bookItems, cursor } = await fetchBookItems(type, start, data);
  if (cursor) return fetchAllBookItems(type, cursor, bookItems);
  else return bookItems;
}

const readingBookItems = await fetchAllBookItems("do", 0);
const wannaReadingBookItems = await fetchAllBookItems("wish", 0);
const readBookItems = await fetchAllBookItems("collect", 0);

const allBookItems: BookItem[] = [
  ...readingBookItems,
  ...wannaReadingBookItems,
  ...readBookItems,
];

updateBookItemsInDatabase(allBookItems);
