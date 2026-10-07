import { message } from '../message';

import { state } from '../state';
import { data } from '../data';
import { group } from '../group';
import { layout } from '../layout';
import { bookmark } from '../bookmark';
import { groupAndBookmark } from '../groupAndBookmark';

import { Button } from '../button';
import { Modal } from '../modal';
import { GroupForm } from '../groupForm';
import { StagedGroup } from '../stagedGroup';

import { node } from '../../utility/node';
import { isValidString } from '../../utility/isValidString';
import { clearChildNode } from '../../utility/clearChildNode';

export const GroupArea = function({
  groupData = {}
} = {}) {

  this.data = groupData;

  this.element = {
    group: node('div|class:group'),
    header: node('div|class:group-header'),
    name: {
      name: node('div|class:group-name'),
      text: node('h1|class:group-name-text')
    },
    control: {
      control: node('div|class:group-control'),
      group: node('div|class:group-control-group form-group form-group-horizontal')
    },
    toolbar: {
      toolbar: node('div|class:group-toolbar'),
      group: node('div|class:group-toolbar-group form-group form-group-horizontal')
    },
    body: node('div|class:group-body')
  };

  this.control = {};

  this.control.button = {
    up: new Button({
      text: message.get('groupAreaControlUp'),
      srOnly: true,
      iconName: 'arrowKeyboardUp',
      style: ['line'],
      title: message.get('groupAreaControlUp'),
      classList: ['group-control-button', 'group-control-up'],
      func: () => {

        groupData.position.destination--;

        if (groupData.position.destination < 0) {
          groupData.position.destination = 0;
        }

        group.item.mod.move(groupData);

        groupAndBookmark.render();

        data.save();

      }
    }),
    sort: new Button({
      text: message.get('groupAreaControlSort'),
      srOnly: true,
      iconName: 'drag',
      style: ['line'],
      title: message.get('groupAreaControlSort'),
      classList: ['group-control-button', 'group-control-sort'],
    }),
    down: new Button({
      text: message.get('groupAreaControlDown'),
      srOnly: true,
      iconName: 'arrowKeyboardDown',
      style: ['line'],
      title: message.get('groupAreaControlDown'),
      classList: ['group-control-button', 'group-control-up'],
      func: () => {

        groupData.position.destination++;

        if (groupData.position.destination > bookmark.all.length - 1) {
          groupData.position.destination = bookmark.all.length - 1;
        }

        group.item.mod.move(groupData);

        groupAndBookmark.render();

        data.save();

      }
    }),
    hide: new Button({
      text: groupData.group.hidden ? message.get('groupAreaControlUnhide') : message.get('groupAreaControlHide'),
      srOnly: true,
      iconName: groupData.group.hidden ? 'eye' : 'eyeHide',
      style: ['line'],
      title: groupData.group.hidden ? message.get('groupAreaControlUnhide') : message.get('groupAreaControlHide'),
      classList: ['group-control-button', 'group-control-hide'],
      func: () => {

        groupData.group.hidden = !groupData.group.hidden;

        if (groupData.group.hidden) {
          this.element.group.classList.add('is-group-hidden');
          this.control.button.hide.icon('eye');
          this.control.button.hide.title(message.get('groupAreaControlUnhide'));
          this.control.button.hide.text(message.get('groupAreaControlUnhide'));
        } else {
          this.element.group.classList.remove('is-group-hidden');
          this.control.button.hide.icon('eyeHide');
          this.control.button.hide.title(message.get('groupAreaControlHide'));
          this.control.button.hide.text(message.get('groupAreaControlHide'));
        }

        this.updateHiddenBadge();

        data.save();

      }
    }),
    edit: new Button({
      text: message.get('groupAreaControlEdit'),
      srOnly: true,
      iconName: 'edit',
      style: ['line'],
      title: message.get('groupAreaControlEdit'),
      classList: ['group-control-button', 'group-control-edit'],
      func: () => {

        const newGroupData = new StagedGroup();

        newGroupData.group = JSON.parse(JSON.stringify(groupData.group));

        newGroupData.position = JSON.parse(JSON.stringify(groupData.position));

        newGroupData.type.existing = true;

        const groupForm = new GroupForm({ groupData: newGroupData });

        const editModal = new Modal({
          heading: isValidString(newGroupData.group.name.text) ? `${message.get('groupEditHeadingName')} ${newGroupData.group.name.text}` : message.get('groupEditHeadingUnnamed'),
          content: groupForm.form(),
          successText: message.get('groupEditSuccessText'),
          cancelText: message.get('groupEditCancelText'),
          width: 40,
          successAction: () => {

            group.item.mod.edit(newGroupData);

            groupAndBookmark.render();

            data.save();

          }
        });

        editModal.open();

      }
    }),
    remove: new Button({
      text: message.get('groupAreaControlRemove'),
      srOnly: true,
      iconName: 'cross',
      style: ['line'],
      title: message.get('groupAreaControlRemove'),
      classList: ['group-control-button', 'group-control-remove'],
      func: () => {

        const removeModal = new Modal({
          heading: isValidString(groupData.group.name.text) ? `${message.get('groupRemoveHeadingName')} ${groupData.group.name.text}` : message.get('groupRemoveHeadingUnnamed'),
          content: message.get('groupRemoveContent'),
          successText: message.get('groupRemoveSuccessText'),
          cancelText: message.get('groupRemoveCancelText'),
          width: 'small',
          successAction: () => {

            group.item.mod.remove(groupData);

            layout.area.assemble();

            groupAndBookmark.render();

            data.save();

          }
        });

        removeModal.open();

      }
    })
  };

  this.openAll = {
    button: new Button({
      text: message.get('groupAreaControlOpenAll'),
      style: ['line'],
      title: message.get('groupAreaControlOpenAll'),
      srOnly: true,
      iconName: 'openAll',
      classList: ['group-toolbar-button', 'group-toolbar-open-all'],
      func: () => {
        this.openAll.open();
      }
    }),
    open: () => {
      const currentItems = group.nav.getCurrentItems(groupData.position.origin);
      const urls = [];
      const collect = (list) => {
        if (!list) return;
        list.forEach((item) => {
          if (item.url) {
            urls.push(item.url);
          } else if (item.isFolder && item.items) {
            collect(item.items);
          }
        });
      };
      collect(currentItems);

      const api = (typeof browser !== 'undefined' && browser.tabs) ? browser.tabs : (typeof chrome !== 'undefined' ? chrome.tabs : null);
      if (api && urls.length > 0) {
        if (state.get.current().bookmark.newTab) {
          urls.forEach((url) => {
            api.create({ url });
          });
        } else {
          const first = urls.shift();
          urls.forEach((url) => {
            api.create({ url });
          });
          window.location.href = first;
        }
      }
    }
  };

  this.collapse = {
    button: new Button({
      text: message.get('groupAreaControlCollapse'),
      style: ['line'],
      title: message.get('groupAreaControlCollapse'),
      srOnly: true,
      iconName: 'arrowKeyboardUp',
      classList: ['group-toolbar-button', 'group-toolbar-collapse'],
      func: () => {
        this.collapse.toggle();
        this.collapse.video();
        this.update.style();
        data.save();
      }
    }),
    toggle: () => {

      if (groupData.group.collapse) {
        groupData.group.collapse = false;
      } else {
        groupData.group.collapse = true;
      }

    },
    video: () => {

      bookmark.tile.current.forEach((item) => {

        if (item.data.position.origin.group === groupData.position.origin) {
          if (item.video) {
            if (groupData.group.collapse) {
              item.video.pause();
            } else {
              item.video.play();
            }
          }
        }

      });

    }
  };

  this.style = () => {

    if (groupData.group.name.show && isValidString(groupData.group.name.text)) {
      this.element.group.classList.add('is-group-header');
    }

    if (groupData.group.toolbar.collapse.show || (groupData.group.toolbar.openAll.show && groupData.group.items.length > 0)) {
      this.element.group.classList.add('is-group-toolbar');
    }

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
      this.control.button.up.disable();
      this.control.button.down.disable();
      this.control.button.sort.disable();
    } else if (state.get.current().group.edit && !state.get.current().search) {
      this.control.button.up.enable();
      this.control.button.down.enable();
      this.control.button.sort.enable();
    }

  };

  this.updateBreadcrumb = () => {
    const groupIndex = groupData.position.origin;
    const stack = group.nav.getStack(groupIndex);
    const rootName = groupData.group.name.text || 'Bookmarks';

    clearChildNode(this.element.name.name);

    if (stack.length === 0) {
      this.element.name.text.innerHTML = rootName;
      this.element.name.name.appendChild(this.element.name.text);
      this.element.group.classList.remove('is-group-drilldown');
      if (state.get.current().group.edit) {
        this.control.enable();
      }
      if (!groupData.group.name.show || !isValidString(groupData.group.name.text)) {
        if (this.element.header.contains(this.element.name.name)) {
          this.element.header.removeChild(this.element.name.name);
        }
      }
    } else {
      this.element.group.classList.add('is-group-drilldown');
      this.control.disable();
      if (!this.element.header.contains(this.element.name.name)) {
        if (this.element.header.contains(this.element.toolbar.toolbar)) {
          this.element.header.insertBefore(this.element.name.name, this.element.toolbar.toolbar);
        } else {
          this.element.header.appendChild(this.element.name.name);
        }
      }

      const breadcrumbWrap = node('div|class:group-breadcrumb');

      const backButton = new Button({
        text: 'Back',
        style: ['line'],
        title: 'Back',
        srOnly: true,
        iconName: 'arrowBack',
        classList: ['group-toolbar-button', 'group-breadcrumb-back'],
        func: () => {
          group.nav.back(groupIndex);
        }
      });
      breadcrumbWrap.appendChild(backButton.button);

      const pathTrail = node('h1|class:group-name-text group-breadcrumb-trail');

      const rootLink = node('a|class:group-breadcrumb-link,href:#');
      rootLink.textContent = rootName;
      rootLink.addEventListener('click', (e) => {
        e.preventDefault();
        group.nav.to(groupIndex, -1);
      });
      pathTrail.appendChild(rootLink);

      stack.forEach((folder, idx) => {
        const sep = node('span|class:group-breadcrumb-sep');
        sep.textContent = '/';
        pathTrail.appendChild(sep);

        const folderName = folder.display?.name?.text || folder.name || 'Folder';

        if (idx === stack.length - 1) {
          const currentSpan = node('span|class:group-breadcrumb-current');
          currentSpan.textContent = folderName;
          pathTrail.appendChild(currentSpan);
        } else {
          const folderLink = node('a|class:group-breadcrumb-link,href:#');
          folderLink.textContent = folderName;
          folderLink.addEventListener('click', (e) => {
            e.preventDefault();
            group.nav.to(groupIndex, idx);
          });
          pathTrail.appendChild(folderLink);
        }
      });

      breadcrumbWrap.appendChild(pathTrail);
      this.element.name.name.appendChild(breadcrumbWrap);
    }
  };

  this.updateHiddenBadge = () => {
    let badge = this.element.name.name.querySelector('.group-hidden-badge');
    if (groupData.group.hidden) {
      if (!badge) {
        badge = node('span|class:group-hidden-badge');
        badge.textContent = 'Hidden';
        this.element.name.name.appendChild(badge);
      }
    } else {
      if (badge) {
        badge.remove();
      }
    }
  };

  this.assemble = () => {

    this.updateBreadcrumb();

    if (groupData.group.hidden) {
      this.element.group.classList.add('is-group-hidden');
    }

    this.element.control.group.appendChild(this.control.button.up.button);

    this.element.control.group.appendChild(this.control.button.sort.button);

    this.element.control.group.appendChild(this.control.button.down.button);

    this.element.control.group.appendChild(this.control.button.hide.button);

    this.element.control.group.appendChild(this.control.button.edit.button);

    this.element.control.group.appendChild(this.control.button.remove.button);

    this.element.control.control.appendChild(this.element.control.group);

    this.element.header.appendChild(this.element.control.control);

    if (groupData.group.name.show && isValidString(groupData.group.name.text)) {
      this.element.header.appendChild(this.element.name.name);
      this.updateHiddenBadge();
    }

    if (groupData.group.toolbar.collapse.show) {
      this.element.toolbar.group.appendChild(this.collapse.button.button);
    }

    if (groupData.group.toolbar.openAll.show && groupData.group.items.length > 0) {
      this.element.toolbar.group.appendChild(this.openAll.button.button);
    }

    if (groupData.group.toolbar.collapse.show || (groupData.group.toolbar.openAll.show && groupData.group.items.length > 0)) {

      this.element.toolbar.toolbar.appendChild(this.element.toolbar.group);

      this.element.header.appendChild(this.element.toolbar.toolbar);

    }

    this.element.group.appendChild(this.element.header);

    this.element.group.appendChild(this.element.body);

    this.element.body.position = groupData.position;

    if (state.get.current().group.edit) {
      this.control.enable();
    } else {
      this.control.disable();
    }

  };

  this.clear = () => {

    clearChildNode(this.element.body);

  };

  this.group = () => {

    return this.element.group;

  };

  this.update = {};

  this.update.style = () => {

    const html = document.querySelector('html');

    if (state.get.current().theme.group.toolbar.opacity < 40) {

      html.classList.add('is-group-toolbar-opacity-low');

      this.openAll.button.style.update(['link']);

      this.collapse.button.style.update(['link']);

    } else {

      html.classList.remove('is-group-toolbar-opacity-low');

      this.openAll.button.style.update(['line']);

      this.collapse.button.style.update(['line']);

    }

    if (groupData.group.collapse) {

      this.element.group.classList.add('is-group-collapse');

    } else {

      this.element.group.classList.remove('is-group-collapse');

    }

  };

  this.style();

  this.assemble();

  this.update.style();

};
