import type { ListenerOptions, Piece, PieceContext } from '@sapphire/framework';
import { Listener, Store } from '@sapphire/framework';
import { blue, gray, yellow } from 'colorette';

const dev = process.env.NODE_ENV !== 'production';

export class ReadyListener extends Listener {
  private readonly style = dev ? yellow : blue;

  public constructor(context: PieceContext, options?: ListenerOptions) {
    super(context, {
      ...options,
      once: true
    });
  }

  run = (): void => {
    this.container.logger.info({
      event: 'init'
    });
    this.printStoreDebugInformation();
  };

  printStoreDebugInformation = (): void => {
    const { client, logger } = this.container;
    const stores = [...client.stores.values()];
    const last = stores.pop()!;

    for (const store of stores) logger.info(this.styleStore(store, false));
    logger.info(this.styleStore(last, true));
  };

  styleStore = (store: Store<Piece>, last: boolean): string => {
    return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
  };
}
