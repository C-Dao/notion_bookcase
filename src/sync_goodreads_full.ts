import "dotenv/load";
import { BookItem, GoodReadsBookType } from "./types.ts";
import {
  fetchBookItems,
  updateBookItemsInDatabase,
} from "./apis/goodreads_api.ts";

async function fetchAllBookItems(
  shelf: GoodReadsBookType,
  page: number,
  data: BookItem[] = [],
): Promise<BookItem[]> {
  const { data: bookItems, nextPage } = await fetchBookItems(shelf, page, data);
  if (nextPage) return fetchAllBookItems(shelf, nextPage, bookItems);
  else return bookItems;
}

const readingBookItems = await fetchAllBookItems("currently-reading", 0);
const wannaReadingBookItems = await fetchAllBookItems("to-read", 0);
const readBookItems = await fetchAllBookItems("read", 0);

const allBookItems: BookItem[] = [
  ...readingBookItems,
  ...wannaReadingBookItems,
  ...readBookItems,
];

updateBookItemsInDatabase(allBookItems);
