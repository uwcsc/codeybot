import type { ListenerOptions, Piece, PieceContext } from '@sapphire/framework';
import { Listener, Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { vars } from '../../config';
import Discord from 'discord.js';
import { initEmojis } from '../../components/emojis';
import { client } from '../../bot';

const dev = process.env.NODE_ENV !== 'production';

const NOTIF_CHANNEL_ID = vars.NOTIF_CHANNEL_ID;

export class ReadyListener extends Listener {
  private readonly style = dev ? yellow : blue;

  public constructor(context: PieceContext, options?: ListenerOptions) {
    super(context, {
      ...options,
      once: true
    });
  }

  run = (): void => {
    this.printBanner();
    this.printStoreDebugInformation();
    this.sendReady();
    initEmojis(client);
  };

  sendReady = async (): Promise<void> => {
    const { client, logger } = this.container;
    logger.info({
      event: 'init'
    });
    const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as Discord.TextChannel;
    notif.send('Codey is up!');
  };

  printBanner = (): void => {
    const success = green('+');

    const llc = dev ? magentaBright : white;
    const blc = dev ? magenta : blue;

    const line01 = llc('');
    const line02 = llc('');
    const line03 = llc('');

    // Offset Pad
    const pad = ' '.repeat(7);

    console.log(
      String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
    );
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
