import { message } from '../message';

import { state } from '../state';
import { data } from '../data';
import { bookmark } from '../bookmark';
import { group } from '../group';
import { groupAndBookmark } from '../groupAndBookmark';

import { Button } from '../button';
import { Video } from '../video';
import { Modal } from '../modal';
import { StagedBookmark } from '../stagedBookmark';
import { StagedGroup } from '../stagedGroup';
import { BookmarkForm } from '../bookmarkForm';

import { node } from '../../utility/node';
import { complexNode } from '../../utility/complexNode';
import { isValidString } from '../../utility/isValidString';
import { trimString } from '../../utility/trimString';
import { getFaviconUrl } from '../../utility/getFaviconUrl';

const BookmarkTile = function({
  bookmarkData = {},
  preview = false
} = {}) {

  this.data = bookmarkData;

  this.element = {
    bookmark: node('div|class:bookmark'),
    front: node('div|class:bookmark-front'),
    back: node('div|class:bookmark-back'),
    content: {
      link: node('a|class:bookmark-link,tabindex:1'),
      display: {
        wrap: node('div|class:bookmark-display-wrap'),
        display: node('div|class:bookmark-display'),
        visual: {
          visual: node('div|class:bookmark-display-visual'),
          letter: complexNode({ tag: 'div', text: bookmarkData.link.display.visual.letter.text, attr: [{ key: 'class', value: 'bookmark-display-visual-letter' }] }),
          icon: node('div|class:bookmark-display-visual-icon'),
          faIcon: node('div|class:' + bookmarkData.link.display.visual.icon.prefix + ' fa-' + bookmarkData.link.display.visual.icon.name),
          image: node('div|class:bookmark-display-visual-image')
        },
        name: {
          name: node('div|class:bookmark-display-name'),
          text: complexNode({ tag: 'div', text: bookmarkData.link.display.name.text, attr: [{ key: 'class', value: 'bookmark-display-name-text' }] })
        }
      },
      background: {
        wrap: node('div|class:bookmark-background-wrap'),
        image: node('div|class:bookmark-background-image'),
        video: node('div|class:bookmark-background-video')
      }
    },
    url: {
      url: node('div|class:bookmark-url'),
      text: node('span|class:bookmark-url-text')
    },
    control: node('div|class:bookmark-control')
  };

  if (preview) { this.element.bookmark.classList.add('bookmark-preview'); }

  this.control = {};

  this.control.button = {
    left: new Button({
      text: message.get('bookmarkTileControlLeft'),
      srOnly: true,
      iconName: 'arrowKeyboardLeft',
      style: ['link'],
      title: message.get('bookmarkTileControlLeft'),
      classList: ['bookmark-control-button', 'bookmark-control-left'],
      func: () => {

        bookmarkData.position.destination.item--;

        if (bookmarkData.position.destination.item < 0) {
          bookmarkData.position.destination.item = 0;
        }

        bookmark.item.mod.move(bookmarkData);

        groupAndBookmark.render();

        data.save();

      }
    }),
    sort: new Button({
      text: message.get('bookmarkTileControlSort'),
      srOnly: true,
      iconName: 'drag',
      style: ['link'],
      title: message.get('bookmarkTileControlSort'),
      classList: ['bookmark-control-button', 'bookmark-control-sort']
    }),
    right: new Button({
      text: message.get('bookmarkTileControlRight'),
      srOnly: true,
      iconName: 'arrowKeyboardRight',
      style: ['link'],
      title: message.get('bookmarkTileControlRight'),
      classList: ['bookmark-control-button', 'bookmark-control-right'],
      func: () => {

        bookmarkData.position.destination.item++;

        if (bookmarkData.position.destination.item > bookmark.all[bookmarkData.position.destination.group].items.length - 1) {
          bookmarkData.position.destination.item = bookmark.all[bookmarkData.position.destination.group].items.length - 1;
        }

        bookmark.item.mod.move(bookmarkData);

        groupAndBookmark.render();

        data.save();

      }
    }),
    edit: new Button({
      text: message.get('bookmarkTileControlEdit'),
      srOnly: true,
      iconName: 'edit',
      style: ['link'],
      title: message.get('bookmarkTileControlEdit'),
      classList: ['bookmark-control-button', 'bookmark-control-edit'],
      func: () => {

        const newBookmarkData = new StagedBookmark();

        newBookmarkData.link = JSON.parse(JSON.stringify(bookmarkData.link));

        newBookmarkData.position = JSON.parse(JSON.stringify(bookmarkData.position));

        newBookmarkData.type.existing = true;

        const bookmarkForm = new BookmarkForm({ bookmarkData: newBookmarkData });

        const editModal = new Modal({
          heading: isValidString(newBookmarkData.link.display.name.text) ? `${message.get('bookmarkEditHeadingName')} ${newBookmarkData.link.display.name.text}` : message.get('bookmarkEditHeadingUnnamed'),
          content: bookmarkForm.form(),
          successText: message.get('bookmarkEditSuccessText'),
          cancelText: message.get('bookmarkEditCancelText'),
          width: (state.get.current().bookmark.style === 'block') ? 60 : 70,
          maxHeight: true,
          successAction: () => {

            switch (newBookmarkData.group.destination) {
              case 'new': {
                newBookmarkData.position.destination.group = bookmark.all.length;

                const newGroupData = new StagedGroup();

                newGroupData.newGroup({
                  name: newBookmarkData.group.name
                });

                group.item.mod.add(newGroupData);

                break;
              }
            }

            bookmark.item.mod.edit(newBookmarkData);

            bookmark.item.mod.propagate(newBookmarkData);

            groupAndBookmark.render();

            data.save();

          }
        });

        editModal.open();

        bookmarkForm.tab.update();

      }
    }),
    remove: new Button({
      text: message.get('bookmarkTileControlRemove'),
      srOnly: true,
      iconName: 'cross',
      style: ['link'],
      title: message.get('bookmarkTileControlRemove'),
      classList: ['bookmark-control-button', 'bookmark-control-remove'],
      func: () => {

        const removeModal = new Modal({
          heading: isValidString(bookmarkData.link.display.name.text) ? `${message.get('bookmarkRemoveHeadingName')} ${bookmarkData.link.display.name.text}` : message.get('bookmarkRemoveHeadingUnnamed'),
          content: message.get('bookmarkRemoveContent'),
          successText: message.get('bookmarkRemoveSuccessText'),
          cancelText: message.get('bookmarkRemoveCancelText'),
          width: 'small',
          successAction: () => {

            bookmark.item.mod.remove(bookmarkData);

            groupAndBookmark.render();

            data.save();

          }
        });

        removeModal.open();

      }
    })
  };

  this.control.disable = () => {

    for (var key in this.control.button) {
      this.control.button[key].disable();
    }

    this.control.searchState();

  };

  this.control.enable = () => {

    for (var key in this.control.button) {
      this.control.button[key].enable();
    }

    this.control.searchState();

  };

  this.control.searchState = () => {

    if (state.get.current().search) {
      this.control.button.left.disable();
      this.control.button.right.disable();
      this.control.button.sort.disable();
    } else if (state.get.current().bookmark.edit && !state.get.current().search) {
      this.control.button.left.enable();
      this.control.button.right.enable();
      this.control.button.sort.enable();
    }

  };

  this.style = (newBookmarkData) => {

    if (newBookmarkData) {
      bookmarkData = newBookmarkData;
    }

    if (bookmarkData.link.isSeparator) {
      this.element.bookmark.classList.add('is-bookmark-separator');
      this.element.bookmark.classList.remove('is-bookmark-folder');
      this.element.content.link.removeAttribute('href');
      this.element.content.link.removeAttribute('target');
      this.element.content.link.setAttribute('tabindex', '-1');
    } else if (bookmarkData.link.isFolder) {
      this.element.bookmark.classList.remove('is-bookmark-separator');
      this.element.bookmark.classList.add('is-bookmark-folder');
      this.element.content.link.setAttribute('href', '#');
      this.element.content.link.removeAttribute('target');
    } else {
      this.element.bookmark.classList.remove('is-bookmark-separator');
      this.element.bookmark.classList.remove('is-bookmark-folder');
      if (isValidString(bookmarkData.link.url) && !preview) {
        this.element.content.link.setAttribute('href', trimString(bookmarkData.link.url));
      } else {
        this.element.content.link.setAttribute('href', '#');
      }

      if (state.get.current().bookmark.newTab && !preview) {
        this.element.content.link.setAttribute('target', '_blank');
      }
    }

    if (!preview) {
      this.element.bookmark.style.setProperty('--bookmark-transition-delay', bookmarkData.position.origin.item);
    }

    this.element.bookmark.style.setProperty('--theme-bookmark-item-opacity', bookmarkData.link.color.opacity);

    if (bookmarkData.link.color.opacity < 100) {
      this.element.bookmark.style.setProperty('--bookmark-clip-padding', 0);
    }

    if (bookmarkData.link.color.opacity < 40) {

      this.element.bookmark.classList.add('is-bookmark-opacity-low');

    } else {

      this.element.bookmark.classList.remove('is-bookmark-opacity-low');

    }

    if (preview) {
      const alignment = ['top-left', 'top-center', 'top-right', 'center-left', 'center-center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];

      alignment.forEach((item) => {
        this.element.bookmark.classList.remove('is-bookmark-alignment-' + item);
      });
      const order = ['visual-name', 'name-visual'];

      order.forEach((item) => {
        this.element.bookmark.classList.remove('is-bookmark-order-' + item);
      });
      const direction = ['vertical', 'horizontal'];

      direction.forEach((item) => {
        this.element.bookmark.classList.remove('is-bookmark-direction-' + item);
      });
    }

    this.element.bookmark.classList.add('is-bookmark-alignment-' + bookmarkData.link.display.alignment);

    this.element.bookmark.classList.add('is-bookmark-order-' + bookmarkData.link.display.order);

    this.element.bookmark.classList.add('is-bookmark-direction-' + bookmarkData.link.display.direction);

    this.element.bookmark.style.setProperty('--bookmark-display-translate-x', bookmarkData.link.display.translate.x);

    this.element.bookmark.style.setProperty('--bookmark-display-translate-y', bookmarkData.link.display.translate.y);

    this.element.bookmark.style.setProperty('--bookmark-display-rotate', bookmarkData.link.display.rotate);

    this.element.bookmark.style.setProperty('--bookmark-display-gutter', bookmarkData.link.display.gutter);

    this.element.bookmark.style.setProperty('--bookmark-display-visual-size', bookmarkData.link.display.visual.size);

    this.element.bookmark.style.setProperty('--bookmark-display-visual-image-url', 'url("' + trimString(bookmarkData.link.display.visual.image.url) + '")');

    this.element.bookmark.style.setProperty('--bookmark-display-name-size', bookmarkData.link.display.name.size);

    this.element.bookmark.style.setProperty('--bookmark-border', bookmarkData.link.border);

    if (bookmarkData.link.accent.by == 'custom') {

      this.element.bookmark.style.setProperty('--theme-accent-rgb-r', bookmarkData.link.accent.rgb.r);

      this.element.bookmark.style.setProperty('--theme-accent-rgb-g', bookmarkData.link.accent.rgb.g);

      this.element.bookmark.style.setProperty('--theme-accent-rgb-b', bookmarkData.link.accent.rgb.b);

      this.element.bookmark.style.setProperty('--theme-accent', 'var(--theme-accent-rgb-r), var(--theme-accent-rgb-g), var(--theme-accent-rgb-b)');

      this.element.bookmark.style.setProperty('--theme-accent-text', '0, 0%, calc(((((var(--theme-accent-rgb-r) * var(--theme-t-r)) + (var(--theme-accent-rgb-g) * var(--theme-t-g)) + (var(--theme-accent-rgb-b) * var(--theme-t-b))) / 255) - var(--theme-t)) * -10000000%)');

      this.element.bookmark.style.setProperty('--bookmark-display-visual-color', 'var(--theme-accent)');

    }

    if (bookmarkData.link.display.visual.shadow.size > 0) {

      this.element.bookmark.style.setProperty('--bookmark-display-visual-shadow-size', bookmarkData.link.display.visual.shadow.size);

      this.element.bookmark.style.setProperty('--bookmark-display-visual-shadow-offset', '0.1');

      this.element.bookmark.style.setProperty('--bookmark-display-visual-shadow-blur', '0.1');

      this.element.bookmark.style.setProperty('--bookmark-display-visual-shadow-opacity', '0.1');

      this.element.bookmark.style.setProperty(
        '--bookmark-display-visual-shadow',
        '0 ' +
        'calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-offset) * 8)) * 0.01em) ' +
        'calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-blur) * 8))  * 0.01em)' +
        'rgba(0, 0, 0, calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-opacity) / 25) * 1))), ' +
        '0 ' +
        'calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-offset) * 16)) * 0.01em) ' +
        'calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-blur) * 16))  * 0.01em)' +
        'rgba(0, 0, 0, calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-opacity) / 25) * 2))), ' +
        '0 ' +
        'calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-offset) * 32)) * 0.01em) ' +
        'calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-blur) * 32))  * 0.01em)' +
        'rgba(0, 0, 0, calc(var(--bookmark-display-visual-shadow-size) * calc(calc(var(--bookmark-display-visual-shadow-opacity) / 25) * 3)))'
      );

    } else {

      this.element.bookmark.style.removeProperty('--bookmark-display-visual-shadow-size');

      this.element.bookmark.style.removeProperty('--bookmark-display-visual-shadow-offset');

      this.element.bookmark.style.removeProperty('--bookmark-display-visual-shadow-blur');

      this.element.bookmark.style.removeProperty('--bookmark-display-visual-shadow-opacity');

      this.element.bookmark.style.removeProperty('--bookmark-display-visual-shadow');

    }

    if (bookmarkData.link.color.by == 'custom') {

      this.element.bookmark.style.setProperty('--theme-color-r', bookmarkData.link.color.rgb.r);

      this.element.bookmark.style.setProperty('--theme-color-g', bookmarkData.link.color.rgb.g);

      this.element.bookmark.style.setProperty('--theme-color-b', bookmarkData.link.color.rgb.b);

      this.element.bookmark.style.setProperty('--theme-color-h', bookmarkData.link.color.hsl.h);

      this.element.bookmark.style.setProperty('--theme-color-s', bookmarkData.link.color.hsl.s);

      this.element.bookmark.style.setProperty('--theme-color-l', bookmarkData.link.color.hsl.l);

      this.element.bookmark.style.setProperty('--theme-color', bookmarkData.link.color.hsl.h + ', ' + bookmarkData.link.color.hsl.s + '%, ' + bookmarkData.link.color.hsl.l + '%');

      this.element.bookmark.style.setProperty('--theme-color-text', '0, 0%, calc(((((var(--theme-color-r) * var(--theme-t-r)) + (var(--theme-color-g) * var(--theme-t-g)) + (var(--theme-color-b) * var(--theme-t-b))) / 255) - var(--theme-t)) * -10000000%)');

      this.element.bookmark.style.setProperty('--bookmark-color', 'var(--theme-color)');

      this.element.bookmark.style.setProperty('--bookmark-color-focus-hover', 'var(--theme-color)');

      this.element.bookmark.style.setProperty('--bookmark-display-visual-color-focus-hover', 'var(--theme-color-text)');

      this.element.bookmark.style.setProperty('--bookmark-display-name-color', 'var(--theme-color-text)');

      this.element.bookmark.style.setProperty('--bookmark-display-name-color-focus-hover', 'var(--theme-color-text)');

      this.element.bookmark.style.setProperty('--button-link-text', 'var(--theme-color-text)');

      this.element.bookmark.style.setProperty('--button-link-text-focus-hover', 'var(--theme-color-text)');

      this.element.bookmark.style.setProperty('--button-link-text-active', 'var(--theme-color-text)');

    }

    if (bookmarkData.link.background.show) {
      this.element.bookmark.style.setProperty('--bookmark-background-opacity', bookmarkData.link.background.opacity);

      switch (bookmarkData.link.background.type) {
        case 'image':
          if (isValidString(bookmarkData.link.background.image.url)) {
            this.element.bookmark.style.setProperty('--bookmark-background-image-url', 'url("' + trimString(bookmarkData.link.background.image.url) + '")');
          }
          break;
      }
    }

    if (bookmarkData.link.shape.tall) {
      this.element.bookmark.classList.add('bookmark-tall');
    }

    if (bookmarkData.link.shape.wide) {
      this.element.bookmark.classList.add('bookmark-wide');
    }

  };

  this.createFolderGrid = (items) => {
    const grid = node('div|class:bookmark-display-visual-folder-grid');
    const childItems = items.slice(0, 4);

    grid.classList.add('grid-' + Math.min(childItems.length, 4));

    const shape = (bookmarkData.link.folderPreviewShape && bookmarkData.link.folderPreviewShape !== 'default')
      ? bookmarkData.link.folderPreviewShape
      : (state.get.current()?.bookmark?.folderPreviewShape || 'tile');

    if (shape === 'circle') {
      grid.classList.add('is-shape-circle');
    } else {
      grid.classList.add('is-shape-tile');
    }

    let cache = {};
    try {
      const raw = localStorage.getItem('nightTabFaviconCache');
      cache = raw ? JSON.parse(raw) : {};
    } catch (e) {
      cache = {};
    }
    const provider = state.get.current()?.bookmark?.faviconService || 'native';

    childItems.forEach((child) => {
      const itemEl = node('div|class:bookmark-folder-mini-item');
      if (child.isFolder) {
        itemEl.appendChild(node('span|class:bookmark-folder-mini-icon fas fa-folder'));
      } else if (child.display?.visual?.type === 'image' && isValidString(child.display?.visual?.image?.url)) {
        const img = node('span|class:bookmark-folder-mini-img');
        img.style.backgroundImage = 'url("' + trimString(child.display.visual.image.url) + '")';
        itemEl.appendChild(img);
      } else if (child.url) {
        const fav = getFaviconUrl(child.url, provider, cache);
        if (fav) {
          const img = node('span|class:bookmark-folder-mini-img');
          img.style.backgroundImage = 'url("' + fav + '")';
          itemEl.appendChild(img);
        } else if (child.display?.visual?.letter?.text) {
          const letter = node('span|class:bookmark-folder-mini-letter');
          letter.textContent = child.display.visual.letter.text.slice(0, 2);
          itemEl.appendChild(letter);
        } else {
          const letter = node('span|class:bookmark-folder-mini-letter');
          const txt = (child.display?.name?.text || child.url || '?').charAt(0).toUpperCase();
          letter.textContent = txt;
          itemEl.appendChild(letter);
        }
      } else if (child.display?.visual?.type === 'icon' && isValidString(child.display?.visual?.icon?.name)) {
        itemEl.appendChild(node('span|class:bookmark-folder-mini-icon ' + (child.display.visual.icon.prefix || 'fas') + ' fa-' + child.display.visual.icon.name));
      } else if (child.display?.visual?.letter?.text) {
        const letter = node('span|class:bookmark-folder-mini-letter');
        letter.textContent = child.display.visual.letter.text.slice(0, 2);
        itemEl.appendChild(letter);
      } else {
        const letter = node('span|class:bookmark-folder-mini-letter');
        const txt = (child.display?.name?.text || child.url || '?').charAt(0).toUpperCase();
        letter.textContent = txt;
        itemEl.appendChild(letter);
      }
      grid.appendChild(itemEl);
    });

    return grid;
  };

  this.assemble = () => {

    if (bookmarkData.link.isSeparator) {
      const line = node('div|class:bookmark-separator-line');
      this.element.content.link.appendChild(line);
      this.element.content.link.removeAttribute('href');
      this.element.content.link.setAttribute('tabindex', '-1');
    } else if (bookmarkData.link.display.visual.show || bookmarkData.link.display.name.show) {
      if (bookmarkData.link.display.visual.show) {
        let isFolderPreview = false;
        if (bookmarkData.link.isFolder && state.get.current()?.bookmark?.folderPreview !== false) {
          const items = bookmarkData.link.items || [];
          if (items.length > 0 && bookmarkData.link.display.visual.type === 'icon' && bookmarkData.link.display.visual.icon.name === 'folder') {
            isFolderPreview = true;
            this.element.content.display.visual.visual.appendChild(this.createFolderGrid(items));
            this.element.content.display.display.appendChild(this.element.content.display.visual.visual);
          }
        }

        if (!isFolderPreview) {
          switch (bookmarkData.link.display.visual.type) {
            case 'letter':
              if (isValidString(bookmarkData.link.display.visual.letter.text)) {
                this.element.content.display.visual.visual.appendChild(this.element.content.display.visual.letter);
                this.element.content.display.display.appendChild(this.element.content.display.visual.visual);
              }
              break;

            case 'icon':
              if (isValidString(bookmarkData.link.display.visual.icon.name)) {
                this.element.content.display.visual.icon.appendChild(this.element.content.display.visual.faIcon);
                this.element.content.display.visual.visual.appendChild(this.element.content.display.visual.icon);
                this.element.content.display.display.appendChild(this.element.content.display.visual.visual);
              }
              break;

            case 'image':
              if (isValidString(bookmarkData.link.display.visual.image.url)) {
                this.element.content.display.visual.visual.appendChild(this.element.content.display.visual.image);
                this.element.content.display.display.appendChild(this.element.content.display.visual.visual);
              } else if (isValidString(bookmarkData.link.display.visual.letter.text)) {
                this.element.content.display.visual.visual.appendChild(this.element.content.display.visual.letter);
                this.element.content.display.display.appendChild(this.element.content.display.visual.visual);
              }
              break;
          }
        }
      }

      if (bookmarkData.link.display.name.show && isValidString(bookmarkData.link.display.name.text)) {
        this.element.content.display.name.name.appendChild(this.element.content.display.name.text);
        this.element.content.display.display.appendChild(this.element.content.display.name.name);
      }

      this.element.content.display.wrap.appendChild(this.element.content.display.display);

      this.element.content.link.appendChild(this.element.content.display.wrap);
    }

    if (!bookmarkData.link.isSeparator && bookmarkData.link.background.show) {

      switch (bookmarkData.link.background.type) {

        case 'image':

          this.element.content.background.wrap.appendChild(this.element.content.background.image);

          break;

        case 'video':

          this.element.content.background.wrap.appendChild(this.element.content.background.video);

          if (isValidString(bookmarkData.link.background.video.url)) {

            this.video = new Video({
              url: bookmarkData.link.background.video.url
            });

            this.element.content.background.video.appendChild(this.video.video);

            this.bind.add();

          } else {

            this.video = false;

            this.bind.remove();

          }

          break;
      }

      this.element.content.link.appendChild(this.element.content.background.wrap);

    }

    this.element.bookmark.appendChild(this.element.front);

    this.element.bookmark.appendChild(this.element.back);

    this.element.front.appendChild(this.element.content.link);

    this.element.control.appendChild(this.control.button.left.button);

    this.element.control.appendChild(this.control.button.sort.button);

    this.element.control.appendChild(this.control.button.right.button);

    this.element.control.appendChild(this.control.button.edit.button);

    this.element.control.appendChild(this.control.button.remove.button);

    this.element.back.appendChild(this.element.control);

    if (bookmarkData.link.isSeparator) {
      this.element.content.link.addEventListener('click', (e) => {
        e.preventDefault();
      });
    } else if (bookmarkData.link.isFolder && !preview) {
      this.element.content.link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.get.current().bookmark.edit) {
          group.nav.enter(bookmarkData.position.destination.group, bookmarkData.link);
        }
      });

      const count = (bookmarkData.link.items || []).length;
      const countText = count === 1 ? '1 item' : `${count} items`;
      this.element.url.text.textContent = countText;
      this.element.url.text.title = (bookmarkData.link.display?.name?.text || 'Folder') + ` (${countText})`;
      this.element.url.url.appendChild(this.element.url.text);
      this.element.back.appendChild(this.element.url.url);
    } else if (isValidString(bookmarkData.link.url)) {

      this.element.url.text.textContent = trimString(bookmarkData.link.url).replace(/^https?:\/\//i, '').replace('www.', '').replace(/\/+$/, '');

      this.element.url.text.title = trimString(bookmarkData.link.url);

      this.element.url.url.appendChild(this.element.url.text);

      this.element.back.appendChild(this.element.url.url);

    }

    if (state.get.current().bookmark.edit) {
      this.control.enable();
    } else {
      this.control.disable();
    }

  };

  this.tile = () => {

    return this.element.bookmark;

  };

  this.update = (newBookmarkData) => {

    this.style(newBookmarkData);

  };

  this.bind = {
    add: () => {

      if (this.video) {

        this.video.bind.add();

      }

    },
    remove: () => {

      if (this.video) {

        this.video.bind.remove();

      }

    }
  };

  this.clear = () => {

    this.bind.remove();

  };

  this.video = false;

  this.assemble();

  this.style();

};

export { BookmarkTile };
