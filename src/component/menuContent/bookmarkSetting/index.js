import { message } from '../../message';

import { state } from '../../state';
import { data } from '../../data';
import { bookmark } from '../../bookmark';
import { bookmarkBrowser } from '../../bookmarkBrowser';
import { layout } from '../../layout';
import { groupAndBookmark } from '../../groupAndBookmark';

import * as form from '../../form';

import { Button } from '../../button';
import { Collapse } from '../../collapse';
import { Edge } from '../../edge';

import { Control_helperText } from '../../control/helperText';
import { Control_radio } from '../../control/radio';
import { Control_checkbox } from '../../control/checkbox';
import { Control_slider } from '../../control/slider';

import { node } from '../../../utility/node';
import { applyCSSVar } from '../../../utility/applyCSSVar';
import { applyCSSClass } from '../../../utility/applyCSSClass';
import { applyCSSState } from '../../../utility/applyCSSState';

const bookmarkSetting = {};

bookmarkSetting.control = {
  general: {},
  style: {},
  orientation: {},
  sort: {}
};

bookmarkSetting.disable = () => {

  if (state.get.current().bookmark.show) {
    if (bookmarkSetting.control.general.browserSync) {
      bookmarkSetting.control.general.browserSync.enable();
    }
    if (bookmarkSetting.control.general.browserSyncNow) {
      bookmarkSetting.control.general.browserSyncNow.enable();
    }
    bookmarkSetting.control.general.size.enable();
    bookmarkSetting.control.general.urlShow.enable();
    bookmarkSetting.control.general.lineShow.enable();
    bookmarkSetting.control.general.shadowShow.enable();
    bookmarkSetting.control.general.hoverScaleShow.enable();
    if (bookmarkSetting.control.general.folderPreview) {
      bookmarkSetting.control.general.folderPreview.enable();
    }
    if (bookmarkSetting.control.general.folderPreviewShape) {
      if (state.get.current().bookmark.folderPreview) {
        bookmarkSetting.control.general.folderPreviewShape.enable();
      } else {
        bookmarkSetting.control.general.folderPreviewShape.disable();
      }
    }
    bookmarkSetting.control.general.newTab.enable();
    bookmarkSetting.control.style.enable();
    bookmarkSetting.control.orientation.orientationElement.enable();
    bookmarkSetting.control.orientation.orientationHelper.enable();
    bookmarkSetting.control.sort.letter.enable();
    bookmarkSetting.control.sort.icon.enable();
    bookmarkSetting.control.sort.name.enable();
  } else {
    if (bookmarkSetting.control.general.browserSync) {
      bookmarkSetting.control.general.browserSync.disable();
    }
    if (bookmarkSetting.control.general.browserSyncNow) {
      bookmarkSetting.control.general.browserSyncNow.disable();
    }
    bookmarkSetting.control.general.size.disable();
    bookmarkSetting.control.general.urlShow.disable();
    bookmarkSetting.control.general.lineShow.disable();
    bookmarkSetting.control.general.shadowShow.disable();
    bookmarkSetting.control.general.hoverScaleShow.disable();
    if (bookmarkSetting.control.general.folderPreview) {
      bookmarkSetting.control.general.folderPreview.disable();
    }
    if (bookmarkSetting.control.general.folderPreviewShape) {
      bookmarkSetting.control.general.folderPreviewShape.disable();
    }
    bookmarkSetting.control.general.newTab.disable();
    bookmarkSetting.control.style.disable();
    bookmarkSetting.control.orientation.orientationElement.disable();
    bookmarkSetting.control.orientation.orientationHelper.disable();
    bookmarkSetting.control.sort.letter.disable();
    bookmarkSetting.control.sort.icon.disable();
    bookmarkSetting.control.sort.name.disable();
  }

};

bookmarkSetting.edge = {
  general: {}
};

bookmarkSetting.general = (parent) => {

  if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

    bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

  }

  bookmarkSetting.control.general.show = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-show',
    path: 'bookmark.show',
    labelText: message.get('menuContentBookmarkGeneralShow'),
    action: () => {

      layout.area.assemble();

      applyCSSState('bookmark.show');

      bookmarkSetting.disable();

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      bookmarkSetting.control.general.collapse.update();

      data.save();

    }
  });

  bookmarkSetting.control.general.urlShow = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-url-show',
    path: 'bookmark.url.show',
    labelText: message.get('menuContentBookmarkGeneralUrlShow'),
    action: () => {
      applyCSSState('bookmark.url.show');
      data.save();
    }
  });

  bookmarkSetting.control.general.lineShow = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-line-show',
    path: 'bookmark.line.show',
    labelText: message.get('menuContentBookmarkGeneralLineShow'),
    action: () => {
      applyCSSState('bookmark.line.show');
      data.save();
    }
  });

  bookmarkSetting.control.general.shadowShow = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-shadow-show',
    path: 'bookmark.shadow.show',
    labelText: message.get('menuContentBookmarkGeneralShadowShowLabel'),
    description: message.get('menuContentBookmarkGeneralShadowShowDescription'),
    action: () => {
      applyCSSState('bookmark.shadow.show');
      data.save();
    }
  });

  bookmarkSetting.control.general.hoverScaleShow = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-hoverScale-show',
    path: 'bookmark.hoverScale.show',
    labelText: message.get('menuContentBookmarkGeneralHoverScaleShow'),
    action: () => {
      applyCSSState('bookmark.hoverScale.show');
      data.save();
    }
  });

  bookmarkSetting.control.general.newTab = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-newTab',
    path: 'bookmark.newTab',
    labelText: message.get('menuContentBookmarkGeneralNewTab'),
    action: () => {

      groupAndBookmark.render();

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      data.save();

    }
  });

  bookmarkSetting.control.general.size = new Control_slider({
    object: state.get.current(),
    path: 'bookmark.size',
    id: 'bookmark-size',
    labelText: message.get('menuContentBookmarkGeneralSize'),
    value: state.get.current().bookmark.size,
    defaultValue: state.get.default().bookmark.size,
    min: state.get.minMax().bookmark.size.min,
    max: state.get.minMax().bookmark.size.max,
    action: () => {
      applyCSSVar('bookmark.size');
      if (state.get.current().bookmark.show && bookmark.tile.current.length > 0 && bookmarkSetting.edge.general.size) { bookmarkSetting.edge.general.size.track(); }
      data.save();
    },
    mouseDownAction: () => {
      if (state.get.current().bookmark.show && bookmark.tile.current.length > 0 && bookmarkSetting.edge.general.size) { bookmarkSetting.edge.general.size.show(); }
    },
    mouseUpAction: () => {
      if (state.get.current().bookmark.show && bookmark.tile.current.length > 0 && bookmarkSetting.edge.general.size) { bookmarkSetting.edge.general.size.hide(); }
    }
  });

  bookmarkSetting.control.general.browserSync = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-browser-sync',
    path: 'bookmark.browserSync',
    labelText: message.get('menuContentBookmarkGeneralBrowserSyncLabel'),
    description: message.get('menuContentBookmarkGeneralBrowserSyncDescription'),
    action: () => {
      data.save();
      if (state.get.current().bookmark.browserSync) {
        bookmarkBrowser.sync({ force: true });
      }
    }
  });

  bookmarkSetting.control.general.browserSyncNow = new Button({
    text: message.get('menuContentBookmarkGeneralBrowserSyncNow'),
    style: ['line'],
    func: () => {
      bookmarkBrowser.sync({ force: true }).then((result) => {
        if (result && result.success) {
          bookmarkSetting.control.general.browserSyncNow.text(`Synced ${result.count || 0} bookmarks`);
          setTimeout(() => {
            bookmarkSetting.control.general.browserSyncNow.text(message.get('menuContentBookmarkGeneralBrowserSyncNow'));
          }, 3000);
        }
      });
    }
  });

  bookmarkSetting.control.general.faviconService = new Control_radio({
    object: state.get.current(),
    label: 'Favicon Provider',
    radioGroup: [
      { id: 'bookmark-favicon-native', labelText: 'Native & Local Cache (Recommended)', description: 'Uses local browser cache and passive tab visits. 100% private, zero external requests.', value: 'native' },
      { id: 'bookmark-favicon-duckduckgo', labelText: 'DuckDuckGo Favicon Service', description: 'Fetches icons via DuckDuckGo. Strictly blocks private/intranet domains.', value: 'duckduckgo' },
      { id: 'bookmark-favicon-google', labelText: 'Google Favicon Service', description: 'Fetches icons via Google S2. Strictly blocks private/intranet domains.', value: 'google' },
      { id: 'bookmark-favicon-none', labelText: 'Monogram Letters Only', description: 'Uses styled initial letters. No image icons.', value: 'none' }
    ],
    groupName: 'bookmark-favicon-service',
    path: 'bookmark.faviconService',
    action: () => {
      data.save();
      bookmarkBrowser.sync({ force: true });
    }
  });

  bookmarkSetting.control.general.folderPreview = new Control_checkbox({
    object: state.get.current(),
    id: 'bookmark-folder-preview',
    path: 'bookmark.folderPreview',
    labelText: 'Folder Icon Previews',
    description: 'Display a mini grid of website icons inside folder bookmark tiles',
    action: () => {
      if (bookmarkSetting.control.general.folderPreviewShape) {
        if (state.get.current().bookmark.folderPreview) {
          bookmarkSetting.control.general.folderPreviewShape.enable();
        } else {
          bookmarkSetting.control.general.folderPreviewShape.disable();
        }
      }
      groupAndBookmark.render();
      data.save();
    }
  });

  bookmarkSetting.control.general.folderPreviewShape = new Control_radio({
    object: state.get.current(),
    label: 'Folder Preview Shape',
    radioGroup: [
      { id: 'bookmark-folder-preview-shape-tile', labelText: 'Match Tile Shape', description: 'Grouped icons shape matches the tile theme radius.', value: 'tile' },
      { id: 'bookmark-folder-preview-shape-circle', labelText: 'Circle', description: 'Grouped icons shape is a circle.', value: 'circle' }
    ],
    groupName: 'bookmark-folder-preview-shape',
    path: 'bookmark.folderPreviewShape',
    action: () => {
      groupAndBookmark.render();
      data.save();
    }
  });

  bookmarkSetting.control.general.area = node('div', [
    bookmarkSetting.control.general.browserSync.wrap(),
    form.wrap({
      children: [
        bookmarkSetting.control.general.browserSyncNow.button
      ]
    }),
    bookmarkSetting.control.general.faviconService.wrap(),
    bookmarkSetting.control.general.folderPreview.wrap(),
    bookmarkSetting.control.general.folderPreviewShape.wrap(),
    bookmarkSetting.control.general.urlShow.wrap(),
    bookmarkSetting.control.general.lineShow.wrap(),
    bookmarkSetting.control.general.shadowShow.wrap(),
    bookmarkSetting.control.general.hoverScaleShow.wrap(),
    bookmarkSetting.control.general.newTab.wrap(),
    bookmarkSetting.control.general.size.wrap()
  ]);

  bookmarkSetting.control.general.collapse = new Collapse({
    type: 'checkbox',
    checkbox: bookmarkSetting.control.general.show,
    target: [{
      content: bookmarkSetting.control.general.area
    }]
  });

  parent.appendChild(
    node('div', [
      bookmarkSetting.control.general.show.wrap(),
      form.wrap({
        children: [
          form.indent({
            children: [
              bookmarkSetting.control.general.collapse.collapse()
            ]
          })
        ]
      })
    ])
  );

};

bookmarkSetting.style = (parent) => {

  bookmarkSetting.control.style = new Control_radio({
    object: state.get.current(),
    radioGroup: [
      { id: 'bookmark-style-block', labelText: message.get('menuContentBookmarkStyleBlockLabel'), description: message.get('menuContentBookmarkStyleBlockDescription'), value: 'block' },
      { id: 'bookmark-style-list', labelText: message.get('menuContentBookmarkStyleListLabel'), description: message.get('menuContentBookmarkStyleListDescription'), value: 'list' }
    ],
    groupName: 'bookmark-style',
    path: 'bookmark.style',
    action: () => {

      switch (state.get.current().bookmark.style) {

        case 'block':
          bookmark.direction.mod.vertical();
          break;

        case 'list':
          bookmark.direction.mod.horizontal();
          break;

      }

      applyCSSClass('bookmark.style');

      groupAndBookmark.render();

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      data.save();

    }
  });

  parent.appendChild(
    node('div', [
      bookmarkSetting.control.style.wrap(),
    ])
  );

};

bookmarkSetting.orientation = (parent) => {

  bookmarkSetting.control.orientation.orientationElement = new Control_radio({
    object: state.get.current(),
    radioGroup: [
      { id: 'bookmark-orientation-top', labelText: message.get('menuContentBookmarkOrientationTop'), value: 'top' },
      { id: 'bookmark-orientation-bottom', labelText: message.get('menuContentBookmarkOrientationBottom'), value: 'bottom' }
    ],
    groupName: 'bookmark-orientation',
    path: 'bookmark.orientation',
    action: () => {

      applyCSSClass('bookmark.orientation');

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      data.save();

    }
  });

  bookmarkSetting.control.orientation.orientationHelper = new Control_helperText({
    text: [message.get('menuContentBookmarkOrientationHelperPara1')]
  });

  parent.appendChild(
    node('div', [
      bookmarkSetting.control.orientation.orientationElement.inline(),
      bookmarkSetting.control.orientation.orientationHelper.wrap()
    ])
  );

};

bookmarkSetting.sort = (parent) => {

  bookmarkSetting.control.sort.letter = new Button({
    text: message.get('menuContentBookmarkSortLetter'),
    style: ['line'],
    func: () => {

      bookmark.item.mod.sort.letter();

      groupAndBookmark.render();

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      data.save();

    }
  });

  bookmarkSetting.control.sort.icon = new Button({
    text: message.get('menuContentBookmarkSortIcon'),
    style: ['line'],
    func: () => {

      bookmark.item.mod.sort.icon();

      groupAndBookmark.render();

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      data.save();

    }
  });

  bookmarkSetting.control.sort.name = new Button({
    text: message.get('menuContentBookmarkSortName'),
    style: ['line'],
    func: () => {

      bookmark.item.mod.sort.name();

      groupAndBookmark.render();

      if (bookmarkSetting.edge.general.size) {

        if (state.get.current().bookmark.show && bookmark.tile.current.length > 0) {

          bookmarkSetting.edge.general.size.update.primary(bookmark.tile.current[0].tile());

        }

      } else {

        bookmarkSetting.edge.general.size = new Edge({ primary: bookmark.tile.current[0].tile(), secondary: [bookmark.element.area] });

      }

      data.save();

    }
  });

  parent.appendChild(
    node('div', [
      form.wrap({
        children: [
          form.inline({
            gap: 'small',
            wrap: true,
            equalGap: true,
            children: [
              bookmarkSetting.control.sort.letter.wrap(),
              bookmarkSetting.control.sort.icon.wrap(),
              bookmarkSetting.control.sort.name.wrap()
            ]
          })
        ]
      })
    ])
  );

};

export { bookmarkSetting };
