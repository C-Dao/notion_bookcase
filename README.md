# douban_book_to_notion

## Introduction
**Use douban's rss source to sync book reading status to the database of notion, this is increasing update, the status includes reading and wanna read, read.**
![](/assets/screenshot_showcase.png)
## How to Use
1. **Goto your douban homepage, Copy your douban's ID, Please save it. We will use it soon.**
  ![](/assets/screenshot_doban_user_id.png)
1. **Duplicate the [notion template](https://benmix.notion.site/d7bb93e54a9e43b3ad04762492880f6f?v=8a0e46806aaa4a2d905639d4c3043bcc)**
![](/assets/screenshot_notion_database.png)
1. **Copy the cloned template's database id. Please save it, We will use it soon.**
  ![](assets/screenshot_notion_database_id.png)
1. **Creating a notion integretion bot and copy the Notion Integration Token.[Learn more](https://developers.notion.com/docs/create-a-notion-integration)**
![](/assets/screenshot_notion_integration_bot.png)
1. **Git clone the repo.**
2. **Setting secrets  for  git actions, add NOTION_TOKEN(step 4), NOTION_BOOK_DATABASE_ID(step 3) and DOUBAN_USER_ID（step 1）**
![](assets/screenshot_add_secrets.png)
1. **First Sync, You can run sync_full action to full sync your douban's book data**
2. **Finally, set the schedule to execute the sync_rss action. you can update the workflow configuration to modify the timing.**

## Credits
**Thanks bambooom's [douban-backup](https://github.com/bambooom/douban-backup)**


## License
[MIT License](/LICENSE)







