import "dotenv/load";
import { BookItem, GoodReadsBookType } from "./types.ts";
import {
  fetchBookItems,
  updateBookItemsInDatabase,
} from "./apis/goodreads_api.ts";

async function fetchFirstPageBookItems(
  shelf: GoodReadsBookType,
  page: number,
  data: BookItem[] = [],
): Promise<BookItem[]> {
  const { data: bookItems } = await fetchBookItems(shelf, page, data);
  return bookItems;
}

const readingBookItems = await fetchFirstPageBookItems("currently-reading", 0);
const wannaReadingBookItems = await fetchFirstPageBookItems("to-read", 0);
const readBookItems = await fetchFirstPageBookItems("read", 0);

const allBookItems: BookItem[] = [
  ...readingBookItems,
  ...wannaReadingBookItems,
  ...readBookItems,
];

updateBookItemsInDatabase(allBookItems);
