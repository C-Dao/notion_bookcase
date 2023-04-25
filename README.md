# douban_book_to_notion

## Introduction

Use douban's rss source to sync book reading status to the database of notion, this is increasing update, the status includes reading and wanna read, read.

## Showcase
[BenMix's Bookcase](https://benmix.com/benmix/a40e2bf289d244edbcf2acf0b6acdfc2?v=61358fa5f66942bd8aeaeb714c3d808d)

<img width='70%' src='/assets/screenshot_showcase.png'/>

## How to Use

- Git clone the repository.

- Creating a notion integretion bot and copy the notion integration token. [Learn more](https://developers.notion.com/docs/create-a-notion-integration#step-1-create-an-integration)

- Duplicate the [notion template](https://benmix.notion.site/d7bb93e54a9e43b3ad04762492880f6f?v=8a0e46806aaa4a2d905639d4c3043bcc)
  
  <img width='70%' src='/assets/screenshot_notion_database.png'/>

- Add your created integretion connect to your notion's database. [Learn more](https://developers.notion.com/docs/create-a-notion-integration#step-2-share-a-database-with-your-integration)

- Copy the cloned template's database id. Please save it, We will use it soon. [Learn more](https://developers.notion.com/docs/create-a-notion-integration#step-3-save-the-database-id)

- Goto your douban homepage, Copy your douban's ID, Please save it. We will use it soon.
  
  <img width='70%' src='/assets/screenshot_doban_user_id.png'/>

- Setting secrets for git actions. Add following secrets to your repository actions configuration.
    - NOTION_TOKEN
    - NOTION_BOOK_DATABASE_ID
    - DOUBAN_USER_ID
    
  <img width='70%' src='/assets/screenshot_add_secrets.png'/>

- First Sync, You must run sync_full action to full sync your douban's book reading data.

- Finally, set the schedule to execute the sync_rss action. you can update the workflow configuration to modify the timing.

## Credits

Thanks bambooom's [douban-backup](https://github.com/bambooom/douban-backup)

## License

The Project is undering [MIT License](/LICENSE)







