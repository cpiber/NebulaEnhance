import type { History } from 'history';
import { Message, getBrowserInstance, injectFunctionWithReturn, sendMessage } from '../../helpers/sharedExt';
import type { Queue } from './index';

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');

export async function setupHistory(this: Queue) {
  this.hasHistoryGlobal = await injectFunctionWithReturn(document.body, () => {
    const root = document.getElementById('root');
    for (const key of Object.keys(root)) {
      if (key.startsWith('__reactContainer')) {
        let obj = root[key] as any;
        while (true) {
          if (obj.stateNode && obj.stateNode.history) {
            if (obj.stateNode.history.__enhancer_handled) return true;
            /* eslint-disable-next-line camelcase */
            obj.stateNode.history.__enhancer_handled = true;
            const history = obj.stateNode.history as History;
            window.addEventListener('message', ev => {
              try {
                const data = JSON.parse(ev.data);
                if (data.type !== 'enhancer-history') return;
                switch (data.action) {
                  case 'push':
                    history.push(data.to, data.state);
                    break;
                  case 'replace':
                    history.replace(data.to, data.state);
                    break;
                }
              } catch { }
            });
            return true;
          }
          if (!obj.child) break;
          obj = obj.child;
        }
        break;
      }
    }
    return false;
  });
  if (this.hasHistoryGlobal) {
    console.debug('Found history prop, exposing to script for better navigation');
  }
}

export function goto(this: Queue, index: number, go = true) {
  if (index < 0 || index >= this.queue.length) return;
  this.elementsEl.children[this.queuepos]?.classList.remove('playing');
  this.queuepos = index;
  if (go) {
    const url = `/videos/${this.queue[index]}`;
    if (this.hasHistoryGlobal) {
      // this was set up above
      // React exposes the props via a custom property, and somewhere in that tree
      // we find the history (History, Navigator, react-router uses both names)
      // this is only accessible from the page, so send a message to the listener
      sendMessage(Message.HISTORY, { action: 'push', to: url }, false);
    } else {
      // trick router into accepting my url without reloading page
      // sadly, we can't really remove the fake states, it completely breaks
      // we also need a fake '/', otherwise the player vanishes
      setTimeout(() => {
        window.history.pushState({ fake: true }, null, '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.history.pushState({ fake: true }, null, url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 0);
    }
    console.debug(`Queue: Navigating to ${url}`);
  }
  if (index >= 0) {
    this.elementsEl.children[index]?.classList.add('playing');
    this.elementsEl.children[index]?.scrollIntoView();
  }
  this.updateText();
  // chrome does not do this for us
  const yt = document.querySelector('.enhancer-yt');
  if (yt) {
    yt.previousElementSibling.remove();
    yt.remove();
  }
  document.querySelector('.enhancer-yt-err')?.remove();
}

export function gotoNext(this: Queue) {
  return this.goto(this.queuepos + 1);
}

export function gotoPrev(this: Queue) {
  return this.goto(this.queuepos - 1);
}

export function updateText(this: Queue) {
  this.titleEl.textContent = this.queuepos >= 0 ? this.store[this.queue[this.queuepos]]?.title : nothingToPlay;
  this.numberEl.textContent = this.queuepos >= 0 ? `${this.queuepos + 1}` : '-';
  this.totalEl.textContent = `${this.queue.length}`;
  this.prevEl.classList.toggle('clickable', this.canGoPrev());
  this.nextEl.classList.toggle('clickable', this.canGoNext());
  this.setStorage();
  this.emit();
}