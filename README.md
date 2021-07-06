# Yet-Another-LinkAce-Extension

## About

An unoffical chrome extension for [LinkAce](https://github.com/Kovah/LinkAce).

## Screenshot

![](https://img.azlith.com/03/c111bd7b3d78d.png)

![](https://img.azlith.com/06/5604fa329b707.png)

## Feature

- add new bookmarks.
- edit existing bookmarks.
- autocomplete for tags and lists.
- check current page automatically.
- search links in address bar.
- ...

**The extension is still in developing since it cannot meet my needs 100% now. More features may be added in the furture.**

## Installation

For users who are experienced in Chrome, please feel free to download it from release and use it under development mode.

~~For users who are not willing to keep development mode on (like me), I will publish its chrome web store url when it pass the chrome web store reviews.~~

For users who are not willing to keep development mode on (like me), the extension is available in [chrome web storehere](https://chrome.google.com/webstore/detail/yet-another-linkace-exten/ladekkfhihppgfcjgaimgggecekfhmho).

## Usage

### Search Links in Address Bar

Following search operators are allowed in Yet Another LinkAce Extension:

- any input started with `#` will be recogized as tags.
- any input started with `@` will be recogized as lists.
- any other input will be recogized as parts of urls.

These search operators could be used multi times and be handled as AND.

For example, `google @list1 #tag1 @list2 #tag2` will match links meet requirements bellow:

1. be in both list1 and list2 
2. be tagged both tag1 and tag2
3. contains _google_ in url.

### Check current page status

This extension will check whether current page has beed bookmarked already and then chage the badge according to the result automatically.

- current page is in LinkAce:![current page is in LinkAce](https://img.azlith.com/03/d00d5c0294bf3.png)
- current page is not in LinkAce:![current page is not in LinkAce](https://img.azlith.com/03/21459f8f15326.png)
- current page is under checking:![current page is under checking](https://img.azlith.com/03/8ad490c24899b.png)
- something went wrong(like network is break down or api setting is not correct) :![something is wrong](https://img.azlith.com/03/8a308ab4dbc9c.png)